import app from "./router"
import type { AppEnv } from "./types"

async function handleMonthlyBills(env: AppEnv) {
  // Query enabled bill templates
  const templates = await env.DB.prepare(
    "SELECT bt.*, h.creator_id FROM bill_templates bt JOIN houses h ON h.id = bt.house_id WHERE bt.enabled = 1"
  ).all<{
    id: number; house_id: number; title: string; amount: number
    category_id: number | null; split_type: string; creator_id: number
  }>()

  for (const tpl of templates.results) {
    // Get active members
    const members = await env.DB.prepare(
      "SELECT user_id FROM members WHERE house_id = ? AND status = 'active'"
    ).bind(tpl.house_id).all<{ user_id: number }>()
    if (!members.results.length) continue

    const now = new Date()
    const billDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`
    const cnt = members.results.length
    const splitAmount = Math.round(tpl.amount / cnt)
    const remainder = tpl.amount - splitAmount * cnt

    // Create bill
    const billResult = await env.DB.prepare(`
      INSERT INTO bills (house_id, creator_id, title, total_amount, category_id, bill_date, status)
      VALUES (?, ?, ?, ?, ?, ?, '已确认')
    `).bind(tpl.house_id, tpl.creator_id, tpl.title, tpl.amount, tpl.category_id, billDate).run()
    const billId = Number(billResult.meta.last_row_id)

    // Create splits (均摊 with remainder on last member)
    for (let i = 0; i < members.results.length; i++) {
      const amt = splitAmount + (i === members.results.length - 1 ? remainder : 0)
      await env.DB.prepare(
        "INSERT INTO splits (bill_id, user_id, amount, split_type) VALUES (?, ?, ?, '均摊')"
      ).bind(billId, members.results[i].user_id, amt).run()
    }

    // Update cron task
    await env.DB.prepare(`
      INSERT INTO cron_tasks (house_id, task_type, last_run_at, next_run_at, status)
      VALUES (?, 'monthly_bill', datetime('now'), datetime('now', '+1 month'), 'success')
    `).bind(tpl.house_id).run()
  }
}

async function handleDailyTasks(env: AppEnv) {
  // Challenge timeout sweep: find open challenges past timeout
  const expired = await env.DB.prepare(`
    SELECT sc.id, sc.item_id, s.house_id FROM settlement_challenges sc
    JOIN settlement_items si ON si.id = sc.item_id
    JOIN settlements s ON s.id = si.settlement_id
    WHERE sc.status = 'open' AND sc.timeout_at <= datetime('now')
  `).all<{ id: number; item_id: number; house_id: number }>()

  for (const ch of expired.results) {
    // Timeout → auto-resolve, keep original_amount_snapshot as final
    await env.DB.prepare(`
      UPDATE settlement_challenges SET status = 'timeout', handled_at = datetime('now')
      WHERE id = ?
    `).bind(ch.id).run()

    await env.DB.prepare(`
      UPDATE settlement_items SET status = 'confirmed', version = version + 1, updated_at = datetime('now')
      WHERE id = ? AND status = 'disputed'
    `).bind(ch.item_id).run()

    await env.DB.prepare(`
      INSERT INTO operation_logs (house_id, operator_id, action, target_table, target_id)
      VALUES (?, 0, 'challenge_timeout', 'settlement_challenges', ?)
    `).bind(ch.house_id, ch.id).run()
  }
}

export default {
  fetch: app.fetch,

  async scheduled(event: ScheduledEvent, env: AppEnv) {
    switch (event.cron) {
      case "0 0 L * *":
        await handleMonthlyBills(env)
        break
      case "0 0 * * *":
        await handleDailyTasks(env)
        break
    }
  },
}
