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
import { RawMaterialCategoriesTable } from "@/components/masters/RawMaterialCategoriesTable";
import { RawMaterialCategoryForm } from "@/components/forms/RawMaterialCategoryForm";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { BASE_URL as API_BASE } from "@/hooks/baseUrls";
import axios from "axios";

// ✅ Get all raw material categories
export async function getRawMaterialCategories(token) {
  const res = await axios.get(
    `${API_BASE}/raw-material-categories/get-categories/${token}`
  );
  return res.data;
}

// ✅ Add a raw material category
export async function addRawMaterialCategory({
  categoryName,
  categoryDescription,
  categoryImage,
  token,
}) {
  const formData = new FormData();
  formData.append("categoryName", categoryName);
  if (categoryDescription)
    formData.append("categoryDescription", categoryDescription);
  if (categoryImage) formData.append("categoryImage", categoryImage);
  formData.append("token", token);

  const res = await fetch(`${API_BASE}/raw-material-categories/add-category`, {
    method: "POST",
    body: formData,
  });
  return res.json();
}

// ✅ Update raw material category
export async function updateRawMaterialCategory({
  categoryId,
  categoryName,
  categoryDescription,
  categoryImage,
  token,
}) {
  const formData = new FormData();
  formData.append("categoryId", categoryId);
  formData.append("categoryName", categoryName);
  if (categoryDescription)
    formData.append("categoryDescription", categoryDescription);
  if (categoryImage) formData.append("categoryImage", categoryImage);
  formData.append("token", token);

  const res = await fetch(
    `${API_BASE}/raw-material-categories/update-category`,
    {
      method: "POST",
      body: formData,
    }
  );
  return res.json();
}

// ✅ Get raw material category details
export async function getRawMaterialCategoryDetails(categoryId, token) {
  const res = await fetch(
    `${API_BASE}/raw-material-categories/get-category-details/${categoryId}/${token}`
  );
  return res.json();
}

// ✅ Change status of raw material category

export async function changeRawMaterialCategoryStatus(
  categoryId: number,
  status: number,
  token: string
) {
  const res = await axios.get(
    `${API_BASE}/raw-material-categories/change-category-status/${categoryId}/${status}/${token}`
  );
  return res.data;
}


// ✅ Get raw materials by material category
export async function getRawMaterialsByCategory(categoryId: number, token: string) {
  const res = await axios.get(
    `${API_BASE}/raw-material-categories/get-materials-by-category/${categoryId}/${token}`
  );
  return res.data;
}

const MasterRawMaterialCategories = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [mockRawMaterialCategories, setMockRawMaterialCategories] = useState(
    []
  ); // Mock data state

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
                <BreadcrumbPage>Raw Material Categories</BreadcrumbPage>
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
            <h1 className="text-3xl font-bold">Raw Material Categories</h1>
            <p className="text-muted-foreground">
              Organize your raw materials into categories for better management
            </p>
          </div>
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Category
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Raw Material Categories</CardTitle>
            <CardDescription>
              View and manage all your raw material categories
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RawMaterialCategoriesTable
              mockRawMaterialCategories={mockRawMaterialCategories}
              setMockRawMaterialCategories={setMockRawMaterialCategories}
            />
          </CardContent>
        </Card>

        <RawMaterialCategoryForm
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
          setMockRawMaterialCategories={setMockRawMaterialCategories}
          mode="add"
        />
      </div>
    </MainLayout>
  );
};

export default MasterRawMaterialCategories;
