// Datos mínimos de un libro para prestarlo, reservarlo o guardarlo en la lista
export interface BookRef {
  id: string
  title: string
  coverId: number | null
}

export interface Loan {
  id: number
  workId: string
  title: string
  coverId: number | null
  // Fechas en formato ISO, tal como llegan de Supabase
  borrowedAt: string
  dueAt: string
  // null = el libro sigue prestado
  returnedAt: string | null
}

export interface Reservation {
  id: number
  workId: string
  title: string
  coverId: number | null
  createdAt: string
}

export type ReadingStatus = 'wishlist' | 'reading' | 'completed'

export interface ReadingEntry {
  workId: string
  title: string
  coverId: number | null
  status: ReadingStatus
}

// Solo llega para libros prestados o con fila de espera; si un libro no aparece, está disponible
export interface Availability {
  workId: string
  // Vencimiento del préstamo actual; null si ya se devolvió pero tiene fila
  dueAt: string | null
  queueLength: number
  // Tu lugar en la fila; null si no lo reservaste
  myQueuePosition: number | null
}
