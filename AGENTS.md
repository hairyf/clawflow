# Clawflow AI Agent Constraints

When adding new features or syncing with nanobot, follow these rules.

---

## 1. Naming Conventions

- **Identifiers**: Use `snake_case` for all methods, functions, and properties to match nanobot.
  - Examples: `list_memory_files`, `add_message`, `chat_id`, `created_at`
  - Reference: `.bonfire/specs/snake-case-rename-map.md`
- **File names**: Align with nanobot when there is a direct counterpart.
  - Use `cron.ts` (not `cron-tool.ts`) for `agent/tools/cron`
  - Reference: `.bonfire/specs/code-file-naming-diff.md`

---

## 2. File Structure

- **Mapping**: Follow `.bonfire/specs/code-file-mapping.md` for nanobot ↔ clawflow file correspondence.
- **New modules**: Place code in the mapped directory (e.g., `agent/tools/`, `cron/`, `session/`).
- **Clawflow-only modules**: `bridge/`, `gateway/` have no nanobot equivalent; extend as needed.

---

## 3. Syncing with Nanobot

- **Reference source**: `sources/nanobot/nanobot/` (Python)
- **Target source**: `packages/core/src/` (TypeScript)
- **Differences**: `.bonfire/specs/code-file-diff.md` documents intentional differences (LLM provider, implementation style).
- **Behavior parity**: Match nanobot behavior where a corresponding module exists; document divergences in the diff spec.

---

## 4. Adding New Features

- Add unit tests in `packages/core/test/` mirroring the source layout.
- Use Vitest with `describe` / `it`; prefer A/B-style tests when comparing with nanobot.
- Update `.bonfire/specs/code-file-mapping.md` and `.bonfire/specs/code-file-diff.md` if adding or changing modules.
- Use `snake_case` for all new identifiers.

---

## 5. Acceptable Differences

- **LLM provider**: nanobot uses LiteLLM; clawflow uses `@ai-sdk/*` multi-provider.
- **Types**: TypeScript interfaces vs Python dataclasses.
- **Async model**: `setImmediate` + Promise vs `asyncio.create_task`.
- **Branding**: ClawFlow vs nanobot in user-facing strings.

---

## 6. Verification

After changes, run:

- `pnpm test --run`
- `pnpm build`

---

<skills_system priority="1">

## Available Skills

<!-- SKILLS_TABLE_START -->
<usage>
When users ask you to perform tasks, check if any of the available skills below can help complete the task more effectively. Skills provide specialized capabilities and domain knowledge.

How to use skills:
- Invoke: `npx openskills read <skill-name>` (run in your shell)
  - For multiple: `npx openskills read skill-one,skill-two`
- The skill content will load with detailed instructions on how to complete the task
- Base directory provided in output for resolving bundled resources (references/, scripts/, assets/)

Usage notes:
- Only use skills listed in <available_skills> below
- Do not invoke a skill that is already loaded in your context
- Each skill invocation is stateless
</usage>

<available_skills>

<skill>
<name>bonfire</name>
<description>Session context persistence for AI coding. Start/end sessions, create specs and docs, review work. Use for session management, "start session", "end session", implementation specs, documentation, code review, or questions about previous work, decisions, blockers, "last time", "what we decided".</description>
<location>project</location>
</skill>

<skill>
<name>pnpm</name>
<description>Node.js package manager with strict dependency resolution. Use when running pnpm specific commands, configuring workspaces, or managing dependencies with catalogs, patches, or overrides.</description>
<location>project</location>
</skill>

<skill>
<name>hairy</name>
<description>Hairy's {Opinionated} preferences and best practices for web development</description>
<location>global</location>
</skill>

<skill>
<name>nanobot</name>
<description>Ultra-lightweight personal AI assistant (nanobot). Use when implementing or comparing agent loop, message bus, tools, cron, channels, or cloning nanobot-style architecture.</description>
<location>project</location>
</skill>

</available_skills>
<!-- SKILLS_TABLE_END -->

</skills_system>
