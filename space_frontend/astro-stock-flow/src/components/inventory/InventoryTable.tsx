import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { StockAdjustmentForm } from "./StockAdjustmentForm";
import { Search, Filter, Download, Plus, Eye, Edit, Package, BarChart3, ArrowRightLeft, MoreHorizontal } from "lucide-react";

const inventoryData = [
  {
    id: "SL-BAG-001",
    name: "Professional Laptop Bag",
    brand: "Bean Good Specialty",

    variant: "Black - 15 inch",
    currentStock: 145,
    reorderLevel: 50,
    location: "WH-A1-B2",
    lastUpdated: "2024-03-15",
    status: "Available"
  },
  {
    id: "SL-BAG-002", 
    name: "Travel Duffel Bag",
    brand: "Bean Good Specialty",

    variant: "Navy Blue - Large",
    currentStock: 23,
    reorderLevel: 30,
    location: "WH-A2-B1",
    lastUpdated: "2024-03-14",
    status: "Low Stock"
  },
  {
    id: "BA-001",
    name: "Executive Briefcase",
    brand: "Brand Alpha",
    variant: "Brown Leather",
    currentStock: 87,
    reorderLevel: 25,
    location: "WH-B1-A1",
    lastUpdated: "2024-03-15",
    status: "Available"
  },
  {
    id: "BB-002",
    name: "Student Backpack",
    brand: "Brand Beta", 
    variant: "Multi-color",
    currentStock: 5,
    reorderLevel: 20,
    location: "WH-B2-A3",
    lastUpdated: "2024-03-13",
    status: "Critical"
  }
];

export function InventoryTable() {
  const { toast } = useToast();
  const [viewDetailsOpen, setViewDetailsOpen] = useState(false);
  const [stockAdjustmentOpen, setStockAdjustmentOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<typeof inventoryData[0] | null>(null);

  const handleViewDetails = (item: typeof inventoryData[0]) => {
    setSelectedItem(item);
    setViewDetailsOpen(true);
  };

  const handleStockAdjustment = (item: typeof inventoryData[0]) => {
    setSelectedItem(item);
    setStockAdjustmentOpen(true);
  };

  const handleTransferStock = (item: typeof inventoryData[0]) => {
    toast({
      title: "Stock Transfer",
      description: `Opening stock transfer for ${item.name}`,
    });
  };

  const handlePrintBarcode = (item: typeof inventoryData[0]) => {
    toast({
      title: "Print Barcode",
      description: `Printing barcode for ${item.id}`,
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Finished Goods Inventory</CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by SKU, name, or brand..."
              className="pl-10"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>SKU</TableHead>
              <TableHead>Product Name</TableHead>
              <TableHead>Brand</TableHead>
              <TableHead>Variant</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Updated</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {inventoryData.map((item) => (
              <TableRow key={item.id} className="hover:bg-muted/50">
                <TableCell className="font-medium">{item.id}</TableCell>
                <TableCell>{item.name}</TableCell>
                <TableCell>{item.brand}</TableCell>
                <TableCell className="text-muted-foreground">{item.variant}</TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">{item.currentStock}</span>
                    <span className="text-xs text-muted-foreground">Min: {item.reorderLevel}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{item.location}</Badge>
                </TableCell>
                <TableCell>
                  <Badge 
                    variant={
                      item.status === "Critical" ? "destructive" :
                      item.status === "Low Stock" ? "secondary" : "default"
                    }
                  >
                    {item.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {item.lastUpdated}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleViewDetails(item)}>
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleStockAdjustment(item)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Adjust Stock
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleTransferStock(item)}>
                        <ArrowRightLeft className="h-4 w-4 mr-2" />
                        Transfer Stock
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handlePrintBarcode(item)}>
                        <BarChart3 className="h-4 w-4 mr-2" />
                        Print Barcode
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
      
      {/* View Details Dialog */}
      <Dialog open={viewDetailsOpen} onOpenChange={setViewDetailsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Inventory Details - {selectedItem?.name}</DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">SKU</p>
                  <p className="text-sm text-muted-foreground">{selectedItem.id}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Brand</p>
                  <p className="text-sm text-muted-foreground">{selectedItem.brand}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Current Stock</p>
                  <p className="text-sm text-muted-foreground">{selectedItem.currentStock} units</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Reorder Level</p>
                  <p className="text-sm text-muted-foreground">{selectedItem.reorderLevel} units</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Location</p>
                  <p className="text-sm text-muted-foreground">{selectedItem.location}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Status</p>
                  <Badge variant={selectedItem.status === "Critical" ? "destructive" : selectedItem.status === "Low Stock" ? "secondary" : "default"}>
                    {selectedItem.status}
                  </Badge>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Stock Adjustment Form */}
      <StockAdjustmentForm 
        open={stockAdjustmentOpen} 
        onOpenChange={setStockAdjustmentOpen} 
      />
    </Card>
  );
}