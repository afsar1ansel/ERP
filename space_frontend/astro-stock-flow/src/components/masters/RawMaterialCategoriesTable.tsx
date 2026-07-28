import { useEffect, useState } from "react";
import { RawMaterialCategoryForm } from "@/components/forms/RawMaterialCategoryForm";
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
  changeRawMaterialCategoryStatus,
  getRawMaterialCategories,
  getRawMaterialsByCategory,
} from "@/pages/master/MasterRawMaterialCategories";

const mockMaterialsByCategory: Record<
  number,
  Array<{
    id: number;
    name: string;
    unit: string;
    currentStock: number;
    reorderLevel: number;
  }>
> = {
  1: [
    {
      id: 1,
      name: "Cotton Fabric - Blue",
      unit: "meters",
      currentStock: 150,
      reorderLevel: 50,
    },
    {
      id: 2,
      name: "Denim Fabric",
      unit: "meters",
      currentStock: 80,
      reorderLevel: 30,
    },
    {
      id: 3,
      name: "Silk Fabric - White",
      unit: "meters",
      currentStock: 25,
      reorderLevel: 10,
    },
  ],
  2: [
    {
      id: 4,
      name: "Metal Buttons - Silver",
      unit: "pieces",
      currentStock: 500,
      reorderLevel: 100,
    },
    {
      id: 5,
      name: "Rivets - Brass",
      unit: "pieces",
      currentStock: 200,
      reorderLevel: 50,
    },
  ],
  3: [
    {
      id: 6,
      name: "Cotton Thread - Black",
      unit: "spools",
      currentStock: 75,
      reorderLevel: 20,
    },
    {
      id: 7,
      name: "Polyester Thread - White",
      unit: "spools",
      currentStock: 60,
      reorderLevel: 15,
    },
  ],
  4: [
    {
      id: 8,
      name: "Metal Zipper - 20cm",
      unit: "pieces",
      currentStock: 100,
      reorderLevel: 25,
    },
  ],
  5: [
    {
      id: 9,
      name: "Foam Padding - 5mm",
      unit: "sheets",
      currentStock: 40,
      reorderLevel: 10,
    },
  ],
};

export const RawMaterialCategoriesTable = ({
  mockRawMaterialCategories,
  setMockRawMaterialCategories,
}) => {
  const { toast } = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [viewDetailsOpen, setViewDetailsOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [editFormOpen, setEditFormOpen] = useState(false);
  const [viewMaterialsOpen, setViewMaterialsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<
    (typeof mockRawMaterialCategories)[0] | null
  >(null);
  const token = localStorage.getItem("token") || "";

  const totalItems = mockRawMaterialCategories.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentData = mockRawMaterialCategories.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1);
  };

  const handleViewDetails = (
    category: (typeof mockRawMaterialCategories)[0]
  ) => {
    setSelectedCategory(category);
    setViewDetailsOpen(true);
  };

  const handleEditCategory = (
    category: (typeof mockRawMaterialCategories)[0]
  ) => {
    setSelectedCategory(category);
    setEditFormOpen(true);
  };

  const handleViewMaterials = async (
    category: (typeof mockRawMaterialCategories)[0]
  ) => {
    setSelectedCategory(null); // reset before fetching
    setViewMaterialsOpen(true);

    console.log(category);

    try {
      const token = localStorage.getItem("token") || "";
      const details = await getRawMaterialsByCategory(category.id, token);

      setSelectedCategory(details);
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to fetch raw materials. Please try again.",
        variant: "destructive",
      });
      setViewMaterialsOpen(false);
    }
  };

  const handleToggleStatus = async (category: {
    category_name: string;
    category_description: string;
    id: number;
    status: number;
  }) => {
    const newStatus = category.status === 1 ? 0 : 1;

    try {
      const res = await changeRawMaterialCategoryStatus(
        category.id,
        newStatus,
        token
      );

      if (res.errFlag !== 0) {
        toast({
          title: "Error",
          description: res.message || "Failed to update category status",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Status Updated",
        description: `${category.category_name} is now ${
          newStatus === 0 ? "inactive" : "active"
        }`,
      });

      // ✅ Refresh categories after update
      getRawMaterialCategorie(token);

      // ✅ Or update local state directly instead of refetch
      // setMockRawMaterialCategories?.(prev =>
      //   prev.map(c => c.id === category.id ? { ...c, status: newStatus } : c)
      // );
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to update category status. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteCategory = (
    category: (typeof mockRawMaterialCategories)[0]
  ) => {
    setSelectedCategory(category);
    setDeleteConfirmOpen(true);
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

  // Import the actual API function with an alias to avoid recursion
  // import { getRawMaterialCategories as fetchRawMaterialCategories } from '...'; // Uncomment and adjust import path

  const getRawMaterialCategorie = async (token: string) => {
    // Replace with the correct API call
    const data = await getRawMaterialCategories(token);
    setMockRawMaterialCategories(data || []);

    console.log(data);

    // For now, just log the token to avoid recursion error
    console.log("Fetching categories with token:", token);
  };

  useEffect(() => {
    getRawMaterialCategorie(token);
  }, []);

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Category Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Material Count</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentData.map((category) => (
              <TableRow key={category.id}>
                <TableCell className="font-medium">
                  {category.category_name}
                </TableCell>
                <TableCell className="text-muted-foreground max-w-xs truncate">
                  {category.category_description}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {category.material_count} materials
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={category.status ? "default" : "secondary"}>
                    {category.status ? "Active" : "Inactive"}
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
                      onClick={() => handleViewMaterials(category)}
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
                      {category.status ? (
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
              Category Details - {selectedCategory?.name}
            </DialogTitle>
          </DialogHeader>
          {selectedCategory && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">Category Name</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedCategory.category_name}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Status</p>
                  <Badge
                    variant={selectedCategory.status ? "default" : "secondary"}
                  >
                    {selectedCategory.status ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium">Material Count</p>
                  <Badge variant="outline">
                    {selectedCategory.materialCount} materials
                  </Badge>
                </div>
                <div className="col-span-2">
                  <p className="text-sm font-medium">Description</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedCategory.category_description}
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
              category contains {selectedCategory?.materialCount} materials.
              This action cannot be undone.
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

      {/* View Materials Dialog */}
      <Dialog open={viewMaterialsOpen} onOpenChange={setViewMaterialsOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Materials in {selectedCategory?.name}</DialogTitle>
          </DialogHeader>
          {selectedCategory && (
            <div className="space-y-4">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Material Name</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead>Current Stock</TableHead>
                      <TableHead>Reorder Level</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Array.isArray(selectedCategory) &&
                      selectedCategory.map((material) => (
                        <TableRow key={material.id}>
                          <TableCell className="font-medium">
                            {material.material_name}
                          </TableCell>
                          <TableCell>{material.unit_of_measure}</TableCell>
                          <TableCell>{material.stock_qty}</TableCell>
                          <TableCell>{material.min_stock_level}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                material.stock_status == "in-stock"
                                  ? "default"
                                  : "destructive"
                              }
                            >
                              {material.stock_status == "in-stock"
                                ? "In Stock"
                                : "Low Stock"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
              {(mockMaterialsByCategory[selectedCategory.id] || []).length ===
                0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No materials found in this category
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Category Form */}
      <RawMaterialCategoryForm
        open={editFormOpen}
        onOpenChange={setEditFormOpen}
        category={selectedCategory}
        mode="edit"
        setMockRawMaterialCategories={setMockRawMaterialCategories}
      />
    </div>
  );
};
