import { FusionAuthService } from './FusionAuthService';

export class TokenRefreshMiddleware {
  private authService: FusionAuthService;
  private refreshPromise: Promise<string> | null = null;

  constructor(authService: FusionAuthService) {
    this.authService = authService;
  }

  async refreshToken(): Promise<string> {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = new Promise(async (resolve, reject) => {
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        // Call FusionAuth refresh endpoint
        const baseUrl = (this.authService as any).baseUrl;
        const response = await fetch(`${baseUrl}/api/jwt/refresh`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${refreshToken}`
          }
        });

        if (!response.ok) {
          throw new Error('Token refresh failed');
        }

        const data = await response.json();
        const newToken = data.token;
        
        // Store new token
        localStorage.setItem('authToken', newToken);
        
        resolve(newToken);
      } catch (error) {
        reject(error);
      } finally {
        this.refreshPromise = null;
      }
    });

    return this.refreshPromise;
  }

  async attachToAxios(axiosInstance: any) {
    axiosInstance.interceptors.response.use(
      (response: any) => response,
      async (error: any) => {
        const originalRequest = error.config;
        
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          
          try {
            const newToken = await this.refreshToken();
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return axiosInstance(originalRequest);
          } catch (refreshError) {
            // Redirect to login if refresh fails
            window.location.href = '/login';
            return Promise.reject(refreshError);
          }
        }
        
        return Promise.reject(error);
      }
    );
  }
}