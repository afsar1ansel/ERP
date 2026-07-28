import { useEffect, useState } from "react";
import { StockLocationForm } from "@/components/forms/StockLocationForm";
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
  MapPin,
  Package,
  ToggleRight,
  ToggleLeft,
} from "lucide-react";
import { PaginationControls } from "../ui/pagination-controls";
import {
  changeStockLocationStatus,
  getAllStockLocations,
} from "@/pages/master/MasterStockLocations";

export const StockLocationsTable = ({
  mockStockLocations,
  setMockStockLocations,
}) => {
  const { toast } = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [viewDetailsOpen, setViewDetailsOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [editFormOpen, setEditFormOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<
    (typeof mockStockLocations)[0] | null
  >(null);
  const authToken = localStorage.getItem("token") || "";

  const totalItems = mockStockLocations.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentData = mockStockLocations.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1);
  };

  const handleViewDetails = (location: (typeof mockStockLocations)[0]) => {
    setSelectedLocation(location);
    setViewDetailsOpen(true);
  };

  const handleEditLocation = (location: (typeof mockStockLocations)[0]) => {
    setSelectedLocation(location);
    setEditFormOpen(true);
  };

  const handleViewStock = (location: (typeof mockStockLocations)[0]) => {
    toast({
      title: "View Stock",
      description: `Viewing stock levels at ${location.bin_number}`,
    });
  };

  const confirmDelete = () => {
    if (selectedLocation) {
      toast({
        title: "Location Deleted",
        description: `${selectedLocation.bin} has been removed`,
        variant: "destructive",
      });
    }
    setDeleteConfirmOpen(false);
    setSelectedLocation(null);
  };

  const getStockLocation = async (token) => {
    const res = await getAllStockLocations(token);
    console.log(res);

    setMockStockLocations(res || []);
  };

  const handleToggleStatus = async (brand: (typeof mockStockLocations)[0]) => {
    const newStatus = brand.status === 1 ? 0 : 1;

    console.log(brand.status, newStatus);

    console.log(brand.id);

    try {
      const res = await changeStockLocationStatus({
        brandId: brand.id, // adjust to your API’s key
        status: newStatus,
        token: authToken, // replace with your actual token
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
        description: `${brand.aisle} is now ${
          newStatus === 0 ? "inactive" : "active"
        }`,
      });

      getStockLocation(authToken);

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

  useEffect(() => {
    getStockLocation(authToken);
  }, []);

  console.log(currentData);

  //  {
  //   aisle_no: ' 1',
  //   capacity: 500,
  //   created_admin_id: 5,
  //   created_at: '2025-10-09 17:53:31',
  //   current_occupancy: 0,
  //   id: 1,
  //   location_label: 'A 1-R1-Row1',
  //   rack_no: '1',
  //   row_no: '1',
  //   status: 1,
  //   updated_admin_id: null,
  //   updated_at: '2025-10-09 17:53:31'
  // }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {/* <TableHead>Warehouse</TableHead> */}
              <TableHead>Aisle</TableHead>
              <TableHead>Rack</TableHead>
              <TableHead>Shelf</TableHead>
              <TableHead>Location Level</TableHead>
              <TableHead>Occupancy</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentData.map((location) => (
              <TableRow key={location.id}>
                {/* <TableCell className="font-medium">
                  {location.warehouse_name}
                </TableCell> */}
                <TableCell>{location.aisle_no}</TableCell>
                <TableCell>{location.rack_no}</TableCell>
                <TableCell>{location.row_no}</TableCell>
                <TableCell>{location.location_label}</TableCell>
                <TableCell>
                  <Badge variant="outline">{location.current_occupancy}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewDetails(location)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditLocation(location)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    {/* <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewStock(location)}
                    >
                      <Package className="h-4 w-4" />
                    </Button> */}
                    {/* <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedLocation(location);
                        setDeleteConfirmOpen(true);
                      }}
                    >
                      {location.status === 1 ? (
                        <ToggleRight className="h-4 w-4" />
                      ) : (
                        <ToggleLeft className="h-4 w-4" />
                      )}
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
              Location Details - {selectedLocation?.bin}
            </DialogTitle>
          </DialogHeader>
          {selectedLocation && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* <div>
                  <p className="text-sm font-medium">Warehouse</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedLocation.warehouse_name}
                  </p>
                </div> */}
                <div>
                  <p className="text-sm font-medium">Aisle</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedLocation.aisle_no}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Rack</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedLocation.rack_no}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Shelf</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedLocation.row_no}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Location Name</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedLocation.location_label}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Capacity</p>
                  <Badge variant="outline">
                    {selectedLocation?.capacity}
                  </Badge>
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
            <AlertDialogTitle>Delete Location</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete location {selectedLocation?.bin}?
              This action cannot be undone and will affect all stock stored at
              this location.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleToggleStatus(selectedLocation)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Location Form */}
      <StockLocationForm
        open={editFormOpen}
        onOpenChange={setEditFormOpen}
        location={selectedLocation}
        mode="edit"
        setMockStockLocations={setMockStockLocations}
      />
    </div>
  );
};
