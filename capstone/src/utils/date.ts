// "October 27, 2026", en la zona horaria de quien usa la app
const DATE_FORMAT = new Intl.DateTimeFormat('en-US', { day: 'numeric', month: 'long', year: 'numeric' })

export function formatDate(isoDate: string): string {
  return DATE_FORMAT.format(new Date(isoDate))
}

export function isOverdue(dueAt: string, now: Date = new Date()): boolean {
  return new Date(dueAt).getTime() < now.getTime()
}
