import { useEffect, useRef, useState, type SubmitEvent } from 'react'
import { Link, Navigate, useLocation } from 'react-router'
import { getAuthErrorMessage, signIn } from '../api/auth.ts'
import ErrorMessage from '../components/ErrorMessage.tsx'
import FormField from '../components/FormField.tsx'
import PageTitle from '../components/PageTitle.tsx'
import { useAuth } from '../hooks/useAuth.ts'
import buttonStyles from '../styles/buttons.module.css'
import { getRedirectPath } from '../utils/url.ts'
import { validateLogin, type LoginErrors } from '../utils/validation.ts'
import styles from './AuthForm.module.css'

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
    <div className={styles.card}>
      <PageTitle title="Iniciar sesión" />
      <h1 className={styles.title}>Iniciar sesión</h1>

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

        {serverError && <ErrorMessage message={serverError} />}

        <button
          type="submit"
          className={`${buttonStyles.primary} ${styles.submit}`}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Iniciando sesión...' : 'Iniciar sesión'}
        </button>
      </form>

      <p className={styles.switch}>
        ¿No tienes cuenta? <Link to="/registro">Crea una</Link>
      </p>
    </div>
  )
}

export default Login
