# Demo Web

RunMesh example web app with a single fusion flow:

- Chat with memory + multi-run ticket generation

## Run

```bash
pnpm install
pnpm --filter runmesh-demo-web start
```

Then open `http://localhost:8787`.

## Requirements

- `OPENAI_API_KEY` set in your environment
- Optional: `OPENAI_MODEL` (defaults to `gpt-5.2`)
- Optional: `OPENAI_BASE_URL` to point at a compatible provider (e.g. OpenRouter)
- Optional: `RUNMESH_ODDS_URL` to pull a live HTML page for odds display
- Optional: `RUNMESH_ODDS_SELECTOR` (defaults to `#div_tableau_cotes`)
- If `RUNMESH_ODDS_URL` is not set, the app reads `cotes.html` from the repo root

## Mimi8 files

The Mimi8 flow expects these files at repo root:

- `donnees_jour.csv`
- `infos_brutes.txt`
- `world_model.json`
- `tuning_state.json`
