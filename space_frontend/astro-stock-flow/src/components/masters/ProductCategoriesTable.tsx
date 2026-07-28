import { useEffect, useState } from "react";
import { ProductCategoryForm } from "@/components/forms/ProductCategoryForm";
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
  ToggleLeft,
  ToggleRight,
  Package,
} from "lucide-react";
import { PaginationControls } from "../ui/pagination-controls";
import {
  changeProductCategoryStatus,
  fetchAllProductCategories,
  fetchProductCategoryDetails,
} from "@/pages/master/MasterProductCategories";

// const mockProductCategories = [
//   { id: 1, name: "Backpacks", description: "Various types of backpacks for travel and daily use", active: true, productCount: 25 },
//   { id: 2, name: "Handbags", description: "Stylish handbags for fashion and utility", active: true, productCount: 18 },
//   { id: 3, name: "Laptop Bags", description: "Professional laptop and computer bags", active: true, productCount: 12 },
//   { id: 4, name: "Travel Bags", description: "Large capacity bags for travel purposes", active: false, productCount: 8 }
// ];

const mockProductsByCategory: Record<
  number,
  Array<{ id: number; name: string; brand: string; status: string }>
> = {
  1: [
    {
      id: 1,
      name: "Urban Explorer Pro",
      brand: "Urban Brand",
      status: "Active",
    },
    {
      id: 2,
      name: "Adventure Backpack",
      brand: "Outdoor Co",
      status: "Active",
    },
    { id: 3, name: "City Commuter", brand: "Metro Bags", status: "Inactive" },
  ],
  2: [
    {
      id: 4,
      name: "Executive Handbag",
      brand: "Luxury Line",
      status: "Active",
    },
    { id: 5, name: "Casual Tote", brand: "Style Co", status: "Active" },
  ],
  3: [
    {
      id: 6,
      name: "Professional Laptop Case",
      brand: "Tech Bags",
      status: "Active",
    },
    {
      id: 7,
      name: "Slim Laptop Sleeve",
      brand: "Modern Tech",
      status: "Active",
    },
  ],
  4: [
    { id: 8, name: "Weekend Traveler", brand: "Journey Co", status: "Active" },
  ],
};

export const ProductCategoriesTable = ({
  mockProductCategories,
  setMockProductCategories,
}) => {
  const { toast } = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [viewDetailsOpen, setViewDetailsOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [editFormOpen, setEditFormOpen] = useState(false);
  const [viewProductsOpen, setViewProductsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<
    (typeof mockProductCategories)[0] | null
  >(null);
  const token = localStorage.getItem("token") || "";

  const totalItems = mockProductCategories.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentData = mockProductCategories.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1);
  };

  const handleViewDetails = (category: (typeof mockProductCategories)[0]) => {
    setSelectedCategory(category);
    setViewDetailsOpen(true);
  };

  const handleViewProducts = async (
    category: (typeof mockProductCategories)[0]
  ) => {
    setSelectedCategory(null); // reset before fetching
    setViewProductsOpen(true);

    try {
      const token = localStorage.getItem("token") || "";
      const details = await fetchProductCategoryDetails({
        categoryId: category.id,
        token,
      });

      setSelectedCategory(details);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch category details. Please try again.",
        variant: "destructive",
      });
      setViewProductsOpen(false);
    }
  };

  const handleEditCategory = (category: (typeof mockProductCategories)[0]) => {
    setSelectedCategory(category);
    setEditFormOpen(true);
  };

  const fetchProductCategoriesFunc = async (token: string) => {
    const categories = await fetchAllProductCategories(token);
    console.log("Fetched categories:", categories);
    setMockProductCategories(categories);
  };

  const handleToggleStatus = async (
    category: (typeof mockProductCategories)[0]
  ) => {
    const newStatus = category.status === 1 ? 0 : 1;

    console.log(category.status, newStatus);

    console.log(category.id);

    try {
      const res = await changeProductCategoryStatus({
        categoryId: category.id, // adjust to your API’s key
        status: newStatus, // convert back to boolean
        token: localStorage.getItem("token"), // replace with your actual token
      });

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
        description: `${category.product_category_name} is now ${
          newStatus === 0 ? "inactive" : "active"
        }`,
      });

      fetchProductCategoriesFunc(localStorage.getItem("token") || "");

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

  const confirmDelete = () => {
    if (selectedCategory) {
      toast({
        title: "Category Deleted",
        description: `${selectedCategory.name} has been removed`,
        variant: "destructive",
      });
    }
    setDeleteConfirmOpen(false);
    setSelectedCategory(null);
  };

  const fetchProductCategories = async (token: string) => {
    const categories = await fetchAllProductCategories(token);
    console.log("Fetched categories:", categories);
    setMockProductCategories(categories);
  };

  useEffect(() => {
    fetchProductCategories(token);
  }, []);

  console.log(selectedCategory);

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Category Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Product Count</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentData.map((category) => (
              <TableRow key={category.id}>
                <TableCell className="font-medium">
                  {category.product_category_name}
                </TableCell>
                <TableCell className="text-muted-foreground max-w-xs truncate">
                  {category.product_description}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {category.product_count} products
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={category.status === 1 ? "default" : "secondary"}
                  >
                    {category.status === 1 ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewDetails(category)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditCategory(category)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewProducts(category)}
                    >
                      <Package className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedCategory(category);
                        setDeleteConfirmOpen(true);
                      }}
                    >
                      {category.status === 1 ? (
                        <ToggleRight className="h-4 w-4" />
                      ) : (
                        <ToggleLeft className="h-4 w-4" />
                      )}
                    </Button>
                    {/* <Button variant="ghost" size="sm" onClick={() => handleDeleteCategory(category)}>
                      <Trash2 className="h-4 w-4" />
                    </Button> */}
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Category Details - {selectedCategory?.product_category_name}
            </DialogTitle>
          </DialogHeader>
          {selectedCategory && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">Category Name</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedCategory.product_category_name}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Status</p>
                  <Badge
                    variant={
                      selectedCategory.status === 1 ? "default" : "secondary"
                    }
                  >
                    {selectedCategory.status === 1 ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium">Product Count</p>
                  <Badge variant="outline">
                    {selectedCategory.product_count} products
                  </Badge>
                </div>
                <div className="col-span-2">
                  <p className="text-sm font-medium">Description</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedCategory.product_description}
                  </p>
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
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedCategory?.name}? This
              category contains {selectedCategory?.productCount} products. This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleToggleStatus(selectedCategory)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* View Products Dialog */}
      <Dialog open={viewProductsOpen} onOpenChange={setViewProductsOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Products in {selectedCategory?.name}</DialogTitle>
          </DialogHeader>
          {selectedCategory && (
            <div className="space-y-4">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product Name</TableHead>
                      <TableHead>Brand</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Array.isArray(selectedCategory) &&
                      selectedCategory.map((product) => (
                        <TableRow key={product.id}>
                          <TableCell className="font-medium">
                            {product.product_name}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              {product.brand_name}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                product.status === 1 ? "default" : "secondary"
                              }
                            >
                              {product.status === 1 ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
              {(selectedCategory || []).length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No products found in this category
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Category Form */}
      <ProductCategoryForm
        open={editFormOpen}
        onOpenChange={setEditFormOpen}
        category={selectedCategory}
        mode="edit"
        setMockProductCategories={setMockProductCategories}
      />
    </div>
  );
};
