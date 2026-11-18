# 接 Supabase 后端：执行步骤

项目地址：https://supabase.com/dashboard/project/hvnfewrdzvhpazfwducc

前端已经全部就绪（认证、库表映射、双模式回落、种子数据都已写好），
**只差你执行一次 SQL 建表**。

---

## 第 1 步：建表（必做，一次性）

1. 打开上面的项目地址 → 左侧 **SQL Editor** → **New query**
2. 打开本地文件 `D:\gameshare\supabase\init-all.sql`，全选复制
3. 粘贴进去 → 右下角 **Run**

跑完应该看到两批成功：`profiles / creators / games / drafts / comments /
user_games / follows` 七张表建好，以及 12 款演示游戏 + 6 位创作者导入完成。

> `init-all.sql` = `schema.sql`（表结构 + 行级安全策略）+ `seed.sql`（种子数据）。
> 也可以分开跑：先 `schema.sql` 再 `seed.sql`。

**为什么要你自己跑**：建表需要 DDL 权限，anon key 做不到；
而能建表的 `service_role` key 能绕过所有权限规则，太敏感，不该进对话记录。
你在 Dashboard 点一下是最安全的方式。

---

## 第 2 步：开启邮箱登录

1. 左侧 **Authentication → Sign In / Providers → Email**
2. 把 **Enable Email provider** 打开（默认开着，确认一下）
3. 如果想免邮箱验证：把 **Confirm email** 关掉，这样注册后直接能登录

---

## 第 3 步（可选）：GitHub OAuth 登录

想让用户用 GitHub 一键登录的话：

1. 在 GitHub ���置 → Developer settings → OAuth Apps → New OAuth App
   - Homepage URL：`https://donk569.github.io/jcgame/`
   - Authorization callback URL：`https://hvnfewrdzvhpazfwducc.supabase.co/auth/v1/callback`
2. 复制 Client ID 和 Client Secret
3. 回到 Supabase → Authentication → Providers → GitHub，填进去并打开
4. 在 Supabase → Authentication → URL Configuration 里，
   把 **Site URL** 和 **Redirect URLs** 都加上：
   `https://donk569.github.io/jcgame/`

不做这步也能用，邮箱密码登录是完整的。

---

## 第 4 步：验证

前端配置已经写在 `.env.local` 里了：

```
VITE_SUPABASE_URL=https://hvnfewrdzvhpazfwducc.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_OBtd5voovLX4hd3zVnAOkQ_dUNld3Ne
VITE_DATA_SOURCE=remote
```

本地跑 `npm run dev`，打开 `/login`，应该看到邮箱密码表单（不再是演示账号输入框）。
注册一个账号 → 登录 → 进工作台 → 收藏一个游戏 → 刷新 → 状态还在（这次是从数据库读回来的）。

---

## 国内访问的实际情况（重要）

`*.supabase.co` 在中国大陆会被网络干扰，直连会 `ERR_CONNECTION_RESET`。
实测结论：

| 场景 | 结果 |
|---|---|
| 本机开代理 | ✅ 完全正常 |
| 本机直连 | ❌ 连接被重置 |
| 访客直连（无代理） | ❌ 打不开 Supabase |

所以现在的策略是：**后端连不上就自动回落本地数据**，站点永远能看、不会白屏。
真正的数据同步需要用户自己有代理，或者后面换成国内可直连的后端
（阿里云 OSS + 自建 API、或腾讯云 CloudBase）。

如果后面确定走国内方案，替换点只有一个：`src/api/backend.ts` 里的那几个函数，
页面代码一行都不用动——这正是前两天做数据层拆分的意义。

---

## 出了错怎么办

| 现象 | 原因 | 解决 |
|---|---|---|
| 页面报 `PGRST205 ... Could not find the table` | SQL 没执行成功 | 重跑第 1 步 |
| 登录提示 `Invalid login credentials` | 邮箱密码不对，或开了邮箱验证 | 检查 Confirmation email 设置 |
| `fetch failed` / 连不上 | 网络被干扰 | 开代理；或把 `VITE_DATA_SOURCE` 改回 `mock` |
| 登录后还是演示账号输入框 | `.env.local` 没生效 | 确认文件在项目根目录，且 dev server 已重启 |
