import React, { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Edit,
  Trash2,
  QrCode,
  GripVertical,
  Loader2
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface ProductionTableProps {
  productionData: any[];
  onEdit: (batch: any) => void;
  onDelete: (batch: any) => void;
  onDownloadQrCode: (batch: any) => void;
  getBatchProgress: (batch: any) => number;
  formateDate: (date: any) => string;
  onReorder: (priorityList: Array<{ batchId: number; newPosition: number }>) => Promise<void>;
}

const SortableRow = ({ 
  batch, 
  onEdit, 
  onDelete, 
  onDownloadQrCode, 
  getBatchProgress, 
  formateDate,
  isDraggable 
}: { 
  batch: any; 
  onEdit: any; 
  onDelete: any; 
  onDownloadQrCode: any; 
  getBatchProgress: any; 
  formateDate: any;
  isDraggable: boolean;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ 
    id: batch.id,
    disabled: !isDraggable
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1 : 0,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <TableRow ref={setNodeRef} style={style} className="hover:bg-muted/50">
      <TableCell className="w-10">
        {isDraggable && (
          <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1">
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
        )}
      </TableCell>
      <TableCell className="font-medium">
        {batch.production_code}
      </TableCell>
      <TableCell>
        <div>
          <p className="font-medium">{batch.product_name}</p>
          <p className="text-sm text-muted-foreground">{batch.quantity || batch.planned_qty} units</p>
        </div>
      </TableCell>
      <TableCell>{batch.floor}</TableCell>
      <TableCell>
        <div className="flex items-center gap-3">
          <Progress value={getBatchProgress(batch)} className="w-20 h-2" />
          <span className="text-sm font-medium">{getBatchProgress(batch)}%</span>
        </div>
      </TableCell>
      <TableCell>
        <div className="text-sm">
          <div>{formateDate(batch.created_at)}</div>
          <div className="text-muted-foreground">to {formateDate(batch.expected_completion_date)}</div>
        </div>
      </TableCell>
      <TableCell>
        <Badge
          variant={
            batch.batch_status === "completed"
              ? "default"
              : batch.batch_status === "inprogress"
              ? "secondary"
              : "outline"
          }
        >
          {batch.batch_status}
        </Badge>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={() => onEdit(batch)}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => onDelete(batch)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" onClick={() => onDownloadQrCode(batch)}>
                  <QrCode className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">QR code for order details.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </TableCell>
    </TableRow>
  );
};

export const ProductionTable: React.FC<ProductionTableProps> = ({
  productionData,
  onEdit,
  onDelete,
  onDownloadQrCode,
  getBatchProgress,
  formateDate,
  onReorder,
}) => {
  const [items, setItems] = useState(productionData);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    setItems(productionData);
  }, [productionData]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);
      
      const newItems = arrayMove(items, oldIndex, newIndex);
      
      // visually update immediately
      setItems(newItems);
      setIsUpdating(true);

      try {
        // Calculate the full priority list for the API
        const priorityList = newItems.map((item, index) => ({
          batchId: Number(item.id),
          newPosition: index + 1
        }));

        await onReorder(priorityList);
        console.log("Priority update successful");
      } catch (error) {
        console.error("Failed to update priority:", error);
        // Revert to original order if API fails
        setItems(productionData);
      } finally {
        setIsUpdating(false);
      }
    }
  };

  // Separate non-draggable (completed) items
  // Ensure the completed items come LAST
  const draggableItems = items.filter(item => getBatchProgress(item) < 100);
  const completedItems = items.filter(item => getBatchProgress(item) >= 100);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <div className="relative rounded-md border bg-card">
        {isUpdating && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-[1px]">
            <div className="flex flex-col items-center gap-2 bg-background p-4 rounded-lg shadow-lg border animate-in fade-in zoom-in duration-200">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm font-medium">Updating priority...</p>
            </div>
          </div>
        )}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10"></TableHead>
              <TableHead>Batch Code</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Floor</TableHead>
              <TableHead>Progress</TableHead>
              <TableHead>Dates</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <SortableContext
              items={draggableItems.map(item => item.id)}
              strategy={verticalListSortingStrategy}
            >
              {draggableItems.map((batch) => (
                <SortableRow
                  key={batch.id}
                  batch={batch}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onDownloadQrCode={onDownloadQrCode}
                  getBatchProgress={getBatchProgress}
                  formateDate={formateDate}
                  isDraggable={true}
                />
              ))}
            </SortableContext>
            {completedItems.map((batch) => (
              <SortableRow
                key={batch.id}
                batch={batch}
                onEdit={onEdit}
                onDelete={onDelete}
                onDownloadQrCode={onDownloadQrCode}
                getBatchProgress={getBatchProgress}
                formateDate={formateDate}
                isDraggable={false}
              />
            ))}
          </TableBody>
        </Table>
      </div>
    </DndContext>
  );
};
