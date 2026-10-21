export const PASSWORD_MIN_LENGTH = 8

// Formato basico: algo@algo.algo, sin espacios. La validacion definitiva la hace el servidor
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export interface RegisterValues {
  email: string
  password: string
  confirmPassword: string
}

export type RegisterErrors = Partial<Record<keyof RegisterValues, string>>

export function validateEmail(email: string): string | null {
  if (!email.trim()) {
    return 'Enter your email.'
  }

  if (!EMAIL_PATTERN.test(email.trim())) {
    return 'Enter a valid email address.'
  }

  return null
}

// Mismas reglas que configuramos en Supabase: 8 caracteres, minuscula, mayuscula y digito
export function validatePassword(password: string): string | null {
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `Password must be at least ${PASSWORD_MIN_LENGTH} characters long.`
  }

  if (!/[a-z]/.test(password)) {
    return 'Password must include a lowercase letter.'
  }

  if (!/[A-Z]/.test(password)) {
    return 'Password must include an uppercase letter.'
  }

  if (!/[0-9]/.test(password)) {
    return 'Password must include a number.'
  }

  return null
}

export function validateRegister(values: RegisterValues): RegisterErrors {
  const errors: RegisterErrors = {}

  const emailError = validateEmail(values.email)
  if (emailError) {
    errors.email = emailError
  }

  const passwordError = validatePassword(values.password)
  if (passwordError) {
    errors.password = passwordError
  }

  if (values.confirmPassword !== values.password) {
    errors.confirmPassword = 'Passwords do not match.'
  }

  return errors
}

export interface LoginValues {
  email: string
  password: string
}

export type LoginErrors = Partial<Record<keyof LoginValues, string>>

// Al iniciar sesion solo se exige que haya contrasena: las reglas de formato son para crearla, no para usarla
export function validateLogin(values: LoginValues): LoginErrors {
  const errors: LoginErrors = {}

  const emailError = validateEmail(values.email)
  if (emailError) {
    errors.email = emailError
  }

  if (!values.password) {
    errors.password = 'Enter your password.'
  }

  return errors
}
