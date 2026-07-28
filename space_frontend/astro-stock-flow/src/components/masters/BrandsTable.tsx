import { useEffect, useState } from "react";
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
import { Edit, Trash2, Eye, ToggleLeft, ToggleRight } from "lucide-react";
import { PaginationControls } from "../ui/pagination-controls";
import { BrandForm } from "../forms/BrandForm";
import {
  fetchBrands,
  deleteBrand,
  changeBrandStatus,
} from "@/pages/master/MasterBrands";
import { formatDateDDMMYYYY } from "@/hooks/DateFormater";
import { AdminDetails } from "@/hooks/getAdminName";

interface Brand {
  id: number;
  brand_name: string;
  brand_logo: string;
  brand_logo_public_id: string;
  status: number; // Or you could use a more specific type like 0 | 1
  created_at: string; // Or Date
  updated_at: string; // Or Date
  created_admin_id: number;
  updated_admin_id: number | null;
  brand_code?: string;
}


export const BrandsTable = ({ mockBrands, setMockBrands }) => {
  const { toast } = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [viewDetailsOpen, setViewDetailsOpen] = useState(false);
  const [editBrandOpen, setEditBrandOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState<
    (typeof mockBrands)[0] | null
  >(null);

  const Token = localStorage.getItem("token") || "";

  const totalItems = mockBrands.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentData = mockBrands.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1);
  };

  const handleViewDetails = (brand: (typeof mockBrands)[0]) => {
    setSelectedBrand(brand);
    setViewDetailsOpen(true);
  };

  const handleEditBrand = (brand: (typeof mockBrands)[0]) => {
    setSelectedBrand(brand);
    setEditBrandOpen(true);
  };

  const handleToggleStatus = async (brand: (typeof mockBrands)[0]) => {
    const newStatus = brand.status === 1 ? 0 : 1;

    console.log(brand.status, newStatus);

    console.log(brand.id);

    try {
      const res = await changeBrandStatus({
        brandId: brand.id, // adjust to your API’s key
        status: newStatus,
        token: Token, // replace with your actual token
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
        description: `${brand.brand_name} is now ${
          newStatus === 0 ? "inactive" : "active"
        }`,
      });

      fetchBrandData();

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


  const fetchBrandData = () => {
    fetchBrands(Token)
      .then((brandsData) => {
        // This block runs when the data is successfully fetched
        console.log(brandsData);
        setMockBrands(brandsData);
      })
      .catch((error) => {
        // This block runs if there's an error
        console.error("Failed to fetch brands:", error);
      });
  };

  useEffect(() => {
    fetchBrandData();
  }, []);

const [createdByName, setCreatedByName] = useState("");

useEffect(() => {
  const fetchAdminName = async () => {
    if (viewDetailsOpen && selectedBrand?.created_admin_id) {
      const name = await AdminDetails(selectedBrand.created_admin_id);
      setCreatedByName(name);
    }
  };
  fetchAdminName();
}, [viewDetailsOpen, selectedBrand?.created_admin_id]);



  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Logo</TableHead>
              <TableHead>Brand Name</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentData.map((brand) => (
              <TableRow key={brand.id}>
                <TableCell>
                  <div className="w-10 h-10 bg-muted rounded flex items-center justify-center">
                    <span className="text-xs font-medium">
                      <img src={brand.brand_logo} alt="brand logo" />
                    </span>
                  </div>
                </TableCell>
                <TableCell className="font-medium">
                  {brand.brand_name}
                </TableCell>
                <TableCell>{brand.brand_code}</TableCell>
                <TableCell>
                  <Badge variant={brand.status === 1 ? "default" : "secondary"}>
                    {brand.status === 1 ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell>{formatDateDDMMYYYY(brand.created_at)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewDetails(brand)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditBrand(brand)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedBrand(brand);
                        setDeleteConfirmOpen(true);
                      }}
                    >
                      {brand.status === 1 ? (
                        <ToggleRight className="h-4 w-4" />
                      ) : (
                        <ToggleLeft className="h-4 w-4" />
                      )}
                    </Button>
                    {/* <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteBrand(brand)}
                    >
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
              Brand Details - {selectedBrand?.brand_name}
            </DialogTitle>
          </DialogHeader>
          {selectedBrand && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">Brand Name</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedBrand.brand_name}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Brand Code</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedBrand.brand_code}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Status</p>
                  <Badge
                    variant={
                      selectedBrand.status === 1 ? "default" : "secondary"
                    }
                  >
                    {selectedBrand.status === 1 ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium">Created By</p>
                  <p className="text-sm text-muted-foreground">
                    {createdByName || "Loading..."}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Created Date</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDateDDMMYYYY(selectedBrand.created_at)}
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
            <AlertDialogTitle>Delete Brand</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedBrand?.brand_name}? This
              action cannot be undone and will affect all products under this
              brand.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleToggleStatus(selectedBrand as Brand)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Brand Form */}
      <BrandForm
        open={editBrandOpen}
        onOpenChange={setEditBrandOpen}
        brand={selectedBrand as Brand}
        setBrands={setMockBrands}
        mode="edit"
      />
    </div>
  );
};
