import {
  Package,
  Users,
  Warehouse,
  Factory,
  ClipboardCheck,
  BarChart3,
  Settings,
  ShoppingBag,
  Box,
  LogIn,
  ArrowLeftRight,
  Menu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useLocation, Link } from "react-router-dom";
import { useState } from "react";
import { usePermissions } from "@/hooks/usePermissions";
import { navigation } from "@/hooks/navigationItems";

export function Sidebar() {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { hasPermission } = usePermissions();
  // Filter navigation based on user permissions
  const filteredNavigation = navigation.filter((item) =>
    hasPermission(item.name),
  );

  const logo = localStorage.getItem("logo");

  return (
    <div
      className={cn(
        "flex flex-col h-full bg-card border-r border-border transition-all duration-300 relative",
        isCollapsed ? "w-16" : "w-64",
      )}
    >
      {/* Logo and Toggle */}
      <div className="flex h-16 items-center justify-between border-b border-border flex-shrink-0 px-2">
        {!isCollapsed && (
          <Link to="/">
            <img src={logo} alt="logo" className="h-14 w-48 object-cover" />
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="h-8 w-8"
        >
          <Menu className="h-4 w-4" />
        </Button>
      </div>

      {/* Scrollable Navigation */}
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-transparent px-2 py-4">
        {filteredNavigation.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.href;
          return (
            <Link key={item.name} to={item.href}>
              <Button
                variant={isActive ? "secondary" : "ghost"}
                className={cn(
                  "w-full h-11 mb-1",
                  isCollapsed
                    ? "justify-center px-0"
                    : "justify-start gap-3 px-3",
                  isActive && "bg-primary/10 text-primary hover:bg-primary/20",
                )}
                title={isCollapsed ? item.name : undefined}
              >
                <Icon className="h-5 w-5" />
                {!isCollapsed && <span>{item.name}</span>}
              </Button>
            </Link>
          );
        })}
      </div>

      {/* Fixed Bottom Section */}
      <div className="p-2 border-t border-border flex-shrink-0 bg-card">
        {localStorage.getItem("token") ? (
          <Link to={localStorage.getItem("userType") === "employee" ? "/employee-login" : "/login"}>
            <Button
              variant="outline"
              className={cn(
                "w-full h-11",
                isCollapsed
                  ? "justify-center px-0"
                  : "justify-start gap-3 px-3",
              )}
              title={isCollapsed ? "Logout" : undefined}
              onClick={(e) => {
                localStorage.clear();
              }}
            >
              <LogIn className="h-5 w-5" />
              {!isCollapsed && <span>Logout</span>}
            </Button>
          </Link>
        ) : (
          <Link to="/login">
            <Button
              variant="outline"
              className={cn(
                "w-full h-11",
                isCollapsed
                  ? "justify-center px-0"
                  : "justify-start gap-3 px-3",
              )}
              title={isCollapsed ? "Login" : undefined}
            >
              <LogIn className="h-5 w-5" />
              {!isCollapsed && <span>Login</span>}
            </Button>
          </Link>
        )}

        {/* User Info */}
        {!isCollapsed && (
          <div className="flex items-center gap-3 mt-4 px-2">
            <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-sm font-medium text-primary">
                {localStorage.getItem("username")?.charAt(0)}
                {localStorage.getItem("username")?.split(" ")?.pop()?.charAt(0)}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {localStorage.getItem("username")}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {localStorage.getItem("userType") === "employee" ? "Employee" : "Super Admin"}
              </p>
            </div>
          </div>
        )}

        {isCollapsed && (
          <div className="flex justify-center mt-4">
            <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-sm font-medium text-primary">JD</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
