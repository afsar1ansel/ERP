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
import { PaymentTermsForm } from "./PaymentTermsForm";
import {
  fetchPaymentTerms,
  changePaymentTermStatus,
  PaymentTerm, // Import the interface
} from "@/pages/master/MastersPaymentTerm";
import { formatDateDDMMYYYY } from "@/hooks/DateFormater";
import { AdminDetails } from "@/hooks/getAdminName"; // Assuming this utility exists

interface PaymentTermsTableProps {
  paymentTerms: PaymentTerm[];
  setPaymentTerms: React.Dispatch<React.SetStateAction<PaymentTerm[]>>;
}

export const PaymentTermsTable = ({
  paymentTerms,
  setPaymentTerms,
}: PaymentTermsTableProps) => {
  const { toast } = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [viewDetailsOpen, setViewDetailsOpen] = useState(false);
  const [editPaymentTermOpen, setEditPaymentTermOpen] = useState(false);
  const [toggleConfirmOpen, setToggleConfirmOpen] = useState(false);
  const [selectedPaymentTerm, setSelectedPaymentTerm] =
    useState<PaymentTerm | null>(null);

  // Get token from local storage
  const Token = localStorage.getItem("token") || "";

  // --- Pagination Logic ---
  console.log(paymentTerms);
  const totalItems = paymentTerms.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentData = paymentTerms.slice(startIndex, endIndex);
  console.log(currentData);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1);
  };

  // --- Fetching and Action Handlers ---

  const fetchPaymentTermData = () => {
    fetchPaymentTerms(Token)
      .then((data) => {
        // The data returned should match the PaymentTerm[] interface
        setPaymentTerms(data);
      })
      .catch((error) => {
        console.error("Failed to fetch payment terms:", error);
        toast({
          title: "Error",
          description:
            "Could not fetch payment terms. Please check the network.",
          variant: "destructive",
        });
      });
  };

  // Fetch data on component mount
  useEffect(() => {
    if (Token) {
      fetchPaymentTermData();
    }
  }, [Token]);

  const handleViewDetails = (paymentTerm: PaymentTerm) => {
    setSelectedPaymentTerm(paymentTerm);
    setViewDetailsOpen(true);
  };

  const handleEditPaymentTerm = (paymentTerm: PaymentTerm) => {
    setSelectedPaymentTerm(paymentTerm);
    setEditPaymentTermOpen(true);
  };

  const handleToggleStatusClick = (paymentTerm: PaymentTerm) => {
    setSelectedPaymentTerm(paymentTerm);
    setToggleConfirmOpen(true); // Open the AlertDialog for confirmation
  };

  const handleConfirmToggleStatus = async () => {
    if (!selectedPaymentTerm) return;

    const currentStatus = selectedPaymentTerm.status;
    const newStatus = currentStatus === 1 ? 0 : 1;

    setToggleConfirmOpen(false); // Close the dialog immediately
    setSelectedPaymentTerm(null); // Clear selected payment term

    try {
      const res = await changePaymentTermStatus({
        paymentTermId: selectedPaymentTerm.id,
        status: newStatus,
        token: Token,
      });

      if (res.errFlag !== 0) {
        throw new Error(res.message || "Failed to update payment term status");
      }

      toast({
        title: "Status Updated",
        description: `${selectedPaymentTerm.term_name} is now ${
          newStatus === 1 ? "active" : "inactive"
        }`,
      });

      // Refresh the entire table data
      fetchPaymentTermData();
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error.message ||
          "Failed to update payment term status. Please try again.",
        variant: "destructive",
      });
    }
  };

  // --- Admin Details Fetcher for View Dialog ---
  const [createdByName, setCreatedByName] = useState("");

  useEffect(() => {
    const fetchAdminName = async () => {
      if (viewDetailsOpen && selectedPaymentTerm?.created_admin_id) {
        // Assuming AdminDetails is an async function that returns the admin name
        const name = await AdminDetails(selectedPaymentTerm.created_admin_id);
        setCreatedByName(name);
      } else {
        setCreatedByName("");
      }
    };
    fetchAdminName();
  }, [viewDetailsOpen, selectedPaymentTerm?.created_admin_id]);

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Payment Term</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentData.length > 0 ? (
              currentData.map((paymentTerm) => (
                <TableRow key={paymentTerm.id}>
                  <TableCell className="font-medium">
                    {paymentTerm.term_name}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        paymentTerm.status === 1 ? "default" : "secondary"
                      }
                    >
                      {paymentTerm.status === 1 ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {formatDateDDMMYYYY(paymentTerm.created_at)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewDetails(paymentTerm)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditPaymentTerm(paymentTerm)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleStatusClick(paymentTerm)}
                      >
                        {paymentTerm.status === 1 ? (
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
                  colSpan={4}
                  className="h-24 text-center text-muted-foreground"
                >
                  No payment terms found.
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
              Payment Term Details - {selectedPaymentTerm?.term_name}
            </DialogTitle>
          </DialogHeader>
          {selectedPaymentTerm && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">Payment Term Name</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedPaymentTerm.term_name}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Status</p>
                  <Badge
                    variant={
                      selectedPaymentTerm.status === 1 ? "default" : "secondary"
                    }
                  >
                    {selectedPaymentTerm.status === 1 ? "Active" : "Inactive"}
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
                    {formatDateDDMMYYYY(selectedPaymentTerm.created_at)}
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
            <AlertDialogTitle>Change Payment Term Status</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to{" "}
              {selectedPaymentTerm?.status === 1
                ? "**deactivate**"
                : "**activate**"}{" "}
              the payment term **{selectedPaymentTerm?.term_name}**?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmToggleStatus}
              className={
                selectedPaymentTerm?.status === 1
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-green-600 hover:bg-green-700"
              }
            >
              {selectedPaymentTerm?.status === 1 ? "Deactivate" : "Activate"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Payment Term Form */}
      <PaymentTermsForm
        open={editPaymentTermOpen}
        onOpenChange={setEditPaymentTermOpen}
        paymentTerm={selectedPaymentTerm}
        setPaymentTerms={setPaymentTerms}
        mode="edit"
      />
    </div>
  );
};
