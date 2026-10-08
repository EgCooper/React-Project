import { useEffect, useRef, useState, type SubmitEvent } from 'react'
import { Link, Navigate, useLocation } from 'react-router'
import { getAuthErrorMessage, signIn } from '../api/auth.ts'
import FormField from '../components/FormField.tsx'
import { useAuth } from '../hooks/useAuth.ts'
import { validateLogin, type LoginErrors } from '../utils/validation.ts'
import styles from './AuthForm.module.css'

// Pagina a la que volver tras iniciar sesion. Solo rutas internas ("/..."), nunca otra web ("//sitio.com")
function getRedirectPath(state: unknown): string {
  if (
    typeof state === 'object' &&
    state !== null &&
    'from' in state &&
    typeof state.from === 'string' &&
    state.from.startsWith('/') &&
    !state.from.startsWith('//')
  ) {
    return state.from
  }

  return '/'
}

function Login() {
  const { user, isLoading } = useAuth()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<LoginErrors>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)

  // Tras un envio con errores, lleva el foco al primer campo invalido
  useEffect(() => {
    formRef.current?.querySelector<HTMLInputElement>('[aria-invalid="true"]')?.focus()
  }, [errors])

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    setServerError(null)

    const validationErrors = validateLogin({ email, password })
    setErrors(validationErrors)

    if (Object.keys(validationErrors).length > 0) {
      return
    }

    setIsSubmitting(true)

    try {
      await signIn(email.trim(), password)
    } catch (error) {
      setServerError(getAuthErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return null
  }

  // Al iniciar sesion, AuthProvider actualiza `user` y volvemos a la pagina de origen
  if (user) {
    return <Navigate to={getRedirectPath(location.state)} replace />
  }

  return (
    <>
      <h1>Iniciar sesión</h1>

      <form ref={formRef} className={styles.form} onSubmit={handleSubmit} noValidate>
        <FormField
          id="login-email"
          label="Correo electrónico"
          type="email"
          autoComplete="email"
          value={email}
          onChange={setEmail}
          error={errors.email}
        />
        <FormField
          id="login-password"
          label="Contraseña"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={setPassword}
          error={errors.password}
        />

        {serverError && (
          <p role="alert" className={styles.error}>
            {serverError}
          </p>
        )}

        <button type="submit" className={styles.submit} disabled={isSubmitting}>
          {isSubmitting ? 'Iniciando sesión...' : 'Iniciar sesión'}
        </button>
      </form>

      <p>
        ¿No tienes cuenta? <Link to="/registro">Crea una</Link>
      </p>
    </>
  )
}

export default Login
