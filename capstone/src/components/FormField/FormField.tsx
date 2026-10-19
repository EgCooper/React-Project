import styles from './FormField.module.css'

interface FormFieldProps {
  id: string
  label: string
  type: 'email' | 'password'
  autoComplete: string
  value: string
  onChange: (value: string) => void
  error?: string
  hint?: string
}

function FormField({ id, label, type, autoComplete, value, onChange, error, hint }: FormFieldProps) {
  const hintId = `${id}-hint`
  const errorId = `${id}-error`
  // Conecta el campo con su pista y su error (si existen) para que el lector de pantalla los lea
  const describedBy = [hint && hintId, error && errorId].filter(Boolean).join(' ') || undefined

  return (
    <div className={styles.field}>
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        className={styles.input}
        type={type}
        autoComplete={autoComplete}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
      />
      {hint && (
        <p id={hintId} className={styles.hint}>
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className={styles.error}>
          {error}
        </p>
      )}
    </div>
  )
}

export default FormField
