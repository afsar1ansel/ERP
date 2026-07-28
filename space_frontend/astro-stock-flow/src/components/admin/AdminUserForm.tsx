import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { addAdminUser, updateAdminUser } from "@/pages/master/AdminUsers"; // Import API functions

interface AdminUser {
  id?: number;
  name: string;
  email: string;
  password?: string; // Only for add mode, or if updating password
  role_id: string; // Use string for form select value
  status?: 0 | 1;
}

interface AdminRole {
  id: number;
  role_name: string;
  // ... other role properties
}

interface AdminUserFormProps {
  mode: "add" | "edit";

  user: any | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  refreshUsers: () => void;
  adminRoles: any[];
}

export function AdminUserForm({
  mode,
  user,
  open,
  onOpenChange,
  onSuccess,
  refreshUsers,
  adminRoles,
}: AdminUserFormProps) {
  const { toast } = useToast();
  const token = localStorage.getItem("token") || "";

  const initialFormData: AdminUser = {
    name: "",
    email: "",
    password: "",
    role_id: "",
  };
  console.log(user);
  const [formData, setFormData] = useState<AdminUser>(initialFormData);
  const [errors, setErrors] = useState<
    Partial<Record<keyof AdminUser, string>>
  >({});
  const [loading, setLoading] = useState(false);

  // Pre-populate on edit
  useEffect(() => {
    if (mode === "edit" && user) {
      setFormData({
        id: user.id,
        name: user.username || "",
        email: user.email || "",
        role_id: user.role_id?.toString() || "",
        // Do not pre-populate password for security
      });
    } else if (mode === "add") {
      setFormData(initialFormData);
    }
  }, [mode, user, open]);

  const handleInputChange = (field: keyof AdminUser, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validateForm = () => {
    const newErrors: Partial<Record<keyof AdminUser, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required.";
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email format.";
    }

    if (!formData.role_id) {
      newErrors.role_id = "Role is required.";
    }

    if (mode === "add" && !formData.password?.trim()) {
      newErrors.password = "Password is required for new users.";
    } else if (formData.password && formData.password.trim().length < 6) {
      // Optional password validation for length
      newErrors.password = "Password must be at least 6 characters.";
    }

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
      let res;
      const payload = {
        name: formData.name,
        email: formData.email,
        roleId: parseInt(formData.role_id),
        // Only include password if it's set and it's add mode, or if a new one is provided in edit mode
        ...(formData.password && { password: formData.password }),
      };

      if (mode === "add") {
        res = await addAdminUser(payload, token);
      } else if (mode === "edit" && formData.id) {
        res = await updateAdminUser({ ...payload, userId: formData.id }, token);
      }

      if (res?.errFlag === 0) {
        toast({
          title: `Admin User ${mode === "add" ? "Added" : "Updated"}`,
          description: `${formData.name} has been ${
            mode === "add" ? "created" : "updated"
          } successfully.`,
        });
        await refreshUsers();
        onSuccess();
        onOpenChange?.(false);
      } else {
        throw new Error(res?.message || "Operation failed.");
      }
    } catch (err) {
      console.error("❌ Admin User form error:", err);
      toast({
        title: "Error",
        description:
          "Failed to save admin user. Please check your data and try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const title =
    mode === "add" ? "Add New Admin User" : `Edit Admin User: ${user?.name}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            <b>{title} </b>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              placeholder="John Doe"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
            />
            {errors.name && (
              <p className="text-red-500 text-sm">{errors.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="john.doe@admin.com"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
            />
            {errors.email && (
              <p className="text-red-500 text-sm">{errors.email}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="role_id">Role</Label>
            <Select
              value={formData.role_id}
              onValueChange={(value) => handleInputChange("role_id", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Admin Role" />
              </SelectTrigger>
              <SelectContent>
                {adminRoles.map((role) => (
                  <SelectItem key={role.id} value={role.id.toString()}>
                    {role.role_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.role_id && (
              <p className="text-red-500 text-sm">{errors.role_id}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">
              Password {mode === "edit" ? "(Leave blank to keep current)" : ""}
            </Label>
            <Input
              id="password"
              type="password"
              placeholder={mode === "add" ? "Enter password" : "••••••••"}
              value={formData.password}
              onChange={(e) => handleInputChange("password", e.target.value)}
            />
            {errors.password && (
              <p className="text-red-500 text-sm">{errors.password}</p>
            )}
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
                ? "Update User"
                : "Add User"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
