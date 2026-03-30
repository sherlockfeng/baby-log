# BabyLog – Architecture overview

## Repo layout (Rush monorepo)

- **apps/mobile** – Expo (React Native) app; consumes API with family token.
- **services/api** – Cloudflare Worker; REST API + D1.
- **packages/shared-types** – Shared TypeScript types and DTOs for API and mobile.

## Data flow

1. User creates a family via `POST /families` → receives a **family token** (store securely).
2. All other API calls use `Authorization: Bearer <token>`.
3. Worker resolves `family_id` from token (stored hash) and scopes all reads/writes to that family.
4. Mobile app stores token in SecureStore; optional FaceID/TouchID lock (local only).

## Auth

- **Family token**: Long-lived secret; created once per family. Stored as SHA-256 hash in D1. No refresh; if lost, create a new family or use a separate recovery flow (not in v0.1).
- **App lock**: Local only; does not leave the device. Toggle in Settings.

## DB (D1)

- **families**: id, name, token_hash, created_at
- **babies**: id, family_id, name, birth_date, created_at
- **events**: id, family_id, baby_id, event_type, event_time, payload (JSON), created_at, updated_at

Indexes on (family_id, event_time) and (baby_id, event_time) for list queries.

## Coding Conventions

### Platform-Specific Components

当一个组件/模块在 Web 和 Native 上需要不同实现时，使用 Metro bundler 的**文件扩展名解析**机制，遵循三文件模式：

| 文件 | 职责 |
|---|---|
| `Component.d.ts` | 声明共享的 Props 类型和导出签名 |
| `Component.web.tsx` | Web 端实现（DOM API / `<input>` 等） |
| `Component.native.tsx` | Native 端实现（RN 原生组件 / 第三方库） |

消费方直接 `import { Component } from "./Component"` — 不带扩展名，Metro 自动按平台选择。

已有实例：
- `src/components/DatePicker` — Web 用 `<input type="date">`，Native 用 `@react-native-community/datetimepicker`
- `src/components/KeyboardAvoidingWrapper` — Web 渲染 `<View>`，Native 用 `KeyboardAvoidingView`
- `src/store/token` 和 `src/store/settings` — Web 用 `localStorage`，Native 用 `expo-secure-store`

**规则：** 新增跨平台差异模块时必须遵循此模式。不要在单文件中用 `Platform.OS` 分支。

### i18n (Internationalization)

技术栈：`i18next` + `react-i18next` + `expo-localization` + `AsyncStorage`。

**文件结构：**
- `src/i18n/index.ts` — 初始化配置，通过 `App.tsx` 顶部的 side-effect import 加载
- `src/i18n/locales/zh.json` — 中文翻译
- `src/i18n/locales/en.json` — 英文翻译

**使用规则：**
1. 所有面向用户的文案**必须**使用 `t("key")`，禁止硬编码中文/英文字符串
2. 在屏幕中通过 `const { t } = useTranslation()` 获取翻译函数
3. 带变量的文案使用插值：`t("settings.deleteBabyMsg", { name: baby.name })`
4. 新增功能时**先在 zh.json 和 en.json 中添加 key**，再写 UI 代码
5. Key 按页面分组：`common.*`、`home.*`、`quickAdd.*`、`settings.*` 等

**语言切换：** 设置页提供三个选项（中文 / English / 跟随系统），偏好持久化到 AsyncStorage（key: `babylog_language`），切换即时生效。

### State Management (React Query)

远程状态管理**只用 React Query**（`@tanstack/react-query`），不引入 Redux/Zustand。

**约定：**
- 全局单一 `QueryClient`，在 `App.tsx` 顶层通过 `QueryClientProvider` 注入
- `queryKey` 格式：`["resource", token, ...filters]`，如 `["babies", token]`、`["events", token, babyId]`
- 需要认证的查询加 `enabled: !!token` 守卫
- 写操作用 `useMutation`，`onSuccess` 中调用 `queryClient.invalidateQueries({ queryKey: [...] })` 刷新缓存，并配合 toast 反馈
- `onError` 中也要 toast 错误信息
- 退出登录时调用 `queryClient.clear()` 清空全部缓存

### User Feedback (Toast + Confirm)

**Toast 系统：**
- `ToastProvider` 包裹在 `App.tsx` 顶层，任何屏幕通过 `useToast()` 获取 `toast` 函数
- 调用方式：`toast("消息")` 或 `toast("消息", "error")`，支持 `"success"` / `"error"` / `"info"` 三种类型
- 每个 mutation 的 `onSuccess` / `onError` 都**必须**给出 toast 反馈

