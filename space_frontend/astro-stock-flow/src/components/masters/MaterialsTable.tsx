import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Edit, Trash2, Eye, Package } from "lucide-react";
import { PaginationControls } from "../ui/pagination-controls";

const mockMaterials = [
  { id: 1, name: "Cotton Canvas", uom: "meters", location: "Warehouse A - R001", supplier: "TextileCorp", category: "Fabric", image: "/placeholder.svg" },
  { id: 2, name: "YKK Zipper #5", uom: "pieces", location: "Warehouse B - R002", supplier: "YKK Corp", category: "Hardware", image: "/placeholder.svg" },
  { id: 3, name: "Genuine Leather", uom: "sq.ft", location: "Warehouse A - R003", supplier: "LeatherWorks", category: "Leather", image: "/placeholder.svg" },
  { id: 4, name: "Polyester Thread", uom: "rolls", location: "Warehouse C - R001", supplier: "ThreadMasters", category: "Thread", image: "/placeholder.svg" }
];

export const MaterialsTable = () => {
  const { toast } = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [viewDetailsOpen, setViewDetailsOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<typeof mockMaterials[0] | null>(null);
  
  const totalItems = mockMaterials.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentData = mockMaterials.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1);
  };

  const handleViewDetails = (material: typeof mockMaterials[0]) => {
    setSelectedMaterial(material);
    setViewDetailsOpen(true);
  };

  const handleEditMaterial = (material: typeof mockMaterials[0]) => {
    toast({
      title: "Edit Material",
      description: `Opening edit form for ${material.name}`,
    });
  };

  const handleViewStock = (material: typeof mockMaterials[0]) => {
    toast({
      title: "View Stock",
      description: `Viewing stock levels for ${material.name}`,
    });
  };

  const handleDeleteMaterial = (material: typeof mockMaterials[0]) => {
    setSelectedMaterial(material);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (selectedMaterial) {
      toast({
        title: "Material Deleted",
        description: `${selectedMaterial.name} has been removed`,
        variant: "destructive",
      });
    }
    setDeleteConfirmOpen(false);
    setSelectedMaterial(null);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Image</TableHead>
              <TableHead>Material Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>UOM</TableHead>
              <TableHead>Storage Location</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentData.map((material) => (
              <TableRow key={material.id}>
                <TableCell>
                  <div className="w-10 h-10 bg-muted rounded flex items-center justify-center">
                    <span className="text-xs">IMG</span>
                  </div>
                </TableCell>
                <TableCell className="font-medium">{material.name}</TableCell>
                <TableCell>
                  <Badge variant="outline">{material.category}</Badge>
                </TableCell>
                <TableCell>{material.uom}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{material.location}</TableCell>
                <TableCell>{material.supplier}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end space-x-1">
                    <Button variant="ghost" size="sm" onClick={() => handleViewDetails(material)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleEditMaterial(material)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleViewStock(material)}>
                      <Package className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDeleteMaterial(material)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <PaginationControls
        currentPage={currentPage}
        totalPages={totalPages}
        pageSize={pageSize}
        totalItems={totalItems}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
      />
      
      {/* View Details Dialog */}
      <Dialog open={viewDetailsOpen} onOpenChange={setViewDetailsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Material Details - {selectedMaterial?.name}</DialogTitle>
          </DialogHeader>
          {selectedMaterial && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">Material Name</p>
                  <p className="text-sm text-muted-foreground">{selectedMaterial.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Category</p>
                  <Badge variant="outline">{selectedMaterial.category}</Badge>
                </div>
                <div>
                  <p className="text-sm font-medium">Unit of Measure</p>
                  <p className="text-sm text-muted-foreground">{selectedMaterial.uom}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Supplier</p>
                  <p className="text-sm text-muted-foreground">{selectedMaterial.supplier}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm font-medium">Storage Location</p>
                  <p className="text-sm text-muted-foreground">{selectedMaterial.location}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Material</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedMaterial?.name}? This action cannot be undone and will affect all products using this material.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};