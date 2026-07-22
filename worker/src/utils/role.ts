export type Role = "系统管理员" | "寝室长" | "普通成员"

export const ROLE_HIERARCHY: Record<Role, number> = {
  "系统管理员": 3,
  "寝室长": 2,
  "普通成员": 1,
}

export function hasMinRole(userRole: string, minRole: Role): boolean {
  const user = ROLE_HIERARCHY[userRole as Role] ?? 0
  const required = ROLE_HIERARCHY[minRole]
  return user >= required
}
