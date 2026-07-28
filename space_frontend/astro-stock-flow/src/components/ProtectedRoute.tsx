// components/ProtectedRoute.tsx
import { Navigate } from "react-router-dom";
import { usePermissions } from "@/hooks/usePermissions";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission: string;
  fallbackPath?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredPermission,
  fallbackPath = "/",
}) => {
  const { hasPermission, getFirstAllowedRoute } = usePermissions();

  if (!hasPermission(requiredPermission)) {
    // If the user doesn't have permission for the home page, redirect to their first allowed route
    const redirectPath =
      requiredPermission === "Dashboard"
        ? getFirstAllowedRoute()
        : fallbackPath;
    return <Navigate to={redirectPath} replace />;
  }

  return <>{children}</>;
};
