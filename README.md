# 合租费用分摊管理系统

微信小程序 + Cloudflare Workers 全栈应用，面向合租室友的账务协作工具，提供账单记录、分摊结算、支付核销、统计可视化等能力。

---

## 目录

- [项目状态](#项目状态)
- [架构概览](#架构概览)
- [技术栈](#技术栈)
- [目录结构](#目录结构)
- [数据库](#数据库)
- [角色权限](#角色权限)
- [账单状态与结算范围](#账单状态与结算范围)
- [认证授权流程](#认证授权流程)
- [质疑流程（先协商后裁决）](#质疑流程先协商后裁决)
- [消息通知逻辑](#消息通知逻辑)
- [幂等性设计](#幂等性设计)
- [搜索筛选与分页](#搜索筛选与分页)
- [统计与排行](#统计与排行)
- [预算计算逻辑](#预算计算逻辑)
- [退出房屋逻辑](#退出房屋逻辑)
- [错误码体系](#错误码体系)
- [本地开发](#本地开发)
- [生产部署](#生产部署)
- [已知严重问题](#已知严重问题)
- [重构建议](#重构建议)
- [API 响应规范](#api-响应规范)
- [设计规范](#设计规范)
- [代码书写规范](#代码书写规范)

---

## 项目状态

**⚠️ 维护警告：该项目存在多处数据完整性缺陷和设计问题，不建议直接用于生产环境。** 以下 README 既记录当前实现，也分析核心问题，供重构参考。

---

## 架构概览

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

### 前端（微信小程序原生）

- 语言：JavaScript + WXML + WXSS
- 状态管理：无（各页面独立维护 `data`，共享数据通过 `wx.getStorageSync`）
- 请求封装：`utils/request.js` — 自动注入 token/currentHouseId、401 自动 refresh、响应解包
- 20 个页面，5 个 tabBar 入口（首页/账单/扫一扫/统计/我的）

### 后端（Cloudflare Workers + Hono）

- 语言：TypeScript
- 框架：Hono v4
- 鉴权：微信 `code2Session` → JWT (access + refresh token)
- 定时任务：Cron Triggers（月度账单生成 + 到期提醒 + 质疑超时清扫）
- 第三方集成：微信订阅消息

### 六种分摊算法

| 算法 | 说明 |
|------|------|
| 均摊 | 总金额按人数等分 |
| 按权重 | 创建者指定每人权重值，按比例分摊 |
| 按天数 | 按每人入住天数比例分摊 |
| 按用量 | 按每人实际使用量比例分摊（如水表读数） |
| 按房间面积 | 按每人房间面积比例分摊 |
| 按阶梯费率 | 按使用量阶梯计费（如阶梯水电价） |

> 权重值由创建者手动指定。

### 结算算法（最小转账贪心）

`settlement.ts` 实现标准贪心配对算法，输入为各成员净收支，输出为转账方案：

```
1. 计算房屋内每个成员的总应付款 - 总应收款 = 净收支
2. 分离出净收入者（应收）列表和净支出者（应付款）列表
3. 分别按金额降序排序
4. 循环：取最大支出者与最大收入者配对，转账金额 = min(|支出|, |收入|)
5. 更新双方余额，移除已清零的成员
6. 重复直到所有成员余额为零
```

> 已知问题：债务清讫为 NP-hard 问题，贪心不保证转账笔数最少（见"已知严重问题"）。

---

## 技术栈

| 层级 | 技术 | 版本 |
| --- | --- | --- |
| 前端 | 微信小程序原生 | lib 3.17.0 |
| 后端 | Cloudflare Workers + Hono | v4 |
| 数据库 | Cloudflare D1 (SQLite) | — |
| 缓存 | Cloudflare Workers KV | — |
| 文件存储 | Cloudflare R2 | — |
| 算法 | TypeScript 纯函数 | — |

---

## 目录结构

```
rental apartment/
├── miniprogram/                          # 微信小程序前端
│   ├── app.js                            # 入口 (扫码 scene 处理)
│   ├── app.json / app.wxss               # 全局配置/样式
│   ├── pages/
│   │   ├── index/                        # 首页（本月汇总 + 快捷入口）
│   │   ├── login/                        # 微信一键登录
│   │   ├── house/create/                 # 创建房屋
│   │   ├── house/join/                   # 加入房屋（邀请码/扫码）
│   │   ├── house/qrcode/                 # 房屋小程序码
│   │   ├── members/                      # 成员管理
│   │   ├── bills/list/                   # 账单列表（筛选+搜索）
│   │   ├── bills/create/                 # 录入账单（六种分摊算法）
│   │   ├── bills/detail/                 # 账单详情
│   │   ├── bills/my/                     # 我的账单
│   │   ├── settlement/create/            # 生成结算单
│   │   ├── settlement/detail/            # 结算详情（确认/转账/质疑）
│   │   ├── settlement/history/           # 历史结算
│   │   ├── scan/                         # 扫一扫 tab
│   │   ├── stats/                        # 统计图表 tab（月度趋势/类目饼图/年度对比）
│   │   ├── profile/                      # 个人中心 tab（资料+支付方式）
│   │   ├── config/                       # 设置
│   │   ├── ranking/                      # 消费排行（总额排行/时间筛选）
│   │   ├── reports/                      # 自定义报表
│   │   └── notification/                 # 站内通知（质疑/裁决/到期提醒）
│   ├── utils/
│   │   ├── request.js                    # 统一请求工具
│   │   ├── format.js                     # 金额/日期/脱敏格式化
│   │   ├── constants.js                  # 全局常量
│   │   ├── avatar-behavior.js            # 头像更新逻辑
│   │   └── notify-templates.js           # 订阅消息模板
│   └── assets/tabbar/                    # tabBar 图标
├── worker/                               # Cloudflare Workers 后端
│   ├── src/
│   │   ├── index.ts                      # Worker 入口 (fetch + scheduled)
│   │   ├── router.ts                     # 路由注册 (16 个路由模块)
│   │   ├── types.ts                      # Bindings / AppEnv 类型
│   │   ├── algorithms/
│   │   │   ├── split.ts                  # 六种分摊算法
│   │   │   └── settlement.ts             # 最小转账贪心算法
│   │   ├── middleware/auth.ts            # JWT 鉴权
│   │   ├── routes/                       # 16 个路由模块 (见下方)
│   │   ├── services/                     # 业务服务层
│   │   │   ├── logger.ts                 # 操作日志
│   │   │   ├── notify.ts                 # 订阅消息推送
│   │   │   ├── wechat.ts                 # 微信 API 封装
│   │   │   └── settlement-reminder.ts    # 到期提醒扫描
│   │   ├── utils/
│   │   │   ├── response.ts               # ok/fail 响应封装
│   │   │   ├── id.ts                     # ID 生成
│   │   │   ├── jwt.ts                    # JWT 工具
│   │   │   ├── date.ts                   # 日期工具
│   │   │   └── settlement-state.ts       # 结算状态机
│   │   └── config/notify-templates.ts    # 通知模板配置
│   ├── migrations/                       # 8 个迁移文件
│   ├── wrangler.toml                     # Worker 配置
│   └── package.json
└── README.md
```

### 后端路由模块一览

| 文件 | 路由前缀 | 职责 |
| --- | --- | --- |
| `auth.ts` | `/api/auth` `/api/user` | 登录、refresh、profile |
| `houses.ts` | `/api/houses` `/api/user/houses` | 房屋 CRUD、成员管理、退租结算 |
| `bills.ts` | `/api/bills` `/api/r2` | 账单 CRUD、文件上传、摘要/导出 |
| `settlements.ts` | `/api/settlements` | 结算单全生命周期（核心模块，需拆分） |
| `stats.ts` | `/api/houses/:id/stats` | 月度趋势折线图/类目饼图/年度对比 |
| `categories.ts` | `/api/houses/:id/categories` | 类目 CRUD |
| `templates.ts` | `/api/bill-templates` | 账单模板 CRUD（支持 cron 自动生成） |
| `cron-tasks.ts` | `/api/cron-tasks` | 周期性账单任务状态查询 |
| `budget.ts` | `/api/houses/:id/budget` | 月度预算设置/90%预警 |
| `budget-suggestion.ts` | `/api/houses/:id/budget-suggestion` | 预算建议（历史均值法） |
| `ranking.ts` | `/api/houses/:id/ranking` | 消费排行（总额/时间筛选） |
| `reports.ts` | `/api/houses/:id/reports` | 自定义报表 |
| `payments.ts` | `/api/payment-methods` | 支付方式 CRUD、转账凭证 |
| `notify.ts` | `/api/notify/subscribe` | 订阅消息管理 |
| `notifications.ts` | (routes 内) | 站内通知、清除已读 |
| `seed.ts` | `/api/seed/test-data` | 测试数据生成 |

---

## 数据库

14 张业务表，8 个迁移文件（`worker/migrations/`）。

| 表名 | 行数参考 | 说明 |
| --- | --- | --- |
| `users` | 少 | 用户基础信息 |
| `houses` | 少 | 房屋配置 |
| `members` | 少 | 成员关系/角色 |
| `bills` | 多 | 账单主表 |
| `splits` | 多 | 分摊明细（支持 6 种方式） |
| `settlements` | 中 | 结算单 |
| `settlement_items` | 中 | 结算转账项（含质疑/争议状态） |
| `settlement_challenges` | 少 | 质疑记录 |
| `bill_templates` | 少 | 账单模板 |
| `categories` | 少 | 类目 |
| `operation_logs` | 多 | 操作日志（含快照） |
| `cron_tasks` | 少 | 周期性账单任务 |
| `partial_payments` | 少 | 部分支付 |
| `payment_methods` | 少 | 收款方式 |

> 迁移文件编号：`0001_init` → `0008_challenge_bill`，需按顺序执行。
>
> ⚠️ 当前 schema 设计缺乏外键索引和级联删除策略，部分迁移直接在已有表上 ADD COLUMN，可能导致生产环境迁移失败。

### 核心表字段说明

**`bills`（账单主表）**

| 字段 | 类型 | 说明 |
|------|------|------|
| 编号 | INTEGER | 主键 |
| 房屋编号 | INTEGER | 关联 houses |
| 创建人编号 | INTEGER | 关联 users |
| 标题 | TEXT | 账单名称 |
| 总金额（分） | INTEGER | 单位分 |
| 类目编号 | INTEGER | 关联 categories |
| 账单日期 | TEXT | 消费日期 |
| 小票图片 | TEXT | R2 文件路径 |
| 备注 | TEXT | |
| 状态 | TEXT | 草稿 / 已确认 / 争议中 / 再次确认 / 待支付 / 已支付 |
| 版本号 | INTEGER | 乐观锁，防并发写冲突 |
| 创建时间 | TEXT | |
| 更新时间 | TEXT | |

**`splits`（分摊明细）**

| 字段 | 类型 | 说明 |
|------|------|------|
| 编号 | INTEGER | 主键 |
| 账单编号 | INTEGER | 关联 bills |
| 用户编号 | INTEGER | 关联 users |
| 金额（分） | INTEGER | 该用户承担金额 |
| 分摊类型 | TEXT | 均摊 / 权重 / 天数 / 用量 / 面积 / 阶梯 |
| 权重值 | REAL | 非均摊时由创建者指定 |
| 创建时间 | TEXT | |

**`settlements`（结算单）**

| 字段 | 类型 | 说明 |
|------|------|------|
| 编号 | INTEGER | 主键 |
| 房屋编号 | INTEGER | 关联 houses |
| 标题 | TEXT | |
| 开始日期 | TEXT | 结算覆盖的起始日期 |
| 结束日期 | TEXT | 结算覆盖的截止日期 |
| 状态 | TEXT | pending / confirmed / transferred |
| 创建人编号 | INTEGER | 关联 users |
| 创建时间 | TEXT | |
| 更新时间 | TEXT | |

**`settlement_items`（结算转账项）**

| 字段 | 类型 | 说明 |
|------|------|------|
| 编号 | INTEGER | 主键 |
| 结算单编号 | INTEGER | 关联 settlements |
| 付款人编号 | INTEGER | 关联 users |
| 收款人编号 | INTEGER | 关联 users |
| 原始金额（分） | INTEGER | 生成结算时计算出的金额，永不改变 |
| 最终金额（分） | INTEGER | 当前实际金额，默认等于原始金额，质疑解决后更新 |
| 状态 | TEXT | pending / confirmed / transferred / disputed |
| 版本号 | INTEGER | 乐观锁，每次更新+1 |
| 创建时间 | TEXT | |
| 更新时间 | TEXT | |

**`settlement_challenges`（质疑记录）**

| 字段 | 类型 | 说明 |
|------|------|------|
| 编号 | INTEGER | 主键 |
| 转账项编号 | INTEGER | 关联 settlement_items |
| 质疑人编号 | INTEGER | 关联 users |
| 质疑轮次 | INTEGER | 从1递增，支持多次质疑 |
| 质疑原因 | TEXT | |
| 质疑金额（分） | INTEGER | 质疑方认为有问题的金额部分 |
| 要求金额（分） | INTEGER | 质疑方认为该多少（null表示直接反对整笔） |
| 原金额快照（分） | INTEGER | 发起本次质疑时 settlement_items.最终金额 |
| 调整后金额（分） | INTEGER | 解决后新的金额，null表示未调整或驳回 |
| 超时截止时间 | TEXT | 写入时固化，避免超时策略变更后漂移 |
| 状态 | TEXT | open / resolved / rejected / timeout |
| 处理人编号 | INTEGER | 关联 users，谁做的裁决 |
| 创建时间 | TEXT | |
| 处理时间 | TEXT | |

**`users`（用户基础信息）**

| 字段 | 类型 | 说明 |
|------|------|------|
| 编号 | INTEGER | 主键 |
| 微信openid | TEXT | 微信唯一标识 |
| 昵称 | TEXT | |
| 头像地址 | TEXT | |
| 创建时间 | TEXT | |
| 更新时间 | TEXT | |

**`houses`（房屋配置）**

| 字段 | 类型 | 说明 |
|------|------|------|
| 编号 | INTEGER | 主键 |
| 名称 | TEXT | |
| 地址 | TEXT | |
| 邀请码 | TEXT | 用于加入房屋 |
| 创建人编号 | INTEGER | 关联 users |
| 创建时间 | TEXT | |
| 更新时间 | TEXT | |

**`members`（成员关系）**

| 字段 | 类型 | 说明 |
|------|------|------|
| 编号 | INTEGER | 主键 |
| 房屋编号 | INTEGER | 关联 houses |
| 用户编号 | INTEGER | 关联 users |
| 角色 | TEXT | 系统管理员 / 寝室长 / 普通成员 |
| 加入时间 | TEXT | |
| 离开时间 | TEXT | 退出房屋时记录 |
| 状态 | TEXT | active / left |

**`categories`（类目）**

| 字段 | 类型 | 说明 |
|------|------|------|
| 编号 | INTEGER | 主键 |
| 房屋编号 | INTEGER | 关联 houses |
| 名称 | TEXT | 如水费、电费、房租 |
| 排序 | INTEGER | 展示顺序 |

**`bill_templates`（账单模板）**

| 字段 | 类型 | 说明 |
|------|------|------|
| 编号 | INTEGER | 主键 |
| 房屋编号 | INTEGER | 关联 houses |
| 标题 | TEXT | |
| 金额（分） | INTEGER | |
| 类目编号 | INTEGER | 关联 categories |
| 分摊类型 | TEXT | 默认分摊方式 |
| cron表达式 | TEXT | 如每月最后一天 |
| 是否启用 | INTEGER | 0禁用 1启用 |
| 创建时间 | TEXT | |
| 更新时间 | TEXT | |

**`cron_tasks`（周期性任务）**

| 字段 | 类型 | 说明 |
|------|------|------|
| 编号 | INTEGER | 主键 |
| 房屋编号 | INTEGER | 关联 houses |
| 任务类型 | TEXT | monthly_bill / settlement_reminder |
| 上次执行时间 | TEXT | |
| 下次执行时间 | TEXT | |
| 执行状态 | TEXT | pending / running / success / failed |

**`operation_logs`（操作日志）**

| 字段 | 类型 | 说明 |
|------|------|------|
| 编号 | INTEGER | 主键 |
| 房屋编号 | INTEGER | 关联 houses |
| 操作人编号 | INTEGER | 关联 users |
| 操作类型 | TEXT | 如 create_bill / challenge / resolve_challenge |
| 目标表名 | TEXT | 如 bills / settlement_items |
| 目标编号 | INTEGER | 受影响行的主键 |
| 操作前快照 | TEXT | JSON数据快照 |
| 操作后快照 | TEXT | JSON数据快照 |
| 快照版本号 | INTEGER | 兼容未来schema变更 |
| 创建时间 | TEXT | |

**`partial_payments`（部分支付）**

| 字段 | 类型 | 说明 |
|------|------|------|
| 编号 | INTEGER | 主键 |
| 转账项编号 | INTEGER | 关联 settlement_items |
| 付款人编号 | INTEGER | 关联 users |
| 金额（分） | INTEGER | 本次支付金额 |
| 凭证 | TEXT | 转账截图R2路径 |
| 备注 | TEXT | |
| 创建时间 | TEXT | |

**`payment_methods`（收款方式）**

| 字段 | 类型 | 说明 |
|------|------|------|
| 编号 | INTEGER | 主键 |
| 用户编号 | INTEGER | 关联 users |
| 类型 | TEXT | 支付宝 / 微信 / 银行卡 |
| 账号 | TEXT | 脱敏展示 |
| 二维码 | TEXT | R2路径 |
| 是否默认 | INTEGER | 0否 1是 |

---

## 角色权限

| 角色 | 范围 | 权限 |
|------|------|------|
| 系统管理员 | 全局 | 管理用户账号、修改角色权限配置、控制程序功能开关 |
| 寝室长 | 房屋内 | 管理成员（添加/移除） |
| 普通成员 | 房屋内 | 录入本人账单、查看所在房屋所有账单、修改/删除本人创建的账单、发起质疑 |

> 功能开关由系统管理员配置，当前支持的开关项：质疑流程、Cron自动账单生成、通知渠道（微信订阅消息/站内通知）、分摊人数上限、邀请码审核。

---

## 账单状态与结算范围

账单生命周期：`草稿 → 已确认 → 争议中 → 再次确认 → 待支付 → 已支付`

结算时筛选范围：`已确认` 及之后状态的账单参与结算（草稿不参与）。

### 定时任务

| 任务 | 时间 | 说明 |
|------|------|------|
| 月度账单生成 | 每月最后一天 | 根据 bill_templates 自动生成周期性账单 |
| 到期提醒 | 到期前1天 | 提醒未完成支付的转账项 |
| 质疑超时清扫 | 质疑发起后3天 | 超时未处理的质疑自动标记为 timeout |

---

## 认证授权流程

```
用户打开小程序 → wx.login() → 获取 code → 后端 /api/auth/login
  → 调用微信 code2Session → 获取 openid + session_key
  → 查询 users 表（openid），不存在则创建新用户
  → 生成 access_token（时效2小时）+ refresh_token（时效30天）
  → 返回给前端 → 存入 wx.getStorageSync
```

**Token续期：** 前端请求 401 时自动调用 `/api/auth/refresh`，传入 refresh_token → 后端验证有效性 → 签发新 access_token。refresh_token 存入 KV，支持吊销（用户注销时从 KV 删除）。

**刷新策略：** refresh_token 每次使用后轮换（旧 token 失效、签发新 token），防止重放攻击。

---

## 质疑流程（先协商后裁决）

```
成员A发起质疑
  → 系统创建 settlement_challenges 记录（状态=open，轮次=1）
  → 站内通知+微信订阅消息推送被质疑方（成员B）
  → B 在3天内回应：
      ├── 调整金额 → A 接受 → 状态=resolved，更新 settlement_items.最终金额，回写bills/splits
      ├── 调整金额 → A 不接受 → 升级到寝室长C裁决
      └── 拒绝调整 → 升级到寝室长C裁决
  → 3天超时未回应 → 自动标记为 timeout，升级到寝室长C裁决
  → 寝室长C裁决：选择"支持A"或"支持B"或"折中金额"
  → 裁决后更新 settlement_items.最终金额，回写 bills/splits
  → 触发结算联动重算检查
```

**多次质疑：** 同笔转账项可多次质疑（质疑轮次递增），每次独立记录金额快照。前一次 resolved 后如有新争议可发起新一轮。

---

## 消息通知逻辑

| 触发事件 | 通知方式 | 说明 |
|---------|---------|------|
| 新账单创建 | 站内通知 | 房屋内所有成员收到账单通知 |
| 质疑发起 | 站内通知 + 微信订阅消息 | 推送给被质疑方 |
| 质疑裁决 | 站内通知 + 微信订阅消息 | 推送给质疑双方 |
| 结算单生成 | 站内通知 | 房屋内所有成员 |
| 转账到期提醒 | 站内通知 + 微信订阅消息 | 到期前1天推送给付款方 |
| 邀请码审核 | 站内通知 | 推送给申请者 |

> 微信订阅消息有频次限制（每用户每月有限次数），超出频次后降级为站内通知。

---

## 幂等性设计

关键操作（质疑发起、质疑裁决、支付确认）增加幂等键（idempotency_key）：

- 前端每次请求生成唯一 UUID 作为 `Idempotency-Key` 请求头
- 后端处理前检查该 key 是否已存在：
  - 已存在 → 直接返回上次处理结果（幂等）
  - 不存在 → 执行操作并记录 key
- 幂等键有效期 24 小时，过期后自动清理

---

## 搜索筛选与分页

`bills/list/` 支持以下筛选维度组合查询：

| 维度 | 说明 |
|------|------|
| 时间范围 | 账单日期区间（开始~结束） |
| 类目 | 下拉选择 categories |
| 状态 | 草稿/已确认/争议中/再次确认/待支付/已支付 |
| 金额区间 | 最低~最高（单位分） |
| 关键词 | 模糊匹配 bills.title |

分页方式：游标分页（cursor-based），每次返回20条，按创建时间倒序。

---

## 统计与排行

**`stats/`（统计页）：**
- 月度总支出趋势折线图（近12个月）
- 类目分布饼图（当月各categorie占比）
- 年度对比柱状图（当年 vs 上年各月）

**`ranking/`（排行页）：**
- 按个人累计消费总额排名（当前房屋内所有成员）
- 支持时间范围筛选（本月/本季度/本年/自定义）

---

## 预算计算逻辑

`budget-suggestion.ts` 基于历史均值法：

1. 取该房屋过去3个月同类目（category）的月度平均支出
2. 按当前成员人数做系数调整
3. 给出下月建议预算金额

`budget.ts` 接受管理员手动设置预算上限，当月度实际支出超过预算90%时触发预警通知。

---

## 退出房屋逻辑

成员退出时只标记 `members.状态 = left`，记录离开时间，**不强制结算**：

- 该成员已参与的未结算账单（已有 splits 记录）**继续参与后续结算**
- 退出后**不再**被新创建的账单分摊
- 当该成员作为付款方或收款方的所有 `settlement_items` 均被标记为 `transferred` 后，房屋内的结算才算彻底完结

---

## 错误码体系

```typescript
// 格式：ERR_模块_错误名
ERR_AUTH_TOKEN_EXPIRED    // token 过期，需刷新
ERR_AUTH_TOKEN_INVALID    // token 无效
ERR_AUTH_REFRESH_FAILED   // refresh 失败，需重新登录

ERR_BILL_NOT_FOUND        // 账单不存在
ERR_BILL_STATUS_INVALID   // 账单状态不允许当前操作
ERR_BILL_DUPLICATE        // 重复创建（幂等校验）

ERR_SETTLE_NOT_FOUND      // 结算单不存在
ERR_SETTLE_STATUS_INVALID // 结算单状态不允许当前操作
ERR_SETTLE_IMBALANCE      // 结算不平衡

ERR_CHALLENGE_TIMEOUT     // 质疑超时
ERR_CHALLENGE_RESOLVED    // 质疑已解决，不可重复操作

ERR_COMMON_FORBIDDEN      // 无权限
ERR_COMMON_RATE_LIMIT     // 频率限制
ERR_COMMON_INTERNAL       // 服务内部错误
```

HTTP 状态码映射：`ERR_AUTH_*` → 401，`ERR_COMMON_FORBIDDEN` → 403，`ERR_*_NOT_FOUND` → 404，`ERR_*_INVALID` → 400，`ERR_COMMON_INTERNAL` → 500，其余 → 400。

---

## 本地开发

### 前置条件

- Node.js >= 18
- npm
- 微信开发者工具
- Cloudflare 账号（用于 D1/KV/R2 模拟）

### 环境变量

创建 `.dev.vars` 文件，包含以下敏感变量：

```env
WECHAT_APPID=xxx
WECHAT_SECRET=xxx
JWT_SECRET=xxx
R2_ACCESS_KEY_ID=xxx
R2_SECRET_ACCESS_KEY=xxx
```

### wrangler.toml 配置示例

```toml
name = "rental-apartment-worker"
main = "src/index.ts"
compatibility_date = "2025-01-01"

[[d1_databases]]
binding = "DB"
database_name = "rental-db"
database_id = "your-database-id"

[[kv_namespaces]]
binding = "KV"
id = "your-kv-id"

[[r2_buckets]]
binding = "R2"
bucket_name = "rental-apartment-uploads"

[[triggers]]
crons = ["0 0 L * *"]  # 每月最后一天生成账单

[[triggers]]
crons = ["0 0 * * *"]  # 每天检查到期提醒 + 质疑超时清扫
```

### 启动后端

```powershell
cd worker
npm install

# 配置敏感变量（创建 .dev.vars）
# WECHAT_APPID=xxx
# WECHAT_SECRET=xxx
# JWT_SECRET=xxx

# 初始化 D1 数据库
npx wrangler d1 migrations apply rental-db --local

# 启动开发服务器
npx wrangler dev --ip 0.0.0.0 --port 8787
```

### 启动小程序

1. 打开微信开发者工具，导入 `miniprogram/` 目录
2. 确认 `utils/request.js` 中 `API_BASE_URL` 指向后端地址
3. 关闭"过滤无依赖文件"（设置 → 项目设置）
4. 编译运行

### 生成测试数据

```powershell
# 调用种子接口（需先登录获取 token）
curl -X POST http://localhost:8787/api/seed/test-data \
  -H "Authorization: Bearer <token>"
```

### 运行测试

```powershell
cd worker
npx vitest
```

---

## 生产部署

1. 创建生产 D1/KV/R2 资源，回填 `wrangler.toml`
2. 注入敏感密钥：`npx wrangler secret put <KEY>`
3. 应用数据库迁移：`npx wrangler d1 migrations apply rental-db --remote`
4. 发布：`npx wrangler deploy`
5. 微信公众平台配置 request 合法域名

---

## 已知严重问题

以下问题按严重程度排列，重构时需优先解决：

### 1. 数据一致性风险（P0）

**复杂业务流程缺乏事务保障：**

- D1 不支持多语句事务。质疑→解决流程涉及 5-10 步数据库操作（状态变更、金额更新、分摊重算、转账项重建、通知推送），任一中间步骤失败即导致部分更新、状态不一致。
- ~~**`settlement_item_splits` 关联表设计缺陷**~~（已移除）：结算转账项原通过该表关联原始分摊明细，但结算生成时未固化金额快照，原始数据变更后可导致金额漂移。已在数据库设计中移除该表，改为在 `settlement_items` 中直接记录原始金额和最终金额，并在质疑记录中留存快照。
- **应用层 Saga 无法彻底治愈无事务问题**：即便引入 Saga 模式，在 D1 无事务环境下，补偿操作的幂等性、部分失败后的状态判定、并发请求下的竞态条件，依然存在不一致窗口期。Saga 只能"检测并修复"，无法"原子地防止"。
- 缺乏级联删除策略，删除房屋或用户时可能因外键约束失败。
- 缺少兜底的数据一致性扫描和自动修复机制。
- **退租结算流程未定义**：`houses.ts` 负责退租结算，但成员退出时的未结算账单、未完成质疑、历史分摊数据如何处理未定义。若直接删除成员记录，会导致关联的 `splits`、`settlement_items` 等表外键约束失败或数据悬空。
- **Cron"月度账单生成"与手动录入可能冲突**：定时任务可以自动生成账单，用户也能手动在 `bills/create/` 录入。两者之间没有去重机制，同一笔费用可能被重复计费。cron 的账单数据来源（模板？规则？）、适用范围（哪些成员/房屋）也未定义。
- **质疑解决后未回写账单金额**：质疑证明原始账单金额有误（如电费多算）时，解决后只改了 `settlement_items.最终金额`，但 **未回写 `bills.total_amount` 和 `splits.amount`**。结果账单页显示错误金额，结算页显示修正金额，两边永远对不上。
- **质疑金额变更后缺乏联动重算**：质疑改了一个转账项的金额，但该转账项是基于分摊算法+债务清讫算出的。金额变了，付款方/收款方的净收支就变了，整张结算单可能不再平衡。当前设计没有触发"质疑→联动重算其他转账项"的机制。

**改进方向：** 结算生成时固化金额快照（而非仅关联ID）；Saga 补偿需完备设计幂等和逆向操作，具体策略为：每步操作先写日志（状态=进行中），执行成功更新为已完成、失败则根据日志执行逆向补偿；配合定时扫描任务兜底检测不一致状态；明确定义退租结算流程及其数据清理策略；划清 cron 自动生成与手动录入的边界，增加去重机制；质疑解决后自动回写受影响的账单金额；质疑改金额后触发结算联动重算或标记结算单为"需重新平衡"。

### 2. 前端状态管理缺失（P1）

- 无全局状态管理，页面间数据传递依赖本地存储或 URL 参数，页面关闭后状态丢失。
- 前端页面同时承载UI渲染、业务逻辑、API调用，职责未分离。
- 后端核心业务模块未按职责拆分，单一模块承载完整生命周期逻辑，可维护性差。

**改进方向：** 引入状态管理库，前后端均按职责分层拆分。

### 3. 安全架构风险（P1）

- JWT Token 明文存储在客户端本地存储，缺少 XSS 防护。
- 文件资源鉴权通过 URL 参数传递 Token，可能泄露至 Referer 或 CDN 日志。
- 缺少 CSRF 防护机制。
- 接口权限校验覆盖面不完整。
- **`seed.ts` 暴露在生产路由中**：`/api/seed/test-data` 是一个生产环境可访问的测试数据生成接口，可被恶意调用造成 D1 存储膨胀甚至触及 5GB 免费上限。
- **refresh token 无吊销机制**：双 token 设计合理，但未说明 refresh token 的存储位置（D1/KV?）、验证方式、以及用户注销/换设备时的吊销策略。一旦 refresh token 泄露，攻击者可长期持有登录态。

**改进方向：** Token 改用安全存储方案，资源鉴权改用签名机制，补全权限校验；seed 路由仅在开发环境注册；设计 refresh token 轮换和吊销机制。

### 4. 结算状态机设计过重（P1）

结算状态路径包含 6 种状态、2 条路径、4 种质疑子状态：

```
pending → confirmed → transferred → disputed_transfer
pending → challenged → resolved/rejected/timeout
```

质疑超时自动清扫机制与手动操作存在竞态条件。对合租场景而言，质疑/争议/仲裁流程过于复杂。

- **缺少撤销/重新结算机制**：结算完成后（`transferred`）发现算错，唯一的修正路径是发起质疑，流程长且不符合"单纯算错"的场景。
- **结算范围未定义**：`settlement/create/` 页面没有明确用户可以按什么规则选择参与结算的账单（按时间范围、全部未结算、手动勾选），前后端对结算输入范围的预期可能不一致。（已解决：见"账单状态与结算范围"章节）
- **`disputed_transfer` 无后续出口**：状态图显示 `transferred → disputed_transfer`，但进入质疑转账状态后没有去向——是退回 `confirmed` 重新转账、进入仲裁流程、还是自动 `resolved`？状态机缺少这条路径的定义。
- **`partial_payments` 与状态机不兼容**：存在 `partial_payments` 表但状态机只有 `transferred`（全额已转），部分支付场景下状态无法正确流转。是停留在 `confirmed` 等待付清，还是新增 `partially_transferred` 状态？未定义。
- **状态转换的触发者未定义**：状态机只定义了"状态"，未定义每个转换由谁触发。例如 `confirmed → transferred` 是付款方自行标记、收款方确认收到、还是双方都确认？角色和权限未映射到状态转换上。
- **转账真实性无法验证**：系统只能记录状态，无法验证转账是否真的发生。付款方标记 `transferred` 后，收款方若不认可只能发起 `disputed_transfer`，缺乏自动核验或第三方凭证机制。
- **质疑无法定位到具体分摊项**：去掉 `settlement_item_splits` 后，转账项只记录了"甲→乙 100元"，但用户发起质疑时只知道金额不对，无法精确指定"这100元里哪笔账单的分摊有问题"。缺乏从质疑到原始账单分摊项的追溯链路。

**改进方向：** 简化状态机，移除自动超时机制，改为通知驱动；增加撤销结算和重新结算的直接路径；明确定义结算范围选择逻辑；补齐 `disputed_transfer` 后续路径；将角色权限映射到每个状态转换上；评估集成支付凭证（如转账截图）验证流程；在质疑记录中保留关联的账单分摊项编号，支持精确追溯。

### 5. 金额处理策略不足（P2）

- 金额以"分"存储，但部分接口返回未标注单位，前端依赖隐式约定。
- 复杂分摊场景下整数除法尾差可能累积。

**改进方向：** 统一单位标注规范，明确舍入策略。

### 6. 架构与编码规范缺失（P2）

- **错误处理策略不统一**（已解决，见"代码书写规范"）：返回错误 vs 抛出异常混用。
- 类型安全依赖人为约束，缺乏编译期保障。
- 关键路径异常被静默吞掉，无法排查。
- 部分模块职责边界模糊，命名易混淆。
- API 路径风格与 RESTful 规范不完全一致。
- **"最小转账贪心算法"缺少算法约束文档**：债务清讫问题是 NP-hard，贪心算法不保证转账笔数最少。未说明近似比、适用条件、以及极端场景（如多人环形债务）下的行为边界。使用者无法判断算法是否适用于当前结算规模。
- **支付方式与实际转账流程脱节**：`payment_methods` 记录了收款方式（支付宝/微信等），但结算详情页未设计如何将收款方信息展示给付款方，也未定义付款方确认已转账的操作路径和反馈机制。信息流与实际操作流之间存在断层。
- **`operation_logs` 快照无版本管理**（已解决，见数据库 `operation_logs` 表字段）：操作日志记录了数据快照用于审计，但未设计快照版本号。数据库 schema 升级后，旧快照的字段结构与新 schema 不兼容，回放或查看历史快照会直接崩溃。
- **多人并发操作无竞态控制**：D1 不支持行级锁和事务，合租场景天然多用户并发。多人同时确认/质疑/转账同一笔结算项时，状态可能被后者覆盖；定时扫描任务与手动操作之间也存在竞态条件。缺乏乐观锁（version 字段）或 CAS 机制。
- **质疑超时未固化截止时间**（已解决，见数据库 `settlement_challenges` 表字段）：质疑记录没有独立记录每轮质疑的截止时间，清扫任务只能靠"创建时间+3天"实时计算。未来改变超时策略（如3天→7天）时，旧质疑的截止时间会被策略变更漂移。
- **缺乏质疑通知流程**（已解决，见"消息通知逻辑"章节）：发起质疑、被质疑方回应、寝室长裁决后，相关方没有主动通知机制。用户必须自己打开页面查看进度，不符合合租场景即时沟通的需求。

**改进方向：** 编码规范已制定（见"代码书写规范"），进一步统一错误处理模式，对齐 RESTful 约定；算法补充约束条件和适用场景文档；补齐从展示收款信息到确认转账完成的完整交互链路；快照写入时附带 schema 版本号，读取时做版本兼容；引入乐观锁或写入队列防止并发写冲突；质疑记录创建时写入截止时间；接入微信订阅消息或站内通知驱动质疑流程。

### 7. 测试策略缺失（P2）

- 仅核心算法层有测试覆盖，核心业务链路无任何测试（单元/集成/E2E）。
- 无 API 契约测试，无前端测试。
- 测试未作为架构设计的一环纳入。

**改进方向：** 按分层建立测试策略，核心流程必须配套集成测试。

### 8. 可观测性设计缺失（P3）

- 未设计结构化日志和错误上报机制。
- 前端无用户行为追踪，后端无性能监控。
- 问题排查依赖 `console.log`，生产环境不可用。

**改进方向：** 引入结构化日志和错误追踪服务。

### 9. API 安全与传输设计不足（P3）

- 请求无签名验证，Token 刷新机制与业务逻辑耦合。
- 网络异常场景下请求无重试策略，影响用户体验。

**改进方向：** 设计独立的安全层和请求重试机制。

---

## 重构建议

### 短期（可立即修复）

1. 质疑流程关键路径增加 try/catch 回滚或标记为待重试状态
2. 超时处理改为通知驱动，不自动变更状态
3. 结算生成时固化金额快照，结算项关联原始分摊时同时记录金额副本，防止原始数据变更导致漂移
4. 明确定义结算范围选择逻辑（时间范围 / 未结算账单 / 手动勾选），前后端对齐（已完成，见"账单状态与结算范围"章节）
5. 补齐从展示收款信息到确认转账完成的完整交互链路设计
6. API 基地址改为动态配置，去除硬编码
7. 前端请求层增加网络重试机制（异常时自动重试 2 次）
8. 明确定义退租结算流程及数据清理策略（未结算账单处理、质疑关闭、历史数据保留）
9. 划清 cron 月度账单生成与手动录入的边界，增加去重校验
10. seed 路由仅在开发环境注册，生产环境移除

### 中期

1. 后端按业务域拆分大模块（结算创建 / 结算项 / 质疑处理 / 支付对接）
2. 前端引入 service 层，将 API 调用和业务逻辑从 Page 中抽离
3. 所有金额字段统一使用精确数值类型并标注单位
4. 质疑流程引入 Saga 模式，每步操作写入审计日志，提供管理员补偿界面
5. 增加撤销结算和重新结算的直接路径，避免出错后只能走质疑流程
6. 补齐 `disputed_transfer` 的后续状态路径（退回重转 / 仲裁 / 自动 resolved），并定义每个状态转换的触发角色和权限
7. 将 `partial_payments` 纳入状态机：为部分支付场景定义独立状态或增加金额字段标记
8. 增加核心业务流程的集成测试（create → confirm → transfer → confirm）
9. `operation_logs` 快照写入时附带 schema 版本号，读取时做版本兼容
10. 引入乐观锁（version 字段）或写入队列，防止并发写冲突
11. 质疑解决后自动回写受影响的 `bills.total_amount` 和 `splits.amount`
12. 质疑改金额后触发结算联动重算或标记结算单为"需重新平衡"

### 长期

1. 简化状态机，移除对合租场景过重的争议/质疑流程
2. 评估数据库选型，获取真正的事务支持（如通过外置 PostgreSQL 服务）
3. 建立规范化错误码体系（`ERR_xxx`），前后端统一错误处理（规范已定义，见"错误码体系"章节，需在代码中落地）
4. 为"最小转账贪心算法"补充约束条件和适用场景文档，明确近似比和极端行为边界
5. 评估是否需要引入转账凭证（截图上传、收款方确认等）辅助验证转账真实性
6. 设计 refresh token 轮换和吊销机制
7. 构建 CI/CD 流水线：lint → typecheck → test → build → deploy
8. 引入错误追踪和性能监控服务
9. 评估前端跨端方案（uni-app / Taro），为多端复用做准备
10. 质疑记录创建时写入截止时间，避免超时策略变更后旧数据漂移
11. 建立质疑全流程的站内通知+订阅消息推送机制

---

## API 响应规范

```typescript
// 成功
{ "success": true, "data": T }
// 失败
{ "success": false, "error": string }
```

金额单位：分（INTEGER），前端使用 `centsToYuan()` 展示。

---

## 设计规范

- 主色渐变：`#4f46e5 → #7c3aed → #8b5cf6`
- 圆角：`28rpx`（卡片），`16rpx`（输入框）
- 阴影：`0 24rpx 56rpx rgba(79, 70, 229, 0.22)`
- tabBar 图标尺寸：`81×81px`

---

## 代码书写规范

### 命名规范

| 类型 | 规范 | 示例 |
|------|------|------|
| 文件/文件夹 | kebab-case | `settlement-create.ts`, `bill-list/` |
| 变量/函数 | camelCase | `getUserById()`, `totalAmount` |
| 类/类型/接口 | PascalCase | `class BillService`, `interface SettlementItem` |
| 数据库表/字段 | snake_case | `bills`, `settlement_items`, `total_amount` |
| 常量 | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT`, `JWT_SECRET` |
| 路由路径 | kebab-case | `/api/bill-templates`, `/api/payment-methods` |
| 枚举值 | PascalCase | `BillStatus.Confirmed`, `ChallengeState.Open` |

### TypeScript 风格

- **禁止 `any`**：必须使用明确的类型或 `unknown`（需类型收窄后使用）
- **函数返回值必须标注类型**：`function calcSplit(amount: number): SplitResult`
- **接口前缀不加 `I`**：用 `BillData` 而非 `IBillData`
- **枚举用 `const enum`** 优先于普通 `enum`，减少运行时开销
- **可选链 `?.` / 空值合并 `??`** 优先于 `&&` / `||` 判空

### 文件组织

- **单文件不超过 200 行**（超出则拆分子模块）
- **路由文件**只注册路由路径和中间件，不写业务逻辑，业务逻辑调用 service 层
- **service 层**只写业务逻辑，不直接操作数据库，通过 DAL/ORM 访问
- **utils**只放纯函数，不依赖项目上下文（无 DB、无请求对象）
- **类型定义**集中放在 `types.ts` 或按模块拆分 `types/` 目录

### 错误处理

- **API 层统一使用 `fail(msg, code)`** 返回错误响应，不直接 `throw Error`
- **service 层内部使用 `throw AppError(code, message)`**，由全局错误中间件捕获并调用 `fail()`
- 错误信息使用中文，面向终端用户；调试信息写入 `operation_logs`

### Git 规范

- **分支命名**：`feature/xxx`（功能）、`fix/xxx`（修复）、`refactor/xxx`（重构）、`chore/xxx`（工程）
- **提交格式**：`type(scope): message`，如 `feat(settlement): add challenge retry mechanism`、`fix(bill): correct amount calculation overflow`
- **type 可选**：`feat` / `fix` / `refactor` / `chore` / `docs` / `test` / `style` / `perf`

### 注释规范

- **导出函数必须加 JSDoc**：说明参数、返回值、抛出异常
- **禁止保留注释掉的代码**：不需要的代码直接删除，历史记录在 git
- **复杂逻辑需写行内注释**：说明"为什么这么做"而非"做了什么"
