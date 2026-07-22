# 合租费用分摊管理系统 — 开发规格书

> 基于 README.md 提炼，供开发实施参考。

---

## 1. 架构

```
微信小程序 (miniprogram/)
  ↓ wx.request (REST JSON)
Cloudflare Worker (worker/src/index.ts)
  ├── Hono Router
  ├── Auth Middleware (JWT)
  ├── Routes (16 模块)
  ├── Algorithms (分摊 + 结算)
  ├── Services (日志/通知/微信API)
  └── D1 / KV / R2 Bindings
```

**前端：** 微信小程序原生（JavaScript + WXML + WXSS），20 页面 / 5 tabBar。
**后端：** Cloudflare Workers + Hono v4 + TypeScript。
**存储：** D1 (SQLite) / KV / R2。

---

## 2. 数据库（14 表，8 迁移文件）

### 2.1 `users`

| 字段 | 类型 | 说明 |
|------|------|------|
| 编号 | INTEGER PK | |
| 微信openid | TEXT | 唯一 |
| 昵称 | TEXT | |
| 头像地址 | TEXT | |
| 创建时间 | TEXT | |
| 更新时间 | TEXT | |

### 2.2 `houses`

| 字段 | 类型 | 说明 |
|------|------|------|
| 编号 | INTEGER PK | |
| 名称 | TEXT | |
| 地址 | TEXT | |
| 邀请码 | TEXT | 6 位随机码，7 天有效期，自动续期 |
| 创建人编号 | INTEGER FK→users | |
| 创建时间 | TEXT | |
| 更新时间 | TEXT | |

### 2.3 `members`

| 字段 | 类型 | 说明 |
|------|------|------|
| 编号 | INTEGER PK | |
| 房屋编号 | INTEGER FK→houses | |
| 用户编号 | INTEGER FK→users | |
| 角色 | TEXT | `系统管理员` / `寝室长` / `普通成员` |
| 加入时间 | TEXT | |
| 离开时间 | TEXT | 退出时记录 |
| 状态 | TEXT | `active` / `left` |

### 2.4 `bills`

| 字段 | 类型 | 说明 |
|------|------|------|
| 编号 | INTEGER PK | |
| 房屋编号 | INTEGER FK→houses | |
| 创建人编号 | INTEGER FK→users | |
| 标题 | TEXT | |
| 总金额（分） | INTEGER | 单位分 |
| 类目编号 | INTEGER FK→categories | |
| 账单日期 | TEXT | |
| 小票图片 | TEXT | R2 路径 |
| 备注 | TEXT | |
| 状态 | TEXT | `草稿` / `已确认` / `争议中` / `再次确认` / `待支付` / `已支付` |
| 版本号 | INTEGER | 乐观锁 |
| 创建时间 | TEXT | |
| 更新时间 | TEXT | |

### 2.5 `splits`

| 字段 | 类型 | 说明 |
|------|------|------|
| 编号 | INTEGER PK | |
| 账单编号 | INTEGER FK→bills | |
| 用户编号 | INTEGER FK→users | |
| 金额（分） | INTEGER | 该用户承担 |
| 分摊类型 | TEXT | `均摊` / `权重` / `天数` / `用量` / `面积` / `阶梯` |
| 权重值 | REAL | 非均摊时输入 |
| 创建时间 | TEXT | |

### 2.6 `settlements`

| 字段 | 类型 | 说明 |
|------|------|------|
| 编号 | INTEGER PK | |
| 房屋编号 | INTEGER FK→houses | |
| 标题 | TEXT | |
| 开始日期 | TEXT | |
| 结束日期 | TEXT | |
| 状态 | TEXT | `pending` / `confirmed` / `transferred` |
| 创建人编号 | INTEGER FK→users | |
| 创建时间 | TEXT | |
| 更新时间 | TEXT | |

### 2.7 `settlement_items`

| 字段 | 类型 | 说明 |
|------|------|------|
| 编号 | INTEGER PK | |
| 结算单编号 | INTEGER FK→settlements | |
| 付款人编号 | INTEGER FK→users | |
| 收款人编号 | INTEGER FK→users | |
| 原始金额（分） | INTEGER | 永不改变 |
| 最终金额（分） | INTEGER | 默认=原始金额，质疑后更新 |
| 状态 | TEXT | `pending` / `confirmed` / `transferred` / `disputed` |
| 版本号 | INTEGER | 乐观锁，每次+1 |
| 创建时间 | TEXT | |
| 更新时间 | TEXT | |

### 2.8 `settlement_challenges`

