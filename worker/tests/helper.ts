import initSqlJs, { Database as SqlJsDb } from "sql.js"

// --- SQLite initialisation (final schema after all migrations) ---

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY,
  wechat_openid TEXT NOT NULL UNIQUE,
  nickname TEXT NOT NULL DEFAULT '',
  avatar TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS houses (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT NOT NULL DEFAULT '',
  invite_code TEXT NOT NULL,
  invite_code_expires_at TEXT NOT NULL,
  creator_id INTEGER NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS members (
  id INTEGER PRIMARY KEY,
  house_id INTEGER NOT NULL REFERENCES houses(id),
  user_id INTEGER NOT NULL REFERENCES users(id),
  role TEXT NOT NULL DEFAULT '普通成员' CHECK(role IN ('系统管理员', '寝室长', '普通成员')),
  joined_at TEXT NOT NULL DEFAULT (datetime('now')),
  left_at TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'left')),
  UNIQUE(house_id, user_id)
);
CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY,
  house_id INTEGER NOT NULL REFERENCES houses(id),
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS bills (
  id INTEGER PRIMARY KEY,
  house_id INTEGER NOT NULL REFERENCES houses(id),
  creator_id INTEGER NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  total_amount INTEGER NOT NULL,
  category_id INTEGER REFERENCES categories(id),
  bill_date TEXT NOT NULL,
  receipt_image TEXT,
  note TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT '草稿' CHECK(status IN ('草稿', '已确认', '争议中', '再次确认', '待支付', '已支付')),
  version INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS splits (
  id INTEGER PRIMARY KEY,
  bill_id INTEGER NOT NULL REFERENCES bills(id),
  user_id INTEGER NOT NULL REFERENCES users(id),
  amount INTEGER NOT NULL,
  split_type TEXT NOT NULL CHECK(split_type IN ('均摊', '权重', '天数', '用量', '面积', '阶梯')),
  weight REAL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS settlements (
  id INTEGER PRIMARY KEY,
  house_id INTEGER NOT NULL REFERENCES houses(id),
  title TEXT NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'closed')),
  creator_id INTEGER NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS settlement_items (
  id INTEGER PRIMARY KEY,
  settlement_id INTEGER NOT NULL REFERENCES settlements(id),
  payer_id INTEGER NOT NULL REFERENCES users(id),
  payee_id INTEGER NOT NULL REFERENCES users(id),
  original_amount INTEGER NOT NULL,
  final_amount INTEGER NOT NULL,
  paid_amount INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'confirmed', 'transferred', 'disputed')),
  version INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS settlement_challenges (
  id INTEGER PRIMARY KEY,
  item_id INTEGER NOT NULL REFERENCES settlement_items(id),
  challenger_id INTEGER NOT NULL REFERENCES users(id),
  round INTEGER NOT NULL DEFAULT 1,
  reason TEXT NOT NULL,
  challenge_amount INTEGER,
  requested_amount INTEGER,
  original_amount_snapshot INTEGER NOT NULL,
  adjusted_amount INTEGER,
  timeout_at TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open', 'resolved', 'rejected', 'timeout')),
  handler_id INTEGER REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  handled_at TEXT
);
CREATE TABLE IF NOT EXISTS bill_templates (
  id INTEGER PRIMARY KEY,
  house_id INTEGER NOT NULL REFERENCES houses(id),
  title TEXT NOT NULL,
  amount INTEGER NOT NULL,
  category_id INTEGER REFERENCES categories(id),
  split_type TEXT NOT NULL DEFAULT '均摊',
  cron_expr TEXT NOT NULL,
  enabled INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS cron_tasks (
  id INTEGER PRIMARY KEY,
  house_id INTEGER NOT NULL REFERENCES houses(id),
  task_type TEXT NOT NULL CHECK(task_type IN ('monthly_bill', 'settlement_reminder')),
  last_run_at TEXT,
  next_run_at TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'running', 'success', 'failed'))
);
CREATE TABLE IF NOT EXISTS operation_logs (
  id INTEGER PRIMARY KEY,
  house_id INTEGER NOT NULL REFERENCES houses(id),
  operator_id INTEGER NOT NULL REFERENCES users(id),
  action TEXT NOT NULL,
  target_table TEXT NOT NULL,
  target_id INTEGER NOT NULL,
  before_snapshot TEXT,
  after_snapshot TEXT,
  snapshot_version INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS partial_payments (
  id INTEGER PRIMARY KEY,
  item_id INTEGER NOT NULL REFERENCES settlement_items(id),
  payer_id INTEGER NOT NULL REFERENCES users(id),
  amount INTEGER NOT NULL,
  voucher TEXT,
  note TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS payment_methods (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  type TEXT NOT NULL CHECK(type IN ('支付宝', '微信', '银行卡')),
  account TEXT NOT NULL,
  qr_code TEXT,
  is_default INTEGER NOT NULL DEFAULT 0
);
`

const INDEXES = `
CREATE INDEX IF NOT EXISTS idx_members_house ON members(house_id);
CREATE INDEX IF NOT EXISTS idx_members_user ON members(user_id);
CREATE INDEX IF NOT EXISTS idx_bills_house ON bills(house_id);
CREATE INDEX IF NOT EXISTS idx_bills_creator ON bills(creator_id);
CREATE INDEX IF NOT EXISTS idx_bills_status ON bills(status);
CREATE INDEX IF NOT EXISTS idx_bills_date ON bills(bill_date);
CREATE INDEX IF NOT EXISTS idx_splits_bill ON splits(bill_id);
CREATE INDEX IF NOT EXISTS idx_splits_user ON splits(user_id);
CREATE INDEX IF NOT EXISTS idx_settlements_house ON settlements(house_id);
CREATE INDEX IF NOT EXISTS idx_settlement_items_settlement ON settlement_items(settlement_id);
CREATE INDEX IF NOT EXISTS idx_settlement_items_payer ON settlement_items(payer_id);
CREATE INDEX IF NOT EXISTS idx_settlement_items_payee ON settlement_items(payee_id);
CREATE INDEX IF NOT EXISTS idx_settlement_challenges_item ON settlement_challenges(item_id);
CREATE INDEX IF NOT EXISTS idx_operation_logs_house ON operation_logs(house_id);
CREATE INDEX IF NOT EXISTS idx_operation_logs_target ON operation_logs(target_table, target_id);
CREATE INDEX IF NOT EXISTS idx_cron_tasks_house ON cron_tasks(house_id);
CREATE INDEX IF NOT EXISTS idx_partial_payments_item ON partial_payments(item_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_user ON payment_methods(user_id);
`

let _db: SqlJsDb | null = null
let _dbInit: Promise<SqlJsDb> | null = null

async function getDb(): Promise<SqlJsDb> {
  if (_db) return _db
  if (_dbInit) return _dbInit
  _dbInit = (async () => {
    const SQL = await initSqlJs()
    const db = new SQL.Database()
    db.run("PRAGMA foreign_keys = ON")
    for (const part of SCHEMA.split(";")) {
      const s = part.trim()
      if (s) db.run(s)
    }
    for (const part of INDEXES.split(";")) {
      const s = part.trim()
      if (s) db.run(s)
    }
    _db = db
    return db
  })()
  return _dbInit
}

// --- D1 mock (wraps sql.js with D1-compatible API) ---

function createD1(db: SqlJsDb) {
  function exec(sql: string, params: unknown[]) {
    const normalized = sql.replace(/\?/g, () => {
      const v = params.shift()
      if (v === null || v === undefined) return "NULL"
      if (typeof v === "number") return String(v)
      return `'${String(v).replace(/'/g, "''")}'`
    })

    const isSelect = /^\s*SELECT/i.test(normalized)
    const isInsert = /^\s*INSERT/i.test(normalized)

    if (isSelect) {
      const rows: Record<string, unknown>[] = []
      try {
        const stmt = db.prepare(normalized)
        if (stmt) {
          while (stmt.step()) rows.push(stmt.getAsObject())
          stmt.free()
        }
      } catch { /* empty result set for invalid SQL */ }
      return { results: rows, changes: 0, lastRowId: "0" }
    }

    db.run(normalized)
    const changes = db.getRowsModified()
    let lastRowId = "0"
    if (isInsert) {
      const r = db.exec("SELECT last_insert_rowid() AS id")
      if (r.length && r[0].values.length) lastRowId = String(r[0].values[0][0])
    }
    return { results: [], changes, lastRowId }
  }

  function makeStmt(sql: string, p: unknown[]) {
    return {
      async all<T>() {
        const r = exec(sql, p)
        return { results: r.results as T[], success: true, meta: { changes: r.changes, last_row_id: r.lastRowId } }
      },
      async first<T>() {
        const r = exec(sql, p)
        return (r.results[0] as T) ?? null
      },
      async run() {
        const r = exec(sql, p)
        return { meta: { changes: r.changes, last_row_id: r.lastRowId } }
      },
    }
  }

  return {
    prepare(sql: string) {
      return {
        ...makeStmt(sql, []),
        bind(...params: unknown[]) {
          return makeStmt(sql, [...params])
        },
      }
    },
  }
}

