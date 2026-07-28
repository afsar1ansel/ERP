import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Plus, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import axios from "axios";
import { BASE_URL } from "@/hooks/baseUrls";
import { ClientTypeTable } from "@/components/masters/ClientTypeTable";
import { ClientTypeForm } from "@/components/masters/ClientTypeForm";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

// --- INTERFACE (Similar to Brand) ---
export interface ClientType {
  id: number;
  type_name: string;
  client_type_code?: string;
  status: number; // 0 | 1
  created_at: string;
  updated_at: string;
  created_admin_id: number;
  updated_admin_id: number | null;
}

// --- API FUNCTIONS (CRUD Operations for Client Types) ---

// POST: Add a new client type
export const addClientType = async ({
  clientTypeName,
//   clientTypeCode,
  token,
}: {
  clientTypeName: string;
//   clientTypeCode: string;
  token: string;
}) => {
    console.log(clientTypeName);
  const formData = new FormData();
  formData.append("typeName", clientTypeName);
  formData.append("token", token);

  // Using POST for form data submission
  const { data } = await axios.post(
    `${BASE_URL}/client-types/add-client-type`,
    formData
  );
  console.log(data);
  return data;
};

// POST: Update an existing client type
export const updateClientType = async ({
  clientTypeId,
  clientTypeName,
  token,
}: {
  clientTypeId: number;
  clientTypeName: string;
  token: string;
}) => {
  const formData = new FormData();
  formData.append("clientTypeId", String(clientTypeId));
  formData.append("typeName", clientTypeName);
  formData.append("token", token);

  const { data } = await axios.post(
    `${BASE_URL}/client-types/update-client-type`,
    formData
  );
  console.log(data);
  return data;
};

// GET: Fetch all client types
export const fetchClientTypes = async (token: string) => {
  // Using GET with token in the URL path (assuming BASE_URL is set)
  const { data } = await axios.get(
    `${BASE_URL}/client-types/get-client-types/${token}`
  );
  return data; // Assuming the API returns an array of client types
};

// GET: Change client type status
export const changeClientTypeStatus = async ({
  clientTypeId,
  status,
  token,
}: {
  clientTypeId: number;
  status: number;
  token: string;
}) => {
  // Using GET with parameters in the URL path
  const { data } = await axios.get(
    `${BASE_URL}/client-types/change-client-type-status/${clientTypeId}/${status}/${token}`
  );
  return data;
};

// POST: Delete a client type (hypothetical, using POST for safety)
export const deleteClientType = async ({
  clientTypeId,
  token,
}: {
  clientTypeId: number;
  token: string;
}) => {
  const formData = new FormData();
  formData.append("clientTypeId", String(clientTypeId));
  formData.append("token", token);

  const { data } = await axios.post(
    `${BASE_URL}/client-types/delete-client-type`,
    formData
  );
  return data;
};

const MasterClientType = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  // State to hold the list of client types
  const [clientTypes, setClientTypes] = useState<ClientType[]>([]);

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link to="/master">Master Data</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbPage>Client Types</BreadcrumbPage>
              </BreadcrumbList>
            </Breadcrumb>
            <div className="flex items-center gap-2">
              <Link to="/master">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Master Data
                </Button>
              </Link>
            </div>
            <h1 className="text-3xl font-bold">Client Type Management</h1>
            <p className="text-muted-foreground">
              Manage different types of clients (e.g., Distributor, Retailer).
            </p>
          </div>
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Client Type
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Client Types</CardTitle>
            <CardDescription>
              View and manage all your client types
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Pass state and setter to the table */}
            <ClientTypeTable
              clientTypes={clientTypes}
              setClientTypes={setClientTypes}
            />
          </CardContent>
        </Card>

        {/* Form for adding/editing a client type */}
        <ClientTypeForm
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
          setClientTypes={setClientTypes}
        />
      </div>
    </MainLayout>
  );
};

export default MasterClientType;
