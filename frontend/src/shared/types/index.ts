// User types
export interface User {
  id: string;
  email: string;
  full_name: string;
  balance: string;
  bot_type: 'none' | 'basic' | 'premium' | 'specialist';
  is_verified: boolean;
  is_staff?: boolean; // Added for admin check
  is_superuser?: boolean; // Added for superuser check
  created_at: string;
  last_login: string | null;
}

// Auth types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  message: string;
  user: User;
  access: string;
  refresh: string;
}

// API Error type
export interface ApiError {
  error: boolean;
  message: string;
  details?: Record<string, any>;
}

// Auth State
export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}
