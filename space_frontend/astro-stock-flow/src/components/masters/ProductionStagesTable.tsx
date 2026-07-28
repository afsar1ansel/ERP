import { useState } from "react";
import { ProductionStageForm } from "@/components/forms/ProductionStageForm";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Edit, Trash2, Search, ToggleRight, ToggleLeft } from "lucide-react";
import { changeProductionStageStatus } from "@/pages/master/MasterProductionStages";

interface ProductionStage {
  id: number;
  stage_name: string;
  stage_head_name: string;
  stage_head_employee_id: number;
  status: number; // 1 = active, 0 = inactive (assuming)
  created_admin_id: number;
  created_at: string; // ISO datetime string
  update_admin_id: number;
  updated_at: string; // ISO datetime string
}

export function ProductionStagesTable({
  mockProductionStages,
  setMockProductionStages,
  fetchProductionStages,
}: any) {
  console.log(mockProductionStages);

  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [editFormOpen, setEditFormOpen] = useState(false);
  const [selectedStage, setSelectedStage] = useState<ProductionStage | null>(
    null
  );

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const token = localStorage.getItem("token");

  const filteredStages = mockProductionStages.filter(
    (stage) =>
      stage?.stage_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      stage?.stage_head_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEditStage = (stage: ProductionStage) => {
    setSelectedStage(stage);
    setEditFormOpen(true);
  };

  const handleToggleStatus = async (stage: ProductionStage) => {
    const status = stage.status === 1 ? 0 : 1;
    const res = changeProductionStageStatus(stage.id, status, token);

    fetchProductionStages();

    if (res) {
      toast({
        title: "Status Updated",
        description: `${stage.stage_name} status has been updated to ${
          status === 1 ? "active" : "inactive"
        }`,
        variant: "default",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search stages..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 w-64"
              />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Stage Name</TableHead>
                <TableHead>Stage Head</TableHead>
                <TableHead>Employees</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStages.map((stage) => (
                <TableRow key={stage.id}>
                  <TableCell className="font-medium">
                    {stage.stage_name}
                  </TableCell>
                  <TableCell>{stage.stage_head_name}</TableCell>
                  <TableCell>
                    {" "}
                    <div className="flex flex-wrap gap-1">
                      {" "}
                      {stage?.employees?.slice(0, 2).map((employee, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="text-xs"
                        >
                          {" "}
                          {employee.name}{" "}
                        </Badge>
                      ))}{" "}
                      {stage?.employees?.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          {" "}
                          +{stage?.employees?.length - 2} more{" "}
                        </Badge>
                      )}{" "}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={stage.status === 1 ? "default" : "secondary"}
                    >
                      {stage.status === 1 ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(stage.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditStage(stage)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedStage(stage);
                          setDeleteConfirmOpen(true);
                        }}
                      >
                        {stage.status === 1 ? (
                          <ToggleRight className="h-4 w-4" />
                        ) : (
                          <ToggleLeft className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Stage</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this stage?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleToggleStatus(selectedStage)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Stage Form */}
      <ProductionStageForm
        open={editFormOpen}
        onOpenChange={setEditFormOpen}
        stage={selectedStage}
        mode="edit"
        setMockProductionStages={setMockProductionStages}
        mockProductionStages={mockProductionStages}
        fetchProductionStages={() => fetchProductionStages(token)}
      />
    </Card>
  );
}
