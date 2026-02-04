# Clawflow 产品提案

## 1. 定位与目标

### 1.1 OpenClaw 与 Clawflow 的差异

| 维度 | OpenClaw | Clawflow |
|------|----------|----------|
| **定位** | 自部署的 C 端个人 AI 助手 | 工程化、项目绑定的 AI 工作流与多 Agent 编排 |
| **工作区** | 默认 `~/.openclaw/workspace`，AI 生成物在用户主目录 | 项目根目录（如 `src/` 或 `workspace/`），代码与产物与仓库一体 |
| **可见性** | 会话与生成内容偏「黑盒」，面向终端用户 | 项目内代码、配置、技能、记忆、定时任务均可版本管理与人工审查 |
| **Agent 模型** | 单 Agent / 多 Agent 路由（按 channel/peer 隔离） | 单项目 + OpenClaw 的 agents/sessions；可选增强：同一项目内多 Agent 编排（.collective） |

Clawflow 的目标是：**把 OpenClaw 的能力与软件工程实践结合**——在保留 Gateway、工具链、通道等能力的前提下，将「项目」与「Agent 工程」绑定，使 AI 生成物可追踪、可审查、可协作。

### 1.2 实现原则（避免 AI 实现幻觉）

- **以 OpenClaw 为唯一基础**：会话、Agent、工作区、记忆、cron、工具、沙箱、通道、Gateway、Hooks 等**一律沿用 OpenClaw 已有能力**，不引入与 OpenClaw 冲突的第二套子系统（例如不另做一套 memory 架构、不另做一套 hooks 运行时）。
- **仅做「项目绑定」与「委托」**：通过项目级配置（`clawflow.config.ts` → `.openclaw/openclaw.json`）与环境变量（`OPENCLAW_CONFIG_PATH`、`OPENCLAW_STATE_DIR`）把工作区与状态目录绑定到项目目录；CLI 以委托方式调用 `openclaw`，不重复实现 OpenClaw 已有命令逻辑。
- **增强功能务实、不硬加**：在 OpenClaw 之上可增加「项目脚手架」（`clawflow create`）、「可选多 Agent 编排」（`.collective`）等；若某增强实现成本高，则预留目录/配置即可，不强行实现以免与上游冲突或产生幻觉。

### 1.3 核心价值

- **项目即工作区**：所有 Agent 产出（代码、配置、技能、记忆、cron）都在项目目录内，可 Git 管理、Code Review；**记忆与 cron 使用 OpenClaw 已有 memory/cron 能力**，仅将存储路径指向项目内目录。
- **可选多 Agent 编排**：若实现可行，可在同一项目中增加轻量 Swarm/Hive-Mind 等（见下文「可选增强」）；若实现困难则仅预留 `.collective` 目录与配置，不硬加。
- **继承 OpenClaw 能力**：Gateway、CLI、TUI、通道、工具（browser/canvas/nodes/cron/sessions）、沙箱、模型/认证故障转移、**memory 管理**、**hooks** 等均复用 OpenClaw，不重复造轮。
- **人工审查友好**：`AGENTS.md`、`skills/`、`tools/`、配置文件集中放置，便于团队约定与审查。

---

## 2. 项目结构（`pnpx clawflow create <project-name>`）

执行 `pnpx clawflow create <project-name>` 后，在 `<project-name>/` 下生成如下目录与占位文件。

```
<project-name>/
├── .openclaw/                    # OpenClaw 状态目录（配置、会话、auth、cron、memory 等均由此管理）
├── .collective/                  # 【可选增强】多 Agent 编排；若实现困难则仅预留，不实现
│   ├── swarm/
│   ├── hive-mind/
│   └── coordination/
├── agents/                       # 【可选】会话索引/视图（只读展示，数据来源为 OpenClaw 的 session 状态）
├── skills/                       # 项目级 skills（OpenClaw workspace 外一层，可被注入或引用）
├── src/                          # 工作目录（= OpenClaw agents.defaults.workspace）
│   ├── skills/                   # 工作区 skills（OpenClaw 已有约定）
│   ├── tools/                    # 工具脚本（由 OpenClaw exec/process 等调用）
│   ├── *.md                      # AGENTS.md、SOUL.md、TOOLS.md 等（OpenClaw 注入）
│   └── ...
├── clawflow.config.ts            # Clawflow 主配置（用于生成 .openclaw/openclaw.json 与路径）
└── package.json
```

