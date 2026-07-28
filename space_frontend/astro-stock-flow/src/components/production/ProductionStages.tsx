import Select from "react-select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X, Layers, Users } from "lucide-react";

function ProductionStages({ formData, setFormData, productionStages, employees }: any) {
  const stageOptions = productionStages.map((stage: any) => ({
    value: stage.id.toString(),
    label: stage.stage_name,
  }));

  const employeeOptions = employees.map((emp: any) => ({
    value: emp.id.toString(),
    label: emp.name,
  }));

  const handleStageSelect = (selectedOptions: any) => {
    const selectedIds = (selectedOptions || []).map((opt: any) => parseInt(opt.value));
    const currentStages = formData.productionStages;

    // Filter out removed stages
    let newStages = currentStages.filter((s: any) =>
      selectedIds.includes(s.stageId)
    );

    // Add new stages with 0 weightage and empty employeeIds
    selectedIds.forEach((id: number) => {
      if (!newStages.some((s: any) => s.stageId === id)) {
        newStages.push({ stageId: id, weightage: 0, employeeIds: [] });
      }
    });

    setFormData((prev: any) => ({
      ...prev,
      productionStages: newStages,
    }));
  };

  const handleWeightageChange = (stageId: number, weightage: number) => {
    setFormData((prev: any) => ({
      ...prev,
      productionStages: prev.productionStages.map((s: any) =>
        s.stageId === stageId ? { ...s, weightage } : s
      ),
    }));
  };

  const handleEmployeesChange = (stageId: number, selectedOptions: any) => {
    const employeeIds = (selectedOptions || []).map((opt: any) => parseInt(opt.value));
    setFormData((prev: any) => ({
      ...prev,
      productionStages: prev.productionStages.map((s: any) =>
        s.stageId === stageId ? { ...s, employeeIds } : s
      ),
    }));
  };

  const removeStage = (stageId: number) => {
    setFormData((prev: any) => ({
      ...prev,
      productionStages: prev.productionStages.filter(
        (s: any) => s.stageId !== stageId
      ),
    }));
  };

  const totalWeightage = formData.productionStages.reduce(
    (sum: number, s: any) => sum + (s.weightage || 0),
    0
  );

  return (
    <div className="space-y-4">
      <div>
        <Label>Production Stages</Label>
        <Select
          isMulti
          options={stageOptions}
          value={stageOptions.filter((opt) =>
            formData.productionStages.some(
              (s: any) => s.stageId === parseInt(opt.value)
            )
          )}
          onChange={handleStageSelect}
          placeholder="Select production stages"
          className="mt-1"
        />
      </div>

      {formData.productionStages.length > 0 && (
        <div className="space-y-2 p-3 border rounded-md bg-slate-50">
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Configure Stages & Teams
          </Label>
          <div className="space-y-4 mt-2">
            {formData.productionStages.map((item: any, index: number) => {
              const stage = productionStages.find(
                (s: any) => s.id === item.stageId
              );
              return (
                <div
                  key={item.stageId}
                  className="bg-white p-3 rounded border shadow-sm space-y-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground font-mono w-4 text-center">
                      {index + 1}
                    </span>
                    <div className="flex-1 flex items-center gap-2 min-w-0">
                      <Layers className="h-4 w-4 text-blue-500 shrink-0" />
                      <span className="text-sm truncate font-bold">
                        {stage?.stage_name || `Stage ${item.stageId}`}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="relative w-24">
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
                          className="h-8 pr-6 text-right font-semibold"
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
                        onClick={() => removeStage(item.stageId)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="ml-7 space-y-1.5 border-t pt-3">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <Users className="h-3 w-3" />
                      <span className="text-[10px] font-semibold uppercase tracking-wider">
                        Assigned Employees
                      </span>
                    </div>
                    <Select
                      isMulti
                      options={employeeOptions}
                      value={employeeOptions.filter((opt) =>
                        (item.employeeIds || []).includes(parseInt(opt.value))
                      )}
                      onChange={(selected) => handleEmployeesChange(item.stageId, selected)}
                      placeholder="Select team members..."
                      className="text-sm"
                      classNames={{
                        control: () => "!min-h-[32px] !border-input",
                        valueContainer: () => "!p-0 !px-2",
                        placeholder: () => "!text-muted-foreground",
                        input: () => "!m-0 !p-0",
                      }}
                    />
                    <p className="text-[10px] text-muted-foreground italic">
                      Leave empty to auto-assign all team members for this stage.
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-2 border-t flex justify-between items-center px-1 mt-2">
            <span className="text-sm font-medium">Total Weightage</span>
            <span
              className={`text-sm font-bold ${
                totalWeightage === 100 ? "text-green-600" : "text-amber-600"
              }`}
            >
              {totalWeightage}%
            </span>
          </div>
          {totalWeightage !== 100 && (
            <p className="text-[10px] text-amber-600 text-right italic">
              Total weightage should be 100%
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default ProductionStages;
