import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Package, AlertTriangle, TrendingUp, Warehouse, Search, Edit, Eye, ChevronDown, ShoppingBag, FileEdit, ArrowRightLeft, Truck } from "lucide-react";
import { PaginationControls } from "../components/ui/pagination-controls";
import { ReceiveFromProductionForm } from "@/components/inventory/ReceiveFromProductionForm";
import { StockAdjustmentForm } from "@/components/inventory/StockAdjustmentForm";
import { TransferStockForm } from "@/components/inventory/TransferStockForm";
import { QuickDispatchForm } from "@/components/inventory/QuickDispatchForm";

const quickStats = [
  {
    title: "Total SKUs",
    value: "1,247",
    icon: Package,
    color: "text-primary"
  },
  {
    title: "Low Stock Items",
    value: "23",
    icon: AlertTriangle,
    color: "text-destructive"
  },
  {
    title: "Storage Locations",
    value: "8",
    icon: Warehouse,
    color: "text-success"
  },
  {
    title: "Fast Moving",
    value: "156",
    icon: TrendingUp,
    color: "text-warning"
  }
];

interface FinishedGood {
  id: string;
  name: string;
  sku: string;
  brand: string;
  category: string;
  stockQuantity: number;
  minStockLevel: number;
  maxStockLevel: number;
  storageLocation: string;
  unitPrice: number;
  totalValue: number;
  lastProduced: string;
  rawMaterialsCost: number;
  status: "in-stock" | "low-stock" | "out-of-stock";
  velocity: "fast" | "medium" | "slow";
  image: string;
}

const mockFinishedGoods: FinishedGood[] = [
  {
    id: "FG001",
    name: "Urban Explorer Backpack Pro",
    sku: "UEB-PRO-001",
    brand: "Urban Explorer",
    category: "Backpack",
    stockQuantity: 45,
    minStockLevel: 20,
    maxStockLevel: 100,
    storageLocation: "FG-Warehouse A - R001 - S1",
    unitPrice: 2500,
    totalValue: 112500,
    lastProduced: "2024-01-25",
    rawMaterialsCost: 1200,
    status: "in-stock",
    velocity: "fast",
    image: "/placeholder.svg"
  },
  {
    id: "FG002",
    name: "Travel Pro Laptop Bag",
    sku: "TPL-BAG-002",
    brand: "Travel Pro",
    category: "Laptop Bag",
    stockQuantity: 12,
    minStockLevel: 15,
    maxStockLevel: 50,
    storageLocation: "FG-Warehouse B - R002 - S1",
    unitPrice: 3200,
    totalValue: 38400,
    lastProduced: "2024-01-20",
    rawMaterialsCost: 1800,
    status: "low-stock",
    velocity: "medium",
    image: "/placeholder.svg"
  },
  {
    id: "FG003",
    name: "City Messenger Classic",
    sku: "CMC-MSG-003",
    brand: "City Bags",
    category: "Messenger Bag",
    stockQuantity: 0,
    minStockLevel: 10,
    maxStockLevel: 40,
    storageLocation: "FG-Warehouse A - R003 - S2",
    unitPrice: 1800,
    totalValue: 0,
    lastProduced: "2024-01-10",
    rawMaterialsCost: 900,
    status: "out-of-stock",
    velocity: "slow",
    image: "/placeholder.svg"
  },
  {
    id: "FG004",
    name: "Executive Briefcase Deluxe",
    sku: "EBD-BFC-004",
    brand: "Travel Pro",
    category: "Briefcase",
    stockQuantity: 28,
    minStockLevel: 10,
    maxStockLevel: 30,
    storageLocation: "FG-Warehouse B - R001 - S3",
    unitPrice: 4500,
    totalValue: 126000,
    lastProduced: "2024-01-22",
    rawMaterialsCost: 2200,
    status: "in-stock",
    velocity: "fast",
    image: "/placeholder.svg"
  },
  {
    id: "FG005",
    name: "Casual Day Pack",
    sku: "CDP-BAG-005",
    brand: "Urban Explorer",
    category: "Backpack",
    stockQuantity: 67,
    minStockLevel: 25,
    maxStockLevel: 80,
    storageLocation: "FG-Warehouse C - R001 - S1",
    unitPrice: 1500,
    totalValue: 100500,
    lastProduced: "2024-01-24",
    rawMaterialsCost: 700,
    status: "in-stock",
    velocity: "medium",
    image: "/placeholder.svg"
  },
  {
    id: "FG006",
    name: "Premium Travel Duffel",
    sku: "PTD-TRV-006",
    brand: "Travel Pro",
    category: "Travel Bag",
    stockQuantity: 8,
    minStockLevel: 12,
    maxStockLevel: 35,
    storageLocation: "FG-Warehouse A - R002 - S1",
    unitPrice: 3800,
    totalValue: 30400,
    lastProduced: "2024-01-18",
    rawMaterialsCost: 2000,
    status: "low-stock",
    velocity: "slow",
    image: "/placeholder.svg"
  }
];

