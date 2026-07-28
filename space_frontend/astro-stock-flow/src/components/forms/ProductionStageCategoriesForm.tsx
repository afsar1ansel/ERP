import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Layers } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";
import { BASE_URL } from "@/hooks/baseUrls";

// Import your API functions here
import {
  addStageCategory,
  updateStageCategory,
} from "@/pages/master/MasterProductionStagesCategories"; // Update path as needed

// --- VALIDATION SCHEMA ---
const formSchema = z.object({
  categoryName: z
    .string()
    .min(3, { message: "Category name must be at least 3 characters." })
    .regex(/^[A-Za-z0-9\s-]+$/, {
      message: "Can only contain letters, numbers, spaces, and hyphens.",
    }),
  stages: z
    .array(
      z.object({
        stageId: z.number(),
        weightage: z.coerce.number().min(0).max(100),
      })
    )
    .min(1, { message: "Please select at least one stage." }),
});

type FormDataSchema = z.infer<typeof formSchema>;

interface ProductionStageCategoriesFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: {
    id: number;
    category_name: string;
    stages?: Array<{ stageId: number; weightage: number }>;
  } | null;
  mode?: "add" | "edit";
  refreshData?: () => Promise<void>;
}

export function ProductionStageCategoriesForm({
  open,
  onOpenChange,
  initialData,
  mode = "add",
  refreshData,
}: ProductionStageCategoriesFormProps) {
  const [availableStages, setAvailableStages] = useState<any[]>([]);
  const [selectedStageId, setSelectedStageId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [stageSearch, setStageSearch] = useState<string>("");
  const Token = localStorage.getItem("token");

  const form = useForm<FormDataSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      categoryName: "",
      stages: [],
    },
  });

  const selectedStageIds = form.watch("stages");

  // Fetch Available Production Stages for the Dropdown
  useEffect(() => {
    const fetchStages = async () => {
      if (!Token) return;
      try {
        const url = `${BASE_URL}/production-stages/get-all/${Token}`;
        const res = await axios.get(url);
        setAvailableStages(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error("Failed to fetch production stages:", err);
      }
    };
    if (open) fetchStages();
  }, [Token, open]);

  // Pre-populate form
  useEffect(() => {
    if (initialData && mode === "edit") {
      const formattedStages = initialData.stages?.map((s) => ({
        stageId: s.stageId,
        weightage: s.weightage || 0,
      })) || [];
      form.reset({
        categoryName: initialData.category_name,
        stages: formattedStages,
      });
    } else {
      form.reset({ categoryName: "", stages: [] });
    }
    setSelectedStageId("");
  }, [initialData, open, form, mode]);

  // --- Handlers for Multi-Select ---
  const addStageToSelection = () => {
    if (selectedStageId) {
      const idToAdd = parseInt(selectedStageId);
      const currentStages = form.getValues("stages");
      if (!currentStages.some((s) => s.stageId === idToAdd)) {
        form.setValue(
          "stages",
          [...currentStages, { stageId: idToAdd, weightage: 0 }],
          {
            shouldValidate: true,
          }
        );
        setSelectedStageId("");
        setStageSearch("");
      }
    }
  };

  const removeStageFromSelection = (idToRemove: number) => {
    const currentStages = form.getValues("stages");
    form.setValue(
      "stages",
      currentStages.filter((s) => s.stageId !== idToRemove),
      { shouldValidate: true }
    );
  };

  const handleWeightageChange = (stageId: number, weightage: number) => {
    const currentStages = form.getValues("stages");
    form.setValue(
      "stages",
      currentStages.map((s) =>
        s.stageId === stageId ? { ...s, weightage } : s
      ),
      { shouldValidate: true }
    );
  };

  const filterStages = (stages: any[], term: string) => {
    return stages.filter((stg) =>
      stg.stage_name?.toLowerCase().includes(term.toLowerCase())
    );
  };

  // --- SUBMIT HANDLER (Uses Imported Functions) ---
  const onSubmit = async (data: FormDataSchema) => {
    if (!Token) return toast.error("Authentication Error");
    setLoading(true);

    try {
      let res;

      // Prepare Payload object (not FormData, the API function handles FormData conversion)
      const payload = {
        categoryName: data.categoryName,
        stages: data.stages, // Already in [{stageId, weightage}] format
        token: Token,
      };

      if (mode === "add") {
        res = await addStageCategory(payload);
      } else if (mode === "edit" && initialData) {
        res = await updateStageCategory({
          ...payload,
          categoryId: initialData.id,
        });
      }

      // Check response
      if (res && res.data && res.data.errFlag === 0) {
        toast.success(res.data.message);
        if (refreshData) await refreshData();
        onOpenChange(false);
      } else {
        toast.error(res?.data?.message || "Operation failed.");
      }
    } catch (error) {
      console.error("Error saving stage category:", error);
      toast.error("Failed to save. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {mode === "edit" ? "Edit" : "Add"} Stage Category
          </DialogTitle>
          <DialogDescription>
            Group multiple production stages into a single category workflow.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="categoryName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category Name *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Full Shirt Manufacturing"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="stages"
              render={() => (
                <FormItem>
                  <FormLabel>Included Stages *</FormLabel>
                  <div className="flex gap-2">
                    <Select
                      value={selectedStageId}
                      onValueChange={setSelectedStageId}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select a stage" />
                      </SelectTrigger>
                      <SelectContent>
                        <div className="p-2 sticky top-0 bg-white z-10 border-b">
                          <Input
                            placeholder="Search..."
                            value={stageSearch}
                            onChange={(e) => setStageSearch(e.target.value)}
                            onKeyDown={(e) => e.stopPropagation()}
                            className="h-9"
                          />
                        </div>
                        {filterStages(availableStages, stageSearch)
                          .filter(
                            (stg) =>
                              !selectedStageIds.some(
                                (s) => s.stageId === stg.id
                              )
                          )
                          .map((stage) => (
                            <SelectItem
                              key={stage.id}
                              value={stage.id.toString()}
                            >
                              {stage.stage_name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      onClick={addStageToSelection}
                      disabled={!selectedStageId}
                    >
                      Add
                    </Button>
                  </div>

                  {selectedStageIds.length > 0 && (
                    <div className="mt-3 space-y-3 p-3 border rounded-md bg-slate-50">
                      {selectedStageIds.map((item, index) => {
                        const stage = availableStages.find(
                          (s) => s.id === item.stageId
                        );
                        return (
                          <div
                            key={item.stageId}
                            className="flex items-center gap-4 bg-white p-2 rounded border"
                          >
                            <span className="text-xs text-muted-foreground font-mono w-4">
                              {index + 1}
                            </span>
                            <div className="flex-1 flex items-center gap-2 min-w-0">
                              <Layers className="h-3 w-3 text-blue-500 shrink-0" />
                              <span className="text-sm truncate">
                                {stage?.stage_name || `Stage ${item.stageId}`}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <div className="relative w-20">
                                <Input
                                  type="number"
                                  placeholder="Weight"
                                  value={item.weightage}
                                  onChange={(e) =>
                                    handleWeightageChange(
                                      item.stageId,
                                      parseFloat(e.target.value) || 0
                                    )
                                  }
                                  className="h-8 pr-6 text-right"
                                />
                                <span className="absolute right-2 top-1.5 text-xs text-muted-foreground">
                                  %
                                </span>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-red-500"
                                onClick={() =>
                                  removeStageFromSelection(item.stageId)
                                }
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                      <div className="pt-2 border-t flex justify-between items-center px-1">
                        <span className="text-sm font-medium">
                          Total Weightage
                        </span>
                        <span
                          className={`text-sm font-bold ${
                            selectedStageIds.reduce(
                              (sum, s) => sum + s.weightage,
                              0
                            ) === 100
                              ? "text-green-600"
                              : "text-amber-600"
                          }`}
                        >
                          {selectedStageIds.reduce(
                            (sum, s) => sum + s.weightage,
                            0
                          )}
                          %
                        </span>
                      </div>
                    </div>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : "Save Category"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
