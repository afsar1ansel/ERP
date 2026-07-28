import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  Users,
  MapPin,
  Eye,
  DollarSign,
  UserCheck,
  ToggleRight,
  ToggleLeft,
} from "lucide-react";
import { BASE_URL } from "@/hooks/baseUrls";
import axios from "axios";
import { DepartmentForm } from "../employees/EditDepartmentForm";
import { changeDepartmentStatus } from "@/pages/Employees";

export function ReceiveFromVendor({
  departments,
  setDepartments,
  setIsAddDepartmentDialogOpen,
}) {
  const { toast } = useToast();
  const token = localStorage.getItem("token");
  const [viewDetailsOpen, setViewDetailsOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<
    (typeof departments)[0] | null
  >(null);

  const [openEditDialog, setOpenEditDialog] = useState(false);

  const handleViewDetails = (department: (typeof departments)[0]) => {
    setSelectedDepartment(department);
    setViewDetailsOpen(true);
  };

  const handleEditDepartment = (department: (typeof departments)[0]) => {
    setSelectedDepartment(department);

    setOpenEditDialog(true);
  };

  const handleManageEmployees = (department: (typeof departments)[0]) => {
    toast({
      title: "Manage Employees",
      description: `Managing employees for ${department.name}`,
    });
  };

  const handleBudgetManagement = (department: (typeof departments)[0]) => {
    toast({
      title: "Budget Management",
      description: `Opening budget management for ${department.name}`,
    });
  };

  const handleDeleteDepartment = (department: (typeof departments)[0]) => {
    setSelectedDepartment(department);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (selectedDepartment) {
      toast({
        title: "Department Deleted",
        description: `${selectedDepartment.name} department has been removed`,
        variant: "destructive",
      });
    }
    setDeleteConfirmOpen(false);
    setSelectedDepartment(null);
  };

  const getAllDepartmentsFetch = async (token) => {
    try {
      const res = await axios.get(
        `${BASE_URL}/vendor-stock-receipts/get-all/${token}`
      );

      setDepartments(res.data);
      console.log(res);
    } catch (error) {
      console.log(error);
    }
  };

  const handleToggleStatus = async (department: (typeof departments)[0]) => {
    const status = department.status === 1 ? 0 : 1;
    const res = changeDepartmentStatus(department.id, status, token);

    if (res) {
      toast({
        title: "Status Updated",
        description: `${
          department.department_name
        } status has been updated to ${status === 1 ? "active" : "inactive"}`,
        variant: "default",
      });
      getAllDepartmentsFetch(token);
    }
  };

  useEffect(() => {
    getAllDepartmentsFetch(token);
  }, []);

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Grn Number</TableHead>
            <TableHead>Invoice Number</TableHead>
            <TableHead>Vendor Name</TableHead>
            <TableHead>Received Date</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {departments.map((department) => (
            <TableRow key={department.id}>
              <TableCell className="font-medium">
                {department.grn_number}
              </TableCell>
              <TableCell>
                <div>
                  <div className="font-medium">{department.invoice_number}</div>
                  <div className="text-sm text-muted-foreground">
                    {department.department_description}
                  </div>
                </div>
              </TableCell>
              <TableCell>{department.vendor_name}</TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  {department.received_date !== null &&
                    new Date(department.received_date).toLocaleDateString()}
                </div>
              </TableCell>

              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleViewDetails(department)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <DepartmentForm
        onSuccess={() => getAllDepartmentsFetch(token)}
        mode="edit"
        department={selectedDepartment}
        isOpen={openEditDialog}
        onOpenChange={setOpenEditDialog}
      />

      <Dialog open={viewDetailsOpen} onOpenChange={setViewDetailsOpen}>
        <DialogContent className="max-w-4xl">
          {" "}
          {/* Increased Width */}
          <DialogHeader>
            <DialogTitle>
              Receive From Vendor - {selectedDepartment?.grn_number}
            </DialogTitle>
          </DialogHeader>
          {selectedDepartment && (
            <div className="space-y-6">
              {/* Top Details Section */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">GRN Number</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedDepartment.grn_number}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Invoice Number</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedDepartment.invoice_number}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Vendor Name</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedDepartment.vendor_name}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Received Date</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedDepartment.received_date &&
                      new Date(
                        selectedDepartment.received_date
                      ).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Items Section */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Items</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Material Name</TableHead>
                      <TableHead>Batch No.</TableHead>
                      <TableHead>Received Qty</TableHead>
                      <TableHead>Unit Cost</TableHead>
                      <TableHead>Total Cost</TableHead>
                      <TableHead>Expiry Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedDepartment.items?.map((item: any) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.material_name}</TableCell>
                        <TableCell>{item.batch_number}</TableCell>
                        <TableCell>{item.received_qty}</TableCell>
                        <TableCell>{item.unit_cost}</TableCell>
                        <TableCell>{item.total_cost}</TableCell>
                        <TableCell>
                          {item.expiry_date &&
                            new Date(item.expiry_date).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Department</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the {selectedDepartment?.name}{" "}
              department? This will affect {selectedDepartment?.employeeCount}{" "}
              employees. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleToggleStatus(selectedDepartment)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
