import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Package, AlertTriangle, TrendingDown, Warehouse, Search, Edit, Eye, Plus, ShoppingCart } from "lucide-react";
import { PaginationControls } from "../components/ui/pagination-controls";
import { AddRawMaterialForm } from "@/components/inventory/AddRawMaterialForm";
import { CreateQuickPOForm } from "@/components/inventory/CreateQuickPOForm";

const quickStats = [
  {
    title: "Total Raw Materials",
    value: "845",
    icon: Package,
    color: "text-primary"
  },
  {
    title: "Low Stock Items",
    value: "18",
    icon: AlertTriangle,
    color: "text-destructive"
  },
  {
    title: "Storage Locations",
    value: "12",
    icon: Warehouse,
    color: "text-success"
  },
  {
    title: "Out of Stock",
    value: "5",
    icon: TrendingDown,
    color: "text-warning"
  }
];

interface RawMaterial {
  id: string;
  name: string;
  category: string;
  vendor: string;
  stockQuantity: number;
  minStockLevel: number;
  maxStockLevel: number;
  unitOfMeasure: string;
  storageLocation: string;
  lastRestocked: string;
  unitCost: number;
  totalValue: number;
  status: "in-stock" | "low-stock" | "out-of-stock";
  image: string;
}

const mockRawMaterials: RawMaterial[] = [
  {
    id: "RM001",
    name: "Genuine Leather Sheets",
    category: "Leather",
    vendor: "ABC Leather Suppliers",
    stockQuantity: 150,
    minStockLevel: 50,
    maxStockLevel: 300,
    unitOfMeasure: "sq.ft",
    storageLocation: "Warehouse A - R001 - S1",
    lastRestocked: "2024-01-20",
    unitCost: 450,
    totalValue: 67500,
    status: "in-stock",
    image: "/placeholder.svg"
  },
  {
    id: "RM002",
    name: "YKK Zippers #5",
    category: "Hardware",
    vendor: "Best Zipper Merchants",
    stockQuantity: 25,
    minStockLevel: 100,
    maxStockLevel: 500,
    unitOfMeasure: "pieces",
    storageLocation: "Warehouse B - R002 - S2",
    lastRestocked: "2024-01-15",
    unitCost: 15,
    totalValue: 375,
    status: "low-stock",
    image: "/placeholder.svg"
  },
  {
    id: "RM003",
    name: "Cotton Canvas - Navy",
    category: "Fabric",
    vendor: "Quality Fabric Mills",
    stockQuantity: 0,
    minStockLevel: 20,
    maxStockLevel: 200,
    unitOfMeasure: "meters",
    storageLocation: "Warehouse A - R003 - S1",
    lastRestocked: "2024-01-10",
    unitCost: 120,
    totalValue: 0,
    status: "out-of-stock",
    image: "/placeholder.svg"
  },
  {
    id: "RM004",
    name: "Metal D-Rings",
    category: "Hardware",
    vendor: "XYZ Hardware Co.",
    stockQuantity: 200,
    minStockLevel: 50,
    maxStockLevel: 300,
    unitOfMeasure: "pieces",
    storageLocation: "Warehouse B - R001 - S3",
    lastRestocked: "2024-01-22",
    unitCost: 8,
    totalValue: 1600,
    status: "in-stock",
    image: "/placeholder.svg"
  },
  {
    id: "RM005",
    name: "Polyester Thread - Black",
    category: "Thread",
    vendor: "Quality Fabric Mills",
    stockQuantity: 75,
    minStockLevel: 30,
    maxStockLevel: 150,
    unitOfMeasure: "rolls",
    storageLocation: "Warehouse C - R001 - S1",
    lastRestocked: "2024-01-18",
    unitCost: 25,
    totalValue: 1875,
    status: "in-stock",
    image: "/placeholder.svg"
  },
  {
    id: "RM006",
    name: "Foam Padding",
    category: "Padding",
    vendor: "ABC Leather Suppliers",
    stockQuantity: 40,
    minStockLevel: 50,
    maxStockLevel: 200,
    unitOfMeasure: "sq.ft",
    storageLocation: "Warehouse A - R002 - S2",
    lastRestocked: "2024-01-12",
    unitCost: 35,
    totalValue: 1400,
    status: "low-stock",
    image: "/placeholder.svg"
  }
];

