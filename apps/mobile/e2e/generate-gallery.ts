import * as fs from "fs";
import * as path from "path";

const SCREENSHOTS_DIR = path.join(__dirname, "screenshots");
const OUTPUT_HTML = path.join(SCREENSHOTS_DIR, "index.html");

interface StepInfo {
  index: number;
  name: string;
  file: string;
}

interface FlowManifest {
  flowId: string;
  flowLabel: string;
  steps: StepInfo[];
}

const UX_OBSERVATIONS: Record<string, string[]> = {
  // P0-2 审计（优化前）
  "02-register": [
    "[已修复] 注册成功后 Token 文字已加大，复制按钮醒目，有安全保存提醒",
  ],
  "06-add-baby": [
    "[已修复] 添加宝宝成功后有 Toast「添加成功」反馈",
  ],
  "07-quickadd-feed": [
    "[已修复] 提交事件后有 Toast「记录成功」提示",
  ],
  "07-quickadd-empty": [
    "[已修复] 空状态增加了「去添加宝宝」跳转按钮",
  ],
  "09-settings-logout": [
    "[已修复-仅原生] 退出登录已加确认弹窗（Alert.alert），但在 Web 端无效",
  ],
  // 模块一新发现
  "m1-logout-confirm": [
    "[BUG] Alert.alert 在 Expo Web (RN Web) 上是空操作，退出登录按钮点击无反应",
    "建议：Web 端用自定义 Modal 替代 Alert.alert，或降级为 window.confirm()",
  ],
  "m1-toast-add-baby": [
    "[优化后] 添加宝宝成功 Toast「添加成功」正常显示",
  ],
  "m1-toast-record": [
    "[优化后] 记录事件 Toast「记录成功」正常显示",
  ],
  "m1-empty-state": [
    "[优化后] QuickAdd 空状态「去添加宝宝」按钮可正常跳转到设置页",
  ],
  "m1-token-copy": [
    "[优化后] 注册成功页 Token 展示醒目，复制按钮可用，有「已复制」反馈 + 安全提醒",
  ],
  "m1-settings-layout": [
    "[优化后] 设置页已按三个分组重构：应用设置 / 宝宝管理 / 账号与安全",
  ],
  // 1.7 用户个人资料
  "m1-profile-settings": [
    "[1.7] 设置页新增「我的资料」分区：称呼输入 + 头像选择",
  ],
  "m1-profile-recorder": [
    "[1.7] 设置称呼「妈妈」后，时间线事件卡片正确显示「妈妈 · 时间」格式",
  ],
  "m1-profile-no-name": [
    "[1.7] 未设置称呼时，时间线仅显示时间，无记录人前缀",
  ],
  // i18n 中英文对比
  "i18n-en-full": [
    "[i18n] English 全流程：首页/快速记录/时间线/设置 全部正确显示英文",
  ],
  "i18n-zh-full": [
    "[i18n] 中文全流程：首页/快速记录/时间线/设置 全部正确显示中文",
  ],
  "i18n-en-auth": [
    "[i18n] English 认证页：Welcome/Login/Register 文案均为英文",
  ],
  "i18n-zh-auth": [
    "[i18n] 中文认证页：欢迎/登录/注册 文案均为中文",
  ],
  "i18n-en-empty": [
    "[i18n] English 空状态：QuickAdd 无宝宝提示 + 按钮文案为英文",
  ],
  "i18n-zh-empty": [
    "[i18n] 中文空状态：QuickAdd 无宝宝提示 + 按钮文案为中文",
  ],
  "i18n-en-timeline": [
    "[i18n] English 时间线：事件类型/详情/筛选标签均为英文",
  ],
  "i18n-zh-timeline": [
    "[i18n] 中文时间线：事件类型/详情/筛选标签均为中文",
  ],
  "i18n-persist": [
    "[i18n] 语言持久化：切换语言后刷新页面，偏好设置不丢失",
  ],
  // 模块二：核心记录增强
  "m2-form-feed-zh": [
    "[2.1] 喂奶表单：方式(瓶/亲/混合) + 量(ml) + 时长(分钟) + 侧选择 + 备注",
  ],
  "m2-form-feed-side": [
    "[2.1] 选择亲喂/混合后展示左/右/双侧 chip 选择",
  ],
  "m2-form-sleep-zh": [
    "[2.1] 睡眠表单：开始/结束时间(DatePicker) + 质量评价(好/一般/差)",
  ],
  "m2-form-diaper-zh": [
    "[2.1] 尿布表单：类型 chip(湿/脏/混合)",
  ],
  "m2-form-poop-zh": [
    "[2.1] 便便表单：性状 + 颜色 + 量 三组 chip 完整呈现",
  ],
  "m2-form-weight-zh": [
    "[2.1] 体重表单：kg 数字键盘输入 + 备注",
  ],
  "m2-form-solid-zh": [
    "[2.1] 辅食表单：食物名称 + 量 + 过敏反应 chip(无/轻微/严重)",
  ],
  "m2-form-vaccine-zh": [
    "[2.1] 疫苗表单：名称(必填) + 接种机构 + 下次接种日期",
  ],
  "m2-form-feed-en": [
    "[2.1] Feed form in English: method, amount, submit — labels all in English",
  ],
  "m2-form-poop-en": [
    "[2.1] Poop form in English: consistency/color/amount chips all English",
  ],
  "m2-form-solid-en": [
    "[2.1] Solid food form in English: food name, allergy reaction chips",
  ],
  "m2-timer-feed": [
    "[2.2] 喂奶计时器完整流程：开始 → 计时条出现 → 停止 → 自动填充时长 → 提交",
  ],
  "m2-timer-bar-stop": [
    "[2.2] TimerBar 持久化：离开 QuickAdd 后计时条仍在首页顶部，可从 bar 停止",
  ],
  "m2-dashboard": [
    "[2.3] 今日总览仪表盘：4 个 stat 卡片(喂奶次数/睡眠时长/末次喂奶/末次换尿布)正确展示",
  ],
  "m2-dashboard-update": [
    "[2.3] 仪表盘动态刷新：新增喂奶记录后返回首页，stat 卡片数据已更新",
  ],
  "m2-dashboard-baby-switch": [
    "[2.3] 宝宝选择器：仪表盘顶部宝宝 chip 可切换，数据随之变化",
  ],
  "m2-dark-mode": [
    "[2.4] 深色模式全屏截图：首页/快速记录/时间线/设置 均切换为深色主题",
  ],
  "m2-light-mode": [
    "[2.4] 浅色模式全屏截图：首页/快速记录/时间线/设置 均为浅色主题",
  ],
  "m2-theme-persist": [
    "[2.4] 主题持久化：设置深色后刷新仍为深色，切回浅色后刷新仍为浅色",
  ],
  // 模块三：记忆与照片
  "m3-baby-profile": [
    "[3.2] 宝宝档案增强：头像/姓名/性别/血型/过敏/备注 全部字段可见且可编辑",
  ],
  "m3-baby-profile-edit": [
    "[3.2] 性别/血型 chip 选择 + 过敏/备注文本保存",
  ],
  "m3-photo-picker": [
    "[3.3] PhotoPicker 在 8 种事件表单(含里程碑)中均可见",
  ],
  "m3-event-photos": [
    "[3.3] 带照片事件在时间线展示 PhotoGrid 缩略图 + 全屏查看器",
  ],
  "m3-milestone-form": [
    "[3.4] 里程碑表单：10 个预置模板 chip + 选择后自动填充标题 + 备注",
  ],
  "m3-milestone-custom": [
    "[3.4] 自定义里程碑：手动输入标题 + 提交成功",
  ],
  "m3-milestone-card": [
    "[3.4] 时间线里程碑金色边框特殊卡片样式 + 粗标题",
  ],
  "m3-milestone-filter": [
    "[3.4] 时间线三态筛选(全部/日常/里程碑)正确过滤事件",
  ],
  "m3-milestone-en": [
    "[3.4] English milestone form + filter: template labels and filter chips in English",
  ],
};

