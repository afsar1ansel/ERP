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
import { ClientTypeForm } from "./ClientTypeForm";
import {
  fetchClientTypes,
  changeClientTypeStatus,
  ClientType, // Import the interface
} from "@/pages/master/MasterClientType";
import { formatDateDDMMYYYY } from "@/hooks/DateFormater";
import { AdminDetails } from "@/hooks/getAdminName"; // Assuming this utility exists

interface ClientTypeTableProps {
  clientTypes: ClientType[];
  setClientTypes: React.Dispatch<React.SetStateAction<ClientType[]>>;
}

export const ClientTypeTable = ({
  clientTypes,
  setClientTypes,
}: ClientTypeTableProps) => {
  const { toast } = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [viewDetailsOpen, setViewDetailsOpen] = useState(false);
  const [editClientTypeOpen, setEditClientTypeOpen] = useState(false);
  const [toggleConfirmOpen, setToggleConfirmOpen] = useState(false);
  const [selectedClientType, setSelectedClientType] =
    useState<ClientType | null>(null);

  // Get token from local storage
  const Token = localStorage.getItem("token") || "";

  // --- Pagination Logic ---
  console.log(clientTypes);
  const totalItems = clientTypes.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentData = clientTypes.slice(startIndex, endIndex);
  console.log(currentData)

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1);
  };

  // --- Fetching and Action Handlers ---

  const fetchClientTypeData = () => {
    fetchClientTypes(Token)
      .then((data) => {
        // The data returned should match the ClientType[] interface
        setClientTypes(data);
      })
      .catch((error) => {
        console.error("Failed to fetch client types:", error);
        toast({
          title: "Error",
          description:
            "Could not fetch client types. Please check the network.",
          variant: "destructive",
        });
      });
  };

  // Fetch data on component mount
  useEffect(() => {
    if (Token) {
      fetchClientTypeData();
    }
  }, [Token]);

  const handleViewDetails = (clientType: ClientType) => {
    setSelectedClientType(clientType);
    setViewDetailsOpen(true);
  };

  const handleEditClientType = (clientType: ClientType) => {
    setSelectedClientType(clientType);
    setEditClientTypeOpen(true);
  };

  const handleToggleStatusClick = (clientType: ClientType) => {
    setSelectedClientType(clientType);
    setToggleConfirmOpen(true); // Open the AlertDialog for confirmation
  };

  const handleConfirmToggleStatus = async () => {
    if (!selectedClientType) return;

    const currentStatus = selectedClientType.status;
    const newStatus = currentStatus === 1 ? 0 : 1;

    setToggleConfirmOpen(false); // Close the dialog immediately
    setSelectedClientType(null); // Clear selected client type

    try {
      const res = await changeClientTypeStatus({
        clientTypeId: selectedClientType.id,
        status: newStatus,
        token: Token,
      });

      if (res.errFlag !== 0) {
        throw new Error(res.message || "Failed to update client type status");
      }

      toast({
        title: "Status Updated",
        description: `${selectedClientType.type_name} is now ${
          newStatus === 1 ? "active" : "inactive"
        }`,
      });

      // Refresh the entire table data
      fetchClientTypeData();
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error.message ||
          "Failed to update client type status. Please try again.",
        variant: "destructive",
      });
    }
  };

  // --- Admin Details Fetcher for View Dialog ---
  const [createdByName, setCreatedByName] = useState("");

  useEffect(() => {
    const fetchAdminName = async () => {
      if (viewDetailsOpen && selectedClientType?.created_admin_id) {
        // Assuming AdminDetails is an async function that returns the admin name
        const name = await AdminDetails(selectedClientType.created_admin_id);
        setCreatedByName(name);
      } else {
        setCreatedByName("");
      }
    };
    fetchAdminName();
  }, [viewDetailsOpen, selectedClientType?.created_admin_id]);

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Client Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentData.length > 0 ? (
              currentData.map((clientType) => (
                <TableRow key={clientType.id}>
                  <TableCell className="font-medium">
                    {clientType.type_name}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        clientType.status === 1 ? "default" : "secondary"
                      }
                    >
                      {clientType.status === 1 ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {formatDateDDMMYYYY(clientType.created_at)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewDetails(clientType)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditClientType(clientType)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleStatusClick(clientType)}
                      >
                        {clientType.status === 1 ? (
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
                  No client types found.
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
              Client Type Details - {selectedClientType?.type_name}
            </DialogTitle>
          </DialogHeader>
          {selectedClientType && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">Client Type Name</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedClientType.type_name}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Status</p>
                  <Badge
                    variant={
                      selectedClientType.status === 1 ? "default" : "secondary"
                    }
                  >
                    {selectedClientType.status === 1 ? "Active" : "Inactive"}
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
                    {formatDateDDMMYYYY(selectedClientType.created_at)}
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
            <AlertDialogTitle>Change Client Type Status</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to{" "}
              {selectedClientType?.status === 1
                ? "**deactivate**"
                : "**activate**"}{" "}
              the client type **{selectedClientType?.type_name}**?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmToggleStatus}
              className={
                selectedClientType?.status === 1
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-green-600 hover:bg-green-700"
              }
            >
              {selectedClientType?.status === 1 ? "Deactivate" : "Activate"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Client Type Form */}
      <ClientTypeForm
        open={editClientTypeOpen}
        onOpenChange={setEditClientTypeOpen}
        clientType={selectedClientType}
        setClientTypes={setClientTypes}
        mode="edit"
      />
    </div>
  );
};
