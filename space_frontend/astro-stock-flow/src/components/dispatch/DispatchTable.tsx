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
import {
  Eye,
  Edit,
  Truck,
  Package,
  Printer,
  MoreHorizontal,
} from "lucide-react";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { DispatchStatusBadge } from "./DispatchStatusBadge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { EditDispatchForm } from "./EditDispatchForm";

// Interface for the nested items in a dispatch order
interface DispatchItem {
  id: number;
  product_name: string;
  product_id: number; // Using product_id as SKU
  ordered_quantity: string;
  unit_price: string;
  total: string;
  available_unit: string; // Corrected: Removed duplicate 'availableUnit'
  // Add other item properties from your data if needed
}

// Corrected interface to match your actual data structure
interface DispatchOrder {
  id: number;
  dispatch_id?: string;
  order_reference: string;
  customer_name: string | null;
  customer_id?: number;
  shipping_address: string;
  items: DispatchItem[];
  grand_total: string;
  priority: string; // e.g., "High", "Medium", "Low"
  dispatch_status: "pending" | "packed" | "shipped" | "delivered";
  created_at: string;
  no_of_boxes: number; // <-- 1. ADDED no_of_boxes TO INTERFACE
  tracking?: string;
  notes?: string;
}

interface DispatchTableProps {
  dispatches: DispatchOrder[];
  searchTerm: string;
  statusFilter: string;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  fetchDispatches: () => void;
}

interface CreateDispatchFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fetchDispatches: () => void;
}

