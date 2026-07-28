import { useEffect, useState } from "react";
import { ProductSKUForm } from "@/components/forms/ProductSKUForm";
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
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Edit,
  Trash2,
  Eye,
  ToggleRight,
  ToggleLeft,
  CopyCheck,
  Download,
} from "lucide-react";
import { PaginationControls } from "../ui/pagination-controls";
import {
  changeProductStatus,
  getAllProductSKUs,
} from "@/pages/master/MasterProductSKUs";

interface RawMaterial {
  material_name: string;
  quantity: number;
  unit: string;
}

interface ProductSKU {
  id: number;
  product_name: string;
  product_description: string;
  product_image: string;
  product_image_public_id: string;
  status: number;

  brand_id: number;
  brand_name: string;

  product_category_id: number;
  product_category_name: string;
  product_category_brand: string;
  rawMaterials?: RawMaterial[];

  created_admin_id: number;
  updated_admin_id: number;
  created_at: string; // ISO date string
  updated_at: string; // ISO date string
}

export const ProductSKUsTable = ({ mockProductSKUs, setMockProductSKUs }) => {
  const { toast } = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [viewDetailsOpen, setViewDetailsOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [editFormOpen, setEditFormOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductSKU | null>(
    null,
  );
  const [duplicateFormOpen, setDuplicateFormOpen] = useState(false);
  const totalItems = mockProductSKUs.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentData = mockProductSKUs.slice(startIndex, endIndex);
  const token = localStorage.getItem("token") || "";

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1);
  };

  const handleViewDetails = (product: ProductSKU) => {
    setSelectedProduct(product);
    setViewDetailsOpen(true);
  };

  const handleEditProduct = (product: ProductSKU) => {
    setSelectedProduct(product);
    setEditFormOpen(true);
  };

  const handleDeleteProduct = async (product: ProductSKU) => {
    const newStatus = product.status === 1 ? 0 : 1;

    try {
      const res = await changeProductStatus(product.id, newStatus, token);

      if (res.errFlag !== 0) {
        toast({
          title: "Error",
          description: res.message || "Failed to update brand status",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Status Updated",
        description: `${product.brand_name} is now ${
          newStatus === 0 ? "inactive" : "active"
        }`,
      });

      getProductSKUs(token);

      // optional: update local state/UI to reflect new status
      // setBrands(prev =>
      //   prev.map(b => b.id === brand.id ? { ...b, status: newStatus } : b)
      // );
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update brand status. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDuplicateProduct = (product: ProductSKU) => {
    setSelectedProduct(product);
    setDuplicateFormOpen(true);
  };

  const getProductSKUs = async (token: string) => {
    // Fetch product SKUs from the API
    const data = await getAllProductSKUs(token);
    setMockProductSKUs(data);

    console.log(data);
  };

  const exportToCSV = (product: ProductSKU) => {
    const csvContent = generateCSV(product);
    const element = document.createElement("a");
    const file = new Blob([csvContent], { type: "text/csv" });
    element.href = URL.createObjectURL(file);
    element.download = `${product.product_name}-details.csv`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const generateCSV = (product: ProductSKU): string => {
    let csv = "";

    // Product Details Section
    csv += "PRODUCT DETAILS\n";
    csv += `Product Name,${product.product_name}\n`;
    csv += `Brand,${product.brand_name}\n`;
    csv += `Category,${product.product_category_name}\n`;
    csv += `Description,${product.product_description}\n`;
    csv += "\n";

    // Bill of Materials Section
    csv += "BILL OF MATERIALS\n";
    csv += "Material Name,Quantity,Unit\n";

    if (product.rawMaterials && product.rawMaterials.length > 0) {
      product.rawMaterials.forEach((material) => {
        csv += `${material.material_name},${material.quantity},${material.unit}\n`;
      });
    } else {
      csv += "No materials defined\n";
    }

    csv += "\n";
    csv += "AUDIT INFO\n";
    csv += `Created At,${product.created_at}\n`;
    csv += `Updated At,${product.updated_at}\n`;

    return csv;
  };

  useEffect(() => {
    getProductSKUs(token);
  }, []);

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Image</TableHead>
              <TableHead>Product Name</TableHead>
              <TableHead>Brand</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Raw Materials</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentData.map((product) => (
              <TableRow key={product.id}>
                <TableCell>
                  <div className="w-10 h-10 bg-muted rounded flex items-center justify-center">
                    <span className="text-xs">
                      <img src={product.product_image} alt="" />
                    </span>
                  </div>
                </TableCell>
                <TableCell className="font-medium">
                  {product.product_name}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">{product.brand_name}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {product.product_category_name}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {product?.rawMaterials?.slice(0, 2).map((material, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {material.material_name}: {material.quantity}{" "}
                        {material.unit}
                      </Badge>
                    ))}
                    {product?.rawMaterials?.length > 2 && (
                      <Badge variant="outline" className="text-xs">
                        +{product.rawMaterials.length - 2} more
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewDetails(product)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditProduct(product)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    {/* <Button variant="ghost" size="sm">
                      <Trash2 className="h-4 w-4" />
                    </Button> */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setDeleteConfirmOpen(true);
                        setSelectedProduct(product);
                      }}
                    >
                      {product.status === 1 ? (
                        <ToggleRight className="h-4 w-4" />
                      ) : (
                        <ToggleLeft className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDuplicateProduct(product)}
                    >
                      <CopyCheck className="h-4 w-4" />
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

      {/* View Details Dialog */}

      <Dialog open={viewDetailsOpen} onOpenChange={setViewDetailsOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>
                Product Details - {selectedProduct?.product_name}
              </DialogTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => selectedProduct && exportToCSV(selectedProduct)}
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </DialogHeader>
          {selectedProduct && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">Product Name</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedProduct.product_name}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Brand</p>
                  <Badge variant="secondary">
                    {selectedProduct.brand_name}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium">Category</p>
                  <Badge variant="outline">
                    {selectedProduct.product_category_name}
                  </Badge>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium mb-2">Bill of Materials</p>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Material</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Unit</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedProduct?.rawMaterials?.map((material, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">
                            {material.material_name}
                          </TableCell>
                          <TableCell>{material.quantity}</TableCell>
                          <TableCell>{material.unit}</TableCell>
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedProduct?.product_name}?
              This action cannot be undone and will affect all related
              production and inventory records.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleDeleteProduct(selectedProduct)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Product Form */}
      <ProductSKUForm
        open={editFormOpen}
        onOpenChange={setEditFormOpen}
        product={selectedProduct}
        setMockProductSKUs={setMockProductSKUs}
        mode="edit"
      />

      {/* Duplicate Product Form */}
      <ProductSKUForm
        open={duplicateFormOpen}
        onOpenChange={setDuplicateFormOpen}
        product={selectedProduct}
        setMockProductSKUs={setMockProductSKUs}
        mode="duplicate" // New mode for duplication
      />
    </div>
  );
};
