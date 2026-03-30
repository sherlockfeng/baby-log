# BabyLog — 产品愿景与总览

## 一句话定位

**家庭宝宝成长记录与分享平台**——从记录工具起步，成长为家庭记忆平台，最终走向育儿社区。

## 产品愿景

```
Phase 1          Phase 2           Phase 3
记录工具    →    家庭记忆平台    →    育儿社区
v0.2             v0.3               v1.0
```

- **Phase 1（v0.2）**：让爸爸妈妈用得顺手——打磨交互、丰富记录、支持照片和里程碑
- **Phase 2（v0.3）**：让全家人一起看——邀请爷爷奶奶、外公外婆加入家庭，共享宝宝成长时间线
- **Phase 3（v1.0）**：让更多家庭受益——分享广场，跨家庭经验分享，图文视频社区

## 技术栈

- **Monorepo**: Rush + pnpm
- **Mobile**: Expo (React Native) + TypeScript
- **Backend**: Cloudflare Workers + TypeScript
- **DB**: Cloudflare D1 (SQLite)
- **Storage**: Cloudflare R2 (照片/视频)
- **Auth**: Family Token (Bearer)；v1.0 升级为用户账号体系
- **App Lock**: FaceID / TouchID (local only)

## 核心用户画像

| 角色 | 场景 | 核心需求 |
|------|------|---------|
| 新手妈妈 | 凌晨 3 点喂奶、换尿布 | 一键记录、计时器、暗色模式 |
| 新手爸爸 | 白天上班想了解宝宝情况 | 今日总览、时间线、统计图表 |
| 爷爷奶奶/外公外婆 | 不在身边想看孙子/外孙 | 查看时间线、照片、里程碑 |
| 育儿新手 | 不知道这个阶段该怎么喂 | 社区经验分享、同月龄参考 |

## 设计准则

产品设计原则、UX 规范、开发流程约定见 [design-guidelines.md](design-guidelines.md)。

## 迭代路线图

详见各期 PRD：
- [v0.1 — MVP 基础功能](v0.1-mvp.md)（已完成）
- [v0.2 — 核心体验升级](v0.2-core-experience.md)（已完成）
- [v0.3 — 家庭圈](v0.3-family-circle.md)（当前迭代）
- [v1.0 — 分享广场](v1.0-community.md)（远期愿景）

## 执行节奏

当前迭代的执行清单见 [todo.md](../../todo.md)（仅包含当期任务）。
