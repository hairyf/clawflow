# Skills 模块核查：nanobot vs clawflow

**日期**: 2025-02-07
**对照**: `sources/nanobot/nanobot`（Python）与 `packages/core/src`（TypeScript）

---

## 0. 给 AI 时 skills 是怎么传过去的（nanobot）

nanobot **不单独传 skills 字段**，而是把 skills 全部塞进 **发给模型的那条 system 消息的 `content` 字符串**里：

1. **loop** 里每次处理一条用户消息时，会调 `context.build_messages(history, current_message, ...)` 得到 `messages` 列表。
2. **build_messages** 里先调 `build_system_prompt()` 得到一整段 system 文案，再拼成一条 `{"role": "system", "content": system_prompt}`，后面再接 history 和当前 user 消息。
3. **build_system_prompt** 里对 skills 做两段拼接：
   - **Active Skills（全文）**：`get_always_skills()` 得到名字列表 → `load_skills_for_context(always_skills)` 拉取这些 skill 的**全文**（strip frontmatter 后），拼成 `# Active Skills\n\n### Skill: xxx\n\n...`，append 到 system 的 `parts`。
   - **Skills（摘要）**：`build_skills_summary()` 得到所有 skill 的 XML 摘要（name、description、path、available、requires），拼成 `# Skills\n\n...<skills>...</skills>`，append 到 `parts`。
4. 最后 `"\n\n---\n\n".join(parts)` 得到一整段 **system 字符串**，里面已经包含 identity、bootstrap、memory、**Active Skills 全文**、**Skills 摘要**。

所以：**给 AI 的“数据”就是一条 system 消息，skills 以“一段长文本”的形式嵌在这条 system 的 `content` 里**——always 技能是全文，其它技能是摘要；模型要某条 skill 的全文时，用 read_file 按 path 去读。

clawflow 的 `context.buildSystemPrompt()` / `buildMessages()` 做的是同一件事：skills 只通过 **system prompt 的字符串** 传给 AI，没有别的通道。

---

## 0.1 我们有没有做？在哪里做？怎么验证？

**有没有做**：有。和 nanobot 一样，把 skills 写进 system 消息的 `content` 里传给 AI。

**在哪里做**（只动到 skills 的 3 处）：

| 文件 | 行号 | 做什么 |
|------|------|--------|
| `packages/core/src/agent/context.ts` | 76–81 | 在 `buildSystemPrompt()` 里调 `getAlwaysSkills()`、`loadSkillsForContext(alwaysSkills)`，把全文拼成 `# Active Skills\n\n...` 推入 `parts` |
| `packages/core/src/agent/context.ts` | 83–90 | 同一方法里调 `buildSkillsSummary()`，把 XML 摘要拼成 `# Skills\n\n...` 推入 `parts` |
| `packages/core/src/agent/context.ts` | 102 | `buildMessages()` 里用 `this.buildSystemPrompt()` 得到整段 system 字符串，作为第一条 system 消息的 `content` |

调用链：`loop.ts` 第 151 行或 200 行 `this.context.buildMessages(...)` → `context.ts` 第 102 行 `this.buildSystemPrompt()` → 上面 76–90 行把 skills 写进 system 字符串。

**怎么验证**：

跑单元测试：

```bash
cd packages/core && pnpm test -- --run
```

- **`context.test.ts`**（`packages/core/src/agent/context.test.ts`）里 3 个用例：
  1. 有 always skills 时，system prompt 包含 `# Active Skills`、`### Skill: cron` 及技能正文。
  2. 有 skills summary 时，system prompt 包含 `# Skills`、`<skills>...</skills>` 及说明文案。
  3. `buildMessages()` 的第一条消息为 system，其 `content` 包含上述 Active Skills 与 Skills 段。

通过即说明 skills 已正确写进发给 AI 的 system 文案。

---

## 1. 源码中的使用位置

### nanobot（Python）

| 位置 | 用法 |
|------|------|
| **agent/context.py** | `ContextBuilder.__init__`: `self.skills = SkillsLoader(workspace)`；`build_system_prompt`: 调 `get_always_skills()`、`load_skills_for_context(always_skills)`、`build_skills_summary()`，拼进 system prompt（Active Skills + Skills 段） |
| **agent/loop.py** | 仅注释提到 “Builds context with history, memory, skills”，无直接调用 |
| **utils/helpers.py** | 定义 `get_skills_path(workspace)`，**未被其它模块引用** |
| **agent/__init__.py** | 导出 `SkillsLoader` |

即：**skills 只在 ContextBuilder 里用**，用于拼 system prompt（always 全文 + summary）。

### clawflow（TypeScript）

