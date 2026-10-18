import { useState } from 'react'
import { getCoverUrl } from '../api/openLibrary.ts'

interface BookCoverProps {
  coverId: number | null
  size: 'S' | 'M' | 'L'
  // Texto alternativo; "" cuando el título ya está al lado (la portada es decorativa)
  alt: string
  className: string
  // Clase extra para el recuadro "Sin portada"
  emptyClassName: string
  loading?: 'lazy' | 'eager'
}

// Portada de Open Library, o un recuadro "Sin portada" si el libro no tiene o la imagen no existe
function BookCover({ coverId, size, alt, className, emptyClassName, loading }: BookCoverProps) {
  // Se guarda qué portada falló: si cambia el libro, la nueva se vuelve a intentar sin necesidad de un efecto
  const [failedCoverId, setFailedCoverId] = useState<number | null>(null)

  if (coverId === null || failedCoverId === coverId) {
    return (
      <div className={`${className} ${emptyClassName}`} aria-hidden="true">
        Sin portada
      </div>
    )
  }

  return (
    <img
      className={className}
      src={getCoverUrl(coverId, size)}
      alt={alt}
      loading={loading}
      onError={() => setFailedCoverId(coverId)}
    />
  )
}

export default BookCover
