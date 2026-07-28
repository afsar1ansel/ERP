import {
  Search,
  Bell,
  Factory,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useState, useEffect } from "react";
import { BASE_URL } from "@/hooks/baseUrls";
import { useNavigate } from "react-router-dom";
import { MobileNav } from "./MobileNav";

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

interface SearchResult {
  display_text: string;
  id: number;
  result_type: string;
  sub_text: string;
}

interface SearchResponse {
  errFlag: number;
  results: SearchResult[];
}

interface Notification {
  id: string;
  type: "critical" | "lowStock" | "activity";
  title: string;
  description: string;
  timestamp: string;
  priority: "high" | "medium" | "low";
}

export function Header() {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationCount, setNotificationCount] = useState(0);
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const navigate = useNavigate();
  useEffect(() => {
    const performSearch = async () => {
      if (!debouncedSearchTerm.trim()) {
        setSearchResults([]);
        setIsDropdownOpen(false);
        return;
      }

      setIsLoading(true);
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("searchTerm", debouncedSearchTerm);
      formData.append("token", token || "");

      try {
        console.log(`Making API call for: ${debouncedSearchTerm}`);
        const response = await fetch(`${BASE_URL}/global-search`, {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const responseData: SearchResponse = await response.json();
        console.log("API Response Data:", responseData);

        if (responseData.errFlag === 0 && responseData.results.length > 0) {
          setSearchResults(responseData.results);
          setIsDropdownOpen(true);
        } else {
          setSearchResults([]);
          setIsDropdownOpen(false);
        }
      } catch (error) {
        console.error("Error making search request:", error);
        setSearchResults([]);
        setIsDropdownOpen(false);
      } finally {
        setIsLoading(false);
      }
    };

    performSearch();
  }, [debouncedSearchTerm]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    if (e.target.value === "") {
      setSearchResults([]);
      setIsDropdownOpen(false);
    }
  };

  const handleResultClick = (result: SearchResult) => {
    console.log("Selected result:", result);

    setIsDropdownOpen(false);
    setSearchTerm(result.display_text);

    // Determine the path based on result_type and navigate
    let targetPath = "";
    switch (result.result_type) {
      case "Employee":
        console.log(result.result_type);
        targetPath = "/employees";
        break;
      case "Vendor":
        targetPath = "/vendors";
        break;
      case "Raw Material":
        targetPath = "/raw-materials";
        break;
      case "Finished Good":
        targetPath = "/finished-goods";
        break;
      case "Purchase Order":
        targetPath = "/purchases";
        break;
      case "Product SKU":
        targetPath = "/production";
        break;
      case "Production Batch":
        targetPath = "/production";
        break;
      case "Dispatch Order":
        targetPath = "/dispatch";
        break;
      case "Client":
        targetPath = "/clients";
        break;
      case "QC Record":
        targetPath = "/qc";
        break;
      // Add other cases as needed
      default:
        targetPath = "/"; // Fallback route
    }

    // Navigate to the target path and pass the result data as state
    navigate(targetPath, { state: { result } });
  };

  const handleInputFocus = () => {
    if (searchResults.length > 0) {
      setIsDropdownOpen(true);
    }
  };

  const handleInputBlur = () => {
    // Small timeout to allow click on results before closing
    setTimeout(() => setIsDropdownOpen(false), 200);
  };

  // Fetch all notifications
  const fetchNotifications = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      // Create FormData objects first
      const criticalForm = new FormData();
      criticalForm.append("token", token);

      const lowStockForm = new FormData();
      lowStockForm.append("token", token);

      const activityForm = new FormData();
      activityForm.append("token", token);

      // Use the FormData objects in the fetch calls
      const [criticalData, lowStockData, activityData] = await Promise.all([
        fetch(`${BASE_URL}/dashboard/critical-production`, {
          method: "POST",
          body: criticalForm,
        }),
        fetch(`${BASE_URL}/dashboard/low-stock`, {
          method: "POST",
          body: lowStockForm,
        }),
        fetch(`${BASE_URL}/dashboard/recent-activities`, {
          method: "POST",
          body: activityForm,
        }),
      ]);

      // Transform data into notifications
      const combinedNotifications: Notification[] = [];

      // Add critical production orders
      const criticalOrders = await criticalData.json();
      criticalOrders.due_soon?.forEach((order: any) => {
        combinedNotifications.push({
          id: order.production_code,
          type: "critical",
          title: "Critical Production Order",
          description: `${order.product_name} - ${order.progress_percentage}% complete`,
          timestamp: new Date().toISOString(),
          priority: "high",
        });
      });

      // Add low stock alerts
      const lowStock = await lowStockData.json();
      lowStock.raw_materials?.forEach((item: any) => {
        if (item.stock_qty <= item.min_stock_level) {
          combinedNotifications.push({
            id: item.material_code,
            type: "lowStock",
            title: "Low Stock Alert",
            description: `${item.material_name} is below minimum stock level`,
            timestamp: new Date().toISOString(),
            priority: "medium",
          });
        }
      });

      // Add recent activities
      const activities = await activityData.json();
      activities.activities?.forEach((activity: any) => {
        combinedNotifications.push({
          id: activity.ref,
          type: "activity",
          title: activity.activity_type,
          description: activity.extra,
          timestamp: activity.created_at,
          priority: "low",
        });
      });

      setNotifications(combinedNotifications);
      setNotificationCount(combinedNotifications.length);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  // Fetch on component mount
  useEffect(() => {
    fetchNotifications();
  }, []);

  // Add notification dropdown UI
  const renderNotificationDropdown = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="relative hover:bg-accent transition-colors"
        >
          <Bell className="h-5 w-5" />
          {notificationCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {notificationCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-[22rem] rounded-xl shadow-lg border border-border/60 p-2 bg-background"
      >
        <div className="max-h-[420px] overflow-auto space-y-2">
          {notifications.length > 0 ? (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className="p-3 rounded-lg border border-transparent hover:border-border hover:bg-accent/40 transition-all duration-200"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {notification.type === "critical" ? (
                      <Factory className="h-5 w-5 text-destructive" />
                    ) : notification.type === "lowStock" ? (
                      <AlertTriangle className="h-5 w-5 text-orange-500" />
                    ) : (
                      <Bell className="h-5 w-5 text-muted-foreground" />
                    )}
                    <Badge
                      variant={
                        notification.type === "critical"
                          ? "destructive"
                          : notification.type === "lowStock"
                          ? "secondary"
                          : "outline"
                      }
                    >
                      {notification.type}
                    </Badge>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(notification.timestamp).toLocaleDateString()}
                  </span>
                </div>

                <div className="mt-2 space-y-1">
                  <h4 className="font-medium text-sm leading-tight">
                    {notification.title}
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {notification.description}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="p-6 text-center text-muted-foreground text-sm">
              No new notifications 🎉
            </div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <header className="h-16 bg-card border-b border-border px-6 flex items-center justify-between">
      {/* Brand Selector & Search */}
      <div className="flex items-center gap-4 flex-1">
        <MobileNav />
        
        {localStorage.getItem("userType") !== "employee" && (
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search SKU, PO, GRN, Batch, Vendor..."
              className="pl-10"
              value={searchTerm}
              onChange={handleInputChange}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
            />

            {/* Search Results Dropdown */}
            {isDropdownOpen && (
              <div className="absolute top-full left-0 right-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg mt-1 max-h-80 overflow-y-auto z-50">
                {isLoading ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    Searching...
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="py-2">
                    {searchResults.map((result, index) => (
                      <div
                        key={`${result.result_type}-${result.id}-${index}`}
                        className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                        onClick={() => handleResultClick(result)}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium text-foreground">
                              {result.display_text}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {result.sub_text}
                            </div>
                          </div>
                          <Badge
                            variant="secondary"
                            className="text-xs capitalize"
                          >
                            {result.result_type.toLowerCase()}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : debouncedSearchTerm && !isLoading ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    No results found for "{debouncedSearchTerm}"
                  </div>
                ) : null}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Theme Toggle & Notifications & QR Scanner */}
      <div className="flex items-center gap-2">
        <ThemeToggle />
        {renderNotificationDropdown()}
      </div>
    </header>
  );
}
