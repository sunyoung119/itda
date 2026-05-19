import type { Role } from '../types'

/** 직군 뱃지 — 접수(파랑)/관제(초록)/보고(보라). 목록·상세에서 공용 사용 */
const STYLE: Record<Role, string> = {
  접수: 'bg-blue-soft text-[#1E40AF]',
  관제: 'bg-green-soft text-[#166534]',
  보고: 'bg-purple-soft text-[#5B21B6]',
}

export function RoleBadge({ role }: { role: Role }) {
  return (
    <span
      className={`flex-shrink-0 rounded px-1.5 py-0.5 text-[9px] font-extrabold ${STYLE[role]}`}
    >
      {role}
    </span>
  )
}
