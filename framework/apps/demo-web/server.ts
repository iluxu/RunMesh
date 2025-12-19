import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import crypto from "node:crypto";
import { load } from "cheerio";
import { z } from "zod";
import { createAgent } from "@runmesh/agent";
import { tool, ToolRegistry } from "@runmesh/tools";
import { createOpenAI, generateStructuredOutput } from "@runmesh/core";

type Ticket = number[];
type Row = {
  numero: number;
  cheval?: string;
  classe?: string;
  score_final?: number;
  score_raw?: number;
  cotedirect?: number;
  coteprob?: number;
  recence?: number;
  p_ml?: number;
  p_fav?: number;
  p_fusion?: number;
  fav_rank?: number | null;
  p_hat?: number;
  [key: string]: unknown;
};

type OddsRow = {
  numero: number;
  cote: number | null;
  cheval?: string;
};

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, "../../..");
const PUBLIC_DIR = path.join(__dirname, "public");
const DEFAULT_MODEL = "gpt-5.2";
const sessions = new Map<string, { messages: { role: "user" | "assistant"; content: string }[] }>();

const CSV_PATH = path.join(ROOT_DIR, "donnees_jour.csv");
const INFOS_BRUTES_PATH = path.join(ROOT_DIR, "infos_brutes.txt");
const WORLD_MODEL_PATH = path.join(ROOT_DIR, "world_model.json");
const TUNING_STATE_PATH = path.join(ROOT_DIR, "tuning_state.json");
const ODDS_PATH = path.join(ROOT_DIR, "cotes.html");
const ODDS_SELECTOR = process.env.RUNMESH_ODDS_SELECTOR ?? "#div_tableau_cotes";
const ODDS_URL = process.env.RUNMESH_ODDS_URL;

const MAX_TABLE_ROWS = 40;
const MAX_JSON_CHARS = 12000;

