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
import { DepartmentForm } from "./EditDepartmentForm";
import { changeDepartmentStatus } from "@/pages/Employees";
import { AdminDetails } from "@/hooks/getAdminName";

// Get All Departments
export const getAllDepartments = async (token) => {
  try {
    const response = await axios.get(
      `${BASE_URL}/departments/get-all/${token}`
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Get Department Details

export function DepartmentsTable({
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
    setViewDetailsOpen(true); 
    setSelectedDepartment(department);
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
    const res = await getAllDepartments(token);
    setDepartments(res);
    console.log(res);
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

const [createdByName, setCreatedByName] = useState("");

useEffect(() => {
  console.log("useEffect triggered"); // Debug log
  console.log("viewDetailsOpen:", viewDetailsOpen); // Debug log
  console.log("selectedDepartment:", selectedDepartment); // Debug log
  const fetchAdminName = async () => {
    try {
      if (selectedDepartment?.create_admin_id) {
        const name = await AdminDetails(selectedDepartment.create_admin_id);
        setCreatedByName(name || "N/A");
      } else {
        setCreatedByName("N/A");
      }
    } catch (error) {
      console.error("Error fetching admin name:", error);
      setCreatedByName("Error loading");
    }
  };
    fetchAdminName();
}, [viewDetailsOpen, selectedDepartment?.created_admin_id]);


  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Sl No.</TableHead>
            <TableHead>Department ID</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Department Head</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Employees</TableHead>
            <TableHead>Budget</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {departments.map((department) => (
            <TableRow key={department.id}>
              <TableCell>{departments.indexOf(department) + 1}</TableCell>
              <TableCell className="font-medium">
                {department.department_code}
              </TableCell>
              <TableCell>
                <div>
                  <div className="font-medium">
                    {department.department_name}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {department.department_description}
                  </div>
                </div>
              </TableCell>
              <TableCell>{department.department_head_name}</TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {department.location}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {department.employees_count}
                </div>
              </TableCell>
              <TableCell className="font-medium">{department.budget}</TableCell>
              <TableCell>
                <Badge
                  variant={department.status === 1 ? "default" : "secondary"}
                  className={
                    department.status === 1 ? "bg-green-100 text-green-800" : ""
                  }
                >
                  {department.status === 1 ? "Active" : "Inactive"}
                </Badge>
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
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEditDepartment(department)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  {/* <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleManageEmployees(department)}
                  >
                    <UserCheck className="h-4 w-4" />
                  </Button> */}
                  {/* <Button variant="ghost" size="icon" onClick={() => handleBudgetManagement(department)}>
                    <DollarSign className="h-4 w-4" />
                  </Button> */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedDepartment(department);
                      setDeleteConfirmOpen(true);
                    }}
                  >
                    {department.status === 1 ? (
                      <ToggleRight className="h-4 w-4" />
                    ) : (
                      <ToggleLeft className="h-4 w-4" />
                    )}
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

      {/* View Details Dialog */}
      <Dialog open={viewDetailsOpen} onOpenChange={setViewDetailsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Department Details - {selectedDepartment?.department_name}
            </DialogTitle>
          </DialogHeader>
          {selectedDepartment && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">Department ID</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedDepartment.id}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Head</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedDepartment.department_head_name}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Location</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedDepartment.location}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Employee Count</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedDepartment.employees_count}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Budget</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedDepartment.budget}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Created by</p>
                  <p className="text-sm text-muted-foreground">
                    {createdByName}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Status</p>
                  <Badge
                    variant={
                      selectedDepartment.status === 1 ? "default" : "secondary"
                    }
                  >
                    {selectedDepartment.status === 1 ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <div className="col-span-2">
                  <p className="text-sm font-medium">Description</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedDepartment.department_description}
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
