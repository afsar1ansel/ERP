import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { Plus, Users, Shield, UserCog, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

// Components for Admin Users/Roles
import { AdminUserTable } from "@/components/admin/AdminUserTable";
import { AdminRoleTable } from "@/components/admin/AdminRoleTable";
import { AdminUserForm } from "@/components/admin/AdminUserForm";
import { AdminRoleForm } from "@/components/admin/AdminRoleForm";

// API/Utility Imports
import axios from "axios";
import { BASE_URL } from "@/hooks/baseUrls";
// import { useLocation } from "react-router-dom"; // Use if needed for search results

// --- API Functions for Admin Users (Placeholders) ---

// Assuming AdminUser type: { id: number, name: string, email: string, role_id: number, status: number, ... }

export const addAdminUser = async (payload: any, token: string) => {
  const formData = new FormData();
   formData.append("username", payload.name);
   formData.append("email", payload.email);
   formData.append("password", payload.password);
   formData.append("role", payload.roleId.toString());
   formData.append("token", token);
   console.log(Object.fromEntries(formData));

  try {
    const res = await axios.post(`${BASE_URL}/admin-users/add`, formData);
    return res.data;
  } catch (err) {
    console.error("Error adding admin user:", err);
    throw err;
  }
};

export const updateAdminUser = async (payload: any, token: string) => {
  const formData = new FormData();
  formData.append("adminUserId", payload.userId.toString());
  formData.append("username", payload.name);
  formData.append("email", payload.email);
  if(payload.password) formData.append("password", payload.password);
  formData.append("roleId", payload.roleId.toString());
  formData.append("token", token);
  console.log(Object.fromEntries(formData));
  try {
    const res = await fetch(`${BASE_URL}/admin-users/update-admin-user`, {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    console.log(data);
    return data;

  } catch (err) {
    console.error("Error updating admin user:", err);
    throw err;
  }
};

export const getAllAdminUsers = async (token: string) => {
  try {
    const res = await axios.get(
      `${BASE_URL}/admin-users/get-all-Admin-users/${token}`
    );
    console.log(res.data);
    return res.data?.data || res.data; // Adjust based on your API response structure
  } catch (err) {
    console.error("Error fetching admin users:", err);
    throw err;
  }
};

export const changeAdminUserStatus = async (
  userId: string | number,
  status: string | number,
  token: string
) => {
  try {
    const res = await axios.get(
      `${BASE_URL}/admin-users/change-status/${userId}/${status}/${token}`
    );
    return res.data;
  } catch (err) {
    console.error("Error changing admin user status:", err);
    throw err;
  }
};

// --- API Functions for Admin Roles (Placeholders) ---

// Assuming AdminRole type: { id: number, role_name: string, description: string, status: number, permissions: string, ... }
export const addAdminRole = async (payload: any, token: string) => {
  // Assuming a simple JSON payload for roles for demonstration
  const formData = new FormData();
  formData.append("role_name", payload.role_name);
  // formData.append("description", payload.description);
  formData.append("page_access", payload.page_access);
  formData.append("token", token);
  console.log(Object.fromEntries(formData));
  try {
    const res = await fetch(`${BASE_URL}/admin-roles/add`, {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    console.log(data);
    return data;
  } catch (err) {
    console.error("Error adding admin role:", err);
    throw err;
  }
};

export const updateAdminRole = async (payload: any, token: string) => {
  const formData = new FormData();
  formData.append("role_name", payload.role_name);
  formData.append("page_access", payload.page_access);
  formData.append("role_id", payload.roleId);
  formData.append("token", token);
  console.log(Object.fromEntries(formData));
  try {
    const res = await fetch(`${BASE_URL}/admin-roles/update`, {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    console.log(data);
    return data;
  } catch (err) {
    console.error("Error updating admin role:", err);
    throw err;
  }
};

export const getAllAdminRoles = async (token: string) => {
  try {
    const res = await axios.get(`${BASE_URL}/admin-roles/get-all/${token}`);
    console.log(res.data);
    return res.data?.data || res.data; // Adjust based on your API response structure
  } catch (err) {
    console.error("Error fetching admin roles:", err);
    throw err;
  }
};

export const changeAdminRoleStatus = async (
  roleId: string | number,
  status: string | number,
  token: string
) => {
  try {
    const res = await axios.get(
      `${BASE_URL}/admin-roles/change-status/${roleId}/${status}/${token}`
    );
    return res.data;
  } catch (err) {
    console.error("Error changing admin role status:", err);
    throw err;
  }
};

// --- Main Component ---
export default function AdminUsers() {
  const [isAdminUserDialogOpen, setIsAdminUserDialogOpen] = useState(false);
  const [isAdminRoleDialogOpen, setIsAdminRoleDialogOpen] = useState(false);
  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const [adminRoles, setAdminRoles] = useState<any[]>([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const token = localStorage.getItem("token") || "";

  // const location = useLocation();
  // const result = location.state?.result; // Uncomment if search results are passed via state

  const fetchAdminUsers = async (t: string) => {
    try {
      const res = await getAllAdminUsers(t);
      setAdminUsers(res);
      setIsDataLoaded(true);
      console.log("Admin Users fetched:", res);
    } catch (err) {
      console.error("Error fetching admin users:", err);
      setIsDataLoaded(true);
      setAdminUsers([]); // Ensure it's an array even on error
    }
  };

  const fetchAdminRoles = async (t: string) => {
    try {
      const res = await getAllAdminRoles(t);
      setAdminRoles(res);
      console.log("Admin Roles fetched:", res);
    } catch (err) {
      console.error("Error fetching admin roles:", err);
      setAdminRoles([]); // Ensure it's an array even on error
    }
  };

  useEffect(() => {
    fetchAdminUsers(token);
    fetchAdminRoles(token);
  }, [token]);

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header remains the same */}
        <div className="flex items-center gap-2">
          <Link to="/master">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Master Data
            </Button>
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <UserCog className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Admin Users & Roles
            </h1>
            <p className="text-muted-foreground">
              Manage system administrators and their permissions
            </p>
          </div>
        </div>

        <Tabs defaultValue="users" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Admin Users
            </TabsTrigger>
            <TabsTrigger value="roles" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Admin Roles
            </TabsTrigger>
          </TabsList>

          {/* Admin Users Tab Content */}
          <TabsContent value="users" className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={() => setIsAdminUserDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add New Admin User
              </Button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>All Admin Users</CardTitle>
              </CardHeader>
              <CardContent>
                <AdminUserTable
                  adminUsers={adminUsers}
                  setAdminUsers={setAdminUsers}
                  isDataLoaded={isDataLoaded}
                  refreshUsers={() => fetchAdminUsers(token)}
                  adminRoles={adminRoles}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Admin Roles Tab Content */}
          <TabsContent value="roles" className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={() => setIsAdminRoleDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add New Admin Role
              </Button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>All Admin Roles</CardTitle>
              </CardHeader>
              <CardContent>
                <AdminRoleTable
                  adminRoles={adminRoles}
                  setAdminRoles={setAdminRoles}
                  refreshRoles={() => fetchAdminRoles(token)}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Forms rendered outside of tabs */}
      <AdminUserForm
        mode="add"
        user={null}
        open={isAdminUserDialogOpen}
        onOpenChange={setIsAdminUserDialogOpen}
        onSuccess={() => {
          setIsAdminUserDialogOpen(false);
          fetchAdminUsers(token);
        }}
        refreshUsers={() => fetchAdminUsers(token)}
        adminRoles={adminRoles}
      />
      

      <AdminRoleForm
        mode="add"
        role={null}
        open={isAdminRoleDialogOpen}
        onOpenChange={setIsAdminRoleDialogOpen}
        onSuccess={() => {
          setIsAdminRoleDialogOpen(false);
          fetchAdminRoles(token);
        }}
        refreshRoles={() => fetchAdminRoles(token)}
      />
    </MainLayout>
  );
}
