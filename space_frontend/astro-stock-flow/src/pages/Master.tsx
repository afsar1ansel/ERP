import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Package2,
  Tags,
  Layers3,
  MapPin,
  FolderTree,
  Settings2,
  Upload,
  Download,
  RotateCcw,
  ArrowRight,
  BookUser,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { BASE_URL } from "@/hooks/baseUrls";

const masterDataSections = [
  {
    title: "Brands",
    description: "Manage brand information and configurations",
    icon: Tags,
    color: "from-blue-500 to-blue-600",
    route: "brands",
    apiKey: "brands",
  },
  {
    title: "Raw Material Categories",
    description: "Raw material classification system",
    icon: Layers3,
    color: "from-green-500 to-green-600",
    route: "raw-material-categories",
    apiKey: "raw_material_categories",
  },
  {
    title: "Product SKUs",
    description: "Finished goods catalog and specifications",
    icon: Package2,
    color: "from-orange-500 to-orange-600",
    route: "product-skus",
    apiKey: "products_sku",
  },
  {
    title: "Stock Locations",
    description: "Warehouse locations and bin management",
    icon: MapPin,
    color: "from-red-500 to-red-600",
    route: "stock-locations",
    apiKey: "storage_locations",
  },
  {
    title: "Product Categories",
    description: "Product classification and grouping",
    icon: FolderTree,
    color: "from-purple-500 to-purple-600",
    route: "product-categories",
    apiKey: "product_categories",
  },
  {
    title: "Production Stages",
    description: "Production workflow stages and assignments",
    icon: Settings2,
    color: "from-indigo-500 to-indigo-600",
    route: "production-stages",
    apiKey: "production_stage",
  },
  {
    title: "Production Stages Categories",
    description: "Categories for production stages",
    icon: Settings2,
    color: "from-purple-500 to-purple-600",
    route: "production-stages-categories",
    apiKey: "production_stage-category",
  },
  {
    title: "Admin Users",
    description: "User management and permissions",
    icon: BookUser,
    color: "from-blue-500 to-blue-600",
    route: "admin_users",
    apiKey: "admin_users",
  },
  {
    title: "Client Types",
    description: "Client type management and configurations",
    icon: BookUser,
    color: "from-blue-500 to-blue-600",
    route: "client-types",
    apiKey: "client_types",
  },
  {
    title: "Unit Of Measurements",
    description: "Unit of measurement management and configurations",
    icon: BookUser,
    color: "from-blue-500 to-blue-600",
    route: "unit-measurements",
    apiKey: "units_of_measurement",
  },
  {
    title: "Payment Terms",
    description: "Payment terms management and configurations",
    icon: BookUser,
    color: "from-blue-500 to-blue-600",
    route: "payment-terms",
    apiKey: "payment_terms",
  },
];

type TableCounts = {
  [key: string]: number;
};


const Master = () => {
  const [counts, setCounts] = useState<TableCounts | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTableCounts = async () => {
      const authToken = localStorage.getItem("token") || "";

      try {
        setIsLoading(true);
        const response = await fetch(
          `${BASE_URL}/masters/get-table-counts/${authToken}`
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch data: ${response.statusText}`);
        }


        const data: TableCounts = await response.json();
        console.log(data)
        setCounts(data);
      } catch (error) {
        console.error("Error fetching table counts:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTableCounts();
  }, []);

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Master Data</h1>
            <p className="text-muted-foreground">
              Manage core data configurations for your inventory system
            </p>
          </div>
        </div>

        {/* Master Data Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {masterDataSections.map((section) => {
            const displayCount = isLoading
              ? "..." 
              : counts?.[section.apiKey] ?? 0; 

            return (
              <Link key={section.title} to={`/master/${section.route}`}>
                <Card className="relative overflow-hidden hover:shadow-lg transition-all duration-200 hover:scale-105 cursor-pointer group">
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${section.color} opacity-5 group-hover:opacity-10 transition-opacity`}
                  />
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <section.icon className="h-8 w-8 text-muted-foreground group-hover:text-primary transition-colors" />
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="secondary"
                          className="text-lg font-bold px-3 py-1"
                        >
                          {displayCount}
                        </Badge>
                        <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                    </div>
                    <CardTitle className="text-xl group-hover:text-primary transition-colors">
                      {section.title}
                    </CardTitle>
                    <CardDescription className="text-sm">
                      {section.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-muted-foreground">
                      Click to manage {section.title.toLowerCase()}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* Quick Actions */}
        {/* <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Bulk operations and data management tools
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                <h3 className="font-medium">Import Data</h3>
                <p className="text-sm text-muted-foreground">Bulk import master data from files</p>
              </div>
              <div className="p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                <Download className="h-8 w-8 text-muted-foreground mb-2" />
                <h3 className="font-medium">Export Catalog</h3>
                <p className="text-sm text-muted-foreground">Download complete master data catalog</p>
              </div>
              <div className="p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                <RotateCcw className="h-8 w-8 text-muted-foreground mb-2" />
                <h3 className="font-medium">Bulk Update</h3>
                <p className="text-sm text-muted-foreground">Update multiple records at once</p>
              </div>
            </div>
          </CardContent>
        </Card> */}
      </div>
    </MainLayout>
  );
};

export default Master;