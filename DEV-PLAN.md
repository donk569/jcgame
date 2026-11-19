# JCGame 功能开发清单

> **2026-11-19 认证系统改造**：登录/注册拆成两套差异化页面（`/login` 简洁、`/register` 完整纵向）；
> 注册加邮箱验证码 + 服务端滑块拼图人机验证。滑块服务端逻辑在 `supabase/captcha.sql`
> （挑战随机/5分钟有效/一次性、凭证绑定邮箱/10分钟/一次性消费、创建与验证限流、失败次数上限）。
> ⚠️ **必须先去 Supabase Dashboard → SQL Editor 跑一遍 `supabase/captcha.sql`**，否则注册页滑块会报"服务未配置"。
> 已知架构边界：anon key 公开，恶意用户可直接调 Supabase signUp 端点绕过前端；
> 要彻底堵死需关公开注册 + Edge Function 用 service_role 建用户（属外部部署，未擅自做）。


> 基线日期：2026-11-17。外观已定稿，本清单只管「让它真正跑起来」。
> 原则：**先换数据源，再加功能；UI 尽量不动。** 每条做完都能在浏览器里验，不写无法验收的项。
>
> **进度（2026-11-18 晚）**
> - ✅ P0-1 数据层拆三层　✅ P0-2 数据 hooks + 七页迁移　✅ P0-5 后端开关
> - ✅ P1-6 登录页 + 路由守卫　✅ P1-8 资料持久化　✅ P1-9 关注持久化
> - ✅ P2-11 发布链路　✅ P2-12 草稿 CRUD　✅ P3-17 收藏点赞　✅ P3-18 评论回复
> - ✅ P1-6 Supabase 认证（邮箱密码 + GitHub OAuth）　✅ P0-3 双模式回落 + 4s 超时
> - ⬜ P2-10 真实文件上传　⬜ P2-13 作品管理　⬜ P2-14 版本日志
> - ⬜ **建表（待用户在 Supabase Dashboard 执行 supabase/init-all.sql）**
> - ⬜ P3-15 真试玩　⬜ P3-16 下载分发　⬜ P3-19 服务端搜索　⬜ P4 全部
>
> **目前所有数据存在浏览器 localStorage**（换设备看不到、清缓存会丢）。
> 接 Supabase 后这些项才算真完成——但界面代码已经收口，换后端不用改界面。

---

## 0. 现状基线（开工前必读）

7 个路由全部可用、视觉已定稿：`/` `/explore` `/game/:slug` `/upload` `/creator/:handle` `/me` `*`。

但**所有交互都是本地假状态**，刷新即丢：

| 位置 | 现在的真实行为 | 文件 |
|---|---|---|
| 游戏 / 创作者 / 分类数据 | 12 款游戏、5 位创作者、9 分类，硬编码在 `src/data/games.ts` | `src/data/games.ts` |
| 收藏 / 点赞 / 关注 | 组件内 `useState`，刷新归零 | `GameDetail.tsx` `Creator.tsx` |
| 试玩 | 三段模拟进度条，没有真 iframe | `PlayModal.tsx` |
| 下载 | toast「演示环境不会真的下载」 | `GameDetail.tsx:204` |
| 上传 | 文件不上传，尺寸与进度均为模拟 | `Upload.tsx:748` |
| 草稿 / 资料 / 通知设置 | 只 toast，不落盘 | `Dashboard.tsx:299/424/494` |
| 作品编辑 / 设置 / 草稿编辑器 | toast「未接入」 | `Dashboard.tsx:570/576/600` |
| 玩家留言 | 只读静态数据，回复未接 | `Dashboard.tsx:299` |

数据契约已经成型（`Game` / `WebBuild` / `DownloadBuild` / `Creator`），**字段名不要随便改**——
页面对数据形状的假设都收敛在 `src/data/games.ts`，这是接后端时唯一要替换的一层。

---

## P0 · 数据与状态地基（必须最先做，否则后面全返工）

| # | 任务 | 涉及文件 | 完成标准 |
|---|---|---|---|
| 1 | 把 `games.ts` 拆成「类型 + mock 数据 + 查询函数」三层，页面不再直接 import 常量 | `src/data/games.ts` → `src/api/*` | 全站 `grep -r "from '@/data/games'"` 只剩 api 层 |
| 2 | 用 hook 封装数据读取：`useGames()` / `useGame(slug)` / `useCreator(handle)` | 新增 `src/hooks/useGames.ts` 等 | 七个页面改用 hook，UI 零变化 |
| 3 | 请求层统一 loading / error / retry，禁掉散落的假 toast | 新增 `src/lib/http.ts` | 任一接口失败时有统一错误态，不会静默 |
| 4 | 全局状态容器：登录态、收藏、点赞、关注 | 新增 `src/store/*`（Context 或 Zustand 二选一） | 收藏一款游戏 → 切页 → 刷新 → 仍在 |
| 5 | 后端开关：一个 env 在 mock / 真实 API 间切换 | `.env` + api 层 | 改一行配置即可切后端，不改页面代码 |

**P0 完成标志：** 关掉 mock 开关时全站进入统一错误态，而不是白屏或旧数据。

---

## P1 · 账号与身份（2–3 天）

