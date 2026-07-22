export function hasMinRole(userRole: string, minRole: string): boolean {
  const hierarchy: Record<string, number> = {
    "系统管理员": 3,
    "寝室长": 2,
    "普通成员": 1,
  }
  return (hierarchy[userRole] ?? 0) >= (hierarchy[minRole] ?? 0)
}