| 字段 | 类型 | 说明 |
|------|------|------|
| 编号 | INTEGER PK | |
| 转账项编号 | INTEGER FK→settlement_items | |
| 质疑人编号 | INTEGER FK→users | |
| 质疑轮次 | INTEGER | 从 1 递增 |
| 质疑原因 | TEXT | |
| 质疑金额（分） | INTEGER | 有问题的金额部分 |
| 要求金额（分） | INTEGER | 认为该多少；null=反对整笔 |
| 原金额快照（分） | INTEGER | 发起时 settlement_items.最终金额 |
| 调整后金额（分） | INTEGER | 解决后新金额；null=未调整/驳回 |
| 超时截止时间 | TEXT | 创建时固化 |
| 状态 | TEXT | `open` / `resolved` / `rejected` / `timeout` |
| 处理人编号 | INTEGER FK→users | |
| 创建时间 | TEXT | |
| 处理时间 | TEXT | |

### 2.9 `categories`

| 字段 | 类型 | 说明 |
|------|------|------|
| 编号 | INTEGER PK | |
| 房屋编号 | INTEGER FK→houses | |
| 名称 | TEXT | 如水费、电费、房租 |
| 排序 | INTEGER | |

### 2.10 `bill_templates`

| 字段 | 类型 | 说明 |
|------|------|------|
| 编号 | INTEGER PK | |
| 房屋编号 | INTEGER FK→houses | |
| 标题 | TEXT | |
| 金额（分） | INTEGER | |
| 类目编号 | INTEGER FK→categories | |
| 分摊类型 | TEXT | 默认分摊方式 |
| cron表达式 | TEXT | 如每月最后一天 |
| 是否启用 | INTEGER | 0/1 |
| 创建时间 | TEXT | |
| 更新时间 | TEXT | |

### 2.11 `cron_tasks`

| 字段 | 类型 | 说明 |
|------|------|------|
| 编号 | INTEGER PK | |
| 房屋编号 | INTEGER FK→houses | |
| 任务类型 | TEXT | `monthly_bill` / `settlement_reminder` |
| 上次执行时间 | TEXT | |
| 下次执行时间 | TEXT | |
| 执行状态 | TEXT | `pending` / `running` / `success` / `failed` |

### 2.12 `operation_logs`

| 字段 | 类型 | 说明 |
|------|------|------|
| 编号 | INTEGER PK | |
| 房屋编号 | INTEGER FK→houses | |
| 操作人编号 | INTEGER FK→users | |
| 操作类型 | TEXT | `create_bill` / `challenge` / `resolve_challenge` ... |
| 目标表名 | TEXT | 如 `bills` / `settlement_items` |
| 目标编号 | INTEGER | 受影响行的 PK |
| 操作前快照 | TEXT | JSON |
| 操作后快照 | TEXT | JSON |
| 快照版本号 | INTEGER | 兼容未来 schema 变更 |
| 创建时间 | TEXT | |

### 2.13 `partial_payments`

| 字段 | 类型 | 说明 |
|------|------|------|
| 编号 | INTEGER PK | |
| 转账项编号 | INTEGER FK→settlement_items | |
| 付款人编号 | INTEGER FK→users | |
| 金额（分） | INTEGER | |
| 凭证 | TEXT | 转账截图 R2 路径 |
| 备注 | TEXT | |
| 创建时间 | TEXT | |

### 2.14 `payment_methods`

| 字段 | 类型 | 说明 |
|------|------|------|
| 编号 | INTEGER PK | |
| 用户编号 | INTEGER FK→users | |
| 类型 | TEXT | `支付宝` / `微信` / `银行卡` |
| 账号 | TEXT | 脱敏展示 |
| 二维码 | TEXT | R2 路径 |
| 是否默认 | INTEGER | 0/1 |

---

## 3. 路由模块（16）

| 路由文件 | 前缀 | 核心职责 |
|---------|------|---------|
| `auth.ts` | `/api/auth` `/api/user` | 微信 code→JWT、token 刷新、profile 获取 |
| `houses.ts` | `/api/houses` `/api/user/houses` | 房屋 CRUD、成员管理、退租结算 |
| `bills.ts` | `/api/bills` | 账单 CRUD、R2 文件上传、摘要/导出 |
| `settlements.ts` | `/api/settlements` | 结算单全生命周期（核心，建议拆分） |
| `stats.ts` | `/api/houses/:id/stats` | 月度趋势/类目饼图/年度对比 |
| `categories.ts` | `/api/houses/:id/categories` | 类目 CRUD |
| `templates.ts` | `/api/bill-templates` | 账单模板 CRUD |
| `cron-tasks.ts` | `/api/cron-tasks` | 周期性任务状态查询 |
| `budget.ts` | `/api/houses/:id/budget` | 预算设置/90%预警 |
| `budget-suggestion.ts` | `/api/houses/:id/budget-suggestion` | 预算建议 |
| `ranking.ts` | `/api/houses/:id/ranking` | 消费排行 |
| `reports.ts` | `/api/houses/:id/reports` | 自定义报表 |
| `payments.ts` | `/api/payment-methods` | 支付方式/转账凭证 |
| `notify.ts` | `/api/notify/subscribe` | 订阅消息管理 |
| `notifications.ts` | (routes 内) | 站内通知/清除已读 |
| `seed.ts` | `/api/seed/test-data` | 测试数据生成（仅开发） |