// --- Test app factory (fresh per call) ---

export async function createTestApp() {
  const db = await getDb()

  // Reset all tables (disable FK checks to avoid order issues)
  db.run("PRAGMA foreign_keys = OFF")
  const tables = db.exec(
    "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
  )
  for (const t of tables) {
    for (const row of t.values) {
      db.run(`DELETE FROM "${row[0]}"`)
    }
  }
  db.run("PRAGMA foreign_keys = ON")

  // Seed test user (user 1 = authenticated user)
  db.run("INSERT INTO users (id, wechat_openid, nickname) VALUES (1, 'test_openid', 'TestUser')")

  const env: Record<string, unknown> = {
    DB: createD1(db),
    KV: { get: async () => null, put: async () => {}, delete: async () => {} },
    R2: {},
    WECHAT_APPID: "test",
    WECHAT_SECRET: "test",
    JWT_SECRET: "test-secret",
    ENVIRONMENT: "test",
  }

  const { createRouter } = await import("../src/router")
  const app = createRouter({ ENVIRONMENT: "test" })

  const token = await (async () => {
    const { sign } = await import("../src/utils/jwt")
    return sign({ userId: 1, iat: Math.floor(Date.now() / 1000) }, "test-secret", 86400)
  })()

  // Bound request function (reuses same app+env for multi-step tests)
  async function authed(url: string, options: RequestInit & { headers?: Record<string, string>; asUser?: number } = {}) {
    const { asUser, ...rest } = options
    const uid = asUser ?? 1
    const t = uid === 1 ? token : await (async () => {
      const { sign } = await import("../src/utils/jwt")
      return sign({ userId: uid, iat: Math.floor(Date.now() / 1000) }, "test-secret", 86400)
    })()
    const req = new Request(`http://localhost${url}`, {
      ...rest,
      headers: { ...rest.headers, Authorization: `Bearer ${t}`, "Content-Type": "application/json" },
    })
    return app.fetch(req, env)
  }

  // Direct DB execution helper for test data seeding
  const D1 = env.DB as unknown as { prepare: (sql: string) => { bind: (...params: unknown[]) => { run: () => Promise<unknown>; first: () => Promise<unknown>; all: () => Promise<{ results: unknown[] }> } } }
  async function sql(sql: string, ...params: unknown[]) {
    return D1.prepare(sql).bind(...params).run()
  }

  return { app, env, authed, sql }
}

export async function rawRequest(url: string, options: RequestInit & { headers?: Record<string, string> } = {}) {
  const { app, env } = await createTestApp()
  const req = new Request(`http://localhost${url}`, {
    ...options,
    headers: { ...options.headers, "Content-Type": "application/json" },
  })
  return app.fetch(req, env)
}
