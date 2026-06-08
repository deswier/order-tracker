import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(amount: number): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(amount)
}

/** Срок хранения заказа в пункте выдачи (дней) */
export const STORAGE_PERIOD_DAYS = 14

/** Дата, до которой нужно забрать заказ: дата доставки + срок хранения */
export function getPickupDeadline(deliveryDate: string): Date {
  const date = new Date(deliveryDate)
  date.setDate(date.getDate() + STORAGE_PERIOD_DAYS)
  return date
}

/** Сколько полных дней осталось до даты (по календарным дням, время суток не учитывается) */
export function daysUntil(date: Date): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(date)
  target.setHours(0, 0, 0, 0)
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

/** Склонение слова "день" по числу: 1 день, 2 дня, 5 дней */
function pluralDays(n: number): string {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return 'день'
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'дня'
  return 'дней'
}

/** Текст о сроке хранения для статуса "Ожидает получения": сколько осталось до конца хранения */
export function formatPickupCountdown(daysLeft: number): string {
  if (daysLeft < 0) return `просрочено на ${-daysLeft} ${pluralDays(-daysLeft)}`
  if (daysLeft === 0) return 'последний день'
  return `осталось ${daysLeft} ${pluralDays(daysLeft)}`
}
