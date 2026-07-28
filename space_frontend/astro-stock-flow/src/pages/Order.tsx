// src/pages/Order.tsx

import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ClipboardList, // Pending
  CheckCircle, // Completed
  Factory, // In Production
  MessageSquare, // Confirmed
  Search,
  ChevronDown,
  Plus,
  Filter,
  Ban, // Cancelled
} from "lucide-react";
import { OrderTable } from "@/components/order/OrderTable";
import { OrderForm } from "@/components/order/OrderForm"; // Form handles both create/edit
import { BASE_URL } from "@/hooks/baseUrls";

// Define the Order interface
interface Order {
  id: number;
  order_code: string; // Updated column name
  client_name: string | null;
  client_id?: number;
  expected_delivery_date: string;
  quantity: number; // Updated column name
  order_status:
  | "pending"
  | "confirmed"
  | "in_production"
  | "completed"
  | "cancelled";
  product_sku_id?: number;
  product_name?: string;
  raw_materials_json?: any;
  notes?: string;
  created_at: string;
}

const OrderPage = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [createOrderOpen, setCreateOrderOpen] = useState(false);
  // Initialized as an empty array, matching the expected type
  const [orders, setOrders] = useState<Order[]>([]);
  const token = localStorage.getItem("token") || "";

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1);
  };

  const fetchOrders = async () => {
    try {
      const response = await fetch(`${BASE_URL}/orders/get-all/${token}`);
      const data = await response.json();

      // FIX 1: Safely extract the data array from the API response
      if (data && data.errFlag === 0 && Array.isArray(data.data)) {
        setOrders(data.data);
      } else {
        console.error("API did not return a valid data array:", data);
        setOrders([]);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // --- Quick Stats Calculation (Updated Statuses) ---
  const pendingCount = orders.filter(
    (o) => o.order_status === "pending"
  ).length;
  const confirmedCount = orders.filter(
    (o) => o.order_status === "confirmed"
  ).length;
  const inProductionCount = orders.filter(
    // Renamed
    (o) => o.order_status === "in_production"
  ).length;
  const completedCount = orders.filter(
    (o) => o.order_status === "completed"
  ).length;

  const quickStats = [
    {
      title: "New Orders (Pending)",
      value: pendingCount,
      icon: ClipboardList,
      color: "text-warning",
    },
    {
      title: "Confirmed Orders",
      value: confirmedCount,
      icon: MessageSquare,
      color: "text-info",
    },
    {
      title: "In Production", // Renamed label
      value: inProductionCount,
      icon: Factory, // Changed Icon
      color: "text-primary",
    },
    {
      title: "Completed Orders",
      value: completedCount,
      icon: CheckCircle,
      color: "text-success",
    },
  ];

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Production Order Management
            </h1>
            <p className="text-muted-foreground">
              Manage incoming customer orders and track their production status.
            </p>
          </div>
          <Button onClick={() => setCreateOrderOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create New Order
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {quickStats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Order Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Customer Orders</CardTitle>
              <div className="flex items-center gap-2">
                <div className="relative max-w-sm">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search orders..."
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline">
                      <Filter className="h-4 w-4 mr-2" />
                      Status
                      <ChevronDown className="h-4 w-4 ml-2" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setStatusFilter("all")}>
                      All Status
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setStatusFilter("pending")}
                    >
                      Pending
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setStatusFilter("confirmed")}
                    >
                      Confirmed
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setStatusFilter("in_production")} // Updated Status
                    >
                      In Production
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setStatusFilter("completed")}
                    >
                      Completed
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setStatusFilter("cancelled")}
                    >
                      Cancelled
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <OrderTable
              orders={orders}
              searchTerm={searchTerm}
              statusFilter={statusFilter}
              currentPage={currentPage}
              pageSize={pageSize}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
              fetchOrders={fetchOrders}
            />
          </CardContent>
        </Card>
      </div>

      <OrderForm
        open={createOrderOpen}
        onOpenChange={setCreateOrderOpen}
        fetchOrders={fetchOrders}
        mode="create"
        initialOrder={null}
      />
    </MainLayout>
  );
};

export default OrderPage;
