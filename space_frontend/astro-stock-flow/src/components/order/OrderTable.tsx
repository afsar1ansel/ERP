// src/components/order/OrderTable.tsx

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Eye, Edit, MoreHorizontal, XCircle, Factory } from "lucide-react";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { useToast } from "@/hooks/use-toast";
import { OrderForm } from "./OrderForm";
import { BASE_URL } from "@/hooks/baseUrls";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";
// --- Interfaces ---
interface OrderItem {
  sku: string;
  productName: string;
  quantity: number;
}

interface OrderData {
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
  | "cancelled"; // Updated Statuses
  product_sku_id?: number;
  product_name?: string;
  raw_materials_json?: any; // The backend should return this parsed, but handling as string/JSON array just in case
  notes?: string;
  created_at: string;
}

interface OrderTableProps {
  orders: OrderData[];
  searchTerm: string;
  statusFilter: string;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  fetchOrders: () => void;
}

export const OrderTable = ({
  orders,
  searchTerm,
  statusFilter,
  currentPage,
  pageSize,
  onPageChange,
  onPageSizeChange,
  fetchOrders,
}: OrderTableProps) => {
  const { toast } = useToast();
  const [viewDetailsOpen, setViewDetailsOpen] = useState(false);
  const [editOrderOpen, setEditOrderOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderData | null>(null);
  const token = localStorage.getItem("token") || "";
  const navigate = useNavigate();

  // Filter and paginate data
  const filteredData = orders.filter((order) => {
    const matchesSearch =
      (order.client_name || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      order.order_code.toLowerCase().includes(searchTerm.toLowerCase()) || // Updated column name
      (order.product_name || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || order.order_status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const totalItems = filteredData.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentData = filteredData.slice(startIndex, endIndex);

  // --- Handlers ---
  const handleViewDetails = (order: OrderData) => {
    setSelectedOrder(order);
    setViewDetailsOpen(true);
  };

  const handleEditOrder = (order: OrderData) => {
    setSelectedOrder(order);
    setEditOrderOpen(true);
  };

  const handleCancelOrder = async (orderId: number) => {
    const confirmation = window.confirm(
      `Are you sure you want to cancel order ${orderId}?`
    );
    if (!confirmation) return;

    try {
      const form = new FormData();
      form.append("orderId", String(orderId));
      form.append("cancelReason", "User cancelled from UI");
      form.append("token", token);

      const response = await fetch(`${BASE_URL}/orders/cancel`, {
        method: "POST",
        body: form,
      });

      const data = await response.json();

      if (data.errFlag === 0) {
        toast({
          title: "Order Cancelled",
          description: `Order ${orderId} has been cancelled successfully.`,
        });
        fetchOrders(); // Refresh data
      } else {
        toast({
          title: "Cancellation Failed",
          description: data.message || "Failed to cancel the order.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error cancelling order:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred during cancellation.",
        variant: "destructive",
      });
    }
  };

  const getRawMaterials = (order: OrderData): OrderItem[] => {
    try {
      if (
        order.raw_materials_json &&
        typeof order.raw_materials_json === "string"
      ) {
        return JSON.parse(order.raw_materials_json);
      }
      return order.raw_materials_json || [];
    } catch (e) {
      console.error("Error parsing raw_materials_json:", e);
      return [];
    }
  };

  const handleMoveToProduction = (order: OrderData) => {
    console.log("Move to Production - order id:", order.id);
    // Option A: pass via location state
    navigate("/production", { state: { orderId: order.id } });

    // Option B: pass via query param instead (uncomment to use)
    // navigate(`/production?orderId=${order.id}`);
  };

  const getStatusBadgeStyles = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-yellow-200";
      case "confirmed":
        return "bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-200";
      case "in_production":
        return "bg-purple-100 text-purple-800 hover:bg-purple-100 border-purple-200";
      case "completed":
        return "bg-green-100 text-green-800 hover:bg-green-100 border-green-200";
      case "cancelled":
        return "bg-red-100 text-red-800 hover:bg-red-100 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-100 border-gray-200";
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Reference ID</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Est. Delivery</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentData.map((order) => (
              <TableRow key={order.id}>
                <TableCell>
                  <div className="font-medium">{order.order_code}</div>{" "}
                  {/* Updated column name */}
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">
                      {order.client_name || "N/A"}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    {order.product_name || (
                      <Badge variant="secondary">Custom/Raw Mat.</Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="font-medium">
                  {order.quantity?.toLocaleString()} units{" "}
                  {/* Updated column name */}
                </TableCell>
                <TableCell className="text-sm">
                  {new Date(order.expected_delivery_date).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  {/* <OrderStatusBadge status={order.order_status} /> */}
                  <Badge variant="outline" className={getStatusBadgeStyles(order.order_status)}>
                    {order.order_status.replace("_", " ").toUpperCase()}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm">
                  {new Date(order.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => handleViewDetails(order)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
                      {/* Only allow editing if not completed or cancelled */}
                      {order.order_status !== "completed" &&
                        order.order_status !== "cancelled" && (
                          <DropdownMenuItem
                            onClick={() => handleEditOrder(order)}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Order
                          </DropdownMenuItem>
                        )}
                      {/* Allow cancellation if not completed or already cancelled */}
                      {order.order_status !== "completed" &&
                        order.order_status !== "cancelled" && (
                          <DropdownMenuItem
                            onClick={() => handleCancelOrder(order.id)}
                            className="text-red-600 hover:text-red-600"
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Cancel Order
                          </DropdownMenuItem>
                        )}
                      {order.order_status === "confirmed" && (
                        <DropdownMenuItem
                          onClick={() =>
                            toast({
                              title: "Start Production",
                              description:
                                "Marking order as in production is not implemented yet",
                            })
                          }
                        >
                          <Factory className="h-4 w-4 mr-2" />
                          Start Production
                        </DropdownMenuItem>
                      )}

                      {/* New: Move to Production */}
                      {order.order_status !== "cancelled" && (

                        <DropdownMenuItem
                          onClick={() => handleMoveToProduction(order)}
                        >
                          <Factory className="h-4 w-4 mr-2" />
                          Move to Production
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <PaginationControls
        currentPage={currentPage}
        totalPages={totalPages}
        pageSize={pageSize}
        totalItems={totalItems}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
      />

      {/* View Details Dialog */}
      <Dialog open={viewDetailsOpen} onOpenChange={setViewDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Order Details - {selectedOrder?.order_code}
            </DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">Client</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedOrder.client_name || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Status</p>
                  {/* <OrderStatusBadge status={selectedOrder.order_status} /> */}
                  <Badge variant="secondary">
                    {selectedOrder.order_status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium">Order Date</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(selectedOrder.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Total Quantity</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedOrder.quantity?.toLocaleString()} units
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Expected Delivery</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(
                      selectedOrder.expected_delivery_date
                    ).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Product/Items Details */}
              <div>
                <p className="text-sm font-medium mb-2">Ordered Item(s)</p>
                <div className="border rounded-lg p-3">
                  {selectedOrder.product_sku_id ? (
                    <p className="font-medium">
                      {selectedOrder.product_name || "N/A"} (
                      {selectedOrder.quantity} units)
                    </p>
                  ) : getRawMaterials(selectedOrder)?.length ? (
                    <ul className="list-disc ml-4 space-y-1 text-sm text-muted-foreground">
                      {getRawMaterials(selectedOrder).map((item, index) => (
                        <li key={index}>
                          {item.productName} ({item.quantity} units)
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">
                      Product details not available or custom order.
                    </p>
                  )}
                </div>
              </div>

              {selectedOrder.notes && (
                <div>
                  <p className="text-sm font-medium">Notes</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedOrder.notes}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Order Form - uses the same form component */}
      <OrderForm
        open={editOrderOpen}
        onOpenChange={setEditOrderOpen}
        fetchOrders={fetchOrders}
        mode="edit"
        initialOrder={selectedOrder}
      />
    </div>
  );
};
