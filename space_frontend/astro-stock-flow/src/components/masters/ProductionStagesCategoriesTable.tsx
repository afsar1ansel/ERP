import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Edit, ToggleRight, ToggleLeft, Search, Layers } from "lucide-react";
// Make sure you have an API function for changing category status, or reuse existing if compatible
import { changeProductionStageStatus } from "@/pages/master/MasterProductionStages";
import { ProductionStageCategoriesForm } from "../forms/ProductionStageCategoriesForm";

// Updated Interface based on your new data structure
interface ProductionStageCategory {
  id: number;
  category_name: string;
  stages: string; // Comes as string "[1, 2, 3]"
  status: number; // 1 = active, 0 = inactive
  created_at: string;
  updated_at: string | null;
}

export function ProductionStagesCategoriesTable({
  mockProductionStages, // This is actually the list of Categories now
  setMockProductionStages,
  fetchProductionStages, // Function to refresh data
}: any) {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [editFormOpen, setEditFormOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<any | null>(null);
  const [SelectedCategoryforToggle, setSelectedCategoryforToggle] = useState<
    any | null
  >(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const token = localStorage.getItem("token");

  // Filter based on Category Name
  const filteredCategories = Array.isArray(mockProductionStages)
    ? mockProductionStages.filter((cat: ProductionStageCategory) =>
        cat.category_name?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  // --- Handlers ---

  const handleEditCategory = (category: ProductionStageCategory) => {
    let parsedStages: any[] = [];
    try {
      const rawStages = JSON.parse(category.stages);

      parsedStages = Array.isArray(rawStages)
        ? rawStages.map((s) => ({
            stageId: typeof s === "object" ? s.stageId : s,
            weightage: typeof s === "object" ? s.weightage : 0,
          }))
        : [];
    } catch (e) {
      parsedStages = [];
    }

    setSelectedCategory({
      ...category,
      stages: parsedStages, // Pass parsed array
    });
    setEditFormOpen(true);
  };

  const handleToggleStatus = async (category: ProductionStageCategory) => {
    const status = category.status === 1 ? 0 : 1;

    // NOTE: You might need to create a specific API for 'changeCategoryStatus'
    // if the backend logic differs from the standard stage status change.
    const res = await changeProductionStageStatus(category.id, status, token);

    if (res) {
      toast({
        title: "Status Updated",
        description: `${category.category_name} status updated.`,
      });
      fetchProductionStages(); // Refresh list
    }
    setDeleteConfirmOpen(false);
  };

  // Helper to safely render the stages list
  const renderStageBadges = (stagesString: string) => {
    try {
      const stageItems = JSON.parse(stagesString);
      if (!Array.isArray(stageItems) || stageItems.length === 0)
        return <span className="text-muted-foreground text-xs">No stages</span>;

      return (
        <div className="flex flex-wrap gap-1">
          {stageItems.slice(0, 3).map((item, index) => {
            const stageId = typeof item === "object" ? item.stageId : item;
            const weightage = typeof item === "object" ? item.weightage : null;
            return (
              <Badge
                key={index}
                variant="secondary"
                className="text-[10px] flex items-center gap-1 py-0 px-1.5"
              >
                <Layers className="w-2 h-2 text-muted-foreground" />
                S{stageId}
                {weightage !== null && (
                  <span className="ml-1 border-l pl-1 font-bold">
                    {weightage}%
                  </span>
                )}
              </Badge>
            );
          })}
          {stageItems.length > 3 && (
            <Badge variant="outline" className="text-[10px] py-0 px-1.5">
              +{stageItems.length - 3} more
            </Badge>
          )}
        </div>
      );
    } catch (error) {
      return <span className="text-red-500 text-xs">Invalid Data</span>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 w-64"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category Name</TableHead>
                <TableHead>Workflow Stages</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCategories.length > 0 ? (
                filteredCategories.map((category: ProductionStageCategory) => (
                  <TableRow key={category.id}>
                    <TableCell className="font-medium">
                      {category.category_name}
                    </TableCell>

                    {/* Render the list of Stage IDs as Badges */}
                    <TableCell>{renderStageBadges(category.stages)}</TableCell>

                    <TableCell>
                      <Badge
                        variant={
                          category.status === 1 ? "default" : "secondary"
                        }
                      >
                        {category.status === 1 ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      {new Date(category.created_at).toLocaleDateString()}
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditCategory(category)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>

                        {/* Toggle Status / "Delete" action */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedCategoryforToggle(category);
                            setDeleteConfirmOpen(true);
                          }}
                        >
                          {category.status === 1 ? (
                            <ToggleRight className="h-4 w-4 text-green-600" />
                          ) : (
                            <ToggleLeft className="h-4 w-4 text-slate-400" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center h-24 text-muted-foreground"
                  >
                    No categories found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      {/* Confirmation Dialog for Status Change */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change Status?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to change the status of{" "}
              <b>{SelectedCategoryforToggle?.category_name}</b>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleToggleStatus(SelectedCategoryforToggle)}
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Form */}
      <ProductionStageCategoriesForm
        open={editFormOpen}
        onOpenChange={setEditFormOpen}
        initialData={selectedCategory} // Renamed prop to match Form component
        mode="edit"
        refreshData={() => fetchProductionStages(token)} // Renamed prop to match Form component
      />
    </Card>
  );
}