function loadManifests(): FlowManifest[] {
  if (!fs.existsSync(SCREENSHOTS_DIR)) return [];
  const dirs = fs.readdirSync(SCREENSHOTS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();

  const manifests: FlowManifest[] = [];
  for (const dir of dirs) {
    const mPath = path.join(SCREENSHOTS_DIR, dir, "_manifest.json");
    if (fs.existsSync(mPath)) {
      manifests.push(JSON.parse(fs.readFileSync(mPath, "utf-8")));
    }
  }
  return manifests;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function generateHtml(manifests: FlowManifest[]): string {
  const now = new Date().toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" });

  const navItems = manifests
    .map((m) => `<a href="#${m.flowId}">${escapeHtml(m.flowLabel)}</a>`)
    .join("\n        ");

  const totalSteps = manifests.reduce((s, m) => s + m.steps.length, 0);

  const flowSections = manifests
    .map((m) => {
      const observations = UX_OBSERVATIONS[m.flowId];
      const obsHtml = observations
        ? `<div class="ux-issues">
            <h4>UX 审计发现</h4>
            <ul>${observations.map((o) => `<li>${escapeHtml(o)}</li>`).join("")}</ul>
           </div>`
        : "";

      const stepsHtml = m.steps
        .map(
          (s) => `
          <div class="step">
            <div class="step-label">${String(s.index).padStart(2, "0")}. ${escapeHtml(s.name)}</div>
            <img src="${m.flowId}/${s.file}" alt="${escapeHtml(s.name)}" loading="lazy" />
          </div>`,
        )
        .join("");

      return `
      <section id="${m.flowId}">
        <h2>${escapeHtml(m.flowLabel)}</h2>
        <p class="flow-meta">${m.steps.length} 个步骤截图</p>
        ${obsHtml}
        <div class="steps">${stepsHtml}</div>
      </section>`;
    })
    .join("\n");

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>BabyLog E2E 截图审计报告</title>
  <style>
    :root {
      --bg: #f5f5f7;
      --card: #ffffff;
      --text: #1d1d1f;
      --text2: #6e6e73;
      --accent: #0071e3;
      --warn: #ff9500;
      --border: #d2d2d7;
      --sidebar-w: 240px;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", sans-serif;
      background: var(--bg);
      color: var(--text);
      display: flex;
      min-height: 100vh;
    }
    nav {
      position: fixed;
      top: 0; left: 0;
      width: var(--sidebar-w);
      height: 100vh;
      background: var(--card);
      border-right: 1px solid var(--border);
      padding: 24px 16px;
      overflow-y: auto;
      z-index: 10;
    }
    nav h3 { font-size: 14px; color: var(--text2); margin-bottom: 16px; text-transform: uppercase; letter-spacing: 0.5px; }
    nav a {
      display: block;
      padding: 8px 12px;
      margin-bottom: 4px;
      border-radius: 8px;
      text-decoration: none;
      color: var(--text);
      font-size: 14px;
      transition: background 0.15s;
    }
    nav a:hover { background: var(--bg); }
    main {
      margin-left: var(--sidebar-w);
      padding: 32px 40px;
      max-width: 960px;
      width: 100%;
    }
    header { margin-bottom: 32px; }
    header h1 { font-size: 28px; font-weight: 700; margin-bottom: 8px; }
    header .meta { font-size: 14px; color: var(--text2); }
    section { margin-bottom: 48px; }
    section h2 { font-size: 22px; font-weight: 600; margin-bottom: 4px; }
    .flow-meta { font-size: 13px; color: var(--text2); margin-bottom: 16px; }
    .ux-issues {
      background: #fff3e0;
      border: 1px solid var(--warn);
      border-radius: 10px;
      padding: 16px 20px;
      margin-bottom: 20px;
    }
    .ux-issues h4 { font-size: 14px; color: #e65100; margin-bottom: 8px; }
    .ux-issues ul { padding-left: 20px; }
    .ux-issues li { font-size: 13px; color: #bf360c; margin-bottom: 4px; }
    .steps { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 16px; }
    .step {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 12px;
      overflow: hidden;
      transition: box-shadow 0.2s;
    }
    .step:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.08); }
    .step img { width: 100%; height: auto; display: block; cursor: pointer; }
    .step img.zoomed {
      position: fixed; top: 50%; left: 50%;
      transform: translate(-50%, -50%);
      max-width: 90vw; max-height: 90vh;
      z-index: 100; border-radius: 12px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    }
    .step-label {
      padding: 8px 12px;
      font-size: 12px;
      font-weight: 500;
      color: var(--text2);
      border-bottom: 1px solid var(--border);
    }
    .overlay {
      display: none; position: fixed; inset: 0;
      background: rgba(0,0,0,0.5); z-index: 99;
    }
    .overlay.active { display: block; }
    .summary {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 20px 24px;
      margin-bottom: 32px;
    }
    .summary h3 { font-size: 16px; margin-bottom: 12px; }
    .summary ul { padding-left: 20px; }
    .summary li { font-size: 14px; margin-bottom: 6px; color: #bf360c; }
  </style>
</head>
<body>
  <nav>
    <h3>用户流程</h3>
    ${navItems}
  </nav>
  <div class="overlay" id="overlay"></div>
  <main>
    <header>
      <h1>BabyLog E2E 截图审计报告</h1>
      <div class="meta">生成时间：${escapeHtml(now)} &nbsp;|&nbsp; ${manifests.length} 个流程 &nbsp;|&nbsp; ${totalSteps} 张截图</div>
    </header>

    <div class="summary">
      <h3>UX 审计发现汇总</h3>
      <ul>
        <li><strong>[已修复]</strong> 注册 Token 页已加大字号 + 醒目复制按钮 + 安全提醒</li>
        <li><strong>[已修复]</strong> 添加宝宝 / 记录事件 / 删除操作均有 Toast 反馈</li>
        <li><strong>[已修复]</strong> 空状态增加「去添加宝宝」跳转按钮</li>
        <li><strong>[已修复]</strong> 退出登录 / 删除操作已加确认弹窗（仅原生端）</li>
        <li><strong>[BUG]</strong> Alert.alert 在 Expo Web 无效：退出登录、删除确认弹窗在 Web 端不生效</li>
        <li><strong>[优化后]</strong> 设置页已重构为三分区：应用设置 / 宝宝管理 / 账号与安全</li>
        <li><strong>[优化后]</strong> 首页显示上次记录时间 + 宝宝头像占位符</li>
        <li><strong>[优化后]</strong> 单宝宝自动选中 + 登录页增大注册引导入口</li>
        <li><strong>[模块二]</strong> 7 种事件类型丰富表单：喂奶/睡眠/尿布/便便/体重/辅食/疫苗（中英文验证）</li>
        <li><strong>[模块二]</strong> 喂奶/睡眠计时器：开始→计时条→停止→自动填充完整流程</li>
        <li><strong>[模块二]</strong> 今日总览仪表盘 4 卡片 + 宝宝切换 + 动态刷新</li>
        <li><strong>[模块二]</strong> 深色/浅色模式全屏截图 + 主题持久化验证</li>
        <li><strong>[模块三]</strong> 宝宝档案增强：头像/性别/血型/过敏/备注编辑</li>
        <li><strong>[模块三]</strong> 事件照片：PhotoPicker 可见 + 时间线 PhotoGrid + 全屏查看器</li>
        <li><strong>[模块三]</strong> 里程碑：模板选择 + 自定义标题 + 金色卡片 + 三态筛选（中英文）</li>
      </ul>
    </div>

    ${flowSections}
  </main>
  <script>
    const overlay = document.getElementById("overlay");
    let zoomed = null;
    document.querySelectorAll(".step img").forEach(img => {
      img.addEventListener("click", () => {
        if (zoomed) { zoomed.classList.remove("zoomed"); overlay.classList.remove("active"); zoomed = null; return; }
        img.classList.add("zoomed");
        overlay.classList.add("active");
        zoomed = img;
      });
    });
    overlay.addEventListener("click", () => {
      if (zoomed) { zoomed.classList.remove("zoomed"); overlay.classList.remove("active"); zoomed = null; }
    });
  </script>
</body>
</html>`;
}

const manifests = loadManifests();
if (manifests.length === 0) {
  console.log("No screenshot manifests found. Run tests first.");
  process.exit(0);
}

fs.writeFileSync(OUTPUT_HTML, generateHtml(manifests), "utf-8");
console.log(`Gallery generated: ${OUTPUT_HTML}`);
console.log(`  Flows: ${manifests.length}`);
console.log(`  Total screenshots: ${manifests.reduce((s, m) => s + m.steps.length, 0)}`);
