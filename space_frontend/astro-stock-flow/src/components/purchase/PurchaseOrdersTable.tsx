import { useState, useEffect, useCallback } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertCircle,
  Pencil,
  Edit,
  QrCode,
  Eye,
  Calendar,
  Package,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { PaginationControls } from "../ui/pagination-controls";
import { EditPurchaseOrderForm } from "./EditPurchaseOrderForm";
import { UpdateReceivedForm } from "./UpdateReceivedForm";
import { useToast } from "@/hooks/use-toast";
import { BASE_URL } from "@/hooks/baseUrls";
import QRCode from "qrcode";
import { set } from "date-fns";


// Interfaces remain the same
interface PurchaseOrderItem {
  id: string;
  alias: string;
  description: string;
  quantity: number;
  receivedQuantity: number;
  unitPrice: number;
  status: "pending" | "partial" | "completed";
}

interface PurchaseOrder {
  id: string;
  poNumber: string;
  vendorName: string;
  orderDate: string;
  expectedDispatchDate: string;
  actualDispatchDate?: string;
  totalAmount: number;
  status: "pending" | "partial" | "completed" | "overdue";
  items: PurchaseOrderItem[];
  completionPercentage: number;
  notes?: string;
}

// Type for the raw API response
type ApiPurchaseOrder = {
  id: number;
  po_number: string;
  vendor_name: string;
  created_at: string;
  notes: string;
  expected_dispatch_date: string;
  actual_dispatch_date: string;
  grand_total: string;
  po_status: "pending" | "partial" | "completed" | "overdue";
  completion_percent: number;
  items: {
    id: number;
    alias: string;
    po_item_description: string;
    ordered_qty: string;
    received_qty: string;
    unit_price: string;
    po_id?: number;
    raw_material_description?: string;
    item_status: "pending" | "partial" | "completed";
  }[];
};

interface PurchaseOrdersTableProps {
  refreshTrigger: number;
  onStatsUpdate?: (purchaseOrders: any[]) => void;
  // onRefresh: () => void;
}