export const DispatchTable = ({
  dispatches,
  searchTerm,
  statusFilter,
  currentPage,
  pageSize,
  onPageChange,
  onPageSizeChange,
  fetchDispatches,
}: DispatchTableProps) => {
  const { toast } = useToast();
  const [viewDetailsOpen, setViewDetailsOpen] = useState(false);
  const [editOrderOpen, setEditOrderOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<DispatchOrder | null>(
    null
  );

  // FIX: Safely filter data by checking for null customer_name
  const filteredData = dispatches.filter((order) => {
    const matchesSearch =
      (order.customer_name || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      order.order_reference.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" ||
      (order.dispatch_status || "").toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  const totalItems = filteredData.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentData = filteredData.slice(startIndex, endIndex);

  // FIX: Make priority check case-insensitive
  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "high":
        return "destructive";
      case "medium":
        return "secondary";
      case "low":
        return "outline";
      default:
        return "outline";
    }
  };

  // FIX: Parse string quantity to number for calculation
  const getTotalItemsCount = (items: DispatchItem[]) => {
    if (!Array.isArray(items)) return 0;
    return items.reduce(
      (total, item) => total + parseFloat(item.ordered_quantity || "0"),
      0
    );
  };

  const handleViewDetails = (order: DispatchOrder) => {
    setSelectedOrder(order);
    setViewDetailsOpen(true);
  };

  const handleEditOrder = (order: DispatchOrder) => {
    setSelectedOrder(order);
    setEditOrderOpen(true);
  };

  const handlePrintLabel = (order: DispatchOrder) => {
    toast({
      title: "Print Label",
      description: `Printing shipping label for ${order.id}`,
    });
  };

  const handleMarkAsPacked = (order: DispatchOrder) => {
    toast({
      title: "Status Updated",
      description: `${order.id} marked as packed`,
    });
  };

  const handleMarkAsShipped = (order: DispatchOrder) => {
    toast({
      title: "Status Updated",
      description: `${order.id} marked as shipped`,
    });
  };

  // Map selectedOrder to EditDispatchForm's expected shape
  const mappedOrder = selectedOrder && {
    id: String(selectedOrder.id),
    order_reference: selectedOrder.order_reference,
    customer_name: selectedOrder.customer_name ?? "",
    customer_id: selectedOrder.customer_id,
    customerAddress: selectedOrder.shipping_address ?? "",
    noOfBox: selectedOrder.no_of_boxes, // <-- 2. ADDED no_of_boxes TO EDIT PAYLOAD
    items: selectedOrder.items.map((item) => ({
      productName: item.product_name,
      productId: item.product_id,
      sku: String(item.product_id),
      orderedQuantity: parseFloat(item.ordered_quantity),
      unitPrice: parseFloat(item.unit_price),
      availableUnit: parseFloat(item.available_unit),
      total:
        item.total !== undefined
          ? parseFloat(item.total)
          : parseFloat(item.ordered_quantity) * parseFloat(item.unit_price),
    })),
    grand_total: parseFloat(selectedOrder.grand_total),
    priority:
      (selectedOrder.priority?.toLowerCase() as "high" | "medium" | "low") ??
      "medium",
    dispatch_status: selectedOrder.dispatch_status,
    createdDate: selectedOrder.created_at,
    shippedDate: undefined,
    estimatedDelivery: undefined,
    tracking: selectedOrder.tracking,
    notes: selectedOrder.notes,
  };

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Dispatch ID</TableHead>
              <TableHead>Order Reference</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Items</TableHead>
              {/* <TableHead>Boxes</TableHead> */}
              <TableHead>Total Value</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created Date</TableHead>
              <TableHead>Tracking</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentData.map((order) => (
              <TableRow key={order.id}>
                <TableCell>
                  <div className="font-mono text-sm font-medium">
                    {order.dispatch_id === "0" ? "-" : order.dispatch_id}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="font-medium">{order.order_reference}</div>
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">
                      {order.customer_name || "N/A"}
                    </div>
                    {/* FIX: Use correct property 'shipping_address' */}
                    <div
                      className="text-sm text-muted-foreground max-w-48 truncate"
                      title={order.shipping_address}
                    >
                      {order.shipping_address}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    <div>{getTotalItemsCount(order.items)} items</div>
                    <div className="text-xs text-muted-foreground">
                      {order.no_of_boxes} boxes
                    </div>
                  </div>
                </TableCell>
                <TableCell className="font-medium">
                  ₹{parseFloat(order.grand_total).toLocaleString()}
                </TableCell>
                <TableCell>
                  {/* FIX: Pass lowercase priority to color function */}
                  <Badge variant={getPriorityColor(order.priority)}>
                    {order.priority.charAt(0).toUpperCase() +
                      order.priority.slice(1)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <DispatchStatusBadge status={order.dispatch_status} />
                </TableCell>
                <TableCell className="text-sm">
                  {/* FIX: Use correct property 'created_at' */}
                  {new Date(order.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-sm">
                  {order.tracking ? (
                    <div className="font-mono">{order.tracking}</div>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
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
                      <DropdownMenuItem onClick={() => handleEditOrder(order)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Order
                      </DropdownMenuItem>
                      {/* <DropdownMenuItem onClick={() => handlePrintLabel(order)}>
                        <Printer className="h-4 w-4 mr-2" />
                        Print Label
                      </DropdownMenuItem> */}
                      {/* {order.dispatch_status === "pending" && (
                        <DropdownMenuItem
                          onClick={() => handleMarkAsPacked(order)}
                        >
                  -       <Package className="h-4 w-4 mr-2" />
                          Mark as Packed
                        </DropdownMenuItem>
                      )}
                      {order.dispatch_status === "packed" && (
                        <DropdownMenuItem
                          onClick={() => handleMarkAsShipped(order)}
                        >
                          <Truck className="h-4 w-4 mr-2" />
                          Mark as Shipped
          _             </DropdownMenuItem>
                      )} */}
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
              Dispatch Order Details - {selectedOrder?.order_reference}
            </DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">Order Reference</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedOrder.order_reference}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Status</p>
                  <DispatchStatusBadge status={selectedOrder.dispatch_status} />
                </div>
                <div>
                  <p className="text-sm font-medium">Customer</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedOrder.customer_name || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Total Value</p>
                  <p className="text-sm text-muted-foreground">
                    ₹{parseFloat(selectedOrder.grand_total).toLocaleString()}
                  </p>
                </div>
                {/* <-- 5. ADDED no_of_boxes TO DETAILS DIALOG --> */}
                <div>
                  <p className="text-sm font-medium">No. of Boxes</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedOrder.no_of_boxes}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm font-medium">Address</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedOrder.shipping_address}
                  </p>
                </div>
                {selectedOrder.tracking && (
                  <div>
                    <p className="text-sm font-medium">Tracking Number</p>
                    <p className="text-sm text-muted-foreground font-mono">
                      {selectedOrder.tracking}
                    </p>
                  </div>
                )}
                {selectedOrder.notes && (
                  <div className="col-span-2">
                    <p className="text-sm font-medium">Notes</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedOrder.notes}
                    </p>
                  </div>
                )}
              </div>

              <div>
                <p className="text-sm font-medium mb-2">Items</p>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>SKU</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Unit Price</TableHead>
                        <TableHead>Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedOrder.items.map((item, index) => (
                        <TableRow key={index}>
                          {/* FIX: Use correct property names from item object */}
                          <TableCell className="font-medium">
                            {item.product_name}
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {item.product_id}
                          </TableCell>
                          <TableCell>{item.ordered_quantity}</TableCell>
                          <TableCell>
                            ₹{parseFloat(item.unit_price).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            ₹
                            {(
                              parseFloat(item.ordered_quantity) *
                              parseFloat(item.unit_price)
                            ).toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Order Form */}
      <EditDispatchForm
        open={editOrderOpen}
        onOpenChange={setEditOrderOpen}
        order={mappedOrder}
        fetchDispatches={fetchDispatches}
      />
    </div>
  );
};
