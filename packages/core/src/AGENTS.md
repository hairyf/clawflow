<skills_system priority="1">

## Available Skills

<usage>
When users ask you to perform tasks, check if any of the available skills below can help complete the task more effectively. Skills provide specialized capabilities and domain knowledge.

How to use skills:
- Invoke: read file `[catalog:agentic-x]/skills/<skill-name>/SKILL.md`
  - For multiple: read files `[catalog:agentic-x]/skills/<skill-name>/SKILL.md`
- The skill content will load with detailed instructions on how to complete the task

Usage notes:
- Only use skills listed in <available_skills> below
</usage>

<!-- SKILLS_TABLE_START -->

<available_skills>

<skill>
<name>cron</name>
<description>Manage cron jobs and wake events (use for reminders; when scheduling a reminder, write the systemEvent text as something that will read like a reminder when it fires, and mention that it is a reminder depending on the time gap between setting and firing; include recent context in reminder text if appropriate)</description>
</skill>

<skill>
<name>memory</name>
<description>Manage memory</description>
</skill>

</available_skills>
<!-- SKILLS_TABLE_END -->

</skills_system>
