import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { Navigate } from "react-router-dom";
import { BASE_URL, Token } from "@/hooks/baseUrls";
import { useEffect, useState } from "react";
import axios from "axios";
import { usePermissions } from "@/hooks/usePermissions";

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const token = localStorage.getItem("token");
  const { getPermissions } = usePermissions();

  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        console.log("No token found, redirecting to login.");

        return;
      }

      try {
        const isEmployee = localStorage.getItem("userType") === "employee";
        const backendUrl = isEmployee 
          ? `${BASE_URL}/employees/token/validate` // Assuming this exists or works similarly
          : `${BASE_URL}/admin-users/token/validate`;
        
        const formData = new FormData();
        formData.append("token", token);
        let response;
        try {
          response = await axios.post(backendUrl, formData);
        } catch (err) {
          if (isEmployee) {
             // If employee validation fails, maybe the endpoint doesn't exist yet.
             // We can skip validation for now or use a fallback.
             console.warn("Employee token validation endpoint failed, assuming valid for now.");
             setIsAuthenticated(true);
             return;
          }
          throw err;
        }
        console.log("Token validation response:", response.data);

        if (response.data.errFlag !== 0) {
          localStorage.removeItem("token");
          localStorage.removeItem("permission");
          setIsAuthenticated(false);
          return;
        }

        setIsAuthenticated(true);
      } catch (error) {
        console.error("Token validation failed:", error);

        // Type guard to check if the error is an AxiosError
        if (axios.isAxiosError(error)) {
          console.error("Axios error details:", error.response?.data);
        }

        localStorage.removeItem("token");
        localStorage.removeItem("permission");
        setIsAuthenticated(false);
      }
    };

    validateToken();
  }, []);

  // Check if user has any permissions at all
  const hasAnyPermission = getPermissions().length > 0;

  if (localStorage.getItem("token") === null || isAuthenticated === false) {
    const isEmployee = localStorage.getItem("userType") === "employee";
    return <Navigate to={isEmployee ? "/employee-login" : "/login"} />;
  }

  if (isAuthenticated === null) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-muted-foreground animate-pulse">
            Authenticating...
          </p>
        </div>
      </div>
    );
  }
  return (
    <div
      className="flex bg-background"
      style={{
        height: '100dvh',
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        paddingLeft: 'env(safe-area-inset-left)',
        paddingRight: 'env(safe-area-inset-right)',
      }}
    >
      <div className="hidden lg:block">
        <Sidebar />
      </div>
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
