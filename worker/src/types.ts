import type { D1Database, KVNamespace, R2Bucket } from "@cloudflare/workers-types"

export interface AppEnv {
  DB: D1Database
  KV: KVNamespace
  R2: R2Bucket
  WECHAT_APPID: string
  WECHAT_SECRET: string
  JWT_SECRET: string
  ENVIRONMENT: string
}

export interface UserPayload {
  userId: number
  openid: string
}

export type Bindings = AppEnv

export interface AuthVariables {
  user: UserPayload
}
