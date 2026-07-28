import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { BrandsTable } from "@/components/masters/BrandsTable";
import { BrandForm } from "@/components/forms/BrandForm";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import axios from "axios";
import { BASE_URL, } from "@/hooks/baseUrls";

interface Brand {
  id: number;
  brand_name: string;
  brand_logo: string;
  brand_logo_public_id: string;
  status: number; // Or you could use a more specific type like 0 | 1
  created_at: string; // Or Date
  updated_at: string; // Or Date
  created_admin_id: number;
  updated_admin_id: number | null;
  brand_code?: string;
}

// --- POST Requests (Updated to use FormData) ---

// POST: Add a new brand
export const addBrand = async ({ brandName, brandLogo, brandCode, token }: { brandName: string; brandLogo: File; brandCode: string; token: string }) => {
  const formData = new FormData();
  formData.append('brandName', brandName);
  formData.append('brandLogo', brandLogo);
  formData.append('brandCode', brandCode);

  formData.append('token', token);

  const { data } = await axios.post(`${BASE_URL}/brands/add-brand`, formData);
  return data;
};

// POST: Update an existing brand
export const updateBrand = async ({ brandId, brandName, brandLogo, brandCode, token }: { brandId: number; brandName: string; brandLogo?: File | string; brandCode: string; token: string }) => {
  const formData = new FormData();
  formData.append('brandId', String(brandId));
  formData.append('brandName', brandName);
  formData.append('brandCode', brandCode);
  formData.append('token', token);
  
  // Only append the logo if a new one was provided
  if (brandLogo) {
    formData.append('brandLogo', brandLogo);
  }

  const { data } = await axios.post(`${BASE_URL}/brands/update-brand`, formData);
  return data;
};


// POST: Delete a brand
export const deleteBrand = async ({ brandId, token }: { brandId: number; token: string }) => {
  const formData = new FormData();
  formData.append('brandId', String(brandId));
  formData.append('token', token);

  // Using a hypothetical POST endpoint for safety.
  const { data } = await axios.post(`${BASE_URL}/brands/delete-brand`, formData);
  return data;
};

// GET: Fetch brand details (You can use this in your View dialog if needed)
 export const fetchBrandDetails = async ({ brandId, token }: { brandId: number; token: string }) => {
    const { data } = await axios.get(`${BASE_URL}/brands/get-brand-details/${brandId}/${token}`);
    return data;
}

// GET: Fetch all brands
export const fetchBrands = async (token: string) => {
  const { data } = await axios.get(`${BASE_URL}/brands/get-brands/${token}`);
  return data; // Assuming the API returns an array of brands
};

// GET: Change brand status
export const changeBrandStatus = async ({ brandId, status, token }: { brandId: number; status: number; token: string }) => {
  const { data } = await axios.get(`${BASE_URL}/brands/change-brand-status/${brandId}/${status}/${token}`);
  return data;
};

const MasterBrands = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [mockBrands, setMockBrands] = useState<Brand[]>([]);


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
                <BreadcrumbPage>Brands</BreadcrumbPage>
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
            <h1 className="text-3xl font-bold">Brand Management</h1>
            <p className="text-muted-foreground">
              Manage your product brands and their information
            </p>
          </div>
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Brand
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Brands</CardTitle>
            <CardDescription>
              View and manage all your product brands
            </CardDescription>
          </CardHeader>
          <CardContent>
            <BrandsTable  mockBrands={mockBrands} setMockBrands={setMockBrands}/>
          </CardContent>
        </Card>

        <BrandForm 
          open={isFormOpen} 
          onOpenChange={setIsFormOpen} 
          setBrands={setMockBrands} 
         
        />
      </div>
    </MainLayout>
  );
};

export default MasterBrands;