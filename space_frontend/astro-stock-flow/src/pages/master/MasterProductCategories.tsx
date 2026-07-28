import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { ProductCategoriesTable } from "@/components/masters/ProductCategoriesTable";
import { ProductCategoryForm } from "@/components/forms/ProductCategoryForm";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

import axios from "axios";
import { BASE_URL } from "@/hooks/baseUrls";





interface AddCategoryParams {
  productCategoryName: string;
  productDescription: string;
  productCategoryImage: File;
  token: string;
}

interface UpdateCategoryParams {
  categoryId: number;
  productCategoryName: string;
  productDescription: string;
  productCategoryImage?: File | string; // The image is optional on update
  token: string;
}

interface CategoryDetailsParams {
  categoryId: number;
  token: string;
}

interface ChangeStatusParams {
  categoryId: number;
  status: number; // Using a boolean is easier to manage in the UI
  token: string;
}


// --- API Functions ---

/**
 * @description Fetches all product categories.
 * @param token - The authentication token.
 */
export const fetchAllProductCategories = async (token: string) => {
  const { data } = await axios.get(`${BASE_URL}/product-categories/get-categories/${token}`);
  return data;
};

/**
 * @description Adds a new product category, including an image.
 */
export const addProductCategory = async ({ productCategoryName, productDescription, productCategoryImage, token }: AddCategoryParams) => {
  const formData = new FormData();
  const Token = localStorage.getItem('token');
  formData.append('productCategoryName', productCategoryName);
  formData.append('productDescription', productDescription);
  formData.append('productCategoryImage', productCategoryImage);
  formData.append('token', Token);

  const { data } = await axios.post(`${BASE_URL}/product-categories/add-category`, formData);
  return data;
};

/**
 * @description Updates an existing product category. The image is optional.
 */
export const updateProductCategory = async ({ categoryId, productCategoryName, productDescription, productCategoryImage, token }: UpdateCategoryParams) => {
  const formData = new FormData();
   const Token = localStorage.getItem("token");
  formData.append('categoryId', String(categoryId));
  formData.append('productCategoryName', productCategoryName);
  formData.append('productDescription', productDescription);
  formData.append('token', Token);

  // Only append the image if a new one has been selected
  if (productCategoryImage) {
    formData.append('productCategoryImage', productCategoryImage);
  }

  const { data } = await axios.post(`${BASE_URL}/product-categories/update-category`, formData);
  return data;
};

/**
 * @description Fetches the details for a single product category.
 */
export const fetchProductCategoryDetails = async ({ categoryId, token }: CategoryDetailsParams) => {
  const { data } = await axios.get(`${BASE_URL}/product-categories/get-products-by-category/${categoryId}/${token}`);
  return data;
};

/**
 * @description Changes the status (e.g., active/inactive) of a product category.
 */
export const changeProductCategoryStatus = async ({ categoryId, status, token }: ChangeStatusParams) => {
  // Convert the boolean status to the string ('active' or 'inactive') required by the API
  const { data } = await axios.get(`${BASE_URL}/product-categories/change-category-status/${categoryId}/${status}/${token}`);
  return data;
};

const MasterProductCategories = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [mockProductCategories, setMockProductCategories] = useState([]);


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
                <BreadcrumbPage>Product Categories</BreadcrumbPage>  
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
            <h1 className="text-3xl font-bold">Product Categories</h1>
            <p className="text-muted-foreground">
              Organize your products into categories for better management and organization
            </p>
          </div>
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Category
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Product Categories</CardTitle>
            <CardDescription>
              View and manage all your product categories
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ProductCategoriesTable mockProductCategories={mockProductCategories} setMockProductCategories={setMockProductCategories} />
          </CardContent>
        </Card>

        <ProductCategoryForm 
          open={isFormOpen} 
          onOpenChange={setIsFormOpen} 
          setMockProductCategories={setMockProductCategories}
        />
      </div>
    </MainLayout>
  );
};

export default MasterProductCategories;