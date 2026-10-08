const PERSIAN_DIGITS = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"]

export function toPersianDigits(value: string | number): string {
  const str = String(value)
  return str.replace(/\d/g, (d) => PERSIAN_DIGITS[parseInt(d, 10)] ?? d)
}

export function formatPrice(price: number): string {
  const formatted = new Intl.NumberFormat("fa-IR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price)
  return `${toPersianDigits(formatted)} تومان`
}

export function formatNumber(value: number): string {
  return toPersianDigits(new Intl.NumberFormat("fa-IR").format(value))
}

export function formatDate(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date
  return new Intl.DateTimeFormat("fa-IR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(d)
}

export function calculateDiscountPercentage(original: number, sale: number): number {
  if (original <= 0) return 0
  return Math.round(((original - sale) / original) * 100)
}