export const PurchaseOrdersTable = ({
  refreshTrigger,
  onStatsUpdate,
}: PurchaseOrdersTableProps) => {
  const { toast } = useToast();
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
  const [editPOOpen, setEditPOOpen] = useState(false);
  const [editingPO, setEditingPO] = useState<PurchaseOrder | null>(null);
  const [updateReceivedOpen, setUpdateReceivedOpen] = useState(false);
  const [forQrdata , setForQrdata] = useState([]);
  const [updatingItem, setUpdatingItem] = useState<PurchaseOrderItem | null>(
    null
  );
  const token = localStorage.getItem("token");

  const fetchPurchaseOrders = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `${BASE_URL}/purchase-orders/get-all/${token}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch purchase orders");
      }
      const data: ApiPurchaseOrder[] = await response.json();
      setForQrdata(data);
      console.log(data);
// alias: '',
      const mappedData: PurchaseOrder[] = data.map((po) => ({
        id: String(po.id),
        poNumber: po.po_number,
        vendorName: po.vendor_name,
        orderDate: po.created_at,
        notes: po.notes,
        expectedDispatchDate: po.expected_dispatch_date,
        actualDispatchDate:
          po.actual_dispatch_date === "0000-00-00"
            ? undefined
            : po.actual_dispatch_date,
        totalAmount: parseFloat(po.grand_total),
        status: po.po_status,
        completionPercentage: po.completion_percent,
        items: po.items.map((item) => ({
          id: String(item.po_id),
          alias: item.alias,
          description: item.raw_material_description,
          quantity: parseFloat(item.ordered_qty),
          receivedQuantity: parseFloat(item.received_qty),
          unitPrice: parseFloat(item.unit_price),
          status: item.item_status,
        })),
      }));

      setPurchaseOrders(mappedData);
        if (onStatsUpdate) {
          onStatsUpdate(data);
        }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
      toast({
        title: "Error",
        description: "Could not fetch purchase orders.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast, token]);

  useEffect(() => {
    fetchPurchaseOrders();
  }, [fetchPurchaseOrders, refreshTrigger]);

  // --- PAGINATION AND UTILITY FUNCTIONS ---
  const totalItems = purchaseOrders.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentData = purchaseOrders.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => setCurrentPage(page);
  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "default";
      case "partial":
        return "secondary";
      case "pending":
        return "outline";
      case "overdue":
        return "destructive";
      default:
        return "outline";
    }
  };

  const getDaysOverdue = (expectedDate: string) => {
    if (!expectedDate || new Date(expectedDate).getFullYear() < 2000) return 0;
    const expected = new Date(expectedDate);
    const today = new Date();
    const diffTime = today.getTime() - expected.getTime();
    return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  };

  const isValidDate = (dateString?: string) => {
    return dateString ? new Date(dateString).getFullYear() > 2000 : false;
  };

  // --- HANDLER FUNCTIONS ---
  const handleEditPO = (po: PurchaseOrder) => {
    setEditingPO(po);
    setEditPOOpen(true);
  };

  const handleUpdateReceived = (item: PurchaseOrderItem) => {
    setUpdatingItem(item);
    setUpdateReceivedOpen(true);
  };

 

  /**
   * Handles the API call to update the received quantity for a specific purchase order item.
   */
  const handleReceivedQuantityUpdate = async (
    itemId: string,
    newReceivedQuantity: number
  ) => {
    const formData = new FormData();
    formData.append("poItemId", itemId);
    formData.append("receivedQty", String(newReceivedQuantity));
    formData.append("token", token || "");

    try {
      const response = await fetch(
        `${BASE_URL}/purchase-orders/item/update-received-qty`,
        {
          method: "POST",
          body: formData,
        }
      );

      const result = await response.json();

      if (!response.ok || result.errFlag === 1) {
        throw new Error(
          result.message || "Failed to update received quantity."
        );
      }

      toast({
        title: "Success",
        description: "Item received quantity has been updated.",
      });

      onRefresh(); // Trigger a full data refresh to get the latest state
    } catch (error) {
      toast({
        title: "Update Failed",
        description:
          error instanceof Error ? error.message : "An unknown error occurred.",
        variant: "destructive",
      });
    }
  };

  const onRefresh = () => {
    fetchPurchaseOrders();
  };

  // --- RENDER LOGIC ---
  if (isLoading) {
    return <div>Loading Purchase Orders...</div>;
  }

  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  console.log(currentData);

function handleDownloadQrCode(po: PurchaseOrder) {
  // 1. Find the data
  const poData = forQrdata.find((item) => item.id === Number(po.id));
  if (!poData) return;

  // 2. ONLY store the unique identifier and maybe a type check
  // This results in a tiny string like: {"t":"PO","id":101}
  const qrData = {
    t: "PO", // Type: "Purchase Order" (useful if you scan other things later)
    id: poData.id, // The only thing you really need
    no: poData.po_number, // Optional: Just for human verification if needed
  };

  const qrDataString = JSON.stringify(qrData);

  // 3. Generate
  QRCode.toDataURL(qrDataString, { width: 300, margin: 2 })
    .then((url) => {
      const link = document.createElement("a");
      link.href = url;
      link.download = `PO-${poData.po_number}-QR.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    })
    .catch((err) => console.error(err));
}
  
  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>PO Number</TableHead>
              <TableHead>Vendor</TableHead>
              <TableHead>Order Date</TableHead>
              <TableHead>Expected Dispatch</TableHead>
              <TableHead>Actual Dispatch</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Completion</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentData.length > 0 ? (
              currentData.map((po) => (
                <TableRow key={po.id}>
                  <TableCell className="font-medium">{po.poNumber}</TableCell>
                  <TableCell>{po.vendorName}</TableCell>
                  <TableCell>
                    {isValidDate(po.orderDate)
                      ? new Date(po.orderDate).toLocaleDateString()
                      : "N/A"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {isValidDate(po.expectedDispatchDate) ? (
                        <>
                          <Calendar className="h-4 w-4" />
                          {new Date(
                            po.expectedDispatchDate
                          ).toLocaleDateString()}
                          {po.status === "overdue" && (
                            <Badge variant="destructive" className="text-xs">
                              {getDaysOverdue(po.expectedDispatchDate)}d overdue
                            </Badge>
                          )}
                        </>
                      ) : (
                        "N/A"
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {isValidDate(po.actualDispatchDate) ? (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {new Date(po.actualDispatchDate!).toLocaleDateString()}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">
                        Not dispatched
                      </span>
                    )}
                  </TableCell>
                  <TableCell>₹{po.totalAmount.toLocaleString()}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-12 bg-muted rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full"
                          style={{ width: `${po.completionPercentage}%` }}
                        />
                      </div>
                      <span className="text-sm">
                        {po.completionPercentage}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusColor(po.status)}>
                      {po.status.charAt(0).toUpperCase() + po.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditPO(po)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>

                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedPO(po)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>
                              Purchase Order Details - {selectedPO?.poNumber}
                            </DialogTitle>
                          </DialogHeader>
                          {selectedPO && (
                            <div className="space-y-6">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="text-sm font-medium">
                                    Vendor:
                                  </label>
                                  <p>{selectedPO.vendorName}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium">
                                    Total Amount:
                                  </label>
                                  <p>
                                    ₹{selectedPO.totalAmount.toLocaleString()}
                                  </p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium">
                                    Order Date:
                                  </label>
                                  <p>
                                    {isValidDate(selectedPO.orderDate)
                                      ? new Date(
                                          selectedPO.orderDate
                                        ).toLocaleDateString()
                                      : "N/A"}
                                  </p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium">
                                    Expected Dispatch:
                                  </label>
                                  <p>
                                    {isValidDate(
                                      selectedPO.expectedDispatchDate
                                    )
                                      ? new Date(
                                          selectedPO.expectedDispatchDate
                                        ).toLocaleDateString()
                                      : "N/A"}
                                  </p>
                                </div>
                              </div>
                              <div>
                                <h3 className="text-lg font-semibold mb-4">
                                  Items
                                </h3>
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Raw Material</TableHead>
                                      <TableHead>Alias Name</TableHead>
                                      <TableHead>Ordered</TableHead>
                                      <TableHead>Received</TableHead>
                                      <TableHead>Unit Price</TableHead>
                                      <TableHead>Status</TableHead>
                                      <TableHead>Actions</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {selectedPO.items.map((item) => (
                                      <TableRow key={item.id}>
                                        <TableCell>{item.id}</TableCell>
                                        <TableCell>{item.alias}</TableCell>
                                        <TableCell>{item.quantity}</TableCell>
                                        <TableCell>
                                          <div className="flex items-center gap-2">
                                            {item.receivedQuantity}
                                            {item.receivedQuantity <
                                              item.quantity && (
                                              <AlertCircle className="h-4 w-4 text-orange-500" />
                                            )}
                                          </div>
                                        </TableCell>
                                        <TableCell>₹{item.unitPrice}</TableCell>
                                        <TableCell>
                                          <Badge
                                            variant={getStatusColor(
                                              item.status
                                            )}
                                          >
                                            {item.status}
                                          </Badge>
                                        </TableCell>
                                        <TableCell>
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() =>
                                              handleUpdateReceived(item)
                                            }
                                          >
                                            <Package className="h-3 w-3 mr-1" />
                                            Update Received
                                          </Button>
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDownloadQrCode(po)}
                            >
                              <QrCode className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs">
                              Scan this QR code during delivery to verify the
                              package contents against your order.
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      {/* <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownloadPDF(po.poNumber)}
                      >
                        <Download className="h-4 w-4" />
                      </Button> */}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={9} className="h-24 text-center">
                  No purchase orders found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <PaginationControls
        currentPage={currentPage}
        totalPages={totalPages}
        pageSize={pageSize}
        totalItems={totalItems}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
      />

      <EditPurchaseOrderForm
        open={editPOOpen}
        onOpenChange={setEditPOOpen}
        purchaseOrder={editingPO}
        onSuccess={onRefresh}
      />

      <UpdateReceivedForm
        open={updateReceivedOpen}
        onOpenChange={setUpdateReceivedOpen}
        item={updatingItem}
        poNumber={selectedPO?.poNumber || ""}
        onUpdate={handleReceivedQuantityUpdate}
      />
    </div>
  );
};
