import api from "./api";

export interface Notification {
  id: number;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  user: {
    id: number;
    email: string;
    full_name: string;
  };
}

// Helper function to check if user is authenticated
const isAuthenticated = (): boolean => {
  const token = localStorage.getItem("token");
  const refreshToken = localStorage.getItem("refreshToken");
  return !!(token && refreshToken);
};

// Helper function to handle authentication errors
const handleAuthError = (error: any): void => {
  if (error.response?.status === 401) {
    console.warn("Authentication error in notifications service:", error.response?.data);
    // Clear tokens and redirect to login
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    window.location.href = "/login";
  }
};

// Retry wrapper for API calls
const withRetry = async <T>(
  apiCall: () => Promise<T>,
  maxRetries: number = 2,
  delay: number = 1000
): Promise<T> => {
  let lastError: any;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await apiCall();
    } catch (error: any) {
      lastError = error;

      // Don't retry on 401 (authentication errors) or 403 (permission errors)
      if (error.response?.status === 401 || error.response?.status === 403) {
        handleAuthError(error);
        throw error;
      }

      // Don't retry on the last attempt
      if (attempt === maxRetries) {
        break;
      }

      // Wait before retrying
      // console.warn(`API call failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${delay}ms:`, error.message);
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2; // Exponential backoff
    }
  }

  throw lastError;
};

export const notificationService = {
  // Check if user is authenticated before making requests
  isAuthenticated,

  // Get all notifications for the current user with retry logic
  getNotifications: async (): Promise<Notification[]> => {
    // console.log("getNotifications called, checking authentication...");
    if (!isAuthenticated()) {
      // console.warn("User not authenticated, cannot fetch notifications");
      return [];
    }

    // console.log("User authenticated, making API call to /notifications/...");
    try {
      const response = await withRetry(() => api.get('/notifications/'));
      // console.log("Successfully fetched notifications:", response.data.length);
      return response.data;
    } catch (error: any) {
      console.error("Failed to fetch notifications after retries:", {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });

      // Don't handle auth errors for 400 status (bad request)
      // This might be a temporary backend issue
      if (error.response?.status !== 400) {
        handleAuthError(error);
      }

      return [];
    }
  },

  // Get unread notifications count with retry logic
  getUnreadCount: async (): Promise<number> => {
    if (!isAuthenticated()) {
      // console.warn("User not authenticated, cannot fetch notification count");
      return 0;
    }

    try {
      const response = await withRetry(() => api.get('/notifications/'));
      const count = response.data.filter((notif: Notification) => !notif.is_read).length;
      // console.log("Unread notification count:", count);
      return count;
    } catch (error: any) {
      // console.error("Failed to fetch notification count after retries:", error);
      handleAuthError(error);
      return 0;
    }
  },

  // Mark a single notification as read with retry logic
  markAsRead: async (id: number): Promise<void> => {
    if (!isAuthenticated()) {
      throw new Error("User not authenticated");
    }

    try {
      await withRetry(() => api.patch(`/notifications/${id}/`, { is_read: true }));
      // console.log("Successfully marked notification as read:", id);
    } catch (error: any) {
      // console.error("Failed to mark notification as read after retries:", error);
      handleAuthError(error);
      throw error;
    }
  },

  // Mark all notifications as read with retry logic
  markAllAsRead: async (): Promise<number> => {
    if (!isAuthenticated()) {
      throw new Error("User not authenticated");
    }

    try {
      const response = await withRetry(() => api.post('/notifications/mark_all_read/'));
      // console.log("Successfully marked all notifications as read:", response.data.updated);
      return response.data.updated;
    } catch (error: any) {
      // console.error("Failed to mark all notifications as read after retries:", error);
      handleAuthError(error);
      throw error;
    }
  },

  // Delete a notification with retry logic
  deleteNotification: async (id: number): Promise<void> => {
    if (!isAuthenticated()) {
      throw new Error("User not authenticated");
    }

    try {
      await withRetry(() => api.delete(`/notifications/${id}/`));
      // console.log("Successfully deleted notification:", id);
    } catch (error: any) {
      // console.error("Failed to delete notification after retries:", error);
      handleAuthError(error);
      throw error;
    }
  },

  // Force refresh tokens (useful for debugging)
  refreshTokens: async (): Promise<boolean> => {
    const refreshToken = localStorage.getItem("refreshToken");
    if (!refreshToken) {
      // console.warn("No refresh token available");
      return false;
    }

    try {
      const response = await api.post('/token/refresh/', { refresh: refreshToken });
      localStorage.setItem("token", response.data.access);
      // console.log("Successfully refreshed tokens");
      return true;
    } catch (error: any) {
      // console.error("Failed to refresh tokens:", error);
      handleAuthError(error);
      return false;
    }
  },
};
