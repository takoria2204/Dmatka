/**
 * Shared code between client and server
 * Useful to share types between client and server
 * and/or small pure JS functions that can be used on both client and server
 */

/**
 * Example response type for /api/demo
 */
export interface DemoResponse {
  message: string;
}

// Authentication types
export interface User {
  id: string;
  fullName: string;
  email: string;
  mobile: string;
  createdAt?: string;
}

export interface LoginRequest {
  mobile: string;
  password: string;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  mobile: string;
  password: string;
  referralCode?: string;
}

export interface AuthResponse {
  message: string;
  token: string;
  user: User;
}

export interface ForgotPasswordRequest {
  mobile: string;
}

export interface ApiError {
  message: string;
}
