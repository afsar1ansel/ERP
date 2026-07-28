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
import { X, Check } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";
import { BASE_URL } from "@/hooks/baseUrls";
import {
  addProductionStage,
  updateProductionStage,
} from "@/pages/master/MasterProductionStages";
import { Separator } from "@/components/ui/separator"; // Assuming you have or can create this simple UI component

// --- ENHANCED VALIDATION SCHEMA ---
const formSchema = z.object({
  stageName: z
    .string()
    .min(3, { message: "Stage name must be at least 3 characters." })
    .regex(/^[A-Za-z0-9\s-]+$/, {
      message: "Can only contain letters, numbers, spaces, and hyphens.",
    }),
  stageHead: z.string().min(1, { message: "Please select a stage head." }),
  stageEmployees: z
    .array(z.string())
    .min(1, { message: "Please add at least one employee." }),
  status: z.enum(["active", "inactive"]),
});

type FormData = z.infer<typeof formSchema>;

interface ProductionStageFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stage?: {
    id: number;
    stage_name: string;
    stage_head_name: string;
    stage_head_employee_id: number;
    status: number;
    employees?: Array<{ id: string }>;
  } | null;
  mode?: "add" | "edit";
  fetchProductionStages?: () => Promise<void>;
}

export function ProductionStageForm({
  open,
  onOpenChange,
  stage,
  mode = "add",
  fetchProductionStages,
}: ProductionStageFormProps) {
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<string>("");
  const [mockEmployees, setMockEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [stageHeadSearch, setStageHeadSearch] = useState<string>(""); // NEW: Search state for Stage Head
  const [employeeSearch, setEmployeeSearch] = useState<string>(""); // NEW: Search state for Stage Employees
  const Token = localStorage.getItem("token");

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      stageName: "",
      stageHead: "",
      stageEmployees: [],
      status: "active",
    },
  });

  // Pre-populate form when in edit mode
  useEffect(() => {
    if (stage && mode === "edit") {
      const employeeIds =
        stage.employees?.map((emp) => emp.id.toString()) || [];
      form.reset({
        stageName: stage.stage_name,
        stageHead: stage.stage_head_employee_id.toString(),
        stageEmployees: employeeIds,
        status: stage.status === 1 ? "active" : "inactive",
      });
      setSelectedEmployees(employeeIds);
    } else {
      // Reset form for add mode
      form.reset({
        stageName: "",
        stageHead: "",
        stageEmployees: [],
        status: "active",
      });
      setSelectedEmployees([]);
    }
    setSelectedEmployee("");
    setStageHeadSearch(""); // Reset search on open/mode change
    setEmployeeSearch(""); // Reset search on open/mode change
  }, [stage, open, form, mode]);

  // Submit handler with Add/Edit API calls
  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const payload: any = {
        stageName: data.stageName,
        stageHeadEmployeeId: data.stageHead,
        stageEmployees: data.stageEmployees.map((empId) => ({
          stage_employee_id: empId,
        })),
        token: Token,
      };

      if (mode === "add") {
        await addProductionStage(payload);
        toast.success("Production stage created successfully!");
      } else if (mode === "edit" && stage) {
        payload.stageId = stage.id;
        // payload.status = data.status === 'active' ? 1 : 0; // Uncomment if needed by API
        await updateProductionStage(payload);
        toast.success("Production stage updated successfully!");
      }

      if (fetchProductionStages) {
        await fetchProductionStages();
      }
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving production stage:", error);
      toast.error("Failed to save production stage. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // --- Employee Multi-select Handlers ---
  const addEmployee = () => {
    if (selectedEmployee && !selectedEmployees.includes(selectedEmployee)) {
      const updated = [...selectedEmployees, selectedEmployee];
      setSelectedEmployees(updated);
      form.setValue("stageEmployees", updated, { shouldValidate: true });
      setSelectedEmployee("");
      setEmployeeSearch(""); // Clear search after adding
    }
  };

  const removeEmployee = (employeeId: string) => {
    const updated = selectedEmployees.filter((emp) => emp !== employeeId);
    setSelectedEmployees(updated);
    form.setValue("stageEmployees", updated, { shouldValidate: true });
  };

  // Fetch employees for dropdowns
  useEffect(() => {
    const handleFetchEmployees = async (token: string | null) => {
      if (!token) return;
      try {
        const url = `${BASE_URL}/employees/get-all/${token}`;
        const res = await axios.get(url);
        setMockEmployees(res.data);
      } catch (err) {
        console.error("Failed to fetch employees:", err);
      }
    };
    handleFetchEmployees(Token);
  }, [Token]);

  // Filtering logic moved outside JSX for clarity
  const filterEmployees = (employees: any[], searchTerm: string) => {
    return employees.filter(
      (emp) =>
        emp.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.department?.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "edit" ? "Edit" : "Add"} Production Stage
          </DialogTitle>
          <DialogDescription>
            {mode === "edit"
              ? "Update the production stage details."
              : "Create a new stage with an assigned head and employees."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="stageName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Stage Name *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Cutting, Stitching, Assembly"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* --- STAGE HEAD: Select with Search Input --- */}
            <FormField
              control={form.control}
              name="stageHead"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Stage Head *</FormLabel>
                  <FormControl>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select stage head" />
                      </SelectTrigger>
                      <SelectContent>
                        {/* Search Input for Stage Head */}
                        <div className="p-2 sticky top-0 bg-white z-10 border-b">
                          <Input
                            placeholder="Search employees..."
                            value={stageHeadSearch}
                            onChange={(e) => setStageHeadSearch(e.target.value)}
                            onKeyDown={(e) => e.stopPropagation()}
                            className="h-9"
                          />
                        </div>

                        {/* Filtered Items */}
                        {filterEmployees(mockEmployees, stageHeadSearch).map(
                          (employee) => (
                            <SelectItem
                              key={employee.id}
                              value={employee.id.toString()}
                            >
                              {employee.name} - {employee.department}
                              {field.value === employee.id.toString() && (
                                <Check className="ml-auto h-4 w-4 opacity-100" />
                              )}
                            </SelectItem>
                          ),
                        )}
                        {filterEmployees(mockEmployees, stageHeadSearch)
                          .length === 0 && (
                          <div className="p-2 text-center text-sm text-muted-foreground">
                            No results found.
                          </div>
                        )}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* --- END STAGE HEAD --- */}

            {/* --- STAGE EMPLOYEES: Multi-select with Search Input --- */}
            <FormField
              control={form.control}
              name="stageEmployees"
              render={() => (
                <FormItem>
                  <FormLabel>Stage Employees *</FormLabel>
                  <div className="flex gap-2">
                    <Select
                      value={selectedEmployee}
                      onValueChange={setSelectedEmployee}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select employee to add" />
                      </SelectTrigger>
                      <SelectContent>
                        {/* Search Input for Stage Employees */}
                        <div className="p-2 sticky top-0 bg-white z-10 border-b">
                          <Input
                            placeholder="Search employees..."
                            value={employeeSearch}
                            onChange={(e) => setEmployeeSearch(e.target.value)}
                            onKeyDown={(e) => e.stopPropagation()}
                            className="h-9"
                          />
                        </div>

                        {/* Filtered Items: Exclude already selected employees */}
                        {filterEmployees(mockEmployees, employeeSearch)
                          .filter(
                            (emp) =>
                              !selectedEmployees.includes(emp.id.toString()),
                          )
                          .map((employee) => (
                            <SelectItem
                              key={employee.id}
                              value={employee.id.toString()}
                            >
                              {employee.name} - {employee.department}
                            </SelectItem>
                          ))}
                        {filterEmployees(mockEmployees, employeeSearch).filter(
                          (emp) =>
                            !selectedEmployees.includes(emp.id.toString()),
                        ).length === 0 && (
                          <div className="p-2 text-center text-sm text-muted-foreground">
                            No employees found or all are selected.
                          </div>
                        )}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      onClick={addEmployee}
                      disabled={!selectedEmployee}
                    >
                      Add
                    </Button>
                  </div>

                  {selectedEmployees.length > 0 && (
                    <div className="flex flex-wrap gap-2 p-3 border rounded-md bg-muted/50">
                      {selectedEmployees.map((employeeId) => {
                        const emp = mockEmployees.find(
                          (e) => e.id.toString() === employeeId,
                        );
                        return (
                          <Badge
                            key={employeeId}
                            variant="secondary"
                            className="flex items-center gap-1"
                          >
                            {emp?.name ?? "Unknown"}
                            <X
                              className="h-3 w-3 cursor-pointer"
                              onClick={() => removeEmployee(employeeId)}
                            />
                          </Badge>
                        );
                      })}
                    </div>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* --- END STAGE EMPLOYEES --- */}

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
                {loading
                  ? "Saving..."
                  : `${mode === "edit" ? "Update" : "Create"} Stage`}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
