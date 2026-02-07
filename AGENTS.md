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
