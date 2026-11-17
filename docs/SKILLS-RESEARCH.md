# GitHub 设计 Skill 调研记录

调研时间：2026-11-17 · 环境：WorkBuddy（Windows / Node 22 / Python 3.13）

## 结论先放

| 仓库 | 许可证 | 处理 | 理由 |
|---|---|---|---|
| [anthropics/skills](https://github.com/anthropics/skills) → `frontend-design` | Apache-2.0（见仓库 LICENSE.txt） | **已安装**（`~/.workbuddy/skills/frontend-design`）→ 项目内备份 `.workbuddy/skills/frontend-design` | 只有 71 行，但它是本次最有用的一份：明确列出"AI 生成设计"的五种典型特征，并给出"先出 token 方案 → 用同一段需求反向自查 → 再写代码"的流程。纯 Markdown，无脚本，无安装风险 |
| 同上 → `brand-guidelines` | Apache-2.0 | 已下载，**未启用** | 内容是 Anthropic 自家品牌规范（配色/字体/版式），对第三方项目没有约束力，只作格式参考 |
| [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills) → `web-design-guidelines` | MIT | **已安装**（`.workbuddy/skills/web-design-guidelines`） | 1 个 SKILL.md（39 行），运行时去取 100+ 条 Web Interface Guidelines 规则，用来做最后的可访问性/交互审计。与其它 skill 无冲突 |
| [nextlevelbuilder/ui-ux-pro-max-skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) | MIT | **只跑脚本取参考，不安装** | 见下方"实测"：它的设计系统生成器给出的配色与字体与本次目标相反。数据量很大（725 文件），需要 Python，且安装器 `npx ui-ux-pro-max-cli init --ai claude` 会写 `.claude/skills`，与本 Agent 的目录约定不同 |
| [leonxlnx/taste-skill](https://github.com/leonxlnx/taste-skill) | MIT | **只吸收规则，不安装** | 1663 个文件 + 必须的 Chrome/Node 检查脚本 + `Stop` hook（`gate.mjs`）。它针对"单页落地页"，与 6 页应用冲突（"一屏一节"、"每页一个 moment"），而且 hook 会在每次停止时跑浏览器检查，绑在一个 UI 原型项目上风险大。它的"永不"清单（不滚动淡入、不倾斜、不用紫、不套模板）被直接吸收进 `DESIGN.md` §9 |
| [pbakaus/impeccable](https://github.com/pbakaus/impeccable) | Apache-2.0（workspace 声明） | **不安装** | 核心是 Rust 引擎 + 61 条反模式检测器 + 浏览器扩展，需要下载平台二进制（`.sha256` 校验、fail-closed）。对"做一个站点"来说，安装成本 > 收益；其检测思路（字体阶梯 ≥1.25、禁止图标瓦片堆叠、禁止编号眉标等）已手工应用 |

## 实测记录

### ui-ux-pro-max 的设计系统生成器

```bash
python3 .claude/skills/ui-ux-pro-max/scripts/search.py \
  "indie game platform dark editorial" --design-system -p "PLAYGROUND"
```

输出摘要：

- 配色：`primary #6366F1`（靛蓝）+ `accent #059669`（翠绿）+ `background #F5F3FF`（淡紫白）
- 字体：`Amatic SC / Cabin`（"indie, craft, handmade"）
- 版式模板：`Trust & Authority + Conversion`（安全徽章、案例、价格表）

这份输出正好是本任务书第九阶段明确要避免的"紫 + 通用 SaaS"组合，字体也不适合中文界面。
**结论：不作为本项目的设计来源，但它的 UX 规则库（表单校验、图标 aria、badge 换行等）仍有参考价值，
只是不需要装进项目。**

### taste-skill 的可执行部分

`skills/taste-skill/SKILL.md` 要求 Node 22 + Chrome/Edge，通过 `gate.mjs` 在每次会话结束时跑
一致性检查（`consistency.mjs` / `check.mjs` / `perf.mjs`）并读截图。这套流程本身很扎实，
但它假设页面形态是"一屏一节的长页"，且会改写 `:root` 变量（`start.mjs css`），
与"已有 token 体系的多页应用"不兼容。故只取规则，不取工具链。

## 最终采用

1. **流程**：frontend-design 的两段式——先出 token/版式方案，再"用同一段需求反向推演会不会得到同样的结果"，
   确认不是默认值后才写代码。本项目的三方向探索（A/B/C）就是对这一步的落实。
2. **验收**：web-design-guidelines 的规则集（可访问性命名、焦点环、表单标签、`prefers-reduced-motion`、
   图片尺寸、触摸目标、URL 反映状态）。
3. **禁令**：taste-skill 的"永不"清单 + frontend-design 的"AI 设计五种特征"合并写入 `DESIGN.md` §9。

## 冲突与处理

| 冲突 | 处理 |
|---|---|
| frontend-design 把"近黑底 + 单一亮强调色"列为 AI 特征 | 任务书明确要求深色游戏平台方向，故保留深色，但**不用**纯黑 `#0B0B0B`，改用偏青墨黑 `#0A1214`，强调色选琥珀而非酸绿/朱红，并加纸色反色带制造非典型的明暗节奏 |
| frontend-design 反对"全大写标签" | 只有品牌名 `PLAYGROUND` 全大写；所有功能性标签改为正常大小写 |
| frontend-design 反对"编号标记" | 只在**真的是步骤**的地方用编号：上传四步、发布三步流程 |
| taste-skill 反对"每个章节都滚动淡入" | 全站没有滚动淡入；只有 Hero 一次入场 + 页面切换 |
| ui-ux-pro-max 建议靛蓝+翠绿配色 | 不采用（见上） |

---

# 第二轮调研（2026-11-17 晚，JCGame 改版）

第一轮的三个 Skill（frontend-design / web-design-guidelines / 规则摘录）解决了「不要做成 AI 模板」，
但没解决「怎样真正做出高级感」。本轮重新在 GitHub 搜索，按三个方向找：高级 UI/UX、动效与交互、视觉审查。

## 检索方式

用 GitHub Search API 按 star 排序查了四组关键词：`claude skill animation gsap framer`、
`agent skill design review ui audit`、`"SKILL.md" frontend design skill`、`awwwards OR "design taste" skill agent`。
筛掉的是：只做 3D/游戏美术生成的（sprite-gen、blender-skills）、做视频动效成片的
（artemnovitckii/claude-animation-skills、reanimate）、以及大量 star 个位数的搬运仓库。

## 采用：oil-oil/oil-ui

- **来源**：github.com/oil-oil/oil-ui · MIT · v0.33.5（2026-11-15 更新，活跃）
- **怎么找到的**：先看到 `oil-oil/oil-motion`（2.9k star）的 README 自己在推荐 oil-ui，
  它对这个 skill 的定位是「把 AI 的 UI 设计能力推到极限」。
- **安装**：`git clone` 后复制到 `.workbuddy/skills/oil-ui`（3.6MB，纯 Markdown + 可选脚本，
  不下载二进制、不联网、不需要 key）。
- **它给的是流程，不是模板**：产品事实 → 每屏一个主角一个主动作 → 灰阶结构 → 实现 →
  **基于真实截图的独立评审**（10 分制）→ 修正。参考文件按需读：
  `visual-language.md`（字体/色彩/控件）、`motion.md`（三处基本动效与弹簧参数）、
  `direction-persuasion.md`（八种首屏骨架）、`layout-and-viewport.md`（窄屏与触控）。
- **实际用到的三条关键判断**：
  1. 「左右分栏是模型最顽固的习惯」——直接推翻了我原来的首屏，换成满版图像压字 + 画中画；
  2. 「每个界面先做三处动效：主操作反馈 / 状态切换的来路 / 首次出场」，其余动效都要能说出目的；
  3. 「独立评审」不能自己评自己——本轮真的派了一个没有上下文的评审 Agent 看截图，
     第一轮 5.5/10，修正记录写在 `DESIGN.md` §12。

## 看过但没装

| 仓库 | 结论 |
|---|---|
| [oil-oil/oil-motion](https://github.com/oil-oil/oil-motion)（2.9k★，MIT） | 用于「AI 生成连续动作素材再接到滚动/鼠标上」，需要 ZenMux API Key 且每次生成计费。它自己的适用边界写明：纯 CSS/JS/SVG 能做的界面过渡与按钮反馈不需要这套流程。本项目属于后者，故不装 |
| [freshtechbro/claudedesignskills](https://github.com/freshtechbro/claudedesignskills)（1.4k★，MIT） | 22 个 skill 覆盖 GSAP / Framer Motion / R3F / Lottie，但每个都配 `*_generator.py` 生成样板代码。任务书明确要「创意与审美，而不是代码模板」，且我们已有 Framer Motion，装进来只会和现有动效体系打架 |
| [pbakaus/impeccable](https://github.com/pbakaus/impeccable)（Apache-2.0） | 第一轮就没装。本轮考虑过，因为它的 61 条反模式检测正是「去 AI 味」需要的；但它要下载 Rust 引擎二进制并挂 hook。折中：把它的检测思路（扁平字阶、图标瓦片堆叠、编号眉标、em dash 滥用）手工过了一遍，评审交给独立 Agent |
| [NiazMorshed2007/reanimate](https://github.com/NiazMorshed2007/reanimate)（1.7k★） | 逐帧反推别人的动画，用于复刻而非设计，与「不能抄参考站」冲突 |
| [aldegad/sprite-gen](https://github.com/aldegad/sprite-gen)（4.1k★） | 2D 精灵图生成，属于素材生产，不属于界面设计 |