function toNumber(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function parseOddsNumber(value: string): number | null {
  const cleaned = value
    .replace(/\s/g, "")
    .replace(",", ".")
    .replace(/[^0-9.]/g, "");
  if (!cleaned) return null;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseOddsRows(html: string): OddsRow[] {
  const $ = load(html);
  const root = $(ODDS_SELECTOR);
  if (!root.length) return [];

  const rows: OddsRow[] = [];
  root.find("tr").each((_, row) => {
    const cells = $(row).find("td");
    if (!cells.length) return;
    const texts = cells
      .map((__, cell) => $(cell).text().trim())
      .get()
      .filter(Boolean);
    if (!texts.length) return;

    const numero = texts
      .map((text) => {
        const match = text.match(/\d+/);
        return match ? Number(match[0]) : null;
      })
      .find((value) => typeof value === "number" && value > 0 && value < 100);

    let cote: number | null = null;
    cells.each((__, cell) => {
      if (cote !== null) return;
      const className = $(cell).attr("class") ?? "";
      if (!/cote/i.test(className)) return;
      cote = parseOddsNumber($(cell).text());
    });

    if (cote === null) {
      const candidates = texts
        .map(parseOddsNumber)
        .filter((value): value is number => typeof value === "number" && value > 0);
      cote = candidates.length ? candidates[candidates.length - 1] : null;
    }

    if (!numero) return;
    const cheval = texts.length > 1 ? texts[1] : undefined;
    rows.push({ numero, cote, cheval });
  });

  const deduped = new Map<number, OddsRow>();
  rows.forEach((row) => {
    if (!deduped.has(row.numero)) {
      deduped.set(row.numero, row);
    }
  });
  return Array.from(deduped.values());
}

async function loadOddsHtml(): Promise<{ html: string; source: string }> {
  if (ODDS_URL) {
    const response = await fetch(ODDS_URL, {
      headers: {
        "User-Agent": "RunMeshDemo/0.1 (+https://runmesh.llmbasedos.com)"
      }
    });
    if (!response.ok) {
      throw new Error(`Odds fetch failed: ${response.status} ${response.statusText}`);
    }
    const html = await response.text();
    return { html, source: ODDS_URL };
  }

  const html = await fs.readFile(ODDS_PATH, "utf-8");
  return { html, source: `file:${ODDS_PATH}` };
}

function softmax(values: number[]): number[] {
  if (!values.length) return [];
  const max = Math.max(...values);
  const exps = values.map((v) => Math.exp(v - max));
  const sum = exps.reduce((acc, v) => acc + v, 0) || 1;
  return exps.map((v) => v / sum);
}

function parseMusicScore(text?: string): number | null {
  if (!text) return null;
  const tokens = text.trim().split(/\s+/).slice(0, 6);
  if (!tokens.length) return null;
  const values = tokens.map((token) => {
    const num = token.match(/\d+/);
    if (num) return Number(num[0]);
    if (/da|dai|di/i.test(token)) return 20;
    return 20;
  });
  const avg = values.reduce((acc, v) => acc + v, 0) / values.length;
  if (!Number.isFinite(avg) || avg <= 0) return null;
  return 1 / avg;
}

function buildScoreRaw(rows: Row[]): Row[] {
  const features = [
    {
      key: "cotedirect",
      weight: 0.2,
      higherBetter: false,
      getter: (row: Row) => toNumber(row.cotedirect, NaN)
    },
    {
      key: "coteprob",
      weight: 0.15,
      higherBetter: false,
      getter: (row: Row) => toNumber(row.coteprob, NaN)
    },
    {
      key: "recence",
      weight: 0.05,
      higherBetter: false,
      getter: (row: Row) => toNumber(row.recence, NaN)
    },
    {
      key: "gains",
      weight: 0.15,
      higherBetter: true,
      getter: (row: Row) => toNumber(row.gains, NaN)
    },
    {
      key: "redkm",
      weight: 0.1,
      higherBetter: false,
      getter: (row: Row) => toNumber(row.redkm, NaN)
    },
    {
      key: "pourcVictJock",
      weight: 0.08,
      higherBetter: true,
      getter: (row: Row) => toNumber(row.pourcVictJock, NaN)
    },
    {
      key: "pourcPlaceJock",
      weight: 0.05,
      higherBetter: true,
      getter: (row: Row) => toNumber(row.pourcPlaceJock, NaN)
    },
    {
      key: "pourcVictEntHippo",
      weight: 0.05,
      higherBetter: true,
      getter: (row: Row) => toNumber(row.pourcVictEntHippo, NaN)
    },
    {
      key: "pourcPlaceEntHippo",
      weight: 0.05,
      higherBetter: true,
      getter: (row: Row) => toNumber(row.pourcPlaceEntHippo, NaN)
    },
    {
      key: "music_score",
      weight: 0.12,
      higherBetter: true,
      getter: (row: Row) => parseMusicScore(String(row.musiquept ?? row.musiqueche ?? "")) ?? NaN
    }
  ];

  const ranges = features.map((feature) => {
    const values = rows.map(feature.getter).filter((v) => Number.isFinite(v));
    const min = values.length ? Math.min(...values) : 0;
    const max = values.length ? Math.max(...values) : 1;
    return { min, max };
  });

  return rows.map((row) => {
    let score = 0;
    features.forEach((feature, idx) => {
      const value = feature.getter(row);
      const { min, max } = ranges[idx];
      let norm = 0.5;
      if (Number.isFinite(value) && max !== min) {
        norm = (value - min) / (max - min);
        if (!feature.higherBetter) {
          norm = 1 - norm;
        }
      }
      norm = Math.min(1, Math.max(0, norm));
      score += norm * feature.weight;
    });
    return { ...row, score_raw: score };
  });
}

function parseCsv(csv: string): Row[] {
  const rows: string[][] = [];
  let current = "";
  let row: string[] = [];
  let inQuotes = false;

  for (let i = 0; i < csv.length; i += 1) {
    const char = csv[i];
    const next = csv[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(current);
      current = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") {
        i += 1;
      }
      row.push(current);
      current = "";
      if (row.length > 1 || row[0] !== "") {
        rows.push(row);
      }
      row = [];
      continue;
    }

    current += char;
  }

  if (current.length || row.length) {
    row.push(current);
    rows.push(row);
  }

  if (!rows.length) return [];
  const headers = rows[0].map((cell) => cell.trim());
  return rows.slice(1).map((cells) => {
    const record: Record<string, unknown> = {};
    headers.forEach((key, idx) => {
      record[key] = (cells[idx] ?? "").trim();
    });
    const numero = Number(record.numero ?? record["numero"]);
    return {
      ...record,
      numero: Number.isFinite(numero) ? numero : 0,
      cheval: typeof record.cheval === "string" ? record.cheval : undefined,
      classe: typeof record.classe === "string" ? record.classe : undefined,
      score_final: toNumber(record.score_final, NaN),
      cotedirect: toNumber(record.cotedirect, NaN),
      coteprob: toNumber(record.coteprob, NaN),
      recence: toNumber(record.recence, NaN)
    };
  });
}

function computePml(rows: Row[], temperature = 8): Row[] {
  const scores = rows.map((row) => {
    if (Number.isFinite(row.score_final)) {
      return toNumber(row.score_final);
    }
    return toNumber(row.score_raw);
  });
  const scaled = scores.map((score) => score / Math.max(temperature, 1e-6));
  const probs = softmax(scaled);
  return rows.map((row, idx) => ({ ...row, p_ml: probs[idx] }));
}

function parseFavorites(infos: string): Record<number, number> {
  const line = infos.split("\n").find((entry) => entry.toLowerCase().includes("chevaux favoris"));
  if (!line) return {};
  const matches = line.match(/\d+/g);
  if (!matches || matches.length < 8) return {};
  const nums = matches.slice(-8).map((n) => Number(n));
  const ranks: Record<number, number> = {};
  nums.forEach((num, idx) => {
    ranks[num] = idx + 1;
  });
  return ranks;
}

function addFusionColumns(rows: Row[], infos: string): Row[] {
  const withRaw = buildScoreRaw(rows);
  const withMl = computePml(withRaw);
  const favRanks = parseFavorites(infos);
  const favScores = withMl.map((row) => {
    const rank = favRanks[row.numero];
    const favScore = rank ? (9 - rank) / 8 : 0;
    return { rank: rank ?? null, score: favScore };
  });

  const totalFav = favScores.reduce((acc, item) => acc + item.score, 0) || 1;
  return withMl.map((row, idx) => {
    const favScore = favScores[idx].score;
    const pFav = totalFav > 0 ? favScore / totalFav : 0;
    const pFusion = 0.5 * (row.p_ml ?? 0) + 0.5 * pFav;
    return {
      ...row,
      fav_rank: favScores[idx].rank,
      p_fav: pFav,
      p_fusion: pFusion
    };
  });
}

function sortByDesc(rows: Row[], key: keyof Row): Row[] {
  return [...rows].sort((a, b) => toNumber(b[key]) - toNumber(a[key]));
}

function uniqueTicket(list: number[]): Ticket {
  return Array.from(new Set(list)).map((n) => Number(n));
}

function buildTicketsPropre(rows: Row[]): { multi4: Ticket | null; multi5: Ticket | null } {
  const bases = sortByDesc(
    rows.filter((r) => r.classe === "BASE"),
    "p_hat"
  );
  const outs = sortByDesc(
    rows.filter((r) => r.classe === "OUTSIDER_EV"),
    "p_hat"
  );
  const b4 = bases.slice(0, 2).map((r) => r.numero);
  const o4 = outs.slice(0, Math.max(0, 4 - b4.length)).map((r) => r.numero);
  const t4 = uniqueTicket([...b4, ...o4]);
  const b5 = bases.slice(0, 2).map((r) => r.numero);
  const o5 = outs.slice(0, Math.max(0, 5 - b5.length)).map((r) => r.numero);
  const t5 = uniqueTicket([...b5, ...o5]);
  return {
    multi4: t4.length === 4 ? t4 : null,
    multi5: t5.length === 5 ? t5 : null
  };
}

function buildTicketsValue(rows: Row[]): { multi4: Ticket | null; multi5: Ticket | null } {
  const scored = rows.map((row) => {
    const cote = Math.max(toNumber(row.cotedirect, 1.01), 1.01);
    const bonus = cote >= 8 && cote <= 20 ? 1.15 : 1.0;
    return { ...row, value_score: toNumber(row.p_hat) * bonus };
  });
  const bases = sortByDesc(
    scored.filter((r) => r.classe === "BASE"),
    "p_hat"
  );
  const outs = sortByDesc(
    scored.filter((r) => r.classe === "OUTSIDER_EV"),
    "value_score"
  );
  const b4 = bases.slice(0, 1).map((r) => r.numero);
  const o4 = outs.slice(0, Math.max(0, 4 - b4.length)).map((r) => r.numero);
  const t4 = uniqueTicket([...b4, ...o4]);
  const b5 = bases.slice(0, 2).map((r) => r.numero);
  const o5 = outs.slice(0, Math.max(0, 5 - b5.length)).map((r) => r.numero);
  const t5 = uniqueTicket([...b5, ...o5]);
  return {
    multi4: t4.length === 4 ? t4 : null,
    multi5: t5.length === 5 ? t5 : null
  };
}

function buildTicketsGamble(rows: Row[]): { multi4: Ticket | null; multi5: Ticket | null } {
  const bases = sortByDesc(
    rows.filter((r) => r.classe === "BASE" && toNumber(r.cotedirect) < 8),
    "p_hat"
  );
  const outs = rows
    .filter((r) => ["OUTSIDER_EV", "TOCARD"].includes(r.classe ?? ""))
    .map((row) => {
      const cote = Math.max(toNumber(row.cotedirect, 1.01), 1.01);
      const bonus = cote >= 15 ? 1.3 : 1.0;
      return { ...row, gamble_score: toNumber(row.p_hat) * bonus };
    });
  const outsSorted = sortByDesc(outs, "gamble_score");
  const b4 = bases.slice(0, 1).map((r) => r.numero);
  const o4 = outsSorted.slice(0, Math.max(0, 4 - b4.length)).map((r) => r.numero);
  const t4 = uniqueTicket([...b4, ...o4]);
  const b5 = bases.slice(0, 1).map((r) => r.numero);
  const o5 = outsSorted.slice(0, Math.max(0, 5 - b5.length)).map((r) => r.numero);
  const t5 = uniqueTicket([...b5, ...o5]);
  return {
    multi4: t4.length === 4 ? t4 : null,
    multi5: t5.length === 5 ? t5 : null
  };
}

function assignClasses(rows: Row[]): Row[] {
  const sorted = [...rows].sort((a, b) => toNumber(b.score_raw) - toNumber(a.score_raw));
  const total = sorted.length || 1;
  const baseCount = Math.min(4, Math.max(2, Math.round(total * 0.2)));
  const outsiderCount = Math.min(6, Math.max(4, Math.round(total * 0.3)));
  return sorted.map((row, idx) => {
    let classe = "TOCARD";
    if (idx < baseCount) classe = "BASE";
    else if (idx < baseCount + outsiderCount) classe = "OUTSIDER_EV";
    return { ...row, classe };
  });
}

function buildAllTickets(rows: Row[]) {
  const withClasse = assignClasses(rows);
  const original = withClasse.map((row) => ({ ...row, p_hat: row.p_ml ?? 0 }));
  const fusion = withClasse.map((row) => ({ ...row, p_hat: row.p_fusion ?? 0 }));
  return {
    ORIGINAL: {
      PROPRE: buildTicketsPropre(original),
      VALUE: buildTicketsValue(original),
      GAMBLE: buildTicketsGamble(original)
    },
    FUSION: {
      PROPRE: buildTicketsPropre(fusion),
      VALUE: buildTicketsValue(fusion),
      GAMBLE: buildTicketsGamble(fusion)
    }
  };
}

function buildUltraFusion(rows: Row[]) {
  const sorted = sortByDesc(rows, "p_fusion");
  const m4 = sorted.slice(0, 4).map((r) => r.numero);
  const m5 = sorted.slice(0, 5).map((r) => r.numero);
  return {
    multi4: m4.length === 4 ? m4 : null,
    multi5: m5.length === 5 ? m5 : null
  };
}

function applyFavoriPublicCushion(
  rows: Row[],
  ultra: { multi4: Ticket | null; multi5: Ticket | null },
  tuning: Record<string, unknown>
) {
  const gamma = (tuning.gamma as Record<string, unknown>) ?? {};
  const cfg = (gamma.favori_public_cushion as Record<string, unknown>) ?? {};
  if (!cfg.enabled) return ultra;
  const minPf = toNumber(cfg.min_p_fusion, 0);
  const favorites = rows.filter((r) => r.fav_rank !== null && r.fav_rank !== undefined);
  if (!favorites.length) return ultra;
  const topFav = sortByDesc(
    favorites.map((r) => ({ ...r, fav_rank: r.fav_rank ?? 99 })),
    "fav_rank"
  )[0];
  if (toNumber(topFav.p_fusion) < minPf) return ultra;
  const m5 = ultra.multi5 ?? [];
  if (m5.includes(topFav.numero)) return ultra;
  const union = uniqueTicket([...m5, topFav.numero]);
  const sorted = sortByDesc(
    rows.filter((r) => union.includes(r.numero)),
    "p_fusion"
  );
  return {
    ...ultra,
    multi5: sorted.slice(0, 5).map((r) => r.numero)
  };
}

function applyGambleMlAnchor(
  rows: Row[],
  tickets: ReturnType<typeof buildAllTickets>,
  tuning: Record<string, unknown>
) {
  const gamma = (tuning.gamma as Record<string, unknown>) ?? {};
  const cfg = (gamma.gamble_ml_anchor as Record<string, unknown>) ?? {};
  if (!cfg.enabled) return tickets;
  const minCote = toNumber(cfg.min_cote, 10);
  const anchor = sortByDesc(
    rows.filter((r) => toNumber(r.cotedirect) >= minCote),
    "p_ml"
  )[0];
  if (!anchor) return tickets;

  (["ORIGINAL", "FUSION"] as const).forEach((mode) => {
    const gamble = tickets[mode].GAMBLE;
    (["multi4", "multi5"] as const).forEach((key) => {
      const list = gamble[key];
      if (!list || list.includes(anchor.numero)) return;
      const union = uniqueTicket([...list, anchor.numero]);
      const sorted = sortByDesc(
        rows.filter((r) => union.includes(r.numero)),
        "p_ml"
      );
      gamble[key] = sorted.slice(0, list.length).map((r) => r.numero);
    });
  });
  return tickets;
}

function formatTicket(ticket: Ticket | null): string {
  if (!ticket) return "NONE";
  return ticket.join(" - ");
}

function ticketsBlock(
  tickets: ReturnType<typeof buildAllTickets>,
  ultra: { multi4: Ticket | null; multi5: Ticket | null }
) {
  const lines: string[] = [];
  lines.push("INTERNAL TICKETS (STARTING POINT):");
  (["ORIGINAL", "FUSION"] as const).forEach((mode) => {
    lines.push(`${mode}:`);
    (["PROPRE", "VALUE", "GAMBLE"] as const).forEach((name) => {
      const entry = tickets[mode][name];
      lines.push(
        `  - ${name} :: M4 = ${formatTicket(entry.multi4)} | M5 = ${formatTicket(entry.multi5)}`
      );
    });
    lines.push("");
  });
  lines.push("ULTRA_FUSION:");
  lines.push(`  - M4 ULTRA = ${formatTicket(ultra.multi4)}`);
  lines.push(`  - M5 ULTRA = ${formatTicket(ultra.multi5)}`);
  return lines.join("\n");
}

function toMarkdownTable(rows: Row[]): string {
  const headers = [
    "numero",
    "cheval",
    "classe",
    "score_raw",
    "p_ml",
    "p_fusion",
    "cotedirect",
    "coteprob",
    "fav_rank"
  ];
  const lines = [headers.join(" | "), headers.map(() => "---").join(" | ")];
  rows.slice(0, MAX_TABLE_ROWS).forEach((row) => {
    const line = headers.map((h) => String(row[h] ?? "")).join(" | ");
    lines.push(line);
  });
  if (rows.length > MAX_TABLE_ROWS) {
    lines.push(`... (${rows.length - MAX_TABLE_ROWS} more rows)`);
  }
  return lines.join("\n");
}

function jsonExcerpt(obj: Record<string, unknown>, maxChars = MAX_JSON_CHARS): string {
  const raw = JSON.stringify(obj, null, 2);
  if (raw.length <= maxChars) return raw;
  return `${raw.slice(0, maxChars)}\n... [TRUNCATED]`;
}

function buildSystemPrompt(): string {
  return [
    "You are a professional horse racing analyst.",
    "Use the provided data only. Do not invent facts.",
    "Your job: produce structured Multi-4 and Multi-5 tickets.",
    "Be concise and justify choices using the numeric table and raw infos.",
    "Use score_raw, p_ml, and p_fusion for decision logic."
  ].join("\n");
}

function buildUserPrompt(
  table: string,
  infos: string,
  world: Record<string, unknown>,
  tuning: Record<string, unknown>,
  tickets: ReturnType<typeof buildAllTickets>,
  ultra: { multi4: Ticket | null; multi5: Ticket | null }
): string {
  return [
    "Context: horse racing ticket selection (aggressive but rational).",
    "The table uses raw data with a derived score_raw (composite form/odds/metrics).",
    "",
    ticketsBlock(tickets, ultra),
    "",
    "DATA TABLE:",
    table,
    "",
    "RAW INFOS:",
    infos,
    "",
    "WORLD MODEL:",
    jsonExcerpt(world),
    "",
    "TUNING STATE:",
    jsonExcerpt(tuning),
    "",
    "Return JSON only that matches the schema."
  ].join("\n");
}

async function readText(filePath: string): Promise<string> {
  return fs.readFile(filePath, "utf-8");
}

async function readJson(filePath: string): Promise<Record<string, unknown>> {
  const raw = await fs.readFile(filePath, "utf-8");
  return JSON.parse(raw);
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

function sendJson(res: http.ServerResponse, status: number, data: unknown) {
  const payload = JSON.stringify(data);
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(payload)
  });
  res.end(payload);
}

