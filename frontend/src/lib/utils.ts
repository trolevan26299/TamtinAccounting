import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatVND(value: number): string {
  return new Intl.NumberFormat('vi-VN').format(value)
}

export function formatDate(isoDate: string): string {
  if (!isoDate) return ''
  const d = new Date(isoDate)
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
}

export function getTrangThai(tthai: number): string {
  const map: Record<number, string> = {
    1: 'Hợp lệ', 2: 'Đã hủy', 3: 'Có điều chỉnh',
    4: 'Bị điều chỉnh', 5: 'Đã thay thế', 6: 'Bị thay thế',
  }
  return map[tthai] || `Code ${tthai}`
}
