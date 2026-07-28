import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { ProductionStagesTable } from "@/components/masters/ProductionStagesTable";
import { ProductionStageForm } from "@/components/forms/ProductionStageForm";
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
// Add a production stage
export const addProductionStage = async ({ stageName, stageHeadName, stageHeadEmployeeId, stageEmployees, token }) => {
  const formData = new FormData();
  formData.append("stageName", stageName);
  formData.append("stageHeadName", stageHeadName);
  formData.append("stageHeadEmployeeId", stageHeadEmployeeId);
  formData.append("stageEmployees", JSON.stringify(stageEmployees)); // since it's json objects
  formData.append("token", token);

  return await axios.post(`${BASE_URL}/production-stages/add`, formData);
};

// Update a production stage
export const updateProductionStage = async ({ stageId, stageName, stageHeadName, stageHeadEmployeeId, stageEmployees, token }) => {
  const formData = new FormData();
  formData.append("stageId", stageId);
  formData.append("stageName", stageName);
  formData.append("stageHeadName", stageHeadName);
  formData.append("stageHeadEmployeeId", stageHeadEmployeeId);
  formData.append("stageEmployees", JSON.stringify(stageEmployees));
  formData.append("token", token);

  return await axios.post(`${BASE_URL}/production-stages/update`, formData);
};

// Get all production stages
export const getAllProductionStages = async (token) => {
  return await axios.get(`${BASE_URL}/production-stages/get-all/${token}`);
};

// Get details of a production stage
export const getProductionStageDetails = async (stageId, token) => {
  return await axios.get(`${BASE_URL}/production-stages/get-details/${stageId}/${token}`);
};

// Change status of a production stage
export const changeProductionStageStatus = async (stageId, status, token) => {
  return await axios.get(`${BASE_URL}/production-stages/change-status/${stageId}/${status}/${token}`);
};

const MasterProductionStages = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [mockProductionStages, setMockProductionStages] = useState([]);
  const token = localStorage.getItem("token");

  const fetchProductionStages = async (token) => {
    const res= await getAllProductionStages(token);
    setMockProductionStages(res.data);
    console.log(res.data);
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
                <BreadcrumbPage>Production Stages</BreadcrumbPage>
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
            <h1 className="text-3xl font-bold">Production Stage Management</h1>
            <p className="text-muted-foreground">
              Define and manage your production workflow stages and assignments
            </p>
          </div>
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Stage
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Production Stages</CardTitle>
            <CardDescription>
              View and manage all your production workflow stages
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ProductionStagesTable fetchProductionStages={() => fetchProductionStages(token)}  mockProductionStages={mockProductionStages} setMockProductionStages={setMockProductionStages} />
          </CardContent>
        </Card>

        <ProductionStageForm 
          open={isFormOpen} 
          onOpenChange={setIsFormOpen} 
          fetchProductionStages={() => fetchProductionStages(token)}
        />
      </div>
    </MainLayout>
  );
};

export default MasterProductionStages;