说明（**一律以 OpenClaw 为准，不引入第二套子系统**）：

- **`.openclaw`**：项目内 OpenClaw 状态目录。通过 **OPENCLAW_CONFIG_PATH** 与 **OPENCLAW_STATE_DIR** 指向此处后，OpenClaw 的会话、auth、cron、**memory（memorySearch.store.path 等）**、plugins 等均落在此目录；可与 `$include` 合并全局配置（见 §6）。
- **`src` 与 workspace**：默认 `src` 作为工作目录；在生成的 `openclaw.json` 中设 **agents.defaults.workspace = "<项目根>/src"**，与 OpenClaw 一致。工作区内 **skills、AGENTS.md/SOUL.md/TOOLS.md、记忆与 cron 的使用** 均遵循 OpenClaw 现有行为（OpenClaw 已有 memory 管理、cron、hooks），不在 Clawflow 中重复实现或替换。
- **记忆（memory）**：**仅使用 OpenClaw 已有 memory 能力**（如 `agents.defaults.memorySearch`、memory 扩展 memory-core / memory-lancedb 等）。若将记忆存储放在项目内，通过配置 `memorySearch.store.path` 等指向项目下的 `.openclaw` 或指定子目录即可；不在本提案中引入 agent-flow/claude-flow 的 L1/L2/L3、AgentDB/HNSW 等另一套 memory 架构，以免实现时产生幻觉或冲突。
- **cron**：**仅使用 OpenClaw 已有 cron 能力**（Gateway cron）。项目内如需版本化的 cron 定义，可仅保留 `cron/` 目录下 JSON 等文件作为「定义备份」，实际执行仍由 OpenClaw Gateway 的 cron 完成（或通过配置导入）；不引入另一套 cron 运行时。
- **agents/**：可选。仅作会话索引或只读视图（例如按项目过滤的 session 列表），数据来源仍是 OpenClaw 的 session 状态；不替代 OpenClaw 的 agents/sessions 模型。
- **skills/ 与 src/skills/**：与 OpenClaw 的 workspace skills 约定一致；项目级 `skills/` 可作为额外挂载或配置路径，由 OpenClaw 的 skills 解析逻辑或配置引用，不重复实现一套 skills 加载器。
- **`.collective`**：**可选增强**。仅在「多 Agent 编排」实现可行且不与 OpenClaw 冲突时再做；若实现难度大，则仅预留目录与 `clawflow.config.ts` 中的配置项，不硬加 swarm/hive-mind/coordination 的运行时逻辑（详见 §5 可选增强）。

---

## 3. 命令设计（以 OpenClaw 为基础）

**原则**：会话、记忆、cron、hooks、agents、sandbox、models、channels 等**一律沿用 OpenClaw 已有命令与能力**；clawflow 只做「项目上下文 + 委托」，不重复实现、不引入与 OpenClaw 冲突的第二套命令（如不单独做 `clawflow memory`、`clawflow hooks` 等与 OpenClaw memory/hooks 语义重叠的子命令）。

### 3.1 必做：项目绑定 + 委托 OpenClaw

| 命令 | 说明 |
|------|------|
| `clawflow create <project-name>` | 创建项目脚手架（含 `.openclaw/`、`src/`、`clawflow.config.ts` 等）；生成或写入项目级 `openclaw.json`（可 `$include` 全局配置，并设 `agents.defaults.workspace`）。 |
| `clawflow gateway start` | 设置 `OPENCLAW_CONFIG_PATH` / `OPENCLAW_STATE_DIR` 后 spawn `openclaw gateway start`，使 Gateway 跑在项目配置与项目状态上。 |
| `clawflow gateway status \| stop \| restart` | 同上环境后委托 `openclaw gateway ...`。 |
| `clawflow tui` | 同上环境后委托 `openclaw tui`。 |
| `clawflow status` / `clawflow health` / `clawflow doctor` | 委托 `openclaw status` / `openclaw health` / `openclaw doctor`（读项目配置）。 |
| `clawflow channels ...` / `clawflow pairing ...` | 委托 `openclaw channels` / `openclaw pairing`。 |
| `clawflow cron list \| add \| remove \| run` | 委托 `openclaw cron ...`（使用 OpenClaw 已有 cron）。 |
| `clawflow sessions list \| history \| send` | 委托 `openclaw sessions ...`。 |
| `clawflow sandbox explain ...` | 委托 `openclaw sandbox explain`。 |
| `clawflow models ...` / `clawflow nodes ...` / `clawflow browser ...` 等 | 均委托 `openclaw <subcommand>`；或统一通过 `clawflow openclaw -- <args>` 透传。 |

**记忆与 Hooks**：不新增 `clawflow memory` / `clawflow hooks` 等与 OpenClaw 重叠的子命令；用户直接使用 OpenClaw 的 memory 能力（配置中 `agents.defaults.memorySearch` 等）与 OpenClaw 已有 hooks（若 OpenClaw 暴露了 hooks CLI 则委托即可）。

### 3.2 可选增强：多 Agent 编排（.collective）

**仅当实现可行且不与 OpenClaw 冲突时再做；若实现难度大则仅预留目录与配置，不实现。**

| 命令 | 说明 |
|------|------|
| `clawflow swarm init \| execute \| status` | 可选：轻量 Swarm 任务编排，读写 `.collective/swarm`。 |
| `clawflow hive-mind spawn \| ...` | 可选：有状态 Hive-Mind 工作区，读写 `.collective/hive-mind`。 |
| `clawflow agents list` | 可委托 `openclaw` 的 agents 列表，或作为项目内会话索引的只读视图。 |

不硬加 SPARC、MCP 等与 OpenClaw 无直接对应的能力；若后续需要再单独列为「后续可扩展」。

---

## 4. 配置文件 `clawflow.config.ts`

### 4.1 设计原则

- **与 OpenClaw 配置一一对应**：`clawflow.config.ts` 仅用于生成或合并进 `.openclaw/openclaw.json`；不定义与 OpenClaw 冲突的语义（例如不定义「clawflow 专用 memory 后端」——记忆一律使用 OpenClaw 的 `agents.defaults.memorySearch` 等）。
- 项目级覆盖：**工作区路径**（对应 `agents.defaults.workspace`）、可选 **collective 目录**（仅当实现可选增强时使用）；其余 gateway、agents、tools、sandbox、channels 等透传或合并进 openclaw 配置。
- 类型友好：通过 `defineConfig` 提供 TypeScript 类型与基础校验。

### 4.2 配置项草案

```ts
import { defineConfig } from 'clawflow'

const config = defineConfig({
  // 工作区：Agent 工作目录，相对项目根 → 生成 openclaw 时写 agents.defaults.workspace
  workspace: 'src',

  // 与 OpenClaw 的集成方式：委托 openclaw，通过 OPENCLAW_CONFIG_PATH / OPENCLAW_STATE_DIR 指向项目 .openclaw
  openclaw: 'delegate',

  // 可选：collective 目录（仅当实现「可选增强」时使用）；若未实现 collective，可忽略
  paths: {
    collective: '.collective',
  },

  // 以下均透传或合并进生成的 .openclaw/openclaw.json，语义与 OpenClaw 完全一致
  gateway: { /* port, bind, auth, ... */ },
  agents: {
    defaults: {
      // workspace 由上方的 workspace 覆盖
      // model, sandbox, tools, memorySearch 等见 OpenClaw 文档
    },
  },
  // tools、sandbox、channels 等：按 OpenClaw 配置书写，不在此处引入新语义
})
```

`defineConfig` 的职责建议：

- 解析并合并环境变量与 `clawflow.config.ts`。
- 将 `workspace` 解析为绝对路径（基于项目根），并写入生成或合并后的 `openclaw.json` 的 `agents.defaults.workspace`。
- 导出供 CLI 委托层使用的配置对象；生成或更新 `projectRoot/.openclaw/openclaw.json`（可含 `$include` 全局配置）。

---

## 5. 技术要点摘要

### 5.1 以 OpenClaw 为唯一基础（不引入冲突）

- **OpenClaw 复用**：Gateway、Pi agent、通道、工具（browser/canvas/nodes/cron/sessions）、**记忆（memorySearch 与 memory 扩展）**、**cron**、**hooks**、沙箱、模型/认证故障转移等**全部沿用 OpenClaw**；Clawflow 仅做「项目绑定」（工作区与状态目录指向项目）与「委托调用」，不重复实现、不引入第二套 memory/hooks/cron/agents 模型。
- **记忆**：**仅使用 OpenClaw 已有 memory**（配置项如 `agents.defaults.memorySearch`、扩展 memory-core / memory-lancedb 等）。若希望记忆数据落在项目内，在生成的 openclaw 配置中设置 `memorySearch.store.path` 等指向项目 `.openclaw` 下路径即可；不在本方案中引入 L1/L2/L3、AgentDB、HNSW 等另一套 memory 架构。
- **cron**：**仅使用 OpenClaw 已有 cron**（Gateway cron）；项目内可保留 cron 定义文件仅作备份或人工编辑，执行仍由 OpenClaw 完成。
- **clawflow.config.ts**：仅用于生成或合并 `.openclaw/openclaw.json` 及解析 `workspace` 等路径；不定义与 OpenClaw 语义冲突的配置项。

### 5.2 可选增强：.collective（多 Agent 编排）

**仅当实现可行且不与 OpenClaw 冲突时再做；若实现难度大则仅预留目录与配置，不硬加。**

- 可在同一项目内增加「轻量 Swarm / Hive-Mind」等任务编排，读写 `.collective/swarm`、`.collective/hive-mind`、`.collective/coordination`；与 OpenClaw 的「多 Agent 路由」（agents.list、按 channel 隔离）是**互补关系**，不是替换——OpenClaw 仍负责单会话/单 Agent 的推理与工具调用，collective 仅负责任务分解与多 Agent 协作的元数据与调度（若实现）。
- 若实现，可参考外部资料（如 agent-flow 的 Swarm/Hive-Mind 概念）；但**不把 agent-flow/claude-flow 的 memory、hooks、MCP 等搬进 Clawflow**，以免与 OpenClaw 已有能力冲突或产生实现幻觉。

### 5.3 安全与沙箱

- **一律沿用 OpenClaw**：沙箱语义（`sandbox.mode`、`scope`、`workspaceAccess`、`tools.sandbox.tools`、elevated）以 OpenClaw 文档与源码为准；Clawflow 不单独实现安全模块，仅在生成 openclaw 配置时透传或合并用户配置。

### 5.4 实现技术栈建议

- **运行时**：Node.js 20+（与 OpenClaw 一致）；TypeScript；测试用 Vitest（本仓库已用）。
- **CLI**：Commander.js 或类似；子命令以「委托 openclaw」为主（gateway、tui、status、channels、cron、sessions、sandbox、models、nodes、browser 等），可选 collective 子命令仅当实现可选增强时存在。
- **持久化**：会话、记忆、cron、插件等持久化**均由 OpenClaw 与项目内 `.openclaw` 目录承担**；若实现 collective，可单独用 SQLite 或文件存放 `.collective` 下的状态，与 OpenClaw 状态分离。

### 5.5 基于 OpenClaw 实现（源码结论）

对 OpenClaw 源码（`sources/openclaw`）的结论如下，**无需改 OpenClaw 即可基于其实现 Clawflow**。

| 关注点 | OpenClaw 行为 | 对 Clawflow 的启示 |
|--------|----------------|--------------------|
| **入口** | `entry.ts` → `run-main.ts` → `runCli(argv)` → `buildProgram()`，再 `loadConfig()` 用于插件与 Gateway | clawflow 可作独立 CLI，在调用 openclaw 前设置 env 或生成配置即可 |
| **配置来源** | `config/io.ts`：`loadConfig()` 使用 `createConfigIO()`，未传参时用 `resolveConfigPath(env)`；**优先读 `OPENCLAW_CONFIG_PATH`**，否则 `OPENCLAW_STATE_DIR/openclaw.json`，再否则 `~/.openclaw/openclaw.json` | 在项目根执行时设 **OPENCLAW_CONFIG_PATH=<项目>/.openclaw/openclaw.json**（或合并后的配置路径），OpenClaw 即加载项目配置 |
| **工作区解析** | `agents/agent-scope.ts`：`resolveAgentWorkspaceDir(cfg, agentId)` 先看 `agents.list[].workspace`，再 `agents.defaults.workspace`，最后默认 `~/.openclaw/workspace` 或 `~/.openclaw/workspace-<id>`；路径经 `resolveUserPath()` 展开 `~` | 在项目级 openclaw 配置里设 **agents.defaults.workspace = "<项目根>/src"**（或 `paths.workspace`），即把工作区绑定到项目目录；Gateway、skills、memory、cron 等已全部按该 workspace 工作 |
| **配置合并** | `config/includes.ts`：支持 **`$include`**，单文件或数组多文件，深合并（对象合并、数组拼接） | 项目内可写 `openclaw.json` 含 `"$include": "~/.openclaw/openclaw.json"`，再覆盖 `agents.defaults.workspace`、gateway、tools 等，复用全局通道与鉴权 |
| **Gateway 启动** | `cli/gateway-cli/run.ts`：`loadConfig()` 无参，即用当前 process.env；再 `startGatewayServer(cfg, ...)` | 以 `OPENCLAW_CONFIG_PATH` + 可选 `OPENCLAW_STATE_DIR` 启动进程后执行 `openclaw gateway`，Gateway 即跑在项目配置与项目状态上 |
| **插件** | `plugins/loader.ts`：按 config + workspaceDir 发现并加载插件，可注册 CLI 子命令与 Gateway 请求处理 | 可选：Clawflow 以 OpenClaw 插件形式提供 `clawflow create`、`swarm`、`hive-mind` 等子命令及 `.collective` 相关逻辑；工作区仍由配置覆盖决定 |

结论：**仅通过「项目级配置 + 环境变量」即可把 OpenClaw 的工作区与状态绑定到项目目录**；可选增强（如 collective）可单独实现或通过插件挂接，且**不与 OpenClaw 已有 memory/cron/hooks/agents 冲突**。

### 5.6 在 OpenClaw 之上可增强的能力（务实、不硬加）

在**不替换、不重复实现 OpenClaw 已有能力**的前提下，可做且仅做以下增强：

| 增强项 | 说明 | 实现难度 | 建议 |
|--------|------|----------|------|
| **项目脚手架** | `clawflow create`：生成项目目录、`clawflow.config.ts`、`.openclaw/openclaw.json`（可 `$include` 全局配置），并设 `agents.defaults.workspace` | 低 | 必做 |
| **项目绑定 + 委托** | 通过 `OPENCLAW_CONFIG_PATH` / `OPENCLAW_STATE_DIR` 调用 openclaw，使 Gateway/TUI/status/channels/cron/sessions 等跑在项目配置与项目状态上 | 低 | 必做 |
| **会话索引/视图** | 可选：在项目内提供 `agents/` 等只读视图（按项目过滤的 session 列表），数据来源仍为 OpenClaw | 低 | 可选 |
| **.collective（多 Agent 编排）** | 可选：同一项目内轻量 Swarm/Hive-Mind 等任务分解与协作，与 OpenClaw 的 agents.list 互补；读写 `.collective/*` | 中高 | 若实现困难则仅预留目录与配置，不实现具体编排逻辑 |
| **OpenClaw 插件形态** | 将 clawflow 做成 OpenClaw 插件，注册 `clawflow create` 等子命令；工作区与状态仍由配置 + env 决定 | 中 | 后续可选 |

**不做的增强（避免与 OpenClaw 冲突或实现幻觉）**：

- 不引入另一套 **memory** 架构（OpenClaw 已有 memorySearch、memory 扩展）；不引入 L1/L2/L3、AgentDB、HNSW 等与 OpenClaw memory 并行的系统。
- 不引入另一套 **hooks** 运行时（若 OpenClaw 已有 hooks，则沿用或委托）；不单独实现 pre-task/post-edit/session-end 等与 OpenClaw 重叠的 CLI。
- 不引入另一套 **cron** 运行时；cron 执行仅由 OpenClaw Gateway 完成。
- **SPARC、MCP、ReasoningBank** 等与 OpenClaw 无直接对应的能力：仅作「后续可扩展」列举，不写入首版必做范围。

### 5.7 实现阶段（建议）

- **Phase 1（必做）**：项目脚手架（`clawflow create`）+ 项目绑定与委托（`OPENCLAW_CONFIG_PATH` / `OPENCLAW_STATE_DIR` + spawn openclaw）。实现后即可在项目目录内使用 OpenClaw 全部能力（Gateway、TUI、channels、cron、sessions、memory、sandbox 等），且工作区与状态均在项目内。
- **Phase 2（可选）**：若可行，增加 `.collective` 目录及可选的多 Agent 编排（swarm/hive-mind）；若实现难度大，则仅预留目录与 `clawflow.config.ts` 中的 collective 配置项。
- **Phase 3（后续）**：会话索引/视图、OpenClaw 插件形态、Web UI、Code Review 集成等，按需再做。

---

## 6. 基于 OpenClaw 的实现路径

在「不改 OpenClaw 源码」的前提下，可采用以下三种方式之一或组合。

### 6.1 委托 + 环境变量（推荐起步）

1. **clawflow CLI** 在项目根解析 `clawflow.config.ts`，若不存在则提示 `clawflow create`。
2. 解析得到项目根 `projectRoot` 与 `workspace`（如 `src`）。
3. **生成或指定项目级 OpenClaw 配置**：
   - 方案 A：生成 `projectRoot/.openclaw/openclaw.json`，内容包含 `agents.defaults.workspace = "<projectRoot>/<workspace>"`，其余可从 `$include` 引入全局配置；
   - 方案 B：或由 clawflow 在内存中合并全局 config + 项目覆盖，写临时文件，再设 `OPENCLAW_CONFIG_PATH` 指向该文件。
4. 执行 openclaw 前设置：
   - `OPENCLAW_CONFIG_PATH = projectRoot/.openclaw/openclaw.json`（或临时文件）；
   - 可选：`OPENCLAW_STATE_DIR = projectRoot/.openclaw`，使会话、auth、cron、plugins 等全部落在项目内。
5. **spawn**：`child_process.spawn("openclaw", ["gateway", "start", ...], { env: { ...process.env, OPENCLAW_CONFIG_PATH, OPENCLAW_STATE_DIR } })`；同理可封装 `openclaw tui`、`openclaw status` 等。

优点：实现快、与 OpenClaw 解耦、可随时跟进上游。缺点：需在项目内维护或生成一份 openclaw 配置（或 include 链）。

### 6.2 项目配置 $include 全局配置

1. **clawflow create** 时在 `projectRoot/.openclaw/` 下生成 `openclaw.json`，例如：
   ```json5
   {
     "$include": "~/.openclaw/openclaw.json",
     "agents": {
       "defaults": {
         "workspace": "<projectRoot>/src"
       }
     }
   }
   ```
2. 用户（或 clawflow）执行 `openclaw gateway start` 前设置：
   - `OPENCLAW_CONFIG_PATH=projectRoot/.openclaw/openclaw.json`
   - 可选 `OPENCLAW_STATE_DIR=projectRoot/.openclaw`
3. OpenClaw 加载时会解析 `$include` 并深合并，项目仅覆盖工作区等必要字段，通道、鉴权等沿用全局。

优点：用户保留一份全局 openclaw 配置，项目只维护少量覆盖。缺点：依赖 OpenClaw 的 include 解析与合并顺序（后合并覆盖先合并）。

### 6.3 OpenClaw 插件形式

1. 将 Clawflow 实现为 **OpenClaw 插件**（实现 `OpenClawPluginApi`，提供 `openclaw.plugin.json` 与入口）。
2. 插件内注册：
   - CLI 子命令：`clawflow create`、`clawflow swarm`、`clawflow hive-mind` 等；
   - 可选：Gateway 请求处理（如 `/collective/swarm`、`/collective/hive-mind`）。
3. 工作区与状态仍由 **配置** 决定：用户或在插件引导下在全局/项目 openclaw 配置中设置 `agents.defaults.workspace` 为项目下的 `src`，并可配合 `OPENCLAW_CONFIG_PATH` 使用项目内 `.openclaw/openclaw.json`（含 `$include` 或完整配置）。

优点：与 OpenClaw 生态统一、可被 `openclaw plugins` 管理。缺点：需遵循 OpenClaw 插件约定与发布方式。

**建议**：首版采用 **6.1 委托 + 环境变量**，在项目内生成 `.openclaw/openclaw.json`（可 `$include` 用户主目录配置），并统一通过 `OPENCLAW_CONFIG_PATH` / `OPENCLAW_STATE_DIR` 调用 openclaw；后续如需更好集成再补 **6.3 插件** 形态。

---

## 7. 后续可扩展方向

以下均为**可选**，且**不引入与 OpenClaw 冲突的子系统**：

- **会话索引/视图**：项目内 `agents/` 作为只读视图，与 Git 分支/PR 关联（Code Review）；数据来源仍为 OpenClaw 的 session 状态。
- **多工作区**：同一项目下多个 workspace（如 `src/`、`docs/`）对应不同 Agent 或工具策略，通过 OpenClaw 的 `agents.list[].workspace` 配置即可。
- **Clawflow 作为 OpenClaw 插件**：以 OpenClaw 插件形式注册 `clawflow create` 等子命令，供已有 OpenClaw 用户选用。
- **Web UI**：项目级 Dashboard，展示会话、cron、collective（若已实现）状态；数据来源为 OpenClaw 与项目内 `.openclaw`。
- **SPARC / MCP / ReasoningBank**：与 OpenClaw 无直接对应，仅作概念扩展；若实现需单独设计，且不与 OpenClaw 的 memory/hooks/agents 语义冲突。

---

## 8. 技能与参考文档（本仓库 skills）

**实现时以 OpenClaw 为准，避免参考冲突导致幻觉。**

### 8.1 主参考：openclaw（`skills/openclaw/`）——必读

Clawflow 的**会话、Agent、工作区、记忆、cron、工具、沙箱、通道、Gateway、hooks** 等一律沿用 OpenClaw；实现与配置以 OpenClaw 文档与源码为准，**不引入与 OpenClaw 冲突的 memory/hooks/cron 等第二套子系统**。

| 文档 | 用途 |
|------|------|
| core-overview | 产品概述、Gateway、多通道、工作区与 skills 约定 |
| core-architecture | Gateway WebSocket、Sessions、Agents、Nodes、执行位置、远程访问 |
| core-cli | 安装、onboard、gateway、status、channels、pairing、models、sandbox、cron、sessions、nodes、browser |
| core-configuration | openclaw.json、路径、gateway/auth、models、channels、sandbox、tools、多 Agent 路由、环境变量 |
| features-tools | 工具 profile/allow/deny、group、exec/process/browser/canvas/nodes/cron/sessions/message 等 |
| features-sandboxing | Docker 沙箱 mode/scope/workspaceAccess、binds、镜像、setupCommand、sandbox tool policy |
| features-channels-pairing | DM pairing、allowlists、pairing approve |
| features-models-failover | 模型选择、auth profiles、fallback |
| advanced-sandbox-tool-policy-elevated | 沙箱与工具策略、elevated 逃逸与修复 |
| advanced-remote-access | SSH、Tailscale Serve/Funnel、安全暴露 |

**记忆（memory）**：使用 OpenClaw 已有 memory 能力（配置中 `agents.defaults.memorySearch`、memory 扩展等）；**不要**参考 agent-flow/claude-flow 的 memory 架构（L1/L2/L3、AgentDB、HNSW 等）来实现 Clawflow 的记忆层，以免与 OpenClaw 冲突或产生幻觉。

### 8.2 可选参考：agent-flow / claude-flow——仅用于「可选 collective」概念

**仅当实现「可选增强」中的 .collective（多 Agent 编排）」时**，可参考以下概念（Swarm、Hive-Mind、拓扑、共识等）；**不要**用其 memory、hooks、MCP、SPARC 等来替换或并行于 OpenClaw 的 memory/hooks/agents。

| 技能 | 可参考内容 | 勿用于 |
|------|------------|--------|
| agent-flow | core-swarm、core-hive-mind、advanced-topologies-consensus（拓扑与协作概念） | memory、hooks、cron、agents 实现——一律用 OpenClaw |
| claude-flow | features-swarm（协调引擎、拓扑概念） | memory、hooks、MCP、security 实现——一律用 OpenClaw |

---

## 9. 参考仓库与链接

- **OpenClaw**（主参考）: [openclaw/openclaw](https://github.com/openclaw/openclaw) — 架构、CLI、配置、工具、沙箱、通道、**memory、cron、hooks、agents**；实现 Clawflow 时以 OpenClaw 文档与源码为准，不引入与 OpenClaw 冲突的子系统。
- **agent-flow**（可选，仅 collective 概念）: [whrit/agent-flow](https://github.com/whrit/agent-flow) — Swarm、Hive-Mind、拓扑与共识；勿用其 memory/hooks 等实现 Clawflow 的记忆或钩子。
- **claude-flow**（可选，仅 collective 概念）: [ruvnet/claude-flow](https://github.com/ruvnet/claude-flow) — 协调引擎、拓扑；勿用其 memory/hooks/MCP 等实现 Clawflow。
- **本仓库**: `skills/openclaw/` 为必读；`skills/agent-flow/`、`skills/claude-flow/` 仅在做「可选 .collective」时作概念参考。