| # | 任务 | 涉及文件 | 完成标准 |
|---|---|---|---|
| 6 | 登录 / 注册（先 GitHub OAuth，最契合开发者平台） | 新增 `src/pages/Auth.tsx` + 路由 | 未登录点「发布游戏」跳登录，登录后回到原页 |
| 7 | 路由守卫：工作台 / 发布页需登录 | `src/App.tsx` | 直接打开 `/me` 未登录会跳转，不闪现内容 |
| 8 | 个人资料真实保存（昵称 / 简介 / 通知设置） | `Dashboard.tsx:424` | 改完刷新仍在，公开主页同步显示 |
| 9 | 关注 / 取消关注落库 | `Creator.tsx:70` | 刷新后关注态保持，工作台可见关注列表 |

---

## P2 · 创作者工作流（核心，3–4 天）

| # | 任务 | 涉及文件 | 完成标准 |
|---|---|---|---|
| 10 | 封面 / 截图 / 安装包真实上传（对象存储 + 进度回调） | `Upload.tsx` | 刷新后文件仍在，图片 URL 可直接访问 |
| 11 | 四步向导接真实提交，发布后生成 slug | `Upload.tsx:639` | 发布成功 → 详情页立刻能打开 → 探索页出现 |
| 12 | 草稿 CRUD：保存 / 继续编辑 / 删除 | `Dashboard.tsx:600` | 发布页填一半存草稿，回工作台能接着填 |
| 13 | 作品管理：编辑资料、改版本、上架 / 下架 | `Dashboard.tsx:570/576` | 改动即时反映到公开详情页 |
| 14 | 版本与更新日志：发布新版本时追加 changelog | `GameDetail.tsx`  changelog 区 | 详情页能显示多版本历史 |

**P2 完成标志：** 用浏览器完整走一遍「登录 → 上传 → 存草稿 → 继续编辑 → 发布 → 工作台改版本 → 公开页看到变化」。

---

## P3 · 玩家侧（2–3 天）

| # | 任务 | 涉及文件 | 完成标准 |
|---|---|---|---|
| 15 | 网页试玩真接入：沙箱 iframe + 独立域 + 全屏 | `PlayModal.tsx` | 霓虹漂移能真跑起来，失败态有真实错误码 |
| 16 | 下载分发：签名 URL / CDN，带平台与体积 | `GameDetail.tsx:204` | 点击触发真实文件下载 |
| 17 | 收藏 / 点赞落库，与工作台联动 | `GameDetail.tsx:124` | 详情页点赞 → `/me` 点赞列表出现 |
| 18 | 玩家评论：提交 + 工作台回复 + 未读态 | `Dashboard.tsx:299` | 玩家留言后工作台能看到并回复 |
| 19 | 搜索 / 筛选 / 排序服务端化，URL 状态保持 | `Explore.tsx` + `useGameSearch.ts` | 刷新和分享链接都保留筛选条件 |

---

## P4 · 质量与上线收尾（2 天）

| # | 任务 | 完成标准 |
|---|---|---|
| 20 | 数据埋点：试玩 / 下载 / 收藏计数真实增长，工作台 7 天图读真数据 | 图表不再是固定数组 |
| 21 | 错误边界 + 加载骨架 + 空状态 | 断网时无白屏，每个空列表都有下一步 |
| 22 | SEO / 分享卡片：标题、描述、og:image 按游戏动态生成 | 发到微信/QQ 有封面和描述 |
| 23 | 可访问性回归：键盘导航、焦点环、`prefers-reduced-motion` | 全站可纯键盘操作 |
| 24 | 移动端回归：6 页 × 390px | 无横向溢出，无 console error |

---

## Supabase 已接入（2026-11-18）

- 项目 `hvnfewrdzvhpazfwducc`，配置在 `.env.local`（不入库）
- **待办：在 Dashboard → SQL Editor 执行 `supabase/init-all.sql`**（建表 + RLS + 种子）
- 详细步骤与排错见 `supabase/README.md`
- 注意：`*.supabase.co` 国内直连被干扰 → 已做自动回落，访客不会白屏

## 开工前要拍板的四件事

1. **后端选型**：建议 Supabase —— 认证 + Postgres + 对象存储一套，免费额度够原型；
   备选是自建 Node + Postgres（可控但要自己运维）。
2. **登录方式**：GitHub OAuth（推荐，开发者平台调性一致）/ 邮箱密码 / 两者都要。
3. **试玩沙箱**：需要后端分配隔离域名（数据契约里的 `WebBuild.host` 已经预留）。
4. **文件存储**：封面与安装包分开存（图片走 CDN，安装包走对象存储 + 签名 URL）。

这四条定了，P0 当天就能动工。

---

## 顺手清掉的技术债（今晚已确认）

- `lucide-react` 已在依赖里但没有任何使用（图标全换成了 Phosphor）→ `npm uninstall lucide-react`
- `dist/` 里有独立的 `.git`（gh-pages 推送用），**不要在主仓库提交它**；建议把部署写成脚本，避免手动 `cd dist`
- 图片压缩前的原图备份在 `art-source/orig/`（已被 `.gitignore` 排除），确认不需要后可不入库

---

## 日常流程（已定）

```bash
# 开发
npm run dev                  # http://127.0.0.1:5173

# 同步到线上（GitHub Pages，链接不变）
npm run build:gh
cd dist
git add -A && git commit -m "deploy: xxx" && git push -f origin gh-pages
cd ..
git add -A && git commit -m "feat: xxx" && git push origin main
```

线上地址：**https://donk569.github.io/jcgame/**
仓库：**https://github.com/donk569/jcgame**
