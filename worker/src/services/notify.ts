export function createNotifier() {
  return {
    async send(openid: string, templateId: string) {
      console.log(`notify ${openid}: ${templateId}`)
    },
  }
}
