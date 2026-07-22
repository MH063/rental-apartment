export function createLogger() {
  return {
    log(action: string, data: Record<string, unknown>) {
      console.log(JSON.stringify({ action, data }))
    },
  }
}
