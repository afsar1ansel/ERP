import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PurchaseOrdersTable } from "@/components/purchase/PurchaseOrdersTable";
import { CreatePurchaseOrderForm } from "@/components/purchase/CreatePurchaseOrderForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Clock, CheckCircle, XCircle, Plus } from "lucide-react";

const purchaseStats = [
  {
    title: "Active POs",
    value: "45",
    icon: ShoppingCart,
    color: "text-primary",
  },
  {
    title: "Pending Approval",
    value: "12",
    icon: Clock,
    color: "text-warning",
  },
  {
    title: "Completed",
    value: "234",
    icon: CheckCircle,
    color: "text-success",
  },
  {
    title: "Overdue",
    value: "3",
    icon: XCircle,
    color: "text-destructive",
  },
];

interface PurchaseStats {
  title: string;
  value: string;
  icon: any;
  color: string;
}

const Purchases = () => {
  const [createPOOpen, setCreatePOOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
    const [purchaseStats, setPurchaseStats] = useState<PurchaseStats[]>([
      {
        title: "Active POs",
        value: "0",
        icon: ShoppingCart,
        color: "text-primary",
      },
      {
        title: "Pending Approval",
        value: "0",
        icon: Clock,
        color: "text-warning",
      },
      {
        title: "Completed",
        value: "0",
        icon: CheckCircle,
        color: "text-success",
      },
      {
        title: "Overdue",
        value: "0",
        icon: XCircle,
        color: "text-destructive",
      },
    ]);

  const handleCreateSuccess = () => {
    setRefreshKey((prevKey) => prevKey + 1); // Incrementing the key triggers the effect
  };

   const updatePurchaseStats = (purchaseOrders: any[]) => {
     if (!purchaseOrders.length) return;

     const stats = {
       active: 0,
       pending: 0,
       completed: 0,
       overdue: 0,
     };

     purchaseOrders.forEach((po) => {
       switch (po.po_status) {
         case "pending":
           stats.pending++;
           stats.active++;
           break;
         case "partial":
           stats.active++;
           break;
         case "completed":
           stats.completed++;
           break;
         case "overdue":
           stats.overdue++;
           stats.active++;
           break;
       }
     });

     setPurchaseStats([
       {
         title: "Active POs",
         value: String(stats.active),
         icon: ShoppingCart,
         color: "text-primary",
       },
       {
         title: "Pending",
         value: String(stats.pending),
         icon: Clock,
         color: "text-warning",
       },
       {
         title: "Completed",
         value: String(stats.completed),
         icon: CheckCircle,
         color: "text-success",
       },
       {
         title: "Overdue",
         value: String(stats.overdue),
         icon: XCircle,
         color: "text-destructive",
       },
     ]);
   };


  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Purchase Management
            </h1>
            <p className="text-muted-foreground">
              Manage purchase orders and vendor relationships
            </p>
          </div>
          <Button onClick={() => setCreatePOOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Purchase Order
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {purchaseStats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Purchase Orders Table */}
        <PurchaseOrdersTable
          refreshTrigger={refreshKey}
          onStatsUpdate={updatePurchaseStats}
        />

        <CreatePurchaseOrderForm
          open={createPOOpen}
          onOpenChange={setCreatePOOpen}
          onSuccess={handleCreateSuccess}
        />
      </div>
    </MainLayout>
  );
};

export default Purchases;
