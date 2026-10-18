import type { ReadingEntry } from '../types/library.ts'
import { canBorrow, findActiveLoan, getBookAvailability, type BookAvailability } from '../utils/availability.ts'
import { useAvailability } from './useAvailability.ts'
import { useLibrary } from './useLibrary.ts'

export interface WishlistItem {
  entry: ReadingEntry
  // null = todavía no se sabe
  availability: BookAvailability | null
}

// Lista de deseos con la disponibilidad de cada libro (requisito 5: avisar cuando estén disponibles)
export function useWishlist() {
  const { readingList, loans } = useLibrary()
  const wishlist = readingList.filter((entry) => entry.status === 'wishlist')
  const { byWorkId } = useAvailability(wishlist.map((entry) => entry.workId))

  const items: WishlistItem[] = wishlist.map((entry) => ({
    entry,
    availability: byWorkId ? getBookAvailability(byWorkId.get(entry.workId), findActiveLoan(loans, entry.workId)) : null,
  }))

  const availableCount = items.filter((item) => item.availability && canBorrow(item.availability)).length

  return { items, availableCount }
}
