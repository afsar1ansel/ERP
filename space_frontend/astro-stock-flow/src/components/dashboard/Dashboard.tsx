import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Package,
  IndianRupee,
  Clock,
  ShoppingCart,
  Factory,
  Calendar,
} from "lucide-react";
import { useEffect, useState } from "react";
import { KPICard } from "./KPICard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CreateQuickPOForm } from "@/components/inventory/CreateQuickPOForm";
import { ReceiveStockForm } from "@/components/inventory/ReceiveStockForm";
import { BASE_URL } from "@/hooks/baseUrls";
import { useNavigate } from "react-router-dom";

const kpiData = [
  {
    title: "Total Stock Value",
    value: "₹2,45,67,890",
    change: "+12.5%",
    changeType: "positive" as const,
    icon: IndianRupee,
    subtitle: "Last 30 days",
  },
  {
    title: "Reorder Alerts",
    value: "23",
    change: "+5 new",
    changeType: "negative" as const,
    icon: AlertTriangle,
    subtitle: "Materials below threshold",
  },
  {
    title: "QC Pass Rate",
    value: "94.2%",
    change: "-2.1%",
    changeType: "negative" as const,
    icon: Package,
    subtitle: "This month",
  },
  {
    title: "Vendor On-Time %",
    value: "87.5%",
    change: "+5.2%",
    changeType: "positive" as const,
    icon: Clock,
    subtitle: "Average delivery performance",
  },
];

interface RecentActivity {
  type: string;
  id: string;
  vendor: string;
  status: string;
}

interface ApiRecentActivity {
  activity_id: number;
  activity_type: string;
  created_at: string;
  extra: string;
  ref: string;
  status: string;
}

interface ApiRecentActivitiesResponse {
  errFlag: number;
  activities: ApiRecentActivity[];
}

// Interface for critical production orders from API
interface ApiCriticalOrder {
  batch_status: string;
  client_id: number;
  client_name: string;
  completed_qty: number;
  current_stage: string;
  expected_completion_date: string;
  id: number;
  planned_qty: number;
  product_id: number;
  product_name: string;
  production_code: string;
  progress_percentage: number;
  risk: string;
}

interface ApiCriticalOrdersResponse {
  errFlag: number;
  due_soon: ApiCriticalOrder[];
}

// Interface for component critical orders
interface CriticalOrder {
  id: string;
  product: string;
  customer: string;
  dueDate: string;
  currentStage: string;
  priority: string;
  delayRisk: string;
  completionPercent: number;
  productionCode: string;
  completedQty: number;
  plannedQty: number;
}

interface LowStockItem {
  id: string;
  type: "Raw Material" | "Finished Good";
  material: string;
  current: number;
  reorder: number;
  vendor: string;
  category: string;
}

interface ApiLowStockData {
  errFlag: number;
  finished_goods: Array<{
    id: number;
    material_code?: string;
    sku_code: string;
    product_name: string;
    stock_qty: string;
    min_level: string;
    max_level: string;
    unit_price?: string;
    product_category_id?: number;
    velocity?: string;
  }>;
  raw_materials: Array<{
    id: number;
    material_code: string;
    material_name: string;
    stock_qty: number;
    min_stock_level: number;
    max_stock_level: number;
    vendor_name: string;
    unit_of_measure: string;
    stock_status?: string;
  }>;
}

interface KpiCardData {
  title: string;
  value: string;
  change: string;
  changeType: "positive" | "negative";
  icon: React.ComponentType<any>; // Type for Lucide icons
  subtitle: string;
}

interface DashboardProps {
  isReceiveStockOpen: boolean;
  setIsReceiveStockOpen: (open: boolean) => void;
  scannedPOId: string | null;
  existingMaterials: any[];
}

