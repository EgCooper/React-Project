import { useEffect, useRef, useState, type SubmitEvent } from 'react'
import { Link, Navigate } from 'react-router'
import { getAuthErrorMessage, signUp } from '../../api/auth.ts'
import ErrorMessage from '../../components/ErrorMessage/ErrorMessage.tsx'
import FormField from '../../components/FormField/FormField.tsx'
import PageTitle from '../../components/PageTitle/PageTitle.tsx'
import { useAuth } from '../../hooks/useAuth.ts'
import buttonStyles from '../../styles/buttons.module.css'
import { PASSWORD_MIN_LENGTH, validateRegister, type RegisterErrors } from '../../utils/validation.ts'
import styles from '../../styles/authForm.module.css'

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
    <div className={styles.card}>
      <PageTitle title="Create account" />
      <h1 className={styles.title}>Create account</h1>

      <form ref={formRef} className={styles.form} onSubmit={handleSubmit} noValidate>
        <FormField
          id="register-email"
          label="Email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={setEmail}
          error={errors.email}
        />
        <FormField
          id="register-password"
          label="Password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={setPassword}
          error={errors.password}
          hint={`At least ${PASSWORD_MIN_LENGTH} characters, with an uppercase letter, a lowercase letter and a number.`}
        />
        <FormField
          id="register-confirm"
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={setConfirmPassword}
          error={errors.confirmPassword}
        />

        {serverError && <ErrorMessage message={serverError} />}

        <button
          type="submit"
          className={`${buttonStyles.primary} ${styles.submit}`}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Creating account...' : 'Create account'}
        </button>
      </form>

      <p className={styles.switch}>
        Already have an account? <Link to="/login">Sign in</Link>
      </p>
    </div>
  )
}

export default Register
