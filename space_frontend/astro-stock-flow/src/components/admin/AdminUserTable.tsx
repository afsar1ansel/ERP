import { useState } from "react";
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
import { Edit, Trash2, Mail, Eye, ToggleRight, ToggleLeft } from "lucide-react";
import { AdminUserForm } from "./AdminUserForm";
import { set } from "date-fns";
import { BASE_URL } from "@/hooks/baseUrls";


interface AdminUser {
  id: number;
  username: string;
  email: string;
  role_id: number;
  role_name: string; // Assuming role_name is included or fetched
  status: 0 | 1;
  created_at: string;
  // Add other AdminUser properties here
}

interface AdminRole {
  id: number;
  role_name: string;
  // Add other AdminRole properties here
}

interface AdminUserTableProps {
  adminUsers: AdminUser[];
  setAdminUsers: React.Dispatch<React.SetStateAction<any[]>>;
  isDataLoaded: boolean;
  refreshUsers: () => Promise<void>;
  adminRoles: AdminRole[];
  // searchResult?: any; // Uncomment if search results are passed
}

export function AdminUserTable({
  adminUsers,
  refreshUsers,
  adminRoles,
}: AdminUserTableProps) {
  const { toast } = useToast();
  const [viewProfileOpen, setViewProfileOpen] = useState(false);
  const [editUserOpen, setEditUserOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const token = localStorage.getItem("token") || "";

  const handleViewProfile = (user: AdminUser) => {
    setSelectedUser(user);
    setViewProfileOpen(true);
  };

  const handleEditUser = (user: AdminUser) => {
    setSelectedUser(user);
    setEditUserOpen(true);
  };

 

  async function handleToggleStatus(user: AdminUser) {
    const newStatus = user.status === 1 ? 0 : 1;
   console.log(newStatus);
    try {
      const res = await fetch(
        `${BASE_URL}/admin-users/change-user-status/${newStatus}/${user.id}/${token}`,
        {
          method: "GET",
        }
      );
      console.log(
        `${BASE_URL}/admin-users/change-user-status/${newStatus}/${user.id}/${token}`
      );

      if (res.ok) {
        toast({
          title: "Success",
          description: "Status updated successfully",
        });
        await refreshUsers();
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
    setDeleteConfirmOpen(false); // Close dialog if opened via confirmation
  }



  const getRoleName = (roleId: number) => {
    return adminRoles.find((role) => role.id === roleId)?.role_name || "N/A";
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>SL no.</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {adminUsers.length > 0 ? (
            adminUsers.map((user, index) => (
              <TableRow key={user.id}>
                <TableCell>{index + 1}</TableCell>
                <TableCell className="font-medium">{user.username}</TableCell>
                <TableCell>
                  <div className="text-sm text-muted-foreground flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    {user.email}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">{getRoleName(user.role_id)}</Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    className={`px-2 py-0.5 rounded-full ${
                      user.status === 1
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {user.status === 1 ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>

                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleViewProfile(user)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEditUser(user)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                        onClick={() => handleToggleStatus(user)}
                    >
                      {user.status === 1 ? (
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
              <TableCell colSpan={6} className="h-24 text-center">
                No Admin Users found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* View Profile Dialog (Similar to Employee Profile) */}
      <Dialog open={viewProfileOpen} onOpenChange={setViewProfileOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Admin User Profile - {selectedUser?.username}
            </DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">Name</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedUser.username}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedUser.email}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Role</p>
                  <p className="text-sm text-muted-foreground">
                    {getRoleName(selectedUser.role_id)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Status</p>
                  <Badge
                    className={`px-2 py-0.5 rounded-full ${
                      selectedUser.status === 1
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {selectedUser.status === 1 ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

    

      {/* Status Toggle Confirmation Dialog (Can be repurposed from Delete) */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change Admin User Status</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to change the status of{" "}
              <span className="font-bold">{selectedUser?.username}</span> to{" "}
              <span className="font-bold">
                {selectedUser?.status === 1 ? "Inactive" : "Active"}
              </span>
              ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              // onClick={() => handleToggleStatus(selectedUser!)}
            >
              Confirm Change
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {selectedUser && ( // Only render if we have a role selected
        <AdminUserForm
          mode="edit"
          user={selectedUser}
          open={editUserOpen} // This controls the Dialog's visibility
          onOpenChange={setEditUserOpen} // Allows closing the Dialog
          onSuccess={() => {
            setEditUserOpen(false);
            refreshUsers();
          }}
          refreshUsers={refreshUsers}
          adminRoles={adminRoles}
        />
      )}
    </div>
  );
}