function formatError(error: unknown): string {
  if (error instanceof Error) {
    const cause = (error as { cause?: unknown }).cause;
    if (cause instanceof Error) {
      return `${error.message}: ${cause.message}`;
    }
    if (typeof cause === "string") {
      return `${error.message}: ${cause}`;
    }
    if (typeof cause === "object" && cause !== null) {
      const causeMessage =
        (cause as { message?: string }).message ??
        (cause as { error?: { message?: string } }).error?.message;
      if (causeMessage) {
        return `${error.message}: ${causeMessage}`;
      }
    }
    return error.message;
  }
  return "Unknown error";
}

async function parseBody(req: http.IncomingMessage): Promise<Record<string, unknown>> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  if (!chunks.length) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf-8"));
  } catch {
    return {};
  }
}

async function handleOdds(_: http.IncomingMessage, res: http.ServerResponse) {
  try {
    const { html, source } = await loadOddsHtml();
    const odds = parseOddsRows(html);
    sendJson(res, 200, {
      source,
      selector: ODDS_SELECTOR,
      updatedAt: new Date().toISOString(),
      odds
    });
  } catch (error) {
    sendJson(res, 500, { error: formatError(error) });
  }
}

async function handleAgent(req: http.IncomingMessage, res: http.ServerResponse) {
  const body = await parseBody(req);
  const prompt = typeof body.prompt === "string" ? body.prompt : "Summarize the race context.";

  const tools = new ToolRegistry();
  tools.register(
    tool({
      name: "pick_top_numbers",
      description: "Pick top N numbers from a list of scores.",
      schema: z.object({
        scores: z.array(z.number()),
        count: z.number().min(1).max(10)
      }),
      handler: ({ scores, count }) => {
        const sorted = scores
          .map((score, idx) => ({ score, idx: idx + 1 }))
          .sort((a, b) => b.score - a.score)
          .slice(0, count);
        return sorted.map((entry) => entry.idx);
      }
    })
  );

  const agent = createAgent({
    name: "demo-web-agent",
    model: process.env.OPENAI_MODEL ?? DEFAULT_MODEL,
    systemPrompt: "You are a helpful race analyst. Use tools when useful.",
    tools
  });

  try {
    const result = await agent.run(prompt);
    const responseText = result.response.choices[0]?.message?.content ?? "";
    sendJson(res, 200, {
      response: typeof responseText === "string" ? responseText : JSON.stringify(responseText),
      steps: result.steps
    });
  } catch (error) {
    sendJson(res, 500, { error: formatError(error) });
  }
}