const FinishedGoodsInventory = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [receiveFromProductionOpen, setReceiveFromProductionOpen] = useState(false);
  const [stockAdjustmentOpen, setStockAdjustmentOpen] = useState(false);
  const [transferStockOpen, setTransferStockOpen] = useState(false);
  const [quickDispatchOpen, setQuickDispatchOpen] = useState(false);

  const filteredData = mockFinishedGoods.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalItems = filteredData.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentData = filteredData.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "in-stock": return "default";
      case "low-stock": return "secondary";
      case "out-of-stock": return "destructive";
      default: return "outline";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "in-stock": return "In Stock";
      case "low-stock": return "Low Stock";
      case "out-of-stock": return "Out of Stock";
      default: return status;
    }
  };

  const getVelocityColor = (velocity: string) => {
    switch (velocity) {
      case "fast": return "default";
      case "medium": return "secondary";
      case "slow": return "outline";
      default: return "outline";
    }
  };

  const getVelocityLabel = (velocity: string) => {
    switch (velocity) {
      case "fast": return "Fast Moving";
      case "medium": return "Medium";
      case "slow": return "Slow Moving";
      default: return velocity;
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Finished Goods Inventory</h1>
            <p className="text-muted-foreground">
              Track and manage finished product inventory across all brands and categories
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button>
                <Package className="h-4 w-4 mr-2" />
                Inventory Actions
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={() => setReceiveFromProductionOpen(true)}>
                <Package className="h-4 w-4 mr-2" />
                Receive from Production
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStockAdjustmentOpen(true)}>
                <FileEdit className="h-4 w-4 mr-2" />
                Stock Adjustment
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTransferStockOpen(true)}>
                <ArrowRightLeft className="h-4 w-4 mr-2" />
                Transfer Stock
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setQuickDispatchOpen(true)}>
                <Truck className="h-4 w-4 mr-2" />
                Quick Dispatch
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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

        {/* Finished Goods Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Finished Goods Inventory</CardTitle>
              <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search products..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Image</TableHead>
                      <TableHead>Product Name</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Brand</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Stock Qty</TableHead>
                      <TableHead>Min/Max Level</TableHead>
                      <TableHead>Storage Location</TableHead>
                      <TableHead>Unit Price</TableHead>
                      <TableHead>Total Value</TableHead>
                      <TableHead>Raw Material Cost</TableHead>
                      <TableHead>Velocity</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Produced</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentData.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell>
                          <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                            <ShoppingBag className="h-6 w-6 text-muted-foreground" />
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{product.name}</div>
                            <div className="text-sm text-muted-foreground">ID: {product.id}</div>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm">{product.sku}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{product.brand}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{product.category}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{product.stockQuantity}</span>
                            {product.status === "low-stock" && (
                              <AlertTriangle className="h-4 w-4 text-warning" />
                            )}
                            {product.status === "out-of-stock" && (
                              <AlertTriangle className="h-4 w-4 text-destructive" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          <div>
                            <div>Min: {product.minStockLevel}</div>
                            <div>Max: {product.maxStockLevel}</div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm max-w-32 truncate" title={product.storageLocation}>
                          {product.storageLocation}
                        </TableCell>
                        <TableCell>₹{product.unitPrice.toLocaleString()}</TableCell>
                        <TableCell className="font-medium">₹{product.totalValue.toLocaleString()}</TableCell>
                        <TableCell>₹{product.rawMaterialsCost.toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge variant={getVelocityColor(product.velocity)}>
                            {getVelocityLabel(product.velocity)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusColor(product.status)}>
                            {getStatusLabel(product.status)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {new Date(product.lastProduced).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-1">
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
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
          </CardContent>
        </Card>
      </div>

      {/* Inventory Action Dialogs */}
      <ReceiveFromProductionForm 
        open={receiveFromProductionOpen} 
        onOpenChange={setReceiveFromProductionOpen} 
      />
      <StockAdjustmentForm 
        open={stockAdjustmentOpen} 
        onOpenChange={setStockAdjustmentOpen} 
      />
      <TransferStockForm 
        open={transferStockOpen} 
        onOpenChange={setTransferStockOpen} 
      />
      <QuickDispatchForm 
        open={quickDispatchOpen} 
        onOpenChange={setQuickDispatchOpen} 
      />
    </MainLayout>
  );
};

export default FinishedGoodsInventory;