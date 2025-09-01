import { config } from '../config';
import { AuthUser } from '../types';

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

export interface ThreadMessage {
  cbId: string;
  threadId: string;
  sender_id: string;
  receiverId: string;
  body: string;
  createdAt: string;
}

export interface Thread {
  cbId: string;
  ownerId: string;
  createdAt: string;
  messages?: ThreadMessage[];
}

export interface Pipeline {
  cbId: string;
  ownerId: string;
  parentThreadId?: string;
  name: string;
  createdAt: string;
  parentThread?: Thread;
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
      
      // Check if the response is already in ApiResponse format
      if (result && typeof result === 'object' && 'success' in result) {
        return result;
      }
      
      // If not, wrap it in ApiResponse format
      return {
        success: true,
        data: result,
        error: undefined
      };
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
      
      // Check if the response is already in ApiResponse format
      if (result && typeof result === 'object' && 'success' in result) {
        return result;
      }
      
      // If not, wrap it in ApiResponse format
      return {
        success: true,
        data: result,
        error: undefined
      };
    } catch (error) {
      console.error('API request error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
        code: 'NETWORK_ERROR'
      };
    }
  }

  async put<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'PUT',
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

  // Authentication methods
  async login(credentials: LoginRequest): Promise<ApiResponse<AuthUser>> {
    return this.post<AuthUser>('/login', credentials);
  }

  async signup(userData: SignupRequest): Promise<ApiResponse<AuthUser>> {
    return this.post<AuthUser>('/login/signup', userData);
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

  async disconnectQuickBooksCompany(cbid: string, qbo_profile_id: string): Promise<ApiResponse<void>> {
    try {
      const response = await fetch(`${this.baseUrl}/quickbooks/profile/disconnect/${cbid}/${qbo_profile_id}`, {
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

  async getQuickBooksCompanyStatus(cbid: string, qbo_profile_id: string): Promise<ApiResponse<any>> {
    return this.get<any>(`/quickbooks/profile/status/${cbid}/${qbo_profile_id}`);
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

  async createMessage(threadId: string, cbid: string, body: string, receiverId?: string): Promise<ApiResponse<{ cbId: string }>> {
    return this.post<{ cbId: string }>(`/thread/${threadId}/message?cbid=${cbid}`, {
      body,
      receiverId
    });
  }

  // Pipelines API methods
  async getAllPipelines(cbid: string): Promise<ApiResponse<Pipeline[]>> {
    return this.get<Pipeline[]>(`/pipelines?cbid=${cbid}`);
  }

  async getPipeline(pipelineId: string, cbid: string): Promise<ApiResponse<Pipeline>> {
    return this.get<Pipeline>(`/pipeline/${pipelineId}?cbid=${cbid}`);
  }

  async createPipeline(cbid: string, name?: string, parentThreadId?: string): Promise<ApiResponse<{ cbId: string }>> {
    return this.post<{ cbId: string }>(`/pipeline/create?cbid=${cbid}`, {
      name,
      parentThreadId
    });
  }

  async updatePipeline(pipelineId: string, cbid: string, name?: string, parentThreadId?: string): Promise<ApiResponse<Pipeline>> {
    return this.put<Pipeline>(`/pipeline/${pipelineId}?cbid=${cbid}`, {
      name,
      parentThreadId
    });
  }

  async deletePipeline(pipelineId: string, cbid: string): Promise<ApiResponse<void>> {
    return this.post<void>(`/pipeline/${pipelineId}?cbid=${cbid}`, {});
  }
}

export const apiClient = new ApiClient();
export default apiClient; 