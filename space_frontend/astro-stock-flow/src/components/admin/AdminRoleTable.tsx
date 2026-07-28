import { useState } from "react";
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
import { Edit, Eye, ToggleRight, ToggleLeft } from "lucide-react";
import { AdminRoleForm } from "./AdminRoleForm";
import { BASE_URL } from "@/hooks/baseUrls";

// import { AdminRoleForm } from "./AdminRoleForm";
// import { changeAdminRoleStatus } from "@/pages/AdminUsers"; // Import API function

interface AdminRole {
  id: number;
  role_name: string;
  description: string;
  status: 0 | 1;
  permissions: string; // JSON string or comma-separated list of permissions
  // Add other AdminRole properties here
}

interface AdminRoleTableProps {
  adminRoles: AdminRole[];
  setAdminRoles: React.Dispatch<React.SetStateAction<any[]>>;
  refreshRoles: () => Promise<void>;
}

export function AdminRoleTable({
  adminRoles,
  refreshRoles,
}: AdminRoleTableProps) {
  const { toast } = useToast();
  const [editRoleOpen, setEditRoleOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<AdminRole | null>(null);
  const token = localStorage.getItem("token") || "";

  const handleEditRole = (role: AdminRole) => {
    setSelectedRole(role);
    setEditRoleOpen(true);
  };

  const handleDeleteRole = (role: AdminRole) => {
    setSelectedRole(role);
    setDeleteConfirmOpen(true);
  };

  async function handleToggleStatus(role: AdminRole) {
    const newStatus = role.status === 1 ? 0 : 1;

    try {
      const res = await fetch(
        `${BASE_URL}/admin-roles/change-status/${role.id}/${newStatus}/${token}`,
        {
          method: "GET",
        }
      );
   
      if (res.ok) {
        toast({
          title: "Success",
          description: "Status updated successfully",
        });
        await refreshRoles();
      } else {
        toast({
          title: "Error",
          description: "Failed to update status",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error("Error updating status:", err);
    }
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>SL no.</TableHead>
            <TableHead>Role Name</TableHead>
            {/* <TableHead>Description</TableHead> */}
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {adminRoles.length > 0 ? (
            adminRoles.map((role, index) => (
              <TableRow key={role.id}>
                <TableCell>{index + 1}</TableCell>
                <TableCell className="font-medium">{role.role_name}</TableCell>
                {/* <TableCell className="max-w-[300px] truncate">
                  {role.description}
                </TableCell> */}
                <TableCell>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      role.status === 1
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {role.status === 1 ? "Active" : "Inactive"}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    {/* Add View Permissions/Details Button if necessary */}
                    {/* <Button variant="ghost" size="icon" onClick={() => handleViewDetails(role)}>
                      <Eye className="h-4 w-4" />
                    </Button> */}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEditRole(role)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteRole(role)}
                    >
                      {role.status === 1 ? (
                        <ToggleRight className="h-4 w-4 text-green-600" />
                      ) : (
                        <ToggleLeft className="h-4 w-4 text-red-600" />
                      )}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={5} className="h-24 text-center">
                No Admin Roles found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* Edit Role Form Dialog */}
      {/* {selectedRole && (
        <AdminRoleForm
          mode="edit"
          role={selectedRole}
          isOpen={editRoleOpen}
          onOpenChange={setEditRoleOpen}
          onSuccess={() => {
            setEditRoleOpen(false);
            refreshRoles();
          }}
        />
      )} */}

      {/* Status Toggle Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change Admin Role Status</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to change the status of role{" "}
              <span className="font-bold">{selectedRole?.role_name}</span> to{" "}
              <span className="font-bold">
                {selectedRole?.status === 1 ? "Inactive" : "Active"}
              </span>
              ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleToggleStatus(selectedRole!)}
            >
              Confirm Change
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {selectedRole && ( // Only render if we have a role selected
        <AdminRoleForm
          mode="edit"
          role={selectedRole}
          open={editRoleOpen} // This controls the Dialog's visibility
          onOpenChange={setEditRoleOpen} // Allows closing the Dialog
          onSuccess={() => {
            setEditRoleOpen(false);
            refreshRoles();
          }}
          refreshRoles={refreshRoles}
        />
      )}
    </div>
  );
}
