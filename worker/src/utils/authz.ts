import type { D1Database } from "@cloudflare/workers-types"

/**
 * 校验当前用户是否为指定合租屋的活跃成员
 * 用于防止 IDOR 攻击（用户通过修改 URL 访问其他合租屋的数据）
 *
 * @param db D1 数据库实例
 * @param houseId 合租屋 ID
 * @param userId 用户 ID
 * @returns 成员记录（含 role），若非成员则返回 null
 */
export async function requireHouseMember(
  db: D1Database,
  houseId: number,
  userId: number
): Promise<{ id: number; role: string } | null> {
  const member = await db
    .prepare(
      "SELECT id, role FROM members WHERE house_id = ? AND user_id = ? AND status = 'active'"
    )
    .bind(houseId, userId)
    .first<{ id: number; role: string }>()
  return member
}

/**
 * 校验当前用户是否为指定合租屋的寝室长及以上角色
 *
 * @param db D1 数据库实例
 * @param houseId 合租屋 ID
 * @param userId 用户 ID
 * @returns 成员记录（含 role），若非寝室长则返回 null
 */
export async function requireHouseLeader(
  db: D1Database,
  houseId: number,
  userId: number
): Promise<{ id: number; role: string } | null> {
  const member = await requireHouseMember(db, houseId, userId)
  if (!member) return null
  if (member.role !== "寝室长" && member.role !== "系统管理员") return null
  return member
}
