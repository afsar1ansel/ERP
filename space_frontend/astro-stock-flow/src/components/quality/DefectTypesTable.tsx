import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Edit, Trash2, AlertTriangle, TrendingUp } from "lucide-react";
import { BASE_URL } from "@/hooks/baseUrls";
import axios from "axios";


interface DefectTypesTableProps {
  allDefects: any[] | null;
  onEditDefect?: (defect: any) => void; // <-- Add this line
}

export function DefectTypesTable({
  allDefects,
  onEditDefect,
}: DefectTypesTableProps) {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "Critical":
        return "bg-red-100 text-red-800";
      case "High":
        return "bg-orange-100 text-orange-800";
      case "Medium":
        return "bg-yellow-100 text-yellow-800";
      case "Low":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Use allDefects if available, otherwise fallback to empty array
  const defects = allDefects ?? [];

  console.log(defects);

  async function deleteDefect(defectId: any) {
    // Implement delete logic here
    const token = localStorage.getItem("token");
    console.log(`Deleting defect with ID: ${defectId.id}`);
    const status = defectId.status === 1 ? 0 : 1;
    const res = `${BASE_URL}/defect-types/change-defect-type-status/${defectId.id}/${status}/${token}`;
    const response = await axios.get(res);
    console.log(
      `${BASE_URL}/defect-types/change-defect-type-status/${defectId.id}/${status}/${token}`
    );

    console.log(response.data);
    // Perform any additional actions or update the state to reflect the deletion
    
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Defect ID</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Severity</TableHead>
            <TableHead>Frequency</TableHead>
            <TableHead>Corrective Action</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {defects.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={8}
                className="text-center text-muted-foreground"
              >
                No defect types found.
              </TableCell>
            </TableRow>
          ) : (
            defects.map((defect: any) => (
              <TableRow key={defect.id || defect.defect_code}>
                <TableCell className="font-medium">
                  {defect.defect_code || defect.id}
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">
                      {defect.defect_name || defect.name}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {defect.description}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{defect.category}</Badge>
                </TableCell>
                <TableCell>
                  <Badge className={getSeverityColor(defect.severity)}>
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    {defect.severity}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    {defect.frequency ?? "-"}
                  </div>
                </TableCell>
                <TableCell className="max-w-xs">
                  <div className="truncate text-sm">
                    {defect.corrective_action}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      defect.status === 1 || defect.status === "Active"
                        ? "default"
                        : "secondary"
                    }
                    className={
                      defect.status === 1 || defect.status === "Active"
                        ? "bg-green-100 text-green-800"
                        : ""
                    }
                  >
                    {defect.status === 1
                      ? "Active"
                      : defect.status === 0
                      ? "Inactive"
                      : defect.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEditDefect && onEditDefect(defect)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button onClick={() => deleteDefect(defect)} variant="ghost" size="icon">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
