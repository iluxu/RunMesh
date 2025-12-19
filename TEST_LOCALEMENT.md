# 🧪 Comment Tester RunMesh Localement

## ✅ Prérequis

Tu dois avoir fait ces étapes (normalement déjà fait):

```bash
# 1. Installer les dépendances
pnpm install

# 2. Builder tous les packages
pnpm build

# 3. Vérifier que les tests passent
pnpm test
```

## 🚀 Tester les Exemples

### 1. Simple Chatbot

```bash
# Aller dans l'exemple
cd examples/simple-chatbot

# Créer un fichier .env avec ta clé API
echo "OPENROUTER_API_KEY=ta_clé_ici" > .env

# Lancer le chatbot
pnpm start
```

**Note**: Tu auras besoin d'une vraie clé OpenRouter. Va sur https://openrouter.ai pour en obtenir une.

### 2. Tool Agent

```bash
cd examples/tool-agent

echo "OPENROUTER_API_KEY=ta_clé_ici" > .env

pnpm start
```

### 3. Demo CLI

```bash
cd framework/apps/demo-cli

# Mettre la clé API dans le .env racine
cd ../../..
echo "OPENROUTER_API_KEY=ta_clé_ici" > .env

# Retourner au demo et lancer
cd framework/apps/demo-cli
npx tsx index.ts "What's 2+2?"
```

### 4. Demo Web

```bash
cd framework/apps/demo-web

# S'assurer que le .env existe à la racine
cd ../../..
echo "OPENROUTER_API_KEY=ta_clé_ici" > .env

# Retourner au demo et lancer
cd framework/apps/demo-web
npx tsx server-simple.ts

# Dans un autre terminal, tester avec curl:
curl -X POST http://localhost:8787/api/agent \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Hello!"}'

# Ou ouvrir dans le navigateur:
open http://localhost:8787
```

## 🔍 Vérifier que les Packages sont Bien Buildés

```bash
# Vérifier que les fichiers .js et .d.ts existent
ls framework/packages/core/dist/

# Devrait montrer:
# index.js, index.d.ts, openai-client.js, providers.js, etc.

# Vérifier plusieurs packages
for pkg in core agent tools memory; do
  echo "Checking @runmesh/$pkg..."
  ls framework/packages/$pkg/dist/*.js | head -3
done
```

## 📦 Tester l'Import des Packages

Depuis la racine du projet:

```bash
# Créer un fichier de test
cat > test-quick.js << 'EOF'
import { createAgent } from "@runmesh/agent";
import { createOpenRouterConfig, createFromProvider } from "@runmesh/core";

console.log("✅ Imports fonctionnent!");
console.log("createAgent:", typeof createAgent);
console.log("createFromProvider:", typeof createFromProvider);
EOF

# Le lancer (ne fonctionnera que si dans le workspace)
node test-quick.js
```

## 🐛 Problèmes Courants

### Problème 1: "Cannot find package '@runmesh/...'"

**Solution**: Tu dois être dans le workspace pnpm. Les exemples utilisent `workspace:*` pour référencer les packages locaux.

```bash
# S'assurer d'être à la racine et rebuilder
cd /path/to/axiom
pnpm build
```

### Problème 2: "dist/ est vide ou a une mauvaise structure"

**Solution**: Nettoyer et rebuilder:

```bash
# Nettoyer tous les dist/
rm -rf framework/packages/*/dist

# Rebuilder
pnpm build

# Vérifier
ls framework/packages/core/dist/
```

### Problème 3: "Module did not self-register"

**Solution**: Problème de Node.js native modules. Reinstaller:

```bash
rm -rf node_modules
rm pnpm-lock.yaml
pnpm install
pnpm build
```

### Problème 4: Les exemples ne lancent pas

**Solution**: Vérifier que tsx est installé:

```bash
cd examples/simple-chatbot
pnpm install
pnpm start
```

## ✅ Checklist Complète de Test

Avant de pusher sur GitHub/npm:

- [ ] `pnpm test` passe (27/27 tests)
- [ ] `pnpm build` réussit sans erreur
- [ ] `pnpm lint` ne montre que des warnings (pas d'erreurs)
- [ ] `ls framework/packages/core/dist/` montre des fichiers .js
- [ ] L'exemple `simple-chatbot` lance sans erreur (avec une vraie API key)
- [ ] L'exemple `tool-agent` lance sans erreur
- [ ] Le `demo-cli` répond à une question
- [ ] Le `demo-web` serve une page web sur localhost:8787

## 📝 Note Importante

Les exemples **NÉCESSITENT** une vraie clé API pour fonctionner:
- OpenRouter (recommandé): https://openrouter.ai
- OpenAI: https://platform.openai.com
- Anthropic: https://console.anthropic.com

Mets ta clé dans `.env` à la racine:
```bash
OPENROUTER_API_KEY=sk-or-v1-xxxxx
```

## 🚀 Si Tout Fonctionne

Tu es prêt pour le launch! Suis le guide dans `TESTING_GUIDE.md` pour:
1. Créer le commit
2. Push sur GitHub
3. Publish sur npm
4. Lancer la stratégie social media
