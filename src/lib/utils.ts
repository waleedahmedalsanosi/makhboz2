import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('ar-SD', {
    style: 'currency',
    currency: 'SDG'
  }).format(price)
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('ar-SD', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date))
}
