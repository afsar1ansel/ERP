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
  Truck,
  Package,
  CheckCircle,
  Clock,
  Search,
  ChevronDown,
  Plus,
  Filter,
} from "lucide-react";
import { PaginationControls } from "../components/ui/pagination-controls";
import { DispatchTable } from "@/components/dispatch/DispatchTable";
import { CreateDispatchForm } from "@/components/dispatch/CreateDispatchForm";
import { BASE_URL } from "@/hooks/baseUrls";

const Dispatch = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [createDispatchOpen, setCreateDispatchOpen] = useState(false);
  const [dispatches, setDispatches] = useState([]);
  const token = localStorage.getItem("token") || "";

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1);
  };

  useEffect(() => {
    fetchDispatches();
  }, []);

  const fetchDispatches = async () => {
    try {
      const response = await fetch(
        `${BASE_URL}/dispatch-orders/get-all/${token}`
      );
      const data = await response.json();
      console.log(data);
      setDispatches(data);
    } catch (error) {
      console.error("Error fetching dispatches:", error);
    }
  };

  const pendingCount = dispatches.filter(
    (d) => (d.dispatch_status || "").toLowerCase() === "pending"
  ).length;
  const packedCount = dispatches.filter(
    (d) => (d.dispatch_status || "").toLowerCase() === "packed"
  ).length;
  const shippedCount = dispatches.filter(
    (d) => (d.dispatch_status || "").toLowerCase() === "shipped"
  ).length;
  const deliveredCount = dispatches.filter(
    (d) => (d.dispatch_status || "").toLowerCase() === "delivered"
  ).length;

  const quickStats = [
    {
      title: "Pending Dispatches",
      value: pendingCount,
      icon: Clock,
      color: "text-warning",
    },
    {
      title: "Packed Orders",
      value: packedCount,
      icon: Package,
      color: "text-primary",
    },
    {
      title: "Shipped Today",
      value: shippedCount,
      icon: Truck,
      color: "text-secondary",
    },
    {
      title: "Delivered",
      value: deliveredCount,
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
              Dispatch Management
            </h1>
            <p className="text-muted-foreground">
              Manage outbound shipments, track delivery status, and coordinate
              dispatch operations
            </p>
          </div>
          <Button onClick={() => setCreateDispatchOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Dispatch
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

        {/* Dispatch Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Dispatch Orders</CardTitle>
              <div className="flex items-center gap-2">
                <div className="relative max-w-sm">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search dispatches..."
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
                    <DropdownMenuItem onClick={() => setStatusFilter("packed")}>
                      Packed
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setStatusFilter("shipped")}
                    >
                      Shipped
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setStatusFilter("delivered")}
                    >
                      Delivered
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <DispatchTable
              dispatches={dispatches}
              searchTerm={searchTerm}
              statusFilter={statusFilter}
              currentPage={currentPage}
              pageSize={pageSize}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
              fetchDispatches={fetchDispatches}
            />
          </CardContent>
        </Card>
      </div>

      <CreateDispatchForm
        open={createDispatchOpen}
        onOpenChange={setCreateDispatchOpen}
        fetchDispatches={fetchDispatches}
      />
    </MainLayout>
  );
};

export default Dispatch;
