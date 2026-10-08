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
    return 'Escribe tu correo.'
  }

  if (!EMAIL_PATTERN.test(email.trim())) {
    return 'El correo no tiene un formato válido.'
  }

  return null
}

// Mismas reglas que configuramos en Supabase: 8 caracteres, minuscula, mayuscula y digito
export function validatePassword(password: string): string | null {
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `La contraseña debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres.`
  }

  if (!/[a-z]/.test(password)) {
    return 'La contraseña debe incluir una letra minúscula.'
  }

  if (!/[A-Z]/.test(password)) {
    return 'La contraseña debe incluir una letra mayúscula.'
  }

  if (!/[0-9]/.test(password)) {
    return 'La contraseña debe incluir un número.'
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
    errors.confirmPassword = 'Las contraseñas no coinciden.'
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
    errors.password = 'Escribe tu contraseña.'
  }

  return errors
}
