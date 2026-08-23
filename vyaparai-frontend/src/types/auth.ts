export interface AuthUser {
  id: string
  businessId: string
  businessName: string
  ownerName: string
  email: string
  mobileNumber: string
  role: string   // ← add this
}

export interface LoginRequest {
  email: string
  password: string
}

export interface SignupRequest {
  businessName: string
  ownerName: string
  email: string
  mobileNumber: string
  password: string
  confirmPassword: string
}

export interface AuthResponse {
  token: string
  user: AuthUser
}

export interface ApiEnvelope<T> {
  success: boolean
  message?: string
  data: T
}
