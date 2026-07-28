import { useEffect, useState } from "react";
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
import { addEmployee } from "@/pages/Employees";

interface AddEmployeeFormProps {
  onSuccess: () => void;
  refreshEmployees: () => Promise<void>;
}

export function AddEmployeeForm({
  onSuccess,
  refreshEmployees,
}: AddEmployeeFormProps) {
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    employeeId: "",
    name: "",
    role: "",
    contact: "",
    email: "",
    department: "",
  });

  const [errors, setErrors] = useState({
    employeeId: "",
    name: "",
    role: "",
    contact: "",
    email: "",
    department: "",
  });

  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem("token") || "";

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" })); // Clear error on change
  };

  // ✅ Validation Function
  const validateForm = () => {
    let newErrors: any = {};

    // Regex: Starts with at least 2 letters, optional hyphen/underscore, ends with numbers
    if (!/^[A-Za-z]{2,}[-_]?[0-9]+$/.test(formData.employeeId)) {
      newErrors.employeeId =
        "Employee ID must start with letters followed by numbers (e.g., EMP001, JOB-123).";
    }

    if (!/^[A-Za-z\s_-]+$/.test(formData.name)) {
      newErrors.name = "Name can only contain letters, spaces, - and _.";
    }

    if (!/^[A-Za-z\s_-]+$/.test(formData.role)) {
      newErrors.role = "Role can only contain letters, spaces, - and _.";
    }

    if (!/^[0-9]{10}$/.test(formData.contact)) {
      newErrors.contact = "Contact must be a 10-digit number.";
    }

    if (
      !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[A-Za-z]{2,}$/.test(formData.email)
    ) {
      newErrors.email = "Enter a valid email address.";
    }

    if (!formData.department) {
      newErrors.department = "Please select a department.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ✅ Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please fix the highlighted fields.",
      });
      return;
    }

    try {
      setLoading(true);

      const res = await addEmployee(
        formData.employeeId,
        formData.name,
        formData.contact,
        formData.email,
        formData.department,
        formData.role,
        token
      );

      if (res.errFlag !== 0) {
        toast({
          variant: "destructive",
          title: "Error",
          description: res.message,
        });
        return;
      }

      toast({
        title: "Success",
        description: `${formData.name} has been successfully added.`,
      });

      setFormData({
        employeeId: "",
        name: "",
        role: "",
        contact: "",
        email: "",
        department: "",
      });

      refreshEmployees();
      onSuccess();
    } catch (err) {
      console.error("Error adding employee:", err);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Something went wrong while adding employee.",
      });
    } finally {
      setLoading(false);
    }
  };

  // ✅ Fetch Departments
  const fetchAllDepartments = async () => {
    try {
      const res = await fetch(`${BASE_URL}/departments/get-all/${token}`);
      const data = await res.json();
      setDepartments(data);
    } catch (err) {
      console.error("Error fetching departments:", err);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not load departments.",
      });
    }
  };

  useEffect(() => {
    fetchAllDepartments();
  }, []);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="employeeId">Employee ID</Label>
          <Input
            id="employeeId"
            placeholder="EMP001"
            value={formData.employeeId}
            onChange={(e) => handleInputChange("employeeId", e.target.value)}
          />
          {errors.employeeId && (
            <p className="text-red-500 text-sm">{errors.employeeId}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="name">Full Name</Label>
          <Input
            id="name"
            placeholder="Enter full name"
            value={formData.name}
            onChange={(e) => handleInputChange("name", e.target.value)}
          />
          {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="role">Role</Label>
        <Input
          id="role"
          placeholder="e.g., Production Manager"
          value={formData.role}
          onChange={(e) => handleInputChange("role", e.target.value)}
        />
        {errors.role && <p className="text-red-500 text-sm">{errors.role}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="contact">Contact Number</Label>
          <Input
            id="contact"
            placeholder="9876543210"
            maxLength={10}
            value={formData.contact}
            onChange={(e) => handleInputChange("contact", e.target.value)}
          />
          {errors.contact && (
            <p className="text-red-500 text-sm">{errors.contact}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="employee@company.com"
            value={formData.email}
            onChange={(e) => handleInputChange("email", e.target.value)}
          />
          {errors.email && (
            <p className="text-red-500 text-sm">{errors.email}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="department">Department</Label>
        <Select
          value={formData.department}
          onValueChange={(value) => handleInputChange("department", value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select department" />
          </SelectTrigger>
          <SelectContent>
            {departments.map((department) => (
              <SelectItem key={department.id} value={department.id.toString()}>
                {department.department_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.department && (
          <p className="text-red-500 text-sm">{errors.department}</p>
        )}
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onSuccess}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Adding..." : "Add Employee"}
        </Button>
      </div>
    </form>
  );
}
