import type { AppEnv } from "../types"

export function createWechatAPI(env: AppEnv) {
  return {
    async code2Session(code: string) {
      const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${env.WECHAT_APPID}&secret=${env.WECHAT_SECRET}&js_code=${code}&grant_type=authorization_code`
      const res = await fetch(url)
      return res.json() as Promise<{ openid?: string; session_key?: string; errcode?: number; errmsg?: string }>
    },
  }
}
