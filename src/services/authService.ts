import axios from 'axios';
import type { AxiosRequestConfig } from 'axios';

// Create an axios instance with base URL from environment variables
// In production, you'll need to set VITE_API_BASE_URL in your environment
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://devn8n.hashtechinfo.com/resumeBuilder-Dev';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'accept': 'application/json',
  },
});

// Auth service functions

// Auth service functions
export const authService = {
  /**
   * Check if email exists in the database
   * @param email - User email to check
   * @returns Promise with response data
   */
  checkMail: async (email: string): Promise<{ exists: boolean; message: string }> => {
    try {
      // Use a more specific URL format with trailing slash to avoid potential redirect issues
      const url = `/auth/user/Checkmail?email=${encodeURIComponent(email)}`;
      console.log('Checking email with URL:', url);
      
      // Add specific config to handle redirects
      const config = {
        maxRedirects: 5,
        validateStatus: function (status: number) {
          return status >= 200 && status < 300 || status === 306; // Accept 306 status
        }
      };
      
      const response = await apiClient.get(url, config);
      
      console.log('Email check response:', response.status, response.data);
      
      // Handle 306 status specifically (which might indicate a redirect issue)
      if (response.status === 306) {
        // For 306 responses, check if we can determine existence from the data
        if (response.data && typeof response.data === 'object') {
          if (response.data.detail === "User found") {
            return { exists: true, message: response.data.detail };
          }
        }
        // Default to not found if we can't determine from data
        return { exists: false, message: 'Unable to verify email existence' };
      }
      
      // If we get "User found" detail, the email exists
      if (response.data.detail === "User found") {
        return { exists: true, message: response.data.detail };
      }
      
      // If we get "No User Found" message, the email doesn't exist
      return { exists: false, message: response.data.message || 'Email not found' };
    } catch (error: any) {
      console.error('Error checking email:', error);
      
      // Provide a default response instead of throwing error to improve UX
      return { exists: false, message: error.message || 'Error checking email' };
    }
  },

  /**
   * Send OTP to the provided email
   * @param email - User email to send OTP to
   * @returns Promise with response data
   */
  sendOtp: async (email: string): Promise<{ status: string }> => {
    try {
      console.log('Sending OTP to:', email);
      console.log('Email type:', typeof email);
      console.log('Email length:', email ? email.length : 0);
      
      if (!email) {
        console.error('Email is empty or undefined!');
        throw new Error('Email is required for sending OTP');
      }
      
      // Match the exact format from the curl example:
      // curl -X 'POST' 'https://devn8n.hashtechinfo.com/resumeBuilder-Dev/auth/send-otp/?email=email@example.com' -H 'accept: application/json' -d ''
      const url = `/auth/send-otp/?email=${encodeURIComponent(email)}`;
      console.log('Request URL:', url);
      
      const config = {
        headers: {
          'accept': 'application/json'
        }
      };
      
      // Send an empty string as data
      const response = await apiClient.post(url, '', config);
      return response.data;
    } catch (error: any) {
      console.error('Error sending OTP:', error);
      if (error.response) {
        console.error('Error response data:', error.response.data);
        console.error('Error response status:', error.response.status);
        console.error('Error response headers:', error.response.headers);
      }
      throw error;
    }
  },

  /**
   * Verify OTP sent to email
   * @param email - User email
   * @param otp - OTP code to verify
   * @returns Promise with response data
   */
  verifyOtp: async (email: string, otp: string): Promise<{ valid: boolean }> => {
    try {
      console.log('Verifying OTP for:', email, 'OTP:', otp);
      
      // Match the exact format from the curl example:
      // curl -X 'POST' 'https://devn8n.hashtechinfo.com/resumeBuilder-Dev/auth/verify-otp/?email=email@example.com&otp=123456' -H 'accept: application/json' -d ''
      const url = `/auth/verify-otp/?email=${encodeURIComponent(email)}&otp=${encodeURIComponent(otp)}`;
      console.log('Request URL:', url);
      
      const config = {
        headers: {
          'accept': 'application/json'
        }
      };
      
      // Send an empty string as data
      const response = await apiClient.post(url, '', config);
      
      return response.data;
    } catch (error: any) {
      console.error('Error verifying OTP:', error);
      if (error.response) {
        console.error('Error response data:', error.response.data);
        console.error('Error response status:', error.response.status);
      }
      throw error;
    }
  },

  /**
   * Register a new user
   * @param userData - User data (name, email, password)
   * @param email - User email for bearer token
   * @param otp - OTP for bearer token
   * @returns Promise with response data
   */
  registerUser: async (
    userData: { name: string; email: string; password: string; phone_number: string;},
    email: string,
    otp: string
  ): Promise<any> => {
    try {
      const bearerToken = `${email}${otp}`;
      const config: AxiosRequestConfig = {
        headers: {
          Authorization: `Bearer ${bearerToken}`,
        },
      };

      const response = await apiClient.post('/auth/user/register', userData, config);
      return response.data;
    } catch (error) {
      console.error('Error registering user:', error);
      throw error;
    }
  },

  /**
   * Login user
   * @param credentials - User credentials (email, password)
   * @returns Promise with response data
   */
  login: async (credentials: { email: string; password: string }): Promise<any> => {
    try {
      const response = await apiClient.post('/auth/user/login', credentials);
      return response.data;
    } catch (error) {
      console.error('Error logging in:', error);
      throw error;
    }
  },

  /**
   * Reset user password
   * @param email - User email
   * @param newPassword - New password
   * @param otp - OTP for bearer token
   * @returns Promise with response data
   */
  forgotPass: async (email: string, newPassword: string, otp: string): Promise<any> => {
    try {
      const bearerToken = `${email}${otp}`;
      const config: AxiosRequestConfig = {
        headers: {
          Authorization: `Bearer ${bearerToken}`,
        },
      };

      const response = await apiClient.put(
        `/auth/user/forgotpass?email=${encodeURIComponent(email)}&new_password=${encodeURIComponent(newPassword)}`,
        {},
        config
      );
      
      return response.data;
    } catch (error) {
      console.error('Error resetting password:', error);
      throw error;
    }
  },
};

export default authService;
