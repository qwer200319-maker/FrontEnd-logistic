import api from "./api";
import { getDemoCredentials } from "./mockBackend";

interface LoginResponse {
  access: string;
  refresh: string;
  user: any;
}

const persistSession = (response: LoginResponse) => {
   localStorage.setItem("token", response.access);
   localStorage.setItem("refreshToken", response.refresh);
   localStorage.setItem("user", JSON.stringify(response.user));

   const loginTime = new Date().toISOString();
   localStorage.setItem("loginTime", loginTime);
   window.dispatchEvent(new CustomEvent("sessionUpdate"));
};

export const login = async (email: string, password: string) => {
   const res = await api.post<LoginResponse>("/login/", { email, password });
   persistSession(res.data);

   return res.data.user;
};

export const loginAsDemo = async (role: "admin" | "customer" | "limited" = "admin") => {
   const credentials = getDemoCredentials()[role];
   return login(credentials.email, credentials.password);
};

export const logout = (navigate?: (path: string) => void) => {
   localStorage.removeItem("token");
   localStorage.removeItem("refreshToken");
   localStorage.removeItem("user");
   localStorage.removeItem("loginTime");
   window.dispatchEvent(new CustomEvent("sessionUpdate"));

   // Use React Router navigate if available, otherwise fallback to window.location
   if (navigate) {
      navigate("/login");
   } else {
      window.location.href = "/login";
   }
 };

// Check if user has valid session (within 24 hours and has valid tokens)
export const hasValidSession = (): boolean => {
   const token = localStorage.getItem("token");
   const loginTime = localStorage.getItem("loginTime");

   if (!token || !loginTime) {
      return false;
   }

   try {
      const loginDate = new Date(loginTime);
      const now = new Date();
      const hoursDiff = (now.getTime() - loginDate.getTime()) / (1000 * 60 * 60);

      // Session expires after 24 hours
      return hoursDiff < 24;
   } catch (error) {
      console.error("Error checking session validity:", error);
      return false;
   }
};

// Get current user if session is valid
export const getCurrentUser = () => {
   if (!hasValidSession()) {
      return null;
   }

   const userStr = localStorage.getItem("user");
   if (userStr) {
      try {
         return JSON.parse(userStr);
      } catch (error) {
         console.error("Failed to parse user from localStorage:", error);
         return null;
      }
   }
   return null;
};

export const getUserRole = (): string | null => {
  const userStr = localStorage.getItem("user");
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      return user.role || null;
    } catch (error) {
      console.error("Failed to parse user from localStorage:", error);
      return null;
    }
  }
  return null;
};

export const isAdmin = (): boolean => {
  return getUserRole() === "admin";
};

export const isCustomer = (): boolean => {
  return getUserRole() === "customer";
};
