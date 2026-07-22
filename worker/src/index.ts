import app from "./router"
import type { AppEnv } from "./types"

export default {
  fetch: app.fetch,

  async scheduled(event: ScheduledEvent, _env: AppEnv) {
    switch (event.cron) {
      case "0 0 L * *":
        // 月度账单生成
        console.log("monthly bill generation triggered")
        break
      case "0 0 * * *":
        // 到期提醒 + 质疑超时清扫
        console.log("daily settlement reminder + challenge timeout check triggered")
        break
    }
  },
}
