import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { BASE_URL } from "@/hooks/baseUrls";
import { updateEmployee } from "@/pages/Employees";

interface Employee {
  id: string;
  name: string;
  role: string;
  phone: string;
  email: string;
  department_id: string;
  status: string;
  employee_code: string;
  emp_status?: string;
}

interface EditEmployeeFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee: Employee | null;
  updateData: () => Promise<void>;
}

export function EditEmployeeForm({
  open,
  onOpenChange,
  employee,
  updateData,
}: EditEmployeeFormProps) {
  const { toast } = useToast();
  const token = localStorage.getItem("token") || "";

  const [formData, setFormData] = useState({
    name: "",
    role: "",
    contact: "",
    email: "",
    department: "",
    status: "",
    employee_code: "",
  });

  // ✅ State to hold validation errors
  const [errors, setErrors] = useState({
    name: "",
    role: "",
    contact: "",
    email: "",
    department: "",
    status: "",
    employee_code: "",
  });

  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (employee) {
      setFormData({
        name: employee.name || "",
        role: employee.role || "",
        contact: employee.phone || "",
        email: employee.email || "",
        department: employee.department_id || "",
        status: employee.emp_status || "",
        employee_code: employee.employee_code || "",
      });
      // Clear errors when a new employee is loaded
      setErrors({
        name: "",
        role: "",
        contact: "",
        email: "",
        department: "",
        status: "",
        employee_code: "",
      });
    }
  }, [employee, open]); // Depend on 'open' to reset form when reopened

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // ✅ Clear the error for the field being edited
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  // ✅ Validation function using Regex
  const validateForm = () => {
    const newErrors: any = {};

    if (!/^[A-Za-z\s.'-]+$/.test(formData.name)) {
      newErrors.name = "Please enter a valid name.";
    }

    if (!/^[A-Za-z\s_-]+$/.test(formData.role)) {
      newErrors.role = "Role can only contain letters, spaces, -, and _.";
    }

    if (!/^[0-9]{10}$/.test(formData.contact)) {
      newErrors.contact = "Contact must be a 10-digit number.";
    }

    if (
      !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(formData.email)
    ) {
      newErrors.email = "Please enter a valid email address.";
    }

    if (!formData.department) {
      newErrors.department = "Please select a department.";
    }

    if (!formData.status) {
      newErrors.status = "Please select a status.";
    }

    if (!formData.employee_code.trim()) {
      newErrors.employee_code = "Employee code is required.";
    } else if (!/^[A-Za-z0-9_-]+$/.test(formData.employee_code)) {
      newErrors.employee_code =
        "Employee code can only contain letters, numbers, hyphens, and underscores.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // ✅ Validate before submitting
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please check the form for errors.",
        variant: "destructive",
      });
      return;
    }

    if (!employee) return;

    setLoading(true);
    try {
      const res = await updateEmployee(
        employee.id,
        formData.employee_code, // Use the updated employee_code from formData
        formData.name,
        formData.contact,
        formData.email,
        formData.department,
        formData.role,
        formData.status,
        token
      );

      if (res.errFlag !== 0) {
        toast({
          title: "Error",
          description: res.message,
          variant: "destructive",
        });
        return;
      }

      await updateData(); // Use await to ensure data is fresh
      toast({
        title: "Employee Updated",
        description: `${formData.name} has been successfully updated.`,
      });

      onOpenChange(false); // close dialog
    } catch (err: any) {
      toast({
        title: "Error",
        description:
          err?.response?.data?.message || "Failed to update employee",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAllDepartments = async () => {
    try {
      const res = await fetch(`${BASE_URL}/departments/get-all/${token}`);
      const data = await res.json();
      setDepartments(data);
    } catch (err) {
      console.error("Error fetching departments:", err);
      toast({
        title: "Error",
        description: "Could not load departments.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchAllDepartments();
  }, []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Employee - {employee?.name}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
              />
              {errors.name && (
                <p className="text-red-500 text-sm">{errors.name}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Input
                id="role"
                value={formData.role}
                onChange={(e) => handleInputChange("role", e.target.value)}
              />
              {errors.role && (
                <p className="text-red-500 text-sm">{errors.role}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="employee_code">Employee Code</Label>
              <Input
                id="employee_code"
                value={formData.employee_code}
                onChange={(e) =>
                  handleInputChange("employee_code", e.target.value)
                }
                placeholder="Enter employee code"
              />
              {errors.employee_code && (
                <p className="text-red-500 text-sm">{errors.employee_code}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact">Contact Number</Label>
              <Input
                id="contact"
                maxLength={10}
                value={formData.contact}
                onChange={(e) => handleInputChange("contact", e.target.value)}
              />
              {errors.contact && (
                <p className="text-red-500 text-sm">{errors.contact}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
              />
              {errors.email && (
                <p className="text-red-500 text-sm">{errors.email}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Select
                value={formData.department}
                onValueChange={(value) =>
                  handleInputChange("department", value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((department) => (
                    <SelectItem
                      key={department.id}
                      value={department.id.toString()}
                    >
                      {department.department_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.department && (
                <p className="text-red-500 text-sm">{errors.department}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => handleInputChange("status", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="On Leave">On Leave</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
              {errors.status && (
                <p className="text-red-500 text-sm">{errors.status}</p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Updating..." : "Update Employee"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default EditEmployeeForm;