**确认弹窗：**
- 破坏性操作（删除宝宝、删除记录、退出登录）**必须**先弹 `Alert.alert` 确认
- 确认弹窗中"取消"用 `style: "cancel"`，"删除/退出"用 `style: "destructive"`

### API Client

`src/api/client.ts` 提供两层封装：

| 函数 | 用途 |
|---|---|
| `apiRequest(path, opts)` | 底层 fetch；自动加 `Content-Type` 和 `Authorization: Bearer` 头 |
| `apiJson<T>(path, opts)` | 包装 `apiRequest`，自动解析 JSON 并处理错误；返回类型化结果 |

- Base URL 来自 `src/config.ts`
- 查询类接口用 `apiJson`（自动 parse + 类型推导）
- 非 JSON 响应的接口（如 `DELETE` 只关心 status）用 `apiRequest`

### Secure Storage

本地敏感数据（token、设置项）使用平台拆分模式（见 Platform-Specific Components 章节）：

| 模块 | Native | Web | Key |
|---|---|---|---|
| `store/token` | `expo-secure-store` | `localStorage` | `babylog_family_token` |
| `store/settings` | `expo-secure-store` | `localStorage` | `babylog_faceid_enabled` 等 |

**规则：**
- 所有存储 key 以 `babylog_` 前缀命名
- 所有存储函数均为 `async`（即使 localStorage 本身是同步的，保持接口一致性）
- 不要在组件中直接调用 `SecureStore` 或 `localStorage`，统一通过 `store/` 模块访问

### Theme and Styling

`src/theme.ts` 导出四组设计 token：

| 导出 | 内容 |
|---|---|
| `colors` | 深色主题调色板：background、primary、text、card、border、error/success/link |
| `spacing` | 间距阶梯：xs(8) / sm(12) / md(16) / lg(24) / xl(32) |
| `borderRadius` | 圆角：input(12) / button(9999 pill) / card(16) |
| `shadow` | 阴影：primary（紫色辉光）/ card（标准投影），兼容 iOS shadow 和 Android elevation |

**规则：**
- 所有样式**必须**引用 theme token，禁止内联颜色值（`"#xxx"`）和魔数间距
- 使用 `StyleSheet.create()` 定义样式，不用 inline style 对象
- 交互元素统一使用 `Pressable`，不使用 `TouchableOpacity`

### Navigation Structure

`App.tsx` 实现双流导航架构：

```
Root (hasToken: boolean | null)
 ├── null  → 返回空（splash 期间）
 ├── false → NavigationContainer > AuthFlow
 │            └── Stack: Welcome → Login / Register
 └── true  → AppLockProvider > MainFlow
              ├── locked → LockScreen
              └── NavigationContainer > Stack:
                   Home / QuickAdd / Timeline / Settings
```

- **AuthFlow**：无 header 的 stack，屏幕通过 props 接收回调（`onDone`、`onBack`、`onGoRegister`）
- **MainFlow**：带主题 header 的 stack，锁屏时渲染 `LockScreen` 覆盖层
- **退出登录**：`clearStoredToken()` → `queryClient.clear()` → `setHasToken(false)` 回到 AuthFlow

### Backend (API + DB)

**Worker 路由：**
- `services/api/src/index.ts` 使用手动 `pathname + method` 分发（无框架 router）
- 所有响应经 `withCors()` 包装，附加 CORS 头
- 认证中间件：提取 Bearer token → SHA-256 hash → 查 D1 `families.token_hash` → 获取 `familyId`
- 路由模块在 `src/routes/*.ts`，每个文件导出命名的 handler 函数，返回 `Response`

**数据库：**
- D1 (Serverless SQLite) 中表名和字段使用 **snake_case**
- API JSON 响应使用 **camelCase**，路由层负责转换
- 查询函数集中在 `src/db/queries.ts`

**Migration 规范：**
- 文件放在 `services/api/migrations/`，以数字序号前缀命名：`001_init.sql`、`002_cascade_delete.sql`
- SQLite 不支持 `ALTER TABLE ... ADD CONSTRAINT`，修改约束需要**表重建模式**：`PRAGMA foreign_keys = OFF` → 创建新表 → 复制数据 → 删除旧表 → 重命名 → 重建索引 → `PRAGMA foreign_keys = ON`

