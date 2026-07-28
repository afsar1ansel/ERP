import { useState } from "react";
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
import { StockLocationsTable } from "@/components/masters/StockLocationsTable";
import { StockLocationForm } from "@/components/forms/StockLocationForm";
import { BASE_URL as API_BASE } from "@/hooks/baseUrls";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import axios from "axios";

// ✅ Get all stock locations
export const getAllStockLocations = async (token: string) => {
  const res = await axios.get(`${API_BASE}/locations/get-all/${token}`);
  return res.data;
};

// ✅ Get stock location details (by warehouse)
export const getStockLocationsByWarehouse = async (
  warehouseId: string | number,
  token: string
) => {
  const res = await axios.get(
    `${API_BASE}/locations/get-all/${warehouseId}/${token}`
  );
  return res.data;
};

// ✅ Get a stock location details (by location id)
export const getStockLocationDetails = async (
  locationId: string | number,
  token: string
) => {
  const res = await axios.get(
    `${API_BASE}/stock-locations/get-stock-location-details/${locationId}/${token}`
  );
  return res.data;
};

export const changeStockLocationStatus = async ({
  brandId,
  status,
  token,
}: {
  brandId: number;
  status: number;
  token: string;
}) => {
  const { data } = await axios.get(
    `${API_BASE}/stock-locations/change-stock-location-status/${brandId}/${status}/${token}`
  );
  return data;
};

// ✅ Add stock location
export const addStockLocation = async (payload: {
  // warehouse_id: string | number;
  aisle: string;
  rack_number: string;
  shelf_number: string;
  // bin_number: string;
  storage_capacity_units: number;
  current_occupancy_units?: number;
  token: string;
}) => {
  // aisle_no, num_racks, num_rows_per_rack, capacity, token;
  const formData = new FormData();
  formData.append("aisle_no", payload.aisle);
  formData.append("num_racks", payload.rack_number);
  formData.append("num_rows_per_rack", payload.shelf_number);
  formData.append("capacity", payload.storage_capacity_units.toString());
  formData.append("token", payload.token);
  //  console.log(Object.fromEntries(formData));

  const res = await axios.post(`${API_BASE}/locations/bulk-create`, formData);
  console.log(res.data);
  return res.data;
};

// ✅ Update stock location
export const updateStockLocation = async (payload: {
  // warehouse_id: string | number;
  location_id: string | number;
  aisle: string;
  rack_number: string;
  shelf_number: string;
  // bin_number: string;
  storage_capacity_units: number;
  current_occupancy_units: number;
  status: string;
  token: string;
}) => {
  const formData = new FormData();
  formData.append("location_id", payload.location_id.toString());
  formData.append("aisle_no", payload.aisle);
  formData.append("rack_no", payload.rack_number);
  formData.append("row_no", payload.shelf_number);
  formData.append("capacity", payload.storage_capacity_units.toString());
  // formData.append("current_occupancy_units", payload.current_occupancy_units.toString());
  formData.append("status", payload.status.toString());
  formData.append("token", payload.token);
  console.log(Object.fromEntries(formData));

  const res = await axios.post(`${API_BASE}/locations/update`, formData);
  console.log(res.data);

  return res.data;
};

const MasterStockLocations = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [mockStockLocations, setMockStockLocations] = useState([]);

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
                <BreadcrumbPage>Stock Locations</BreadcrumbPage>
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
            <h1 className="text-3xl font-bold">Stock Location Management</h1>
            <p className="text-muted-foreground">
              Organize your warehouse and storage locations for efficient
              inventory management
            </p>
          </div>
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Location
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Stock Locations</CardTitle>
            <CardDescription>
              View and manage all your warehouse storage locations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <StockLocationsTable
              mockStockLocations={mockStockLocations}
              setMockStockLocations={setMockStockLocations}
            />
          </CardContent>
        </Card>

        <StockLocationForm
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
          setMockStockLocations={setMockStockLocations}
        />
      </div>
    </MainLayout>
  );
};

export default MasterStockLocations;
