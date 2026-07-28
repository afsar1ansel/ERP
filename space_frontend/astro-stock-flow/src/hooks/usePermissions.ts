import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { navigation } from "./navigationItems";

export interface PageAccess {
  id: number;
  page_name: string;
  page_route: string;
}

export function getDecodedPermissions() {
  const encodedPermissions = localStorage.getItem("permission");

  if (!encodedPermissions) {
    return []; // Return an empty array or default value if not found
  }

  try {
    // 1. Base64 Decode the string
    // atob() decodes a Base64-encoded string.
    const permissionsString = atob(encodedPermissions);

    // 2. Parse the JSON string back into an object/array
    return JSON.parse(permissionsString);
  } catch (error) {
    console.error("Failed to decode or parse permissions:", error);
    // Handle error case, e.g., clear bad data and return empty permissions
    localStorage.removeItem("permission");
    return [];
  }
}

export const usePermissions = () => {
  const getPermissions = (): PageAccess[] => {
    try {
      //   const permissions = localStorage.getItem("permission");
      const permission = getDecodedPermissions();
      const permissions = JSON.stringify(permission);
      return permissions ? JSON.parse(permissions) : [];
    } catch (error) {
      console.error("Error parsing permissions:", error);
      return [];
    }
  };

  const hasPermission = (pageName: string): boolean => {
    const permissions = getPermissions();
    return permissions.some(
      (permission) =>
        permission.page_name.toLowerCase() === pageName.toLowerCase(),
    );
  };

  const getAllowedRoutes = () => {
    const permissions = getPermissions();
    return permissions.map((permission) => permission.page_name);
  };

  const getFirstAllowedRoute = (): string => {
    const permissions = getPermissions();
    if (permissions.length === 0) return "/login";

    // Find the first navigation item that the user has permission for
    const firstAllowedItem = navigation.find((item) =>
      permissions.some(
        (p) => p.page_name.toLowerCase() === item.name.toLowerCase(),
      ),
    );

    return firstAllowedItem ? firstAllowedItem.href : "/login";
  };

  return {
    getPermissions,
    hasPermission,
    getAllowedRoutes,
    getFirstAllowedRoute,
  };
};
