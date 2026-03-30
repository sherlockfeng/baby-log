# BabyLog Mobile E2E 测试原则与技术设计

## 核心原则

### 1. 只用 testID，禁止文本选择器

```typescript
// 正确
page.getByTestId("home.title")
page.getByTestId("quickAdd.goAddBabyButton")

// 禁止 — 文案变更 / i18n 切换后立即碎掉
page.getByText("今日")
page.getByRole("button", { name: "去添加宝宝" })
page.locator('text="保存"')
```

所有 testID 集中注册在 `apps/mobile/src/testids.ts`（TID 对象）。动态 ID 用函数：

```typescript
TID.home.babyChip(babyId)     // → "home.babyChip.e2e-baby-a"
TID.timeline.eventCard(evId)  // → "timeline.eventCard.e2e-event-feed-a"
```

动态 ID 未知时用前缀匹配：

```typescript
page.locator('[data-testid^="timeline.eventCard."]').first()
```

### 2. 新增 UI 元素必须同步注册 testID

每次新增或改动屏幕组件时：

1. 在 `testids.ts` 添加 key（按 `页面.元素` 格式命名）
2. 在组件 JSX 上加 `testID={TID.xxx.yyy}`
3. i18n 重构时需检查 testID 是否被覆盖

命名规则：`{screen}.{element}`，可交互元素用动词描述（`submitButton`、`goAddBabyButton`），展示元素用名词（`title`、`emptyMessage`、`tokenStatus`）。

### 3. 种子数据用固定 ID，不依赖运行时生成

```typescript
const FAMILY_ID = "e2e-family-001";
const BABY_A_ID = "e2e-baby-a";
const EVENT_ID  = "e2e-event-feed-a";
```

这样 `page.getByTestId("timeline.eventCard.e2e-event-feed-a")` 是确定性的。通过 UI 创建的数据（如 QuickAdd 提交的事件）没有确定 ID，用前缀匹配或列表级 testID 验证。

### 4. 每个测试用例独立，不依赖执行顺序

- 每个 `test()` 开头调 `seed*()` 重置 DB 到已知状态
- `waitForApp()` 清除 localStorage 并重载，确保无残留 auth 状态
- workers 设为 1（串行），避免多测试并发竞争同一 DB

### 5. 每步都截图，生成可视化审计报告

```typescript
const step = createFlow(page, "01-welcome", "欢迎页");
await step("welcome-screen");      // → screenshots/01-welcome/01-welcome-screen.png
await step("welcome-buttons");     // → screenshots/01-welcome/02-welcome-buttons.png
```

`npm run test:flows` 自动执行测试 + 生成 `screenshots/index.html` 审计报告。产品可直接浏览器打开审核每一步 UI。

### 6. Expo Web 已知限制要规避，不要硬等

| 陷阱 | 表现 | 规避 |
|------|------|------|
| `Alert.alert` 在 Web 是空操作 | 点击按钮无反应，回调不执行 | 退出登录用 `localStorage.clear()` + `reload()` 模拟 |
| `expo-secure-store` 不支持 Web | token 存取失败 | 代码中已降级为 `localStorage` |
| Metro CI 模式无热更新 | 改了代码但测试看到旧版 | 必须 kill + 重启 Expo（`npx expo start --web --clear`） |
| i18n 异步初始化 | 首帧可能显示 fallback | 断言加适当 timeout |

### 7. 新增功能的 E2E Checklist

- [ ] 在 `testids.ts` 注册新元素的 testID
- [ ] 在组件中添加 `testID={TID.xxx}`
- [ ] 如需新种子数据，在 `helpers.ts` 添加 `seed*()` 函数
- [ ] 在合适的 spec 文件中添加 `test()`（或新建 spec）
- [ ] 每个关键步骤调 `step()` 生成截图
- [ ] 在 `generate-gallery.ts` 的 `UX_OBSERVATIONS` 中记录审计发现
- [ ] 运行全量 `npm test` 确认无回归
- [ ] 运行 `npm run gallery` 更新截图报告

---

## 技术架构

### 文件结构

```
apps/mobile/e2e/
├── playwright.config.ts              # Playwright 配置
├── package.json                      # 测试依赖
├── helpers.ts                        # DB 重置/种子/登录
├── step.ts                           # 截图流程工具
├── user-flows.spec.ts                # 核心用户流程 (11 case)
├── interaction-optimizations.spec.ts # 交互优化验证 (12 case)
├── bug-verification.spec.ts          # P0 Bug 修复验证 (3 case)
├── i18n-verification.spec.ts         # 中英文 i18n 验证 (9 case)
├── generate-gallery.ts               # HTML 截图报告生成器
├── screenshots/                      # 截图输出 (gitignore)
│   └── index.html                    # 生成的审计报告
└── test-results/                     # Playwright 失败截图
```

### 运行命令

```bash
# 前置：启动 API + Expo Web
cd services/api && npm run dev       # Terminal 1
cd apps/mobile && npm run web        # Terminal 2

# 运行测试
cd apps/mobile/e2e && npm test

# 测试 + 生成报告
cd apps/mobile/e2e && npm run test:flows

# 带浏览器窗口调试
cd apps/mobile/e2e && npm run test:headed
```

### Playwright 配置要点

```typescript
{
  baseURL: "http://localhost:8081",
  viewport: { width: 390, height: 844 },  // iPhone 14 Pro
  workers: 1,                              // 串行，避免 DB 竞争
  timeout: 60_000,
}
```

### 数据层

后端 E2E 专用端点（`E2E_ENABLED` 环境变量控制，生产关闭）：

- `POST /e2e/reset` — 清空全部数据
- `POST /e2e/seed` — 插入 families / babies / events

Helper 函数：

| 函数 | 数据 | 用途 |
|------|------|------|
| `resetDb()` | 清空 | 注册流程 |
| `seedFamily()` | 1 family | 登录、空状态 |
| `seedFamilyWithBaby()` | 1 family + 1 baby | 记录、首页 |
| `seedTimelineFilter()` | 2 babies + 2 events | 时间线筛选 |
| `seedBabyWithManyEvents(n)` | 1 baby + N events | 分页、级联删除 |

### 截图系统

`createFlow(page, flowId, label)` 返回 `step(name)` 函数，每次调用：
1. 等待 400ms UI 稳定
2. 截图保存为 `screenshots/{flowId}/{index}-{name}.png`
3. 更新 `_manifest.json`

`generate-gallery.ts` 读取所有 manifest 生成带侧边栏导航的 HTML 报告。

---

## 当前测试清单（35 case）

| Spec 文件 | Case 数 | 覆盖范围 |
|-----------|---------|---------|
| `user-flows.spec.ts` | 11 | 欢迎/注册/登录/首页/添加宝宝/快速记录/时间线/设置 |
| `interaction-optimizations.spec.ts` | 12 | Toast/确认弹窗/空状态/编辑删除/复制/注册链接/自动选中/设置分区 |
| `bug-verification.spec.ts` | 3 | DatePicker/分页/级联删除 |
| `i18n-verification.spec.ts` | 9 | 中英文全流程/认证页/空状态/时间线/语言持久化 |
