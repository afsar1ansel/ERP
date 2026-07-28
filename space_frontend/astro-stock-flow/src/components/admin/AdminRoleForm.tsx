import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import axios from "axios";
import { BASE_URL } from "@/hooks/baseUrls";
import { addAdminRole, updateAdminRole } from "@/pages/master/AdminUsers";

interface Page {
  id: number;
  page_name: string;
  status: number;
}

interface AdminRole {
  id?: number;
  role_name: string;
  permissions: string;
}

interface AdminRoleFormProps {
  mode: "add" | "edit";
  role: any | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  refreshRoles: () => Promise<void>;
}

const getAllAdminPages = async (token: string) => {
  try {
    const url = `${BASE_URL}/admin-role-pages/get-all/${token}`;
    const res = await axios.get(url);
    return res.data || [];
  } catch (err) {
    console.error("Error fetching admin pages:", err);
    return [];
  }
};

export function AdminRoleForm({
  mode,
  role,
  open,
  onOpenChange,
  onSuccess,
  refreshRoles,
}: AdminRoleFormProps) {
  const { toast } = useToast();
  const token = localStorage.getItem("token") || "";

  const initialFormData: AdminRole = {
    role_name: "",
    permissions: "[]",
  };

  console.log(role)

  const [formData, setFormData] = useState<AdminRole>(initialFormData);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [availablePages, setAvailablePages] = useState<Page[]>([]);
  const [errors, setErrors] = useState<
    Partial<Record<keyof AdminRole, string>>
  >({});
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    const fetchPages = async () => {
      setPageLoading(true);
      const pages = await getAllAdminPages(token);
      setAvailablePages(pages);
      setPageLoading(false);
    };
    fetchPages();
  }, [token]);

useEffect(() => {
  if (mode === "edit" && role) {
    // 🎯 FIX: Ensure role_name and description are correctly pulled from the 'role' object
    setFormData({
      id: role.id,
      role_name: role.role_name || "",
      permissions: role.page_access || "[]", // <-- Use page_access from the fetched data
    });
    try {
      // Parse the page_access string (e.g., '[1, 6, 4]') into an array of strings ('1', '6', '4')
      // If role.page_access is null/undefined, use '[]' as default.
      const pageIds = JSON.parse(role.page_access || "[]").map(String);
      setSelectedPermissions(pageIds);
    } catch (e) {
      console.error("Error parsing permissions:", e);
      setSelectedPermissions([]);
    }
  } else if (mode === "add") {
    setFormData(initialFormData);
    setSelectedPermissions([]);
  }
}, [mode, role, open]);

  const handleInputChange = (field: keyof AdminRole, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handlePermissionChange = (pageId: string, checked: boolean) => {
    setSelectedPermissions((prev) =>
      checked ? [...prev, pageId] : prev.filter((p) => p !== pageId)
    );
  };

  const validateForm = () => {
    const newErrors: Partial<Record<keyof AdminRole, string>> = {};

    if (!formData.role_name.trim()) {
      newErrors.role_name = "Role Name is required.";
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
      const numericalPageAccess = selectedPermissions
        .map((id) => parseInt(id, 10))
        .filter((id) => !isNaN(id));

      const pageAccessJson = JSON.stringify(numericalPageAccess);

      const payload = {
        role_name: formData.role_name,
        page_access: pageAccessJson,
      };

      let res;
      if (mode === "add") {
        res = await addAdminRole(payload, token);
      } else if (mode === "edit" && formData.id) {
        res = await updateAdminRole({ ...payload, roleId: formData.id }, token);
      }

      if (res?.errFlag === 0) {
        toast({
          title: `Admin Role ${mode === "add" ? "Added" : "Updated"}`,
          description: `${formData.role_name} has been ${
            mode === "add" ? "created" : "updated"
          } successfully.`,
        });
        await refreshRoles();
        onSuccess();
        onOpenChange(false);
      } else {
        throw new Error(res?.message || "Operation failed.");
      }
    } catch (err: any) {
      console.error("❌ Admin Role form error:", err);
      toast({
        title: "Error",
        description:
          err.message || "Failed to save admin role. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const title =
    mode === "add"
      ? "Add New Admin Role"
      : `Edit Admin Role: ${role?.role_name}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>
            <b>{title}</b>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="role_name">Role Name</Label>
              <Input
                id="role_name"
                placeholder="e.g., Super Admin"
                value={formData.role_name}
                onChange={(e) => handleInputChange("role_name", e.target.value)}
              />
              {errors.role_name && (
                <p className="text-red-500 text-sm">{errors.role_name}</p>
              )}
            </div>
            <div></div>
          </div>

          {/* <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Brief description of the role's responsibilities"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
            />
            {errors.description && (
              <p className="text-red-500 text-sm">{errors.description}</p>
            )}
          </div> */}

          <div className="space-y-3 p-4 border rounded-md">
            <Label className="text-lg font-semibold">
              Page Access Permissions
            </Label>
            <p className="text-sm text-muted-foreground">
              Select the pages this role has access to (Page ID will be saved).
            </p>
            <div className="grid grid-cols-2 gap-3 mt-2">
              {pageLoading ? (
                <div className="text-muted-foreground italic col-span-2">
                  Loading pages...
                </div>
              ) : (
                availablePages.map((page) => (
                  <div key={page.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={page.id.toString()}
                      checked={selectedPermissions.includes(page.id.toString())}
                      onCheckedChange={(checked) =>
                        handlePermissionChange(
                          page.id.toString(),
                          checked as boolean
                        )
                      }
                    />
                    <label
                      htmlFor={page.id.toString()}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {page.page_name}
                    </label>
                  </div>
                ))
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
            <Button type="submit" disabled={loading || pageLoading}>
              {loading
                ? "Saving..."
                : mode === "edit"
                ? "Update Role"
                : "Add Role"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