---

## 4. 核心业务规则

### 4.1 账单状态机

```
草稿 → 已确认 → 争议中 → 再次确认 → 待支付 → 已支付
```

结算参与范围：`已确认` 及之后状态（草稿不参与）。

### 4.2 结算状态机

```
pending → confirmed → transferred → disputed_transfer
pending → challenged → resolved / rejected / timeout
```

### 4.3 质疑流程

```
发起质疑 (open)
  → 通知被质疑方
  → 被质疑方 3 天内回应：
      ├── 调整金额 → 质疑方接受 → resolved，回写金额
      ├── 调整金额 → 质疑方不接受 → 寝室长裁决
      └── 拒绝 → 寝室长裁决
  → 超时未回应 → timeout → 寝室长裁决
  → 裁决：支持A / 支持B / 折中 → 更新金额
  → 回写 bills.total_amount + splits.amount
  → 触发结算联动重算
```

### 4.4 分摊算法（6 种）

| 算法 | 公式 |
|------|------|
| 均摊 | 总金额 ÷ 人数 |
| 按权重 | 个人权重 ÷ 总权重 × 总金额 |
| 按天数 | 个人天数 ÷ 总天数 × 总金额 |
| 按用量 | 个人用量 ÷ 总用量 × 总金额 |
| 按房间面积 | 个人面积 ÷ 总面积 × 总金额 |
| 按阶梯费率 | 按用量区间阶梯计价 |

### 4.5 结算贪心算法

```
1. 净收支 = 总应付款 - 总应收款
2. 分离净收入者(应收)列表和净支出者(应付款)列表
3. 分别按金额降序排序
4. 循环配对：最大支出 → 最大收入，转账 = min(|支出|, |收入|)
5. 更新余额，移除已清零
6. 重复至全部为零
```

### 4.6 角色权限

| 角色 | 范围 | 权限 |
|------|------|------|
| 系统管理员 | 全局 | 用户账号/角色配置/功能开关 |
| 寝室长 | 房屋内 | 成员添加/移除 |
| 普通成员 | 房屋内 | 本人账单录入/查看全部/修改删除本人/发起质疑 |

### 4.7 认证授权

```
wx.login() → code → /api/auth/login → code2Session → JWT
access_token: 2h 时效
refresh_token: 30d 时效，存入 KV，每次使用后轮换
401 → 自动调用 /api/auth/refresh
```

### 4.8 定时任务

| 任务 | 触发时间 |
|------|---------|
| 月度账单生成 | 每月最后一天 |
| 到期提醒 | 到期前 1 天 |
| 质疑超时清扫 | 质疑后 3 天 |

### 4.9 幂等性

关键操作（质疑发起/裁决/支付确认）要求前端传 `Idempotency-Key`（UUID），后端 24h 内去重返回上次结果。

### 4.10 退出房屋

- 仅设 `members.状态=left` + 记录离开时间
- 已参与的未结算账单继续参与结算
- 退出后不再被新账单分摊

---

## 5. 错误码体系

```typescript
ERR_AUTH_TOKEN_EXPIRED     // 401 — token 过期
ERR_AUTH_TOKEN_INVALID     // 401 — token 无效
ERR_AUTH_REFRESH_FAILED    // 401 — refresh 失败
ERR_BILL_NOT_FOUND         // 404
ERR_BILL_STATUS_INVALID    // 400
ERR_BILL_DUPLICATE         // 400 — 幂等
ERR_SETTLE_NOT_FOUND       // 404
ERR_SETTLE_STATUS_INVALID  // 400
ERR_SETTLE_IMBALANCE       // 400
ERR_CHALLENGE_TIMEOUT      // 400
ERR_CHALLENGE_RESOLVED     // 400
ERR_COMMON_FORBIDDEN       // 403
ERR_COMMON_RATE_LIMIT      // 429
ERR_COMMON_INTERNAL        // 500
```

---

## 6. API 响应格式

```typescript
// 成功
{ "success": true, "data": T }
// 失败
{ "success": false, "error": string }
```

金额统一以「分」为 INTEGER 传输，前端用 `centsToYuan()` 展示。

---

## 7. 代码规范摘要

- **命名：** 文件/文件夹 kebab-case、变量/函数 camelCase、类/类型 PascalCase、常量 UPPER_SNAKE_CASE、数据库 snake_case、路由路径 kebab-case
- **TS：** 禁止 `any`、函数标注返回值、接口不加 `I` 前缀、`const enum` 优先
- **文件：** ≤200 行/文件、路由只注册不写逻辑、Service 不直接操作 DB
- **错误：** API 层用 `fail(msg, code)`，Service 层 `throw AppError`，全局中间件捕获
- **Git：** `feature/xxx` / `fix/xxx` 分支，提交格式 `type(scope): message`
- **注释：** 导出函数必加 JSDoc，禁止保留注释代码
