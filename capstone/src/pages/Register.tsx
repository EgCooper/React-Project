import { useEffect, useRef, useState, type SubmitEvent } from 'react'
import { Link, Navigate } from 'react-router'
import { getAuthErrorMessage, signUp } from '../api/auth.ts'
import { useAuth } from '../hooks/useAuth.ts'
import { PASSWORD_MIN_LENGTH, validateRegister, type RegisterErrors } from '../utils/validation.ts'
import styles from './AuthForm.module.css'

function Register() {
  const { user, isLoading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [errors, setErrors] = useState<RegisterErrors>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)

  // Tras un envio con errores, lleva el foco al primer campo invalido (accesibilidad con teclado y lector de pantalla)
  useEffect(() => {
    formRef.current?.querySelector<HTMLInputElement>('[aria-invalid="true"]')?.focus()
  }, [errors])

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    setServerError(null)

    const validationErrors = validateRegister({ email, password, confirmPassword })
    setErrors(validationErrors)

    if (Object.keys(validationErrors).length > 0) {
      return
    }

    setIsSubmitting(true)

    try {
      // Con la confirmacion de correo desactivada, Supabase inicia la sesion al registrarse
      await signUp(email.trim(), password)
    } catch (error) {
      setServerError(getAuthErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return null
  }

  // Con sesion iniciada no tiene sentido registrarse; tambien redirige justo despues de un registro exitoso
  if (user) {
    return <Navigate to="/" replace />
  }

  return (
    <>
      <h1>Crear cuenta</h1>

      <form ref={formRef} className={styles.form} onSubmit={handleSubmit} noValidate>
        <div className={styles.field}>
          <label htmlFor="register-email">Correo electrónico</label>
          <input
            id="register-email"
            className={styles.input}
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? 'register-email-error' : undefined}
          />
          {errors.email && (
            <p id="register-email-error" className={styles.error}>
              {errors.email}
            </p>
          )}
        </div>

        <div className={styles.field}>
          <label htmlFor="register-password">Contraseña</label>
          <input
            id="register-password"
            className={styles.input}
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            aria-invalid={Boolean(errors.password)}
            aria-describedby={
              errors.password ? 'register-password-hint register-password-error' : 'register-password-hint'
            }
          />
          <p id="register-password-hint" className={styles.hint}>
            Mínimo {PASSWORD_MIN_LENGTH} caracteres, con una mayúscula, una minúscula y un número.
          </p>
          {errors.password && (
            <p id="register-password-error" className={styles.error}>
              {errors.password}
            </p>
          )}
        </div>

        <div className={styles.field}>
          <label htmlFor="register-confirm">Confirmar contraseña</label>
          <input
            id="register-confirm"
            className={styles.input}
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            aria-invalid={Boolean(errors.confirmPassword)}
            aria-describedby={errors.confirmPassword ? 'register-confirm-error' : undefined}
          />
          {errors.confirmPassword && (
            <p id="register-confirm-error" className={styles.error}>
              {errors.confirmPassword}
            </p>
          )}
        </div>

        {serverError && (
          <p role="alert" className={styles.error}>
            {serverError}
          </p>
        )}

        <button type="submit" className={styles.submit} disabled={isSubmitting}>
          {isSubmitting ? 'Creando cuenta...' : 'Crear cuenta'}
        </button>
      </form>

      <p>
        ¿Ya tienes cuenta? <Link to="/iniciar-sesion">Inicia sesión</Link>
      </p>
    </>
  )
}

export default Register