const RawMaterialsInventory = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddMaterialDialogOpen, setIsAddMaterialDialogOpen] = useState(false);
  const [quickPODialog, setQuickPODialog] = useState<{
    open: boolean;
    material?: RawMaterial;
  }>({ open: false });

  const filteredData = mockRawMaterials.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.vendor.toLowerCase().includes(searchTerm.toLowerCase())
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

  const openQuickPODialog = (material: RawMaterial) => {
    setQuickPODialog({ open: true, material });
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Raw Materials Inventory</h1>
            <p className="text-muted-foreground">
              Track and manage raw material stock levels, suppliers, and storage locations
            </p>
          </div>
          <Dialog open={isAddMaterialDialogOpen} onOpenChange={setIsAddMaterialDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Raw Material
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Raw Material</DialogTitle>
              </DialogHeader>
              <AddRawMaterialForm onSuccess={() => setIsAddMaterialDialogOpen(false)} />
            </DialogContent>
          </Dialog>
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

        {/* Raw Materials Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Raw Materials Inventory</CardTitle>
              <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search raw materials..."
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
                      <TableHead>Material Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Vendor</TableHead>
                      <TableHead>Stock Qty</TableHead>
                      <TableHead>Min/Max Level</TableHead>
                      <TableHead>UOM</TableHead>
                      <TableHead>Storage Location</TableHead>
                      <TableHead>Unit Cost</TableHead>
                      <TableHead>Total Value</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Restocked</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentData.map((material) => (
                      <TableRow key={material.id}>
                        <TableCell>
                          <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                            <Package className="h-6 w-6 text-muted-foreground" />
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{material.name}</div>
                            <div className="text-sm text-muted-foreground">ID: {material.id}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{material.category}</Badge>
                        </TableCell>
                        <TableCell className="text-sm">{material.vendor}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{material.stockQuantity}</span>
                            {material.status === "low-stock" && (
                              <AlertTriangle className="h-4 w-4 text-warning" />
                            )}
                            {material.status === "out-of-stock" && (
                              <AlertTriangle className="h-4 w-4 text-destructive" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          <div>
                            <div>Min: {material.minStockLevel}</div>
                            <div>Max: {material.maxStockLevel}</div>
                          </div>
                        </TableCell>
                        <TableCell>{material.unitOfMeasure}</TableCell>
                        <TableCell className="text-sm max-w-32 truncate" title={material.storageLocation}>
                          {material.storageLocation}
                        </TableCell>
                        <TableCell>₹{material.unitCost}</TableCell>
                        <TableCell className="font-medium">₹{material.totalValue.toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge variant={getStatusColor(material.status)}>
                            {getStatusLabel(material.status)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {new Date(material.lastRestocked).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-1">
                            {(material.status === "low-stock" || material.status === "out-of-stock") && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => openQuickPODialog(material)}
                                className="text-primary border-primary hover:bg-primary hover:text-white"
                              >
                                <ShoppingCart className="h-4 w-4 mr-1" />
                                Create PO
                              </Button>
                            )}
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

        {/* Quick PO Dialog */}
        <Dialog open={quickPODialog.open} onOpenChange={(open) => setQuickPODialog({ open })}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create Quick Purchase Order</DialogTitle>
            </DialogHeader>
            {quickPODialog.material && (
              <CreateQuickPOForm
                materialName={quickPODialog.material.name}
                materialId={quickPODialog.material.id}
                vendor={quickPODialog.material.vendor}
                currentStock={quickPODialog.material.stockQuantity}
                minStock={quickPODialog.material.minStockLevel}
                onSuccess={() => setQuickPODialog({ open: false })}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
};

export default RawMaterialsInventory;