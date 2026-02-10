---
name: memory
description: Search and retrieve workspace memory files (`memory/*.md`, `MEMORY.md`) using QMD. Use for questions about past work, decisions, preferences, or "what we did last time".
allowed-tools: Bash(qmd:*), Read, Glob, Grep
metadata:
  author: hairy
  source: https://github.com/tobi/qmd
  version: "2026.02.10"
---

# Workspace Memory (`/memory`)

Persistent memory for the agent lives in the workspace:

- **Daily notes**: `memory/YYYY-MM-DD.md`
- **Long-term memory**: `MEMORY.md` (only load in trusted / main sessions)

Use this skill when the user asks about:

- Previous work, decisions, or plans
- "What we decided last time", "remind me what we did"
- Preferences, habits, or recurring tasks stored in memory files

---

## Underlying Tool: QMD

QMD is a local hybrid search engine for markdown documents (BM25 + vectors + reranking).

- Repo: `https://github.com/tobi/qmd`
- All queries and retrievals in this skill should go through the `qmd` CLI.

### Installation (one-time, done by human)

```bash
bun install -g github:tobi/qmd
```

Verify:

```bash
qmd status
```

If `qmd` is not available (`command not found`), explain that the user needs to install it first.

---

## Indexing Workspace Memory

Run these from the **workspace root** (`[catalog:workspace]`):

```bash
# 1) Create a "memory" collection pointing at memory/*.md
qmd collection add ./memory --name memory

# 2) Optionally include long‑term MEMORY.md in the same index
qmd collection add . --name memory-root --mask "MEMORY.md"

# 3) Generate or refresh embeddings
qmd embed
```

Guidelines:

- If collections already exist, `qmd status` will list them – do **not** re-add unless paths changed.
- For normal use, it is sufficient to run `qmd embed` occasionally when new memory files are created.

---

## Commands

| Command | Purpose |
|--------|---------|
| `/memory search <query>` | Hybrid search across memory files using QMD |
| `/memory get <docid or path>` | Retrieve a specific memory document via QMD |

---

## Command Routing

Use `$ARGUMENTS` (everything after `/memory`) to decide behavior:

| Pattern | Action |
|--------|--------|
| Empty | Ask what the user wants to recall, then behave like `search <query>` |
| `search <query>` | Run **Search Flow** (QMD hybrid search) |
| `get <id-or-path>` | Run **Get Flow** (QMD document retrieval) |

If the input does not start with `search` or `get`, treat the whole string as a **search query**.

---

## Search Flow – `/memory search <query>`

Goal: find the most relevant memory snippets for the query and use them to answer.

1. **Ensure QMD is available**
   - If `qmd status` fails, explain that QMD must be installed (see Installation) and stop.
2. **Search memory collections**
   - Prefer hybrid search with reranking:

     ```bash
     qmd query "<query>" -c memory --json -n 10
     ```

   - If `memory-root` is configured and the query sounds long‑term (e.g. "overall preferences", "long-term decisions"), also query:

     ```bash
     qmd query "<query>" -c memory-root --json -n 5
     ```
3. **Interpret results**
   - Focus on results with score ≥ 0.4 (moderately relevant).
   - For each top result, note:
     - `filepath` (e.g. `memory/2025-02-10.md`, `MEMORY.md`)
     - `docid` (e.g. `#a1b2c3`)
     - Snippet text.
4. **Optionally fetch full context**
   - When a snippet is promising but too short, fetch more using either:
     - `qmd get "<docid>" --full`, or
     - `Read` on `[catalog:workspace]/<filepath>`.
5. **Answer the user**
   - Synthesize an answer using the retrieved snippets.
   - When helpful, include inline citations like: `Source: memory/2025-02-10.md#L42`.
   - If nothing relevant is found above the threshold, say you searched memory files and did not find a confident match.

---

## Get Flow – `/memory get <docid or path>`

Goal: retrieve and show a specific memory document or section.

1. **Argument parsing**
   - If the argument starts with `#`, treat it as a **docid** from QMD search output.
   - Otherwise, treat it as a **filepath or basename** relative to `[catalog:workspace]`, for example:
     - `MEMORY.md`
     - `memory/2025-02-10.md`
     - `2025-02-10` (you may need to map this to `memory/2025-02-10.md`).
2. **Retrieval via QMD**

   ```bash
   # By docid
   qmd get "#abc123" --full

   # By path (QMD supports fuzzy matching)
   qmd get "memory/2025-02-10.md" --full
   ```

3. **Fallback to direct file read**
   - If `qmd get` fails for a path, fall back to:
     - `Read` on `[catalog:workspace]/memory/<date>.md` or `[catalog:workspace]/MEMORY.md`.
4. **Presenting results**
   - Show the relevant parts of the document, not the entire file when it is very long.
   - If the user asked to "open" a specific day or the long‑term memory, you may include larger excerpts.
   - Always preserve headings and dates so the user understands where the content lives.

---

## Usage Examples

Natural language triggers (map these to `/memory search`):

- "What did we decide about the deployment pipeline last week?"
- "Remind me what I said about my sleep schedule."
- "Summarize the last three days of memory."

Explicit command-style usage:

```text
/memory search what we decided about backups
/memory search preferences about work hours
/memory get MEMORY.md
/memory get #a1b2c3
/memory get memory/2025-02-10.md
```

In all cases, clearly state that you are answering based on saved memory files. If you are unsure or memory is incomplete, say so explicitly.

