import { config } from '../config';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  code?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface User {
  id: string;
  email: string;
  role: string;
  cbid: string;
}

export interface UserProfile {
  id: string;
  time_zone?: string;
  created_at: string;
  auth_user_id: string;
  cbid: string;
  get_timezone(): string;
  get_full_name(): string;
  get_email(): string;
  get_phone(): string;
}

export interface Thread {
  cbId: string;
  ownerId: string;
  createdAt: string;
}

class ApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = config.backendApiUrl;
  }

  async post<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      const result = await response.json();
      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
        code: 'NETWORK_ERROR'
      };
    }
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      console.log(`API GET request to: ${this.baseUrl}${endpoint}`);
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      console.log(`API response status: ${response.status}`);
      const result = await response.json();
      console.log('API response data:', result);
      return result;
    } catch (error) {
      console.error('API request error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
        code: 'NETWORK_ERROR'
      };
    }
  }

  // Authentication methods
  async login(credentials: LoginRequest): Promise<ApiResponse<User>> {
    return this.post<User>('/login', credentials);
  }

  async signup(userData: SignupRequest): Promise<ApiResponse<User>> {
    return this.post<User>('/login/signup', userData);
  }

  // Profile methods
  async getUserProfile(cbid: string): Promise<ApiResponse<UserProfile>> {
    return this.get<UserProfile>(`/profile/${cbid}`);
  }

  // QuickBooks methods
  async initiateQuickBooksAuth(cbid: string): Promise<ApiResponse<{ auth_url: string }>> {
    return this.get<{ auth_url: string }>(`/quickbooks/login?cbid=${cbid}`);
  }

  async getQuickBooksProfile(cbid: string): Promise<ApiResponse<any>> {
    return this.get<any>(`/quickbooks/profile/user?cbid=${cbid}`);
  }

  async getQuickBooksCompanies(cbid: string): Promise<ApiResponse<any[]>> {
    return this.get<any[]>(`/quickbooks/profile/companies?cbid=${cbid}`);
  }

  async disconnectQuickBooksCompany(cbid: string, realmId: string): Promise<ApiResponse<void>> {
    try {
      const response = await fetch(`${this.baseUrl}/quickbooks/profile/disconnect/${realmId}?cbid=${cbid}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      const result = await response.json();
      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
        code: 'NETWORK_ERROR'
      };
    }
  }

  // Threads API methods
  async getAllThreads(cbid: string): Promise<ApiResponse<Thread[]>> {
    return this.get<Thread[]>(`/threads?cbid=${cbid}`);
  }

  async getThread(threadCbid: string, userCbid: string): Promise<ApiResponse<Thread>> {
    return this.get<Thread>(`/thread/${threadCbid}?cbid=${userCbid}`);
  }

  async createThread(cbid: string): Promise<ApiResponse<{ cbId: string }>> {
    return this.post<{ cbId: string }>(`/thread/create?cbid=${cbid}`, {});
  }
}

export const apiClient = new ApiClient();
export default apiClient; 