async function computeMimi8Context() {
  const required = [CSV_PATH, INFOS_BRUTES_PATH, WORLD_MODEL_PATH, TUNING_STATE_PATH];
  const missing: string[] = [];
  for (const filePath of required) {
    if (!(await fileExists(filePath))) {
      missing.push(path.basename(filePath));
    }
  }
  if (missing.length) {
    throw new Error(`Missing files: ${missing.join(", ")}`);
  }

  const csvRaw = await readText(CSV_PATH);
  const infos = await readText(INFOS_BRUTES_PATH);
  const world = await readJson(WORLD_MODEL_PATH);
  const tuning = await readJson(TUNING_STATE_PATH);

  const parsed = parseCsv(csvRaw);
  const rows = addFusionColumns(parsed, infos);
  let tickets = buildAllTickets(rows);
  let ultra = buildUltraFusion(rows);
  tickets = applyGambleMlAnchor(rows, tickets, tuning);
  ultra = applyFavoriPublicCushion(rows, ultra, tuning);

  return { rows, infos, world, tuning, tickets, ultra };
}

async function handleMimi8(_: http.IncomingMessage, res: http.ServerResponse) {
  try {
    const { rows, infos, world, tuning, tickets, ultra } = await computeMimi8Context();
    const table = toMarkdownTable(rows);
    const systemPrompt = buildSystemPrompt();
    const userPrompt = buildUserPrompt(table, infos, world, tuning, tickets, ultra);

    const OutputSchema = z.object({
      summary: z.string(),
      tickets: z.object({
        propre: z.object({
          m4: z.array(z.number()).length(4),
          m5: z.array(z.number()).length(5),
          comment: z.string()
        }),
        value: z.object({
          m4: z.array(z.number()).length(4),
          m5: z.array(z.number()).length(5),
          comment: z.string()
        }),
        gamble: z.object({
          m4: z.array(z.number()).length(4),
          m5: z.array(z.number()).length(5),
          comment: z.string()
        }),
        ultra: z.object({
          m4: z.array(z.number()).length(4),
          m5: z.array(z.number()).length(5),
          comment: z.string()
        })
      }),
      strategy: z.array(z.string()).max(6),
      risk_note: z.string()
    });

    const client = createOpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      defaultModel: process.env.OPENAI_MODEL ?? DEFAULT_MODEL
    });

    const result = await generateStructuredOutput({
      client,
      request: {
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ]
      },
      schema: OutputSchema,
      maxRetries: 2
    });

    sendJson(res, 200, result.value);
  } catch (error) {
    sendJson(res, 500, { error: formatError(error) });
  }
}

