import { MainLayout } from "@/components/layout/MainLayout";
import { InventoryTable } from "@/components/inventory/InventoryTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, AlertTriangle, TrendingUp, Warehouse } from "lucide-react";

const quickStats = [
  {
    title: "Total SKUs",
    value: "1,247",
    icon: Package,
    color: "text-primary"
  },
  {
    title: "Low Stock Items",
    value: "23",
    icon: AlertTriangle,
    color: "text-warning"
  },
  {
    title: "Locations",
    value: "45",
    icon: Warehouse,
    color: "text-success"
  },
  {
    title: "Moving Fast",
    value: "156",
    icon: TrendingUp,
    color: "text-primary"
  }
];

const Inventory = () => {
  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Inventory Management</h1>
            <p className="text-muted-foreground">
              Track and manage your finished goods inventory across all brands
            </p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {quickStats.map((stat, index) => {
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

        {/* Main Inventory Table */}
        <InventoryTable />
      </div>
    </MainLayout>
  );
};

export default Inventory;