| 位置 | 用法 |
|------|------|
| **agent/context.ts** | `ContextBuilder` 构造: `this.skills = new SkillsLoader(workspace)`；`buildSystemPrompt`: 调 `getAlwaysSkills()`、`loadSkillsForContext(alwaysSkills)`、`buildSkillsSummary()`，拼进 system prompt（顺序与 nanobot 一致） |
| **agent/loop.ts** | 无直接引用 skills，通过 ContextBuilder 间接使用 |
| **utils/helpers.ts** | 定义 `getSkillsPath(workspace?)`，**未被其它模块引用**（与 nanobot 一致） |
| **agent/skills.ts** | 实现 SkillsLoader，未在 index 导出（仅 context 引用） |

结论：**使用点一致**——两边都是只在 Context 里用 skills 拼 system prompt，loop 不直接碰 skills；`get_skills_path` / `getSkillsPath` 两边都未在别处使用。

---

## 2. Builtin skills 目录与打包

| 项目 | nanobot | clawflow |
|------|---------|----------|
| Builtin 定义 | `BUILTIN_SKILLS_DIR = Path(__file__).parent.parent / "skills"` → 即 `nanobot/skills` | `getDefaultBuiltinSkillsDir()`：先 `../skills`（相对当前模块），再 `../../skills` |
| 源码运行时 | 加载 `agent/skills.py`，parent.parent = `nanobot`，即 `nanobot/skills` | 加载 `src/agent/skills.ts` 时，`../skills` = **`src/skills`**（你当前放的目录） |
| 构建后运行时 | 同左 | 运行 `dist/*.mjs` 时，`../skills` = **`dist/skills`**；tsdown `copy: ['src/skills']` 会把 `packages/core/src/skills` 复制到 dist，故 builtin 来自 **dist/skills** |
| 内容来源 | 仓库内 `nanobot/skills`（cron、github、skill-creator、summarize、tmux、weather 等） | 仓库内 **`packages/core/src/skills`**，构建时由 tsdown 拷到 `dist/skills` |

结论：**我们有做**——builtin 目录、源码位置（src/skills）、打包到 dist 的方式都对齐 nanobot 的“包内 skills 目录”思路。

---

## 3. API 与行为对照

| API / 行为 | nanobot | clawflow | 状态 |
|------------|---------|----------|------|
| 构造 | `SkillsLoader(workspace, builtin_skills_dir=None)` | `SkillsLoader(workspace, builtinSkillsDir?)` | ✓ |
| list_skills / listSkills | workspace + builtin，`filter_unavailable` | 同，`filterUnavailable` | ✓ |
| load_skill / loadSkill | workspace 优先再 builtin | 同 | ✓ |
| build_skills_summary / buildSkillsSummary | XML：available、description、requires（缺失时） | 同 | ✓ |
| get_always_skills / getAlwaysSkills | 从 metadata 读 always + 满足 requirements | 同 | ✓ |
| load_skills_for_context / loadSkillsForContext | 全文 + strip frontmatter，`### Skill: name` | 同 | ✓ |
| get_skill_metadata / getSkillMetadata | YAML frontmatter | 同 | ✓ |
| _strip_frontmatter / stripFrontmatter | 去 `---...---` | 同 | ✓ |
| _check_requirements / checkRequirements | bins + env | 同（whichSync + process.env） | ✓ |
| get_skills_path / getSkillsPath | utils 中定义，未被引用 | utils 中定义，未被引用 | ✓（一致） |

结论：**API 与行为已对齐**。

---

## 4. 可选参数 skill_names

- **nanobot**: `build_system_prompt(skill_names=None)`、`build_messages(..., skill_names=None)`，并把 `skill_names` 传给 `build_system_prompt`；但在 `build_system_prompt` 内部**并未使用**该参数，始终用 `get_always_skills()` + `build_skills_summary()`。
- **clawflow**: `buildSystemPrompt(_skillNames?: string[])` 保留参数但未使用，`buildMessages` 未暴露 skillNames。

结论：**语义一致**（两边都未按 skill_names 做定制），无缺失。

---

## 5. 小结

- **使用位置**：两边都只在 **Context** 里用 skills（拼 system prompt），**我们有做**。
- **Builtin 与打包**：nanobot 用包内 `nanobot/skills`；我们用 **`src/skills`** + tsdown 复制到 **`dist/skills`**，**我们有做**。
- **API 与逻辑**：list/load、summary、always、metadata、frontmatter、requirements 均对齐，**我们有做**。
- **get_skills_path / getSkillsPath**：两边都仅定义、未引用，**一致**。

无需再补的差异：无。若后续 nanobot 在 loop 或其它处直接使用 skills，再对照补即可。
