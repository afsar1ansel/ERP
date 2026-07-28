import { useEffect, useRef, useState } from "react";
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
import { EditEmployeeForm } from "./EditEmployeeForm";
import {
  Edit,
  Trash2,
  Phone,
  Mail,
  Eye,
  UserPlus,
  ToggleRight,
  ToggleLeft,
} from "lucide-react";
import { changeEmployeeStatus, getAllEmployees } from "@/pages/Employees";
import { BASE_URL } from "@/hooks/baseUrls";
import { AdminDetails } from "@/hooks/getAdminName";
// import { useScrollToSearchResult } from "@/hooks/useScrollToSearchResult";

// Mock data for employees

export function EmployeesTable({
  employees,
  setEmployees,
  searchResult,
  isDataLoaded,
}) {
  const { toast } = useToast();
  const [viewProfileOpen, setViewProfileOpen] = useState(false);
  const [editEmployeeOpen, setEditEmployeeOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<
    (typeof employees)[0] | null
  >(null);
  const token = localStorage.getItem("token") || "";
  const rowRefs = useRef<{ [key: number]: HTMLTableRowElement | null }>({});
  const [hasScrolled, setHasScrolled] = useState(false);

  const handleViewProfile = (employee: (typeof employees)[0]) => {
    setSelectedEmployee(employee);
    setViewProfileOpen(true);
  };

  const handleEditEmployee = (employee: (typeof employees)[0]) => {
    setSelectedEmployee(employee);
    setEditEmployeeOpen(true);
  };

  const handleAssignJob = (employee: (typeof employees)[0]) => {
    toast({
      title: "Assign Job",
      description: `Assigning new job to ${employee.name}`,
    });
  };

  const handleDeleteEmployee = (employee: (typeof employees)[0]) => {
    setSelectedEmployee(employee);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (selectedEmployee) {
      toast({
        title: "Employee Deleted",
        description: `${selectedEmployee.name} has been removed from the system`,
        variant: "destructive",
      });
    }
    setDeleteConfirmOpen(false);
    setSelectedEmployee(null);
  };

  const getAllemployees = async (token: string) => {
    try {
      const res = await getAllEmployees(token);
      console.log(res);

      setEmployees(res);
    } catch (err) {
      console.error("Error fetching employees:", err);
      throw err;
    }
  };

  async function handleToggleStatus(employee) {
    const newStatus = employee.status === 1 ? 0 : 1;
    try {
      const res = await changeEmployeeStatus(employee.id, newStatus, token);
      console.log(res);

      if (res.errFlag !== 0) {
        toast({
          title: "Error",
          description: res.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Employee Status Updated",
        description: `${employee.name}'s status has been updated to ${newStatus === 1 ? "Active" : "Inactive"
          }.`,
      });
      getAllemployees(token);
    } catch (err) {
      console.error("Error fetching employees:", err);
      throw err;
    }
  }

  const statusClassMap: Record<string, string> = {
    active: "bg-green-100 text-green-800",
    "on-leave": "bg-yellow-100 text-yellow-800",
    inactive: "bg-red-100 text-red-800",
    probation: "bg-blue-100 text-blue-800",
    default: "bg-gray-100 text-gray-800",
  };

  function normalizeStatus(status?: string) {
    return (status || "").toLowerCase().trim().replace(/\s+/g, "-"); // handles "On Leave" → "on-leave"
  }
  useEffect(() => {
    getAllemployees(token);
  }, []);

  const [createdByName, setCreatedByName] = useState("");

  useEffect(() => {
    const fetchAdminName = async () => {
      if (selectedEmployee?.created_admin_id) {
        const name = await AdminDetails(selectedEmployee.created_admin_id);
        setCreatedByName(name);
      }
    };
    fetchAdminName();
  }, [viewProfileOpen, selectedEmployee?.created_admin_id]);

  // // Scroll to search result when employees are loaded
  useEffect(() => {
    // Only run if we have all the required conditions
    if (searchResult && isDataLoaded && employees.length > 0 && !hasScrolled) {
      const employeeId = searchResult.id;

      // Use a longer timeout to ensure DOM is fully rendered with all data
      const scrollTimer = setTimeout(() => {
        const employee = employees.find((emp) => emp.id === employeeId);

        if (employee) {
          const rowElement = rowRefs.current[employeeId];
          console.log(
            "Looking for employee:",
            employeeId,
            "Found element:",
            rowElement
          );

          if (rowElement) {
            rowElement.scrollIntoView({
              behavior: "smooth",
              block: "center",
            });

            // Add highlight effect
            rowElement.classList.add("highlight-search-result");
            setTimeout(() => {
              rowElement.classList.remove("highlight-search-result");
            }, 3000);

            setHasScrolled(true);
          } else {
            // If element not found, try one more time after a short delay
            console.log("Element not found, retrying...");
            setTimeout(() => {
              const retryElement = rowRefs.current[employeeId];
              if (retryElement) {
                retryElement.scrollIntoView({
                  behavior: "smooth",
                  block: "center",
                });
                retryElement.classList.add("highlight-search-result");
                setTimeout(() => {
                  retryElement.classList.remove("highlight-search-result");
                }, 3000);
                setHasScrolled(true);
              }
            }, 500);
          }
        }
      }, 300); // Increased delay for larger datasets

      return () => clearTimeout(scrollTimer);
    }
  }, [employees, searchResult, hasScrolled, isDataLoaded]);

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>SL no.</TableHead>
            <TableHead>Employee ID</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Current Jobs</TableHead>
            <TableHead>Department</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {employees.map((employee) => (
            <TableRow
              key={employee.id}
              ref={(el) => (rowRefs.current[employee.id] = el)}
              className={
                selectedEmployee?.id === employee.id
                  ? "bg-blue-50 transition-colors duration-300"
                  : ""
              }
            >
              <TableCell>{employees.indexOf(employee) + 1}</TableCell>
              <TableCell className="font-medium">
                {employee.employee_code}
              </TableCell>
              <TableCell>
                <div>
                  <div className="font-medium">{employee.name}</div>
                  <div className="text-sm text-muted-foreground flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    {employee.email}
                  </div>
                </div>
              </TableCell>
              <TableCell>{employee.role}</TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  {employee.phone}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {employee?.current_jobs?.length > 0 ? (
                    employee?.current_jobs?.map((job) => (
                      <Badge
                        key={job.job_code}
                        variant="secondary"
                        className="text-xs"
                      >
                        {job.job_code}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-muted-foreground text-sm">
                      Not Assigned
                    </span>
                  )}
                </div>
              </TableCell>
              <TableCell>{employee.department_name}</TableCell>
              <TableCell>
                <Badge
                  className={`px-2 py-0.5 rounded-full ${statusClassMap[normalizeStatus(employee.emp_status)] ||
                    statusClassMap.default
                    }`}
                >
                  {employee.emp_status}
                </Badge>
              </TableCell>

              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleViewProfile(employee)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEditEmployee(employee)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedEmployee(employee);
                      setDeleteConfirmOpen(true);
                    }}
                  >
                    {employee.status === 1 ? (
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

      {/* View Profile Dialog */}
      <Dialog open={viewProfileOpen} onOpenChange={setViewProfileOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Employee Profile - {selectedEmployee?.name}
            </DialogTitle>
          </DialogHeader>
          {selectedEmployee && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">Employee ID</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedEmployee.employee_code}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Role</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedEmployee.role}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Department</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedEmployee.department_name}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Status</p>
                  <Badge
                    className={`px-2 py-0.5 rounded-full ${statusClassMap[normalizeStatus(selectedEmployee.emp_status)] ||
                      statusClassMap.default
                      }`}
                  >
                    {selectedEmployee.emp_status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium">Contact</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedEmployee.phone}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedEmployee.email}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-medium">Created By</p>
                  <p className="text-sm text-muted-foreground">
                    {createdByName || "Loading..."}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium">Current Assignments</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {selectedEmployee?.currentJobs?.length > 0 ? (
                    selectedEmployee.currentJobs.map((job) => (
                      <Badge key={job} variant="secondary" className="text-xs">
                        {job}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-muted-foreground text-sm">
                      Not Assigned
                    </span>
                  )}
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
            <AlertDialogTitle>Delete Employee</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedEmployee?.name}? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleToggleStatus(selectedEmployee)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Employee Form */}
      <EditEmployeeForm
        open={editEmployeeOpen}
        onOpenChange={setEditEmployeeOpen}
        employee={selectedEmployee}
        updateData={() => getAllemployees(token)}
      />
    </div>
  );
}