export function Dashboard({
  isReceiveStockOpen,
  setIsReceiveStockOpen,
  scannedPOId,
  existingMaterials,
}: DashboardProps) {
  const [quickPODialog, setQuickPODialog] = useState<{
    open: boolean;
    item?: any;
  }>({ open: false });

  const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([]);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>(
    []
  );
  const [criticalOrders, setCriticalOrders] = useState<CriticalOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [activitiesLoading, setActivitiesLoading] = useState(true);
  const [criticalOrdersLoading, setCriticalOrdersLoading] = useState(true);

  // ADD THIS STATE
  const [kpiData, setKpiData] = useState<KpiCardData[]>([
    {
      title: "Total Production",
      value: "...",
      change: "",
      changeType: "positive",
      icon: Factory,
      subtitle: "This month",
    },
    {
      title: "Reorder Alerts",
      value: "...",
      change: "",
      changeType: "negative",
      icon: AlertTriangle,
      subtitle: "Materials below threshold",
    },
    {
      title: "QC Pass Rate",
      value: "...",
      change: "",
      changeType: "negative",
      icon: Package,
      subtitle: "This month",
    },
    {
      title: "Vendor On-Time %",
      value: "...",
      change: "",
      changeType: "positive",
      icon: Clock,
      subtitle: "Average delivery performance",
    },
  ]);

  const openQuickPODialog = (item: any) => {
    setQuickPODialog({ open: true, item });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "Critical":
        return "bg-red-100 text-red-800";
      case "High":
        return "bg-orange-100 text-orange-800";
      case "Medium":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-blue-100 text-blue-800";
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "High":
      case "Critical":
        return "text-red-600";
      case "Medium":
        return "text-orange-600";
      case "Low":
        return "text-green-600";
      default:
        return "text-gray-600";
    }
  };

  const mapApiStatusToComponentStatus = (
    apiStatus: string,
    activityType: string
  ): string => {
    // Handle numeric statuses (like '1' for GRN)
    if (apiStatus === "1") {
      return "completed";
    }

    // Handle other status mappings
    switch (apiStatus.toLowerCase()) {
      case "pending":
      case "scheduled":
        return "pending";
      case "completed":
      case "approved":
        return "completed";
      case "failed":
        return "failed";
      default:
        return "pending";
    }
  };

  const mapActivityType = (apiType: string): string => {
    switch (apiType) {
      case "PROD":
        return "Production";
      case "GRN":
      case "PO":
      case "QC":
        return apiType;
      default:
        return apiType;
    }
  };

  // Function to transform API critical orders to component format
  const transformCriticalOrders = (
    apiOrders: ApiCriticalOrder[]
  ): CriticalOrder[] => {
    return apiOrders.map((order) => ({
      id: `ORDER-${order.id}`,
      product: order.product_name,
      customer: order.client_name,
      dueDate: order.expected_completion_date,
      currentStage: order.current_stage,
      priority: order.risk,
      delayRisk: order.risk, // Using risk for both priority and delayRisk as per API
      completionPercent: order.progress_percentage,
      productionCode: order.production_code,
      completedQty: order.completed_qty,
      plannedQty: order.planned_qty,
    }));
  };

  useEffect(() => {
    fetchStats();
    fetchBoxData();
    fetchRecentActivityData();
    fetchCriticalProductionOrders();
  }, []);

  async function fetchStats() {
    const token = localStorage.getItem("token");
    if (!token) {
      console.error("No token found in localStorage");
      return;
    }

    const formData = new FormData();
    formData.append("token", token);
    try {
      const response = await fetch(`${BASE_URL}/dashboard/stats`, {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      console.log("Stats data:", data);

      if (data.errFlag === 0 && data.stats) {
        // --- THIS IS THE NEW LOGIC ---
        const stats = data.stats;

        const newKpiData: KpiCardData[] = [
          {
            title: "Total Production",
            value: stats.total_production.toString(),
            change: "", // API doesn't provide change data
            changeType: "positive",
            icon: Factory,
            subtitle: "This month",
          },
          {
            title: "Reorder Alerts",
            value: stats.low_stock_alerts.toString(),
            change: "", // API doesn't provide change data
            changeType: "negative",
            icon: AlertTriangle,
            subtitle: "Materials below threshold",
          },
          {
            title: "QC Pass Rate",
            // Format to 1 decimal place
            value: `${parseFloat(stats.qc_pass_rate).toFixed(1)}%`,
            change: "", // API doesn't provide change data
            changeType: stats.qc_pass_rate >= 90 ? "positive" : "negative",
            icon: Package,
            subtitle: "This month",
          },
          {
            title: "Vendor On-Time %",
            // Format to 1 decimal place
            value: `${parseFloat(stats.avg_vendor_on_time).toFixed(1)}%`,
            change: "", // API doesn't provide change data
            changeType: "positive",
            icon: Clock,
            subtitle: "Average delivery performance",
          },
        ];

        setKpiData(newKpiData);
        // --- END OF NEW LOGIC ---
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
      // Optional: Set KPI values to "Error" on failure
      setKpiData((prevData) =>
        prevData.map((kpi) => ({ ...kpi, value: "Error" }))
      );
    }
  }

  async function fetchCriticalProductionOrders() {
    const token = localStorage.getItem("token");
    console.log("Fetching critical production orders with token:", token);
    if (!token) {
      console.error("No token found in localStorage");
      setCriticalOrdersLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append("token", token);

    try {
      const response = await fetch(
        `${BASE_URL}/dashboard/critical-production`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }
      const data: ApiCriticalOrdersResponse = await response.json();
      console.log("Critical production orders data:", data);

      if (data.errFlag === 0 && data.due_soon) {
        const transformedOrders = transformCriticalOrders(data.due_soon);
        setCriticalOrders(transformedOrders);
      } else {
        console.error("Error in critical orders response:", data);
      }
    } catch (error) {
      console.error("Failed to fetch critical production orders:", error);
    } finally {
      setCriticalOrdersLoading(false);
    }
  }

  async function fetchRecentActivityData() {
    const token = localStorage.getItem("token");
    if (!token) {
      console.error("No token found in localStorage");
      setActivitiesLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append("token", token);

    try {
      const response = await fetch(`${BASE_URL}/dashboard/recent-activities`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      const data: ApiRecentActivitiesResponse = await response.json();
      console.log("Recent activity data:", data);

      if (data.errFlag === 0 && data.activities) {
        // Transform API data to RecentActivity format
        const transformedActivities: RecentActivity[] = data.activities.map(
          (activity) => ({
            type: mapActivityType(activity.activity_type),
            id: activity.ref,
            vendor: activity.extra?.trim() || "N/A",
            status: mapApiStatusToComponentStatus(
              activity.status,
              activity.activity_type
            ),
          })
        );

        setRecentActivities(transformedActivities);
      }
    } catch (error) {
      console.error("Error fetching recent activity data:", error);
    } finally {
      setActivitiesLoading(false);
    }
  }

  async function fetchBoxData() {
    const token = localStorage.getItem("token");
    if (!token) {
      console.error("No token found in localStorage");
      setLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append("token", token);

    try {
      const response = await fetch(`${BASE_URL}/dashboard/low-stock`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      const data: ApiLowStockData = await response.json();
      console.log("Low stock data:", data);

      if (data.errFlag === 0) {
        // Transform API data to LowStockItem format
        const transformedData: LowStockItem[] = [];

        // Transform raw materials
        if (data.raw_materials && data.raw_materials.length > 0) {
          data.raw_materials.forEach((rm) => {
            transformedData.push({
              id: rm.material_code?.trim() || `RM${rm.id}`,
              type: "Raw Material",
              material: rm.material_name,
              current: rm.stock_qty,
              reorder: rm.min_stock_level - rm.stock_qty,
              vendor: rm.vendor_name,
              category: rm.unit_of_measure,
            });
          });
        }

        // Transform finished goods
        if (data.finished_goods && data.finished_goods.length > 0) {
          data.finished_goods.forEach((fg) => {
            transformedData.push({
              id: fg.sku_code?.trim() || `FG${fg.id}`,
              type: "Finished Good",
              material: fg.product_name || fg.sku_code,
              current: parseFloat(fg.stock_qty),
              reorder: parseFloat(fg.max_level),
              vendor: "N/A",
              category: "Finished Product",
            });
          });
        }

        setLowStockItems(transformedData);
      }
    } catch (error) {
      console.error("Failed to fetch low stock data:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {kpiData.map((kpi, index) => (
            <KPICard key={index} {...kpi} />
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Critical Production Orders */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Factory className="h-5 w-5 text-destructive" />
                Critical Production Orders
              </CardTitle>
            </CardHeader>
            <CardContent>
              {criticalOrdersLoading ? (
                <div className="text-center py-8">
                  <p>Loading critical orders...</p>
                </div>
              ) : criticalOrders.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    No critical orders found
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {criticalOrders.map((order, index) => (
                    <div
                      key={index}
                      className="border rounded-lg p-4 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            {order.productionCode}
                          </Badge>
                          <Badge className={getPriorityColor(order.priority)}>
                            {order.priority}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4" />
                          <span className="text-muted-foreground">
                            Due: {new Date(order.dueDate).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium">{order.product}</h4>
                        <p className="text-sm text-muted-foreground">
                          {order.customer}
                        </p>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="text-sm">
                            <span className="font-medium">Stage:</span>{" "}
                            {order.currentStage}
                          </div>
                          <div className="text-sm">
                            <span className="font-medium">Risk:</span>
                            <span
                              className={`ml-1 ${getRiskColor(
                                order.delayRisk
                              )}`}
                            >
                              {order.delayRisk}
                            </span>
                          </div>
                          <div className="text-sm">
                            <span className="font-medium">Progress:</span>{" "}
                            {order.completedQty}/{order.plannedQty}
                          </div>
                        </div>
                        <div className="text-sm font-medium">
                          {order.completionPercent}% Complete
                        </div>
                      </div>

                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${
                            order.delayRisk === "High" ||
                            order.delayRisk === "Critical"
                              ? "bg-red-500"
                              : order.delayRisk === "Medium"
                              ? "bg-orange-500"
                              : "bg-green-500"
                          }`}
                          style={{ width: `${order.completionPercent}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Activities */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activities</CardTitle>
            </CardHeader>
            <CardContent>
              {activitiesLoading ? (
                <div className="text-center py-8">
                  <p>Loading recent activities...</p>
                </div>
              ) : recentActivities.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    No recent activities found
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentActivities.map((activity, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <Badge variant="outline">{activity.type}</Badge>
                        <div>
                          <p className="font-medium text-sm">{activity.id}</p>
                          <p className="text-sm text-muted-foreground">
                            {activity.vendor}
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant={
                          activity.status === "completed"
                            ? "default"
                            : activity.status === "failed"
                            ? "destructive"
                            : activity.status === "approved"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {activity.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Low Stock Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Low Stock Alerts - Raw Materials & Finished Goods
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <p>Loading low stock data...</p>
              </div>
            ) : lowStockItems.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  No low stock items found
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {lowStockItems.map((item, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge
                        variant={
                          item.type === "Raw Material" ? "secondary" : "outline"
                        }
                      >
                        {item.type}
                      </Badge>
                      <Badge variant="outline">{item.category}</Badge>
                    </div>

                    <div>
                      <h4 className="font-medium text-sm">{item.material}</h4>
                      <p className="text-xs text-muted-foreground">
                        {item.vendor}
                      </p>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <div>
                        <span className="font-medium">
                          Current: {item.current}
                        </span>
                      </div>
                      <div className="text-muted-foreground">
                        Need: {item.reorder}
                      </div>
                    </div>

                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${
                          item.current === 0
                            ? "bg-red-500"
                            : item.current < item.reorder * 0.5
                            ? "bg-orange-500"
                            : "bg-yellow-500"
                        }`}
                        style={{
                          width: `${Math.min(
                            (item.current / item.reorder) * 100,
                            100
                          )}%`,
                        }}
                      />
                    </div>

                    {item.type !== "Finished Good" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full"
                        onClick={() => openQuickPODialog(item)}
                      >
                        <ShoppingCart className="h-4 w-4 mr-1" />
                        Create PO
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick PO Dialog */}
      <Dialog
        open={quickPODialog.open}
        onOpenChange={(open) => setQuickPODialog({ open })}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Quick Purchase Order</DialogTitle>
          </DialogHeader>
          {quickPODialog.item && (
            <CreateQuickPOForm
              materialName={quickPODialog.item.material}
              materialId={quickPODialog.item.id}
              vendor={quickPODialog.item.vendor}
              currentStock={quickPODialog.item.current}
              minStock={quickPODialog.item.reorder}
              onSuccess={() => setQuickPODialog({ open: false })}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Receive Stock Dialog */}
      <Dialog open={isReceiveStockOpen} onOpenChange={setIsReceiveStockOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Receive Stock</DialogTitle>
          </DialogHeader>
          <ReceiveStockForm
            existingMaterials={existingMaterials}
            onSuccess={() => {
              setIsReceiveStockOpen(false);
            }}
            scannedPOId={scannedPOId}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
