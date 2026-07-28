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
import { Edit, Eye, ToggleLeft, ToggleRight } from "lucide-react";
import { PaginationControls } from "../ui/pagination-controls";
import { UnitMeasurementForm } from "./UnitMeasurementForm";
import {
  fetchUnitMeasurements,
  changeUnitMeasurementStatus,
  UnitMeasurement, // Import the interface
} from "@/pages/master/MasterUnitMeasurment";
import { formatDateDDMMYYYY } from "@/hooks/DateFormater";
import { AdminDetails } from "@/hooks/getAdminName"; // Assuming this utility exists

interface UnitMeasurementTableProps {
  unitMeasurements: UnitMeasurement[];
  setUnitMeasurements: React.Dispatch<React.SetStateAction<UnitMeasurement[]>>;
}

export const UnitMeasurementTable = ({
  unitMeasurements,
  setUnitMeasurements,
}: UnitMeasurementTableProps) => {
  const { toast } = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [viewDetailsOpen, setViewDetailsOpen] = useState(false);
  const [editUnitMeasurementOpen, setEditUnitMeasurementOpen] = useState(false);
  const [toggleConfirmOpen, setToggleConfirmOpen] = useState(false);
  const [selectedUnitMeasurement, setSelectedUnitMeasurement] =
    useState<UnitMeasurement | null>(null);

  // Get token from local storage
  const Token = localStorage.getItem("token") || "";

  // --- Pagination Logic ---
  console.log(unitMeasurements);
  const totalItems = unitMeasurements.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentData = unitMeasurements.slice(startIndex, endIndex);
  console.log(currentData);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1);
  };

  // --- Fetching and Action Handlers ---

  const fetchUnitMeasurementData = () => {
    fetchUnitMeasurements(Token)
      .then((data) => {
        // The data returned should match the UnitMeasurement[] interface
        setUnitMeasurements(data);
      })
      .catch((error) => {
        console.error("Failed to fetch unit measurements:", error);
        toast({
          title: "Error",
          description:
            "Could not fetch unit measurements. Please check the network.",
          variant: "destructive",
        });
      });
  };

  // Fetch data on component mount
  useEffect(() => {
    if (Token) {
      fetchUnitMeasurementData();
    }
  }, [Token]);

  const handleViewDetails = (unitMeasurement: UnitMeasurement) => {
    setSelectedUnitMeasurement(unitMeasurement);
    setViewDetailsOpen(true);
  };

  const handleEditUnitMeasurement = (unitMeasurement: UnitMeasurement) => {
    setSelectedUnitMeasurement(unitMeasurement);
    setEditUnitMeasurementOpen(true);
  };

  const handleToggleStatusClick = (unitMeasurement: UnitMeasurement) => {
    setSelectedUnitMeasurement(unitMeasurement);
    setToggleConfirmOpen(true); // Open the AlertDialog for confirmation
  };

  const handleConfirmToggleStatus = async () => {
    if (!selectedUnitMeasurement) return;

    const currentStatus = selectedUnitMeasurement.status;
    const newStatus = currentStatus === 1 ? 0 : 1;

    setToggleConfirmOpen(false); // Close the dialog immediately
    setSelectedUnitMeasurement(null); // Clear selected unit measurement

    try {
      const res = await changeUnitMeasurementStatus({
        unitMeasurementId: selectedUnitMeasurement.id,
        status: newStatus,
        token: Token,
      });

      if (res.errFlag !== 0) {
        throw new Error(
          res.message || "Failed to update unit measurement status"
        );
      }

      toast({
        title: "Status Updated",
        description: `${selectedUnitMeasurement.unit_name} is now ${
          newStatus === 1 ? "active" : "inactive"
        }`,
      });

      // Refresh the entire table data
      fetchUnitMeasurementData();
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error.message ||
          "Failed to update unit measurement status. Please try again.",
        variant: "destructive",
      });
    }
  };

  // --- Admin Details Fetcher for View Dialog ---
  const [createdByName, setCreatedByName] = useState("");

  useEffect(() => {
    const fetchAdminName = async () => {
      if (viewDetailsOpen && selectedUnitMeasurement?.created_admin_id) {
        // Assuming AdminDetails is an async function that returns the admin name
        const name = await AdminDetails(
          selectedUnitMeasurement.created_admin_id
        );
        setCreatedByName(name);
      } else {
        setCreatedByName("");
      }
    };
    fetchAdminName();
  }, [viewDetailsOpen, selectedUnitMeasurement?.created_admin_id]);

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Unit Name</TableHead>
              {/* <TableHead>Code</TableHead> */}
              <TableHead>Status</TableHead>
              <TableHead>Created Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentData.length > 0 ? (
              currentData.map((unitMeasurement) => (
                <TableRow key={unitMeasurement.id}>
                  <TableCell className="font-medium">
                    {unitMeasurement.unit_name}
                  </TableCell>
                  {/* <TableCell className="font-medium">
                    {unitMeasurement.unit_code}
                  </TableCell> */}
                  <TableCell>
                    <Badge
                      variant={
                        unitMeasurement.status === 1 ? "default" : "secondary"
                      }
                    >
                      {unitMeasurement.status === 1 ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {formatDateDDMMYYYY(unitMeasurement.created_at)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewDetails(unitMeasurement)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          handleEditUnitMeasurement(unitMeasurement)
                        }
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleStatusClick(unitMeasurement)}
                      >
                        {unitMeasurement.status === 1 ? (
                          <ToggleRight className="h-4 w-4 text-green-500" />
                        ) : (
                          <ToggleLeft className="h-4 w-4 text-red-500" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="h-24 text-center text-muted-foreground"
                >
                  No unit measurements found.
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

      {/* View Details Dialog */}
      <Dialog open={viewDetailsOpen} onOpenChange={setViewDetailsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Unit Measurement Details - {selectedUnitMeasurement?.unit_name}
            </DialogTitle>
          </DialogHeader>
          {selectedUnitMeasurement && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">Unit Name</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedUnitMeasurement.unit_name}
                  </p>
                </div>
                {/* <div>
                  <p className="text-sm font-medium">Unit Code</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedUnitMeasurement.unit_code}
                  </p>
                </div> */}
                <div>
                  <p className="text-sm font-medium">Status</p>
                  <Badge
                    variant={
                      selectedUnitMeasurement.status === 1
                        ? "default"
                        : "secondary"
                    }
                  >
                    {selectedUnitMeasurement.status === 1
                      ? "Active"
                      : "Inactive"}
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
                    {formatDateDDMMYYYY(selectedUnitMeasurement.created_at)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Toggle Status Confirmation Dialog */}
      <AlertDialog open={toggleConfirmOpen} onOpenChange={setToggleConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change Unit Measurement Status</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to{" "}
              {selectedUnitMeasurement?.status === 1
                ? "**deactivate**"
                : "**activate**"}{" "}
              the unit measurement **{selectedUnitMeasurement?.unit_name}**?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmToggleStatus}
              className={
                selectedUnitMeasurement?.status === 1
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-green-600 hover:bg-green-700"
              }
            >
              {selectedUnitMeasurement?.status === 1
                ? "Deactivate"
                : "Activate"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Unit Measurement Form */}
      <UnitMeasurementForm
        open={editUnitMeasurementOpen}
        onOpenChange={setEditUnitMeasurementOpen}
        unitMeasurement={selectedUnitMeasurement}
        setUnitMeasurements={setUnitMeasurements}
        mode="edit"
      />
    </div>
  );
};
