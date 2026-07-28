import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { ArrowLeftRight, Factory, Truck, PackageCheck } from "lucide-react";

import { StocktransectionTable } from "@/components/Stocktransection/Productionreceipt";
import { ReceiveFromVendor } from "@/components/Stocktransection/ReceiveFromVendor";
import { FGstockadjustment } from "@/components/Stocktransection/FGstockadjustment";

export default function Stocktransection() {
  const [isAddEmployeeDialogOpen, setIsAddEmployeeDialogOpen] = useState(false);
  const [isAddDepartmentDialogOpen, setIsAddDepartmentDialogOpen] =
    useState(false);
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);

  const token = localStorage.getItem("token") || "";

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <ArrowLeftRight className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Stock Transaction
            </h1>
            <p className="text-muted-foreground">
              Track and manage your finished goods inventory across all brands
            </p>
          </div>
        </div>

        <Tabs defaultValue="employees" className="w-full">
          {/* FIX: 
            - 'h-auto' lets the list grow vertically on mobile to fit the 3 rows.
            - 'sm:h-10' restores the original fixed height on desktop.
          */}
          <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 h-auto sm:h-10">
            <TabsTrigger value="employees" className="flex items-center gap-2">
              <Factory className="h-4 w-4" />
              Production Receipt
            </TabsTrigger>

            <TabsTrigger
              value="departments"
              className="flex items-center gap-2"
            >
              <Truck className="h-4 w-4" />
              Receive From Vendor
            </TabsTrigger>
            <TabsTrigger
              value="fgstockadjustment"
              className="flex items-center gap-2"
            >
              <PackageCheck className="h-4 w-4" />
              FG Stock Adjustment
            </TabsTrigger>
          </TabsList>

          <TabsContent value="employees" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Production Receipt</CardTitle>
              </CardHeader>
              <CardContent>
                <StocktransectionTable />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="departments" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Receive From Vendor</CardTitle>
              </CardHeader>
              <CardContent>
                <ReceiveFromVendor
                  departments={departments}
                  setDepartments={setDepartments}
                  setIsAddDepartmentDialogOpen={setIsAddDepartmentDialogOpen}
                />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="fgstockadjustment" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Finished Goods - Stock Adjustments</CardTitle>
              </CardHeader>
              <CardContent>
                <FGstockadjustment />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
