import { useEffect, useState } from "react";
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
import { ProductionStageCategoriesForm } from "@/components/forms/ProductionStageCategoriesForm";
import { ProductionStagesCategoriesTable } from "@/components/masters/ProductionStagesCategoriesTable";
// Add a production stage
export const addStageCategory = async ({ categoryName, stages, token }) => {
  const formData = new FormData();
  formData.append("categoryName", categoryName);
  // Backend expects a JSON string for the list: "[1, 2, 3]"
  formData.append("stages", JSON.stringify(stages));
  formData.append("token", token);

  return await axios.post(
    `${BASE_URL}/production-stage-categories/add`,
    formData
  );
};

// Update a production stage
export const updateStageCategory = async ({
  categoryId,
  categoryName,
  stages,
  token,
}) => {
  const formData = new FormData();
  formData.append("categoryId", categoryId); // Ensure backend accepts this
  formData.append("categoryName", categoryName);
  formData.append("stages", JSON.stringify(stages));
  formData.append("token", token);

  // Adjust URL based on your actual update endpoint
  return await axios.post(
    `${BASE_URL}/production-stage-categories/update`,
    formData
  );
};

// Get all production stages
export const getAllProductionStages = async (token) => {
  return await axios.get(
    `${BASE_URL}/production-stage-categories/get-all/${token}`
  );
};

// Get details of a production stage
export const getProductionStageDetails = async (stageId, token) => {
  return await axios.get(
    `${BASE_URL}/production-stages/get-details/${stageId}/${token}`
  );
};

// Change status of a production stage
export const changeProductionStageStatus = async (stageId, status, token) => {
  console.log(stageId, status, token);
  return await axios.get(
    `${BASE_URL}/production-stage-categories/change-status/${stageId}/${status}/${token}`
  );
};

const MasterProductionStagesCategories = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [mockProductionStages, setMockProductionStages] = useState([]);
  const token = localStorage.getItem("token");

  const fetchProductionStages = async (token) => {
    const res = await getAllProductionStages(token);
    // Ensure data is always an array
    const data = Array.isArray(res.data) ? res.data : [];
    setMockProductionStages(data);
    console.log(data);
  };
  useEffect(() => {
    fetchProductionStages(token);
  }, []);

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
                <BreadcrumbPage>Production Stages Categories</BreadcrumbPage>
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
            <h1 className="text-3xl font-bold">Production Stage Categories</h1>
            <p className="text-muted-foreground">
              Define and manage your production workflow stages and assignments
            </p>
          </div>
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Categories
          </Button>
        </div>

        <ProductionStagesCategoriesTable
          fetchProductionStages={() => fetchProductionStages(token)}
          mockProductionStages={mockProductionStages}
          setMockProductionStages={setMockProductionStages}
        />

        <ProductionStageCategoriesForm
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
          refreshData={() => fetchProductionStages(token)}
        />
      </div>
    </MainLayout>
  );
};

export default MasterProductionStagesCategories;
