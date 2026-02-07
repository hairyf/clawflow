---
source: https://github.com/HKUDS/nanobot
title: Skills 技能加载
category: features
---

# Skills：技能加载与注入

Skills 是 workspace 或内置的 `{name}/SKILL.md` 文档，用于扩展 Agent 能力（如 GitHub、天气、tmux）。SkillsLoader 负责发现、校验依赖、生成摘要或全文注入。

## 目录

- **Workspace**：`workspace/skills/{name}/SKILL.md`（优先）
- **内置**：`nanobot/skills/{name}/SKILL.md`（若存在）

## 能力清单

```python
loader = SkillsLoader(workspace)

# 列出可用 skill（可选过滤不满足依赖的）
skills = loader.list_skills(filter_unavailable=True)
# [{"name": "...", "path": "...", "source": "workspace"|"builtin"}, ...]

# 按需加载全文
content = loader.load_skill("github")

# 批量加载用于 context
text = loader.load_skills_for_context(["skill_a", "skill_b"])

# 生成摘要（供 progressive loading：agent 用 read_file 按需读 SKILL.md）
summary_xml = loader.build_skills_summary()
```

## 依赖与可用性

- 在 SKILL.md 的 frontmatter 里可通过 `metadata`（或 nanobot 约定）声明 `requires.bins`、`requires.env`。
- `_check_requirements(meta)` 为 True 时该 skill 才视为可用；`build_skills_summary()` 中会标 `available="true|false"`，不可用时可写 `requires` 提示（如缺少 CLI 或 ENV）。

## Always 技能

- `get_always_skills()` 返回标记为「始终加载」且满足依赖的 skill 名称列表。
- 这些技能的全文会通过 `load_skills_for_context(always_skills)` 直接注入 system prompt；其余只出现在 summary 中。

## 参考

- 源码: `nanobot/agent/skills.py`
- 项目结构: README 中 `nanobot/skills/` 与 `workspace/skills/`
