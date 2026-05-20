export interface User {
  id: string
  name: string
  email: string
  password?: string
  createdAt?: string 
}

export interface AuthResponse {
  user: Omit<User, 'password'>
  accessToken: string
  refreshToken: string
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  name: string
  email: string
  password: string
  confirmPassword: string
}