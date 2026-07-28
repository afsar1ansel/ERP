import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Edit, Download, Eye, Calendar, Package, AlertCircle } from "lucide-react";
import { PaginationControls } from "../ui/pagination-controls";

interface PurchaseOrderItem {
  id: string;
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
}

const mockPurchaseOrders: PurchaseOrder[] = [
  {
    id: "1",
    poNumber: "PO-2024-001",
    vendorName: "ABC Leather Suppliers",
    orderDate: "2024-01-15",
    expectedDispatchDate: "2024-01-25",
    actualDispatchDate: "2024-01-27",
    totalAmount: 25000,
    status: "partial",
    completionPercentage: 60,
    items: [
      { id: "1", description: "Genuine Leather Sheets", quantity: 50, receivedQuantity: 30, unitPrice: 400, status: "partial" },
      { id: "2", description: "Leather Dye - Black", quantity: 10, receivedQuantity: 10, unitPrice: 500, status: "completed" },
      { id: "3", description: "Leather Tools Set", quantity: 5, receivedQuantity: 0, unitPrice: 1000, status: "pending" }
    ]
  },
  {
    id: "2", 
    poNumber: "PO-2024-002",
    vendorName: "XYZ Hardware Co.",
    orderDate: "2024-01-20",
    expectedDispatchDate: "2024-01-30",
    totalAmount: 15000,
    status: "overdue",
    completionPercentage: 0,
    items: [
      { id: "4", description: "Metal Buckles - Silver", quantity: 100, receivedQuantity: 0, unitPrice: 50, status: "pending" },
      { id: "5", description: "Zipper Pulls", quantity: 200, receivedQuantity: 0, unitPrice: 25, status: "pending" }
    ]
  },
  {
    id: "3",
    poNumber: "PO-2024-003", 
    vendorName: "Quality Fabric Mills",
    orderDate: "2024-01-25",
    expectedDispatchDate: "2024-02-05",
    actualDispatchDate: "2024-02-03",
    totalAmount: 35000,
    status: "completed",
    completionPercentage: 100,
    items: [
      { id: "6", description: "Cotton Canvas - Navy", quantity: 200, receivedQuantity: 200, unitPrice: 150, status: "completed" },
      { id: "7", description: "Thread Spools", quantity: 50, receivedQuantity: 50, unitPrice: 100, status: "completed" }
    ]
  }
];

export const PurchaseOrdersTable = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
  const [editingItem, setEditingItem] = useState<{ poId: string; itemId: string; description: string } | null>(null);

  const totalItems = mockPurchaseOrders.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentData = mockPurchaseOrders.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "default";
      case "partial": return "secondary";
      case "pending": return "outline";
      case "overdue": return "destructive";
      default: return "outline";
    }
  };

  const handleDownloadPDF = (poNumber: string) => {
    // Mock PDF download
    console.log(`Downloading PDF for ${poNumber}`);
    // In real implementation, this would generate and download a PDF
  };

  const handleEditDescription = (poId: string, itemId: string, currentDescription: string) => {
    setEditingItem({ poId, itemId, description: currentDescription });
  };

  const handleSaveDescription = () => {
    if (editingItem) {
      console.log("Saving description:", editingItem);
      // In real implementation, this would update the backend
      setEditingItem(null);
    }
  };

  const getDaysOverdue = (expectedDate: string) => {
    const expected = new Date(expectedDate);
    const today = new Date();
    const diffTime = today.getTime() - expected.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

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
            {currentData.map((po) => (
              <TableRow key={po.id}>
                <TableCell className="font-medium">{po.poNumber}</TableCell>
                <TableCell>{po.vendorName}</TableCell>
                <TableCell>{new Date(po.orderDate).toLocaleDateString()}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {new Date(po.expectedDispatchDate).toLocaleDateString()}
                    {po.status === "overdue" && (
                      <Badge variant="destructive" className="text-xs">
                        {getDaysOverdue(po.expectedDispatchDate)}d overdue
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {po.actualDispatchDate ? (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {new Date(po.actualDispatchDate).toLocaleDateString()}
                    </div>
                  ) : (
                    <span className="text-muted-foreground">Not dispatched</span>
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
                    <span className="text-sm">{po.completionPercentage}%</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusColor(po.status)}>
                    {po.status.charAt(0).toUpperCase() + po.status.slice(1)}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end space-x-1">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="sm" onClick={() => setSelectedPO(po)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Purchase Order Details - {po.poNumber}</DialogTitle>
                        </DialogHeader>
                        {selectedPO && (
                          <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="text-sm font-medium">Vendor:</label>
                                <p>{selectedPO.vendorName}</p>
                              </div>
                              <div>
                                <label className="text-sm font-medium">Total Amount:</label>
                                <p>₹{selectedPO.totalAmount.toLocaleString()}</p>
                              </div>
                              <div>
                                <label className="text-sm font-medium">Order Date:</label>
                                <p>{new Date(selectedPO.orderDate).toLocaleDateString()}</p>
                              </div>
                              <div>
                                <label className="text-sm font-medium">Expected Dispatch:</label>
                                <p>{new Date(selectedPO.expectedDispatchDate).toLocaleDateString()}</p>
                              </div>
                            </div>
                            
                            <div>
                              <h3 className="text-lg font-semibold mb-4">Items</h3>
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Description</TableHead>
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
                                      <TableCell>
                                        {editingItem?.itemId === item.id ? (
                                          <div className="flex gap-2">
                                            <Input
                                              value={editingItem.description}
                                              onChange={(e) => setEditingItem({
                                                ...editingItem,
                                                description: e.target.value
                                              })}
                                            />
                                            <Button size="sm" onClick={handleSaveDescription}>
                                              Save
                                            </Button>
                                            <Button 
                                              size="sm" 
                                              variant="outline" 
                                              onClick={() => setEditingItem(null)}
                                            >
                                              Cancel
                                            </Button>
                                          </div>
                                        ) : (
                                          <div className="flex items-center justify-between">
                                            <span>{item.description}</span>
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              onClick={() => handleEditDescription(selectedPO.id, item.id, item.description)}
                                            >
                                              <Edit className="h-3 w-3" />
                                            </Button>
                                          </div>
                                        )}
                                      </TableCell>
                                      <TableCell>{item.quantity}</TableCell>
                                      <TableCell>
                                        <div className="flex items-center gap-2">
                                          {item.receivedQuantity}
                                          {item.receivedQuantity < item.quantity && (
                                            <AlertCircle className="h-4 w-4 text-warning" />
                                          )}
                                        </div>
                                      </TableCell>
                                      <TableCell>₹{item.unitPrice}</TableCell>
                                      <TableCell>
                                        <Badge variant={getStatusColor(item.status)}>
                                          {item.status}
                                        </Badge>
                                      </TableCell>
                                      <TableCell>
                                        <Button size="sm" variant="outline">
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
                    <Button variant="ghost" size="sm" onClick={() => handleDownloadPDF(po.poNumber)}>
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
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
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
      />
    </div>
  );
};