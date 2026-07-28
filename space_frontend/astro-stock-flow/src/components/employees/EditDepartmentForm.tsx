import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  addDepartment,
  getAllEmployees,
  updateDepartment,
} from "@/pages/Employees";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Department {
  departmentId?: string;
  departmentCode: string;
  departmentName: string;
  departmentDescription: string;
  departmentHead: string;
  location: string;
  employeesCount?: string | number;
  budget: string | number;
  id?: string;
  department_code?: string;
  department_name?: string;
  department_description?: string;
  department_head?: string;
  employees_count?: string | number;
  department_head_name?: string;
  department_head_emp_id?: string;
}

interface DepartmentFormProps {
  mode?: "add" | "edit";
  department?: Department | null;
  onSuccess: () => Promise<void>;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function DepartmentForm({
  mode = "add",
  department,
  onSuccess,
  isOpen = false,
  onOpenChange,
}: DepartmentFormProps) {
  const { toast } = useToast();
  const token = localStorage.getItem("token") || "";

  const [formData, setFormData] = useState<Department>({
    departmentId: "",
    departmentCode: "",
    departmentName: "",
    departmentDescription: "",
    departmentHead: "",
    location: "",
    employeesCount: "",
    budget: "",
  });

  // ✅ New error state to hold validation messages for each field
  const [errors, setErrors] = useState({
    departmentCode: "",
    departmentName: "",
    departmentDescription: "",
    departmentHead: "",
    location: "",
    budget: "",
  });

  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Pre-populate on edit
  useEffect(() => {
    if (mode === "edit" && department) {
      setFormData({
        departmentId: department.id || "",
        departmentCode: department.department_code || "",
        departmentName: department.department_name || "",
        departmentDescription: department.department_description || "",
        departmentHead: department.department_head_emp_id || "",
        location: department.location || "",
        employeesCount: department.employees_count || "",
        budget: department.budget || "",
      });
    } else if (mode === "add") {
      setFormData({
        departmentId: "",
        departmentCode: "",
        departmentName: "",
        departmentDescription: "",
        departmentHead: "",
        location: "",
        employeesCount: "",
        budget: "",
      });
    }
  }, [mode, department, isOpen]);

  const handleInputChange = (field: keyof Department, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear the specific error when user starts typing
    setErrors((prev) => ({ ...prev, [field as string]: "" }));
  };

  // ✅ Updated Validation Function with Regex
  const validateForm = () => {
    const newErrors: any = {};

    // Department Code: e.g., FIN-001, HR002
    if (!/^[A-Z]{2,5}[-_]?\d{3,}$/i.test(formData.departmentCode)) {
      newErrors.departmentCode = "Code must be like 'DEPT001' or 'HR-01'.";
    }

    // Department Name: Allows letters, numbers, spaces, and hyphens
    if (!/^[A-Za-z0-9\s-]+$/.test(formData.departmentName)) {
      newErrors.departmentName =
        "Name can only contain letters, numbers, spaces, and hyphens.";
    }

    // Description: Must not be empty
    if (!formData.departmentDescription.trim()) {
      newErrors.departmentDescription = "Description is required.";
    }

    // Department Head: A selection must be made
    // if (!formData.departmentHead) {
    //   newErrors.departmentHead = "Please select a department head.";
    // }

    // Location: Allows letters, numbers, spaces, commas, and hyphens
    if (!/^[A-Za-z0-9\s,-]+$/.test(formData.location)) {
      newErrors.location =
        "Location can only contain letters, numbers, spaces, commas, and hyphens.";
    }

    // Budget: Must be a positive number (can be decimal)
    if (
      !/^\d+(\.\d{1,2})?$/.test(String(formData.budget)) ||
      Number(formData.budget) <= 0
    ) {
      newErrors.budget = "Budget must be a positive number.";
    }

    console.log("Validation Errors:", newErrors);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors in the form.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      if (mode === "add") {
        const payload: any = {
          departmentCode: formData.departmentCode,
          departmentName: formData.departmentName,
          departmentDescription: formData.departmentDescription,
          location: formData.location,
          employeesCount: formData.employeesCount ?? "",
          budget: formData.budget,
          token,
        };

        if (formData.departmentHead) {
          payload.departmentHeadEmpId = formData.departmentHead;
        }
        await addDepartment({
          ...payload,
        });

        toast({
          title: "Department Added",
          description: `${formData.departmentName} has been created successfully.`,
        });
      } else if (mode === "edit" && formData.departmentId) {
        const updatePayload: any = {
          departmentId: formData.departmentId,
          departmentCode: formData.departmentCode,
          departmentName: formData.departmentName,
          departmentDescription: formData.departmentDescription,
          location: formData.location,
          employeesCount: formData.employeesCount ?? "",
          budget: formData.budget,
          token,
        };

        // only include departmentHeadEmpId if user actually selected one
        if (formData.departmentHead) {
          updatePayload.departmentHeadEmpId = formData.departmentHead;
        }

        await updateDepartment(updatePayload);

        toast({
          title: "Department Updated",
          description: `${formData.departmentName} has been updated successfully.`,
        });
      }
      onSuccess();
      onOpenChange?.(false);
    } catch (err) {
      console.error("❌ Department form error:", err);
      toast({
        title: "Error",
        description: "Failed to save department. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchGetEmployees = async () => {
    try {
      const res = await getAllEmployees(token);
      console.log(res);
      setEmployees(res);
    } catch (error) {
      console.error("Failed to fetch employees", error);
    }
  };

  useEffect(() => {
    fetchGetEmployees();
  }, []);

  const title = mode === "add" ? "Add New Department" : "Edit Department";

  const [searchQuery, setSearchQuery] = useState("");
  const [filteredEmployees, setFilteredEmployees] = useState<any[]>([]);

  // Automatically filter employees when searchQuery or employees changes
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredEmployees(employees);
    } else {
      const filtered = employees.filter(
        (emp) =>
          emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          emp.employee_code
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          emp.email?.toLowerCase().includes(searchQuery.toLowerCase()),
      );
      setFilteredEmployees(filtered);
    }
  }, [searchQuery, employees]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            <b>{title}</b>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="departmentCode">Department Code</Label>
              <Input
                id="departmentCode"
                placeholder="DEPT001"
                value={formData.departmentCode}
                onChange={(e) =>
                  handleInputChange("departmentCode", e.target.value)
                }
              />
              {errors.departmentCode && (
                <p className="text-red-500 text-sm">{errors.departmentCode}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="departmentName">Department Name</Label>
              <Input
                id="departmentName"
                placeholder="e.g., Production"
                value={formData.departmentName}
                onChange={(e) =>
                  handleInputChange("departmentName", e.target.value)
                }
              />
              {errors.departmentName && (
                <p className="text-red-500 text-sm">{errors.departmentName}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="departmentDescription">Description</Label>
            <Textarea
              id="departmentDescription"
              placeholder="Brief description of department functions"
              value={formData.departmentDescription}
              onChange={(e) =>
                handleInputChange("departmentDescription", e.target.value)
              }
            />
            {errors.departmentDescription && (
              <p className="text-red-500 text-sm">
                {errors.departmentDescription}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* <div className="space-y-2">
              <Label htmlFor="departmentHead">Department Head</Label>
              <Select
                value={formData.departmentHead}
                onValueChange={(value) =>
                  handleInputChange("departmentHead", value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Department Head" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id.toString()}>
                      {emp.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.departmentHead && (
                <p className="text-red-500 text-sm">{errors.departmentHead}</p>
              )}
            
            </div> */}

            <div className="space-y-2">
              <Label htmlFor="departmentHead">Department Head</Label>
              <Select
                value={formData.departmentHead}
                onValueChange={(value) =>
                  handleInputChange("departmentHead", value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Department Head" />
                </SelectTrigger>

                <SelectContent>
                  {/* 🔍 Add a simple search input */}
                  <div
                    className="p-2 sticky top-0 bg-white z-10"
                    onKeyDown={(e) => e.stopPropagation()}
                  >
                    <Input
                      type="text"
                      placeholder="Search employee..."
                      className="h-8 text-sm"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>

                  {/* Filtered Employee List */}
                  {filteredEmployees.length > 0 ? (
                    filteredEmployees.map((emp) => (
                      <SelectItem key={emp.id} value={emp.id.toString()}>
                        {emp.name} ({emp.employee_code?.trim()})
                      </SelectItem>
                    ))
                  ) : (
                    <div className="text-sm text-gray-500 p-2">
                      No matches found
                    </div>
                  )}
                </SelectContent>
              </Select>

              {errors.departmentHead && (
                <p className="text-red-500 text-sm">{errors.departmentHead}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                placeholder="Floor 1, Building A"
                value={formData.location}
                onChange={(e) => handleInputChange("location", e.target.value)}
              />
              {errors.location && (
                <p className="text-red-500 text-sm">{errors.location}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="employeesCount">Employees Count (Optional)</Label>
              <Input
                id="employeesCount"
                type="number"
                placeholder="50"
                value={formData.employeesCount}
                onChange={(e) =>
                  handleInputChange("employeesCount", e.target.value)
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="budget">Annual Budget</Label>
              <Input
                id="budget"
                type="number"
                placeholder="2500000"
                value={formData.budget}
                onChange={(e) => handleInputChange("budget", e.target.value)}
              />
              {errors.budget && (
                <p className="text-red-500 text-sm">{errors.budget}</p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange?.(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading
                ? "Saving..."
                : mode === "edit"
                  ? "Update Department"
                  : "Add Department"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