async function handleFusion(req: http.IncomingMessage, res: http.ServerResponse) {
  const body = await parseBody(req);
  const prompt =
    typeof body.prompt === "string"
      ? body.prompt
      : "Give a 3-bullet race summary and the best tickets.";
  const sessionId =
    typeof body.sessionId === "string" && body.sessionId.length > 0
      ? body.sessionId
      : crypto.randomUUID();
  const runs = Math.min(5, Math.max(1, Number(body.runs ?? 1)));
  const baseTemp = Number.isFinite(Number(body.temperature)) ? Number(body.temperature) : 0.6;

  try {
    const { rows, infos, world, tuning, tickets, ultra } = await computeMimi8Context();
    const table = toMarkdownTable(rows);
    const systemPrompt = [
      buildSystemPrompt(),
      "Return JSON only. Provide exactly 3 bullets in agent.bullets."
    ].join("\n");
    const userPrompt = [
      buildUserPrompt(table, infos, world, tuning, tickets, ultra),
      "",
      `USER_PROMPT: ${prompt}`
    ].join("\n");

    const session = sessions.get(sessionId) ?? { messages: [] };
    sessions.set(sessionId, session);
    const history = session.messages;

    const OutputSchema = z.object({
      agent: z.object({
        bullets: z.array(z.string()).length(3),
        answer: z.string()
      }),
      tickets: z.object({
        propre: z.object({
          m4: z.array(z.number()).length(4),
          m5: z.array(z.number()).length(5),
          comment: z.string()
        }),
        value: z.object({
          m4: z.array(z.number()).length(4),
          m5: z.array(z.number()).length(5),
          comment: z.string()
        }),
        gamble: z.object({
          m4: z.array(z.number()).length(4),
          m5: z.array(z.number()).length(5),
          comment: z.string()
        }),
        ultra: z.object({
          m4: z.array(z.number()).length(4),
          m5: z.array(z.number()).length(5),
          comment: z.string()
        })
      }),
      strategy: z.array(z.string()).max(6),
      risk_note: z.string()
    });

    const client = createOpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      defaultModel: process.env.OPENAI_MODEL ?? DEFAULT_MODEL
    });

    const runResults: Array<z.infer<typeof OutputSchema>> = [];
    for (let i = 0; i < runs; i += 1) {
      const temp = Math.min(1.2, Math.max(0, baseTemp + i * 0.05));
      const result = await generateStructuredOutput({
        client,
        request: {
          messages: [
            { role: "system", content: systemPrompt },
            ...history,
            { role: "user", content: userPrompt }
          ],
          temperature: temp
        },
        schema: OutputSchema,
        maxRetries: 2
      });
      runResults.push(result.value);
    }

    const primary = runResults[0];
    history.push({ role: "user", content: prompt });
    if (primary?.agent?.answer) {
      history.push({ role: "assistant", content: primary.agent.answer });
    }

    sendJson(res, 200, {
      sessionId,
      turn: primary,
      runs: runResults
    });
  } catch (error) {
    sendJson(res, 500, { error: formatError(error) });
  }
}
async function serveStatic(req: http.IncomingMessage, res: http.ServerResponse) {
  const url = new URL(req.url ?? "/", `http://${req.headers.host}`);
  const pathname = url.pathname === "/" ? "/index.html" : url.pathname;
  const filePath = path.join(PUBLIC_DIR, pathname);

  try {
    const content = await fs.readFile(filePath);
    const ext = path.extname(filePath);
    const contentType =
      ext === ".html"
        ? "text/html"
        : ext === ".css"
          ? "text/css"
          : ext === ".js"
            ? "text/javascript"
            : "application/octet-stream";
    res.writeHead(200, { "Content-Type": contentType });
    res.end(content);
  } catch {
    res.writeHead(404);
    res.end("Not found");
  }
}

const server = http.createServer(async (req, res) => {
  if (!req.url) {
    res.writeHead(400);
    res.end("Bad request");
    return;
  }

  if (req.method === "POST" && req.url.startsWith("/api/agent")) {
    await handleAgent(req, res);
    return;
  }

  if (req.method === "POST" && req.url.startsWith("/api/mimi8")) {
    await handleMimi8(req, res);
    return;
  }

  if (req.method === "POST" && req.url.startsWith("/api/fusion")) {
    await handleFusion(req, res);
    return;
  }

  if (req.method === "GET" && req.url.startsWith("/api/odds")) {
    await handleOdds(req, res);
    return;
  }

  if (req.method === "POST" && req.url.startsWith("/api/session/reset")) {
    const body = await parseBody(req);
    if (typeof body.sessionId === "string") {
      sessions.delete(body.sessionId);
    }
    sendJson(res, 200, { ok: true });
    return;
  }

  await serveStatic(req, res);
});

const port = Number(process.env.PORT ?? 8787);
server.listen(port, () => {
  console.log(`RunMesh demo-web running at http://localhost:${port}`);
});