## Development Rules

### Rule 0: 实现需求时必须同步补充 testID

在实现任何需求（新功能、Bug 修复、UI 调整）时，**必须为所有关键交互元素添加 `testID`**，以供 E2E 测试编写用例。这不是事后补充的工作，而是需求交付的一部分——缺少 testID 的功能视为未完成。

具体要求：
1. 新增页面/组件时，先在 `apps/mobile/src/testids.ts` 中注册对应的 ID 常量。
2. 修改现有页面时，检查涉及的元素是否已有 testID，没有的一并补上。
3. PR / 代码审查时需确认 testID 覆盖完整。

testID 的命名规范和覆盖范围详见 Rule 1。

### Rule 1: All UI elements must have testID

Every screen and interactive element **must** carry a stable `testID` prop so that e2e tests (Playwright / Maestro) can locate it without relying on display text.

**What needs testID:**
- Screen root container (e.g. `SafeAreaView`)
- Buttons and touchable areas (submit, navigate, toggle, close)
- Text inputs
- Error and empty-state messages
- Filter chips and dynamic list items

**Naming convention:** `<screen>.<element>` in camelCase, e.g. `login.tokenInput`, `settings.addBabyButton`. For dynamic/repeated elements, use a function: `quickAdd.babyChip.<id>`, `timeline.eventCard.<id>`.

**Central registry:** All testID strings live in `apps/mobile/src/testids.ts` (the `TID` object). Screens import from there — never hardcode testID strings inline.

**When modifying code:** confirm the relevant `TID` entries exist in `testids.ts` and the corresponding `testID` props are set in JSX. Use `Pressable` (not `TouchableOpacity`) for all interactive elements.

### Rule 2: Run Playwright e2e after completing a feature

After finishing any code change that touches UI or API, run the Playwright e2e suite to verify nothing is broken:

```bash
# Prerequisite: API and Expo Web must be running
# Terminal 1: cd services/api && rushx dev
# Terminal 2: cd apps/mobile && npx expo start --web --port 19006 --localhost

cd apps/mobile/e2e
npx playwright test
```

All 8 tests must pass before considering the change complete. If a new user flow is added, write a corresponding e2e test.

### Test ID coverage

See `apps/mobile/src/testids.ts` for the full map. At a glance:

| Screen | Prefix | Key elements |
|---|---|---|
| WelcomeScreen | `welcome.*` | screen, loginButton, registerButton |
| LockScreen | `lock.*` | screen, unlockButton |
| LoginScreen | `login.*` | screen, tokenInput, submitButton, error, goRegisterLink, closeButton |
| RegisterScreen | `register.*` | screen, nameInput, submitButton, closeButton, successScreen, tokenText, copyButton, enterAppButton |
| HomeScreen | `home.*` | screen, babyInfo, babyChip(id), lastRecord, quickAddCard, timelineCard, settingsCard |
| QuickAddScreen | `quickAdd.*` | screen, emptyState, goAddBabyButton, babyChip(id), typeChip(type), submitButton, per-form inputs |
| TimelineScreen | `timeline.*` | screen, filterAll, filterBaby(id), emptyState, eventCard(id), eventList, editModal, editNoteInput, editCancelButton, editSaveButton |
| SettingsScreen | `settings.*` | screen, sectionProfile, nicknameInput, avatarImage, changeAvatarButton, faceIdSwitch, babyRow(id), deleteBabyButton(id), babyNameInput, babyBirthButton, addBabyButton, logoutButton, tokenStatus |

## Maestro + iOS Simulator (native e2e)

For native iOS e2e testing with Maestro, see [docs/08-E2E/mobile-e2e.md](../08-E2E/mobile-e2e.md). Quick reference:

```bash
# One-time setup
brew install cocoapods
curl -Ls "https://get.maestro.mobile.dev" | bash
cd apps/mobile && npx expo prebuild --platform ios --clean
xcrun simctl create "iPhone 16 iOS18" "iPhone 16" "com.apple.CoreSimulator.SimRuntime.iOS-18-5"

# Run (3 terminals)
cd services/api && rushx dev                                    # Terminal 1: API
cd apps/mobile && npx expo run:ios --device "iPhone 16 iOS18"   # Terminal 2: Build + Metro
maestro test apps/mobile/.maestro/flows/                        # Terminal 3: Tests
```

Key constraints: must use Dev Client (not Expo Go), must use iOS 18.x (not iOS 26).
