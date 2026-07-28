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
import { UnitMeasurementTable } from "@/components/masters/UnitMeasurementTable";
import { UnitMeasurementForm } from "@/components/masters/UnitMeasurementForm";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

// --- INTERFACE (Similar to ClientType) ---
export interface UnitMeasurement {
  id: number;
  unit_name: string; // Corresponds to type_name
//   unit_code: string; // New field, similar to client_type_code
  status: number; // 0 | 1
  created_at: string;
  updated_at: string;
  created_admin_id: number;
  updated_admin_id: number | null;
}

// --- API FUNCTIONS (CRUD Operations for Unit Measurements) ---

// POST: Add a new unit measurement
export const addUnitMeasurement = async ({
  unitName,
//   unitCode,
  token,
}: {
  unitName: string;
//   unitCode: string;
  token: string;
}) => {
  console.log(unitName);
  const formData = new FormData();
  formData.append("unitName", unitName);
//   formData.append("unitCode", unitCode);
  formData.append("token", token);

  // Using POST for form data submission
  const { data } = await axios.post(`${BASE_URL}/units/add-unit`, formData);
  console.log(data);
  return data;
};

// POST: Update an existing unit measurement
export const updateUnitMeasurement = async ({
  unitMeasurementId,
  unitName,
//   unitCode,
  token,
}: {
  unitMeasurementId: number;
  unitName: string;
//   unitCode: string;
  token: string;
}) => {
  const formData = new FormData();
  formData.append("unitId", String(unitMeasurementId));
  formData.append("unitName", unitName);
//   formData.append("unitCode", unitCode);
  formData.append("token", token);

  const { data } = await axios.post(`${BASE_URL}/units/update-unit`, formData);
  console.log(data);
  return data;
};

// GET: Fetch all unit measurements
export const fetchUnitMeasurements = async (token: string) => {
  // Using GET with token in the URL path (assuming BASE_URL is set)
  const { data } = await axios.get(`${BASE_URL}/units/get-units/${token}`);
  // Assuming the API returns an array of unit measurements
  return data;
};

// GET: Change unit measurement status
export const changeUnitMeasurementStatus = async ({
  unitMeasurementId,
  status,
  token,
}: {
  unitMeasurementId: number;
  status: number;
  token: string;
}) => {
  // Using GET with parameters in the URL path
  const { data } = await axios.get(
    `${BASE_URL}/units/change-unit-status/${unitMeasurementId}/${status}/${token}`
  );
  return data;
};

// POST: Delete a unit measurement (hypothetical, using POST for safety)
export const deleteUnitMeasurement = async ({
  unitMeasurementId,
  token,
}: {
  unitMeasurementId: number;
  token: string;
}) => {
  const formData = new FormData();
  formData.append("unitMeasurementId", String(unitMeasurementId));
  formData.append("token", token);

  const { data } = await axios.post(
    `${BASE_URL}/unit-measurements/delete-unit-measurement`,
    formData
  );
  return data;
};

const MasterUnitMeasurment = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  // State to hold the list of unit measurements
  const [unitMeasurements, setUnitMeasurements] = useState<UnitMeasurement[]>(
    []
  );

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
                <BreadcrumbPage>Unit Measurements</BreadcrumbPage>
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
            <h1 className="text-3xl font-bold">Unit Measurement Management</h1>
            <p className="text-muted-foreground">
              Manage different units of measurement (e.g., Kilogram, Piece).
            </p>
          </div>
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Unit Measurement
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Unit Measurements</CardTitle>
            <CardDescription>
              View and manage all your units of measurement
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Pass state and setter to the table */}
            <UnitMeasurementTable
              unitMeasurements={unitMeasurements}
              setUnitMeasurements={setUnitMeasurements}
            />
          </CardContent>
        </Card>

        {/* Form for adding/editing a unit measurement */}
        <UnitMeasurementForm
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
          setUnitMeasurements={setUnitMeasurements}
        />
      </div>
    </MainLayout>
  );
};

export default MasterUnitMeasurment;
