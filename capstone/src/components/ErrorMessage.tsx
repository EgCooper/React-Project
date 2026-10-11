import buttonStyles from '../styles/buttons.module.css'
import styles from './ErrorMessage.module.css'

interface ErrorMessageProps {
  message: string
  // Sin onRetry no hay botón (ej. el error del servidor en un formulario)
  onRetry?: () => void
}

function ErrorMessage({ message, onRetry }: ErrorMessageProps) {
  return (
    <div className={styles.box}>
      {/* role="alert" solo en el texto: si envolviera al botón, el lector también diría "Reintentar" */}
      <p role="alert" className={styles.message}>
        {message}
      </p>
      {onRetry && (
        <button type="button" className={buttonStyles.primary} onClick={onRetry}>
          Reintentar
        </button>
      )}
    </div>
  )
}

export default ErrorMessage
