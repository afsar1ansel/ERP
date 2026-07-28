import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { X, Upload, Image } from "lucide-react";
import axios from "axios";
import { addQCRecord, updateQCRecord } from "@/pages/QualityControl";
import QCRecordsTestType from "./QCRecordsTestType";

// Interfaces for structured data
interface TestType {
  id: string;
  name: string;
}

interface RawMaterial {
  id: number;
  material_code: string;
  material_name: string;
}

interface ProductionBatch {
  id: number;
  production_code: string;
  product_name: string;
}

interface EntityOption {
  id: string;
  code: string;
  name: string;
}

interface AddQCRecordFormProps {
  mode: "add" | "edit";
  onSuccess: () => void;
  selectedQCRecord?: any;
  token: string;
  baseUrl: string;
}

interface FormData {
  entityType: string;
  entityId: string;
  item: string;
  inspector: string;
  testType: string | number;
  parameters: string;
  remarks: string;
  result: string;
  defect_count: string;
  testType2: string | number;
}

export function AddQCRecordForm({
  mode,
  onSuccess,
  selectedQCRecord,
  token,
  baseUrl,
}: AddQCRecordFormProps) {
  const { toast } = useToast();

  const [formData, setFormData] = useState<FormData>({
    entityType: "",
    entityId: "",
    item: "",
    inspector: "",
    testType: "",
    parameters: "",
    remarks: "",
    result: "",
    defect_count: "0",
    testType2: "",
  });

  // --- VALIDATION AND UI STATES ---
  const [errors, setErrors] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
  const [testTypes, setTestTypes] = useState<TestType[]>([]);

  // --- NEW STATES FOR ENTITY DROPDOWN ---
  const [entityOptions, setEntityOptions] = useState<EntityOption[]>([]);
  const [loadingEntities, setLoadingEntities] = useState(false);

  // --- MODIFIED ---: Pre-fill form data in edit mode, including defect_count
  useEffect(() => {
    if (mode === "edit" && selectedQCRecord) {
      setFormData({
        entityType: selectedQCRecord.entity_type || "",
        entityId: selectedQCRecord.entity_id || "",
        item: selectedQCRecord.item_name || "",
        inspector: selectedQCRecord.inspector_name || "",
        testType: selectedQCRecord.test_type_id
          ? String(selectedQCRecord.test_type_id)
          : "",
        testType2: selectedQCRecord.test_type_name || "",
        parameters: selectedQCRecord.test_parameters || "",
        remarks: selectedQCRecord.remarks || "",
        result: selectedQCRecord.result || "",
        defect_count: String(selectedQCRecord.defect_count || "0"),
      });
      setExistingImageUrl(selectedQCRecord.qc_image_url || null);
    } else {
      // Reset form for add mode
      setFormData({
        entityType: "",
        entityId: "",
        item: "",
        inspector: "",
        testType: "",
        parameters: "",
        remarks: "",
        result: "",
        defect_count: "0",
        testType2: "",
      });
      setExistingImageUrl(null);
    }
    setErrors({});
    setSelectedImageFile(null);
  }, [mode, selectedQCRecord]);

  // Fetch test types for the dropdown
  useEffect(() => {
    const fetchTestTypes = async () => {
      try {
        const res = await axios.get(
          `${baseUrl}/qc-test-types/get-qc-test-types/${token}`
        );
        if (Array.isArray(res.data)) {
          setTestTypes(
            res.data.map((t: any) => ({
              id: t.id,
              name: t.test_type_name,
            }))
          );
        }
      } catch (error) {
        console.error("Error fetching test types:", error);
      }
    };
    fetchTestTypes();
  }, [token, baseUrl]);

  // --- NEW: Fetch entity options based on selected entity type ---
  useEffect(() => {
    const fetchEntityOptions = async () => {
      if (!formData.entityType) {
        setEntityOptions([]);
        return;
      }

      setLoadingEntities(true);
      try {
        let apiUrl = "";

        if (
          formData.entityType === "GRN" ||
          formData.entityType === "Raw Material"
        ) {
          apiUrl = `${baseUrl}/raw-materials/get-all/${token}`;
        } else if (
          formData.entityType === "Production" ||
          formData.entityType === "Finished Goods"
        ) {
          apiUrl = `${baseUrl}/production-batches/get-all/${token}`;
        }

        if (apiUrl) {
          const response = await axios.get(apiUrl);
          let options: EntityOption[] = [];

          if (
            formData.entityType === "GRN" ||
            formData.entityType === "Raw Material"
          ) {
            // For raw materials, use material_code and material_name
            options = response.data.map((item: RawMaterial) => ({
              id: String(item.id),
              code: item.material_code.trim(),
              name: item.material_name.trim(),
            }));
          } else if (
            formData.entityType === "Production" ||
            formData.entityType === "Finished Goods"
          ) {
            // For production batches, use production_code and product_name
            options = response.data.map((item: ProductionBatch) => ({
              id: String(item.id),
              code: item.production_code,
              name: item.product_name,
            }));
          }

          setEntityOptions(options);
        }
      } catch (error) {
        console.error("Error fetching entity options:", error);
        toast({
          title: "Error",
          description: "Failed to load entity options",
          variant: "destructive",
        });
        setEntityOptions([]);
      } finally {
        setLoadingEntities(false);
      }
    };

    fetchEntityOptions();
  }, [formData.entityType, token, baseUrl, toast]);

  // --- NEW: Handle entity selection to auto-fill item name ---
  const handleEntitySelect = (entityId: string) => {
    setFormData((prev) => ({ ...prev, entityId }));

    // Auto-fill item name based on selected entity
    const selectedEntity = entityOptions.find(
      (option) => option.id === entityId
    );
    if (selectedEntity) {
      setFormData((prev) => ({
        ...prev,
        entityId,
        item: selectedEntity.name,
      }));
    }
  };

  // --- MODIFIED ---: Added validation for defect_count
  const validateForm = () => {
    const newErrors: any = {};

    if (!formData.entityType) newErrors.entityType = "Entity type is required.";
    if (!formData.entityId) newErrors.entityId = "Entity ID is required.";
    if (!/^[A-Za-z0-9\s-]{3,}$/.test(formData.item))
      newErrors.item = "Item name must be at least 3 characters.";
    if (!/^[A-Za-z\s.]{3,}$/.test(formData.inspector))
      newErrors.inspector = "Enter a valid inspector name.";
    if (!formData.testType && !formData.testType2)
      newErrors.testType = "Test type is required.";
    if (!/^.{10,}$/.test(formData.parameters.trim()))
      newErrors.parameters = "Parameters must be at least 10 characters long.";
    if (!formData.result) newErrors.result = "Result is required.";
    if (!/^\d+$/.test(formData.defect_count))
      newErrors.defect_count = "Defect count must be a non-negative number.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // --- MODIFIED ---: Added defect_count to API data payload
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fill all required fields correctly.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const apiData: any = {
        entityType: formData.entityType,
        entityId: formData.entityId,
        itemName: formData.item,
        inspectorName: formData.inspector,
        testTypeId: formData.testType || formData.testType2,
        testParameters: formData.parameters,
        remarks: formData.remarks,
        result: formData.result,
        defect_count: formData.defect_count,
        qcImage: selectedImageFile,
        token,
      };

      if (mode === "add") {
        await addQCRecord(apiData);
        toast({
          title: "Success",
          description: "QC Record created successfully.",
        });
      } else {
        apiData.qcId = selectedQCRecord.id;
        apiData.qcCode = selectedQCRecord.qc_code;
        await updateQCRecord(apiData);
        toast({
          title: "Success",
          description: "QC Record updated successfully.",
        });
      }
      onSuccess();
    } catch (error) {
      console.error("Error submitting QC record:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // --- INPUT & FILE HANDLERS (No changes needed here) ---
  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev: any) => ({ ...prev, [field]: "" }));
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImageFile(file);
      setExistingImageUrl(null);
    }
  };

  const removeImage = () => {
    setSelectedImageFile(null);
    setExistingImageUrl(null);
  };

  return (
    <>
      <DialogDescription>
        {mode === "add"
          ? "Create a new quality control record."
          : "Edit the existing quality control record."}
      </DialogDescription>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Entity Type and Entity ID */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="entityType">Entity Type *</Label>
            <Select
              value={formData.entityType}
              onValueChange={(value) => handleInputChange("entityType", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select entity type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="GRN">GRN</SelectItem>
                <SelectItem value="Production">Production</SelectItem>
                <SelectItem value="Finished Goods">Finished Goods</SelectItem>
                <SelectItem value="Raw Material">Raw Material</SelectItem>
              </SelectContent>
            </Select>
            {errors.entityType && (
              <p className="text-red-500 text-sm mt-1">{errors.entityType}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="entityId">Entity ID *</Label>
            <Select
              value={formData.entityId}
              onValueChange={handleEntitySelect}
              disabled={!formData.entityType || loadingEntities}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    loadingEntities
                      ? "Loading..."
                      : !formData.entityType
                      ? "Select entity type first"
                      : "Select entity"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {entityOptions.map((option) => (
                  <SelectItem key={option.id} value={option.id}>
                    {option.code} - {option.name}
                  </SelectItem>
                ))}
                {entityOptions.length === 0 && !loadingEntities && (
                  <SelectItem value="no-options" disabled>
                    No options available
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
            {errors.entityId && (
              <p className="text-red-500 text-sm mt-1">{errors.entityId}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="item">Item Name *</Label>
          <Input
            id="item"
            placeholder="Enter item name"
            value={formData.item}
            onChange={(e) => handleInputChange("item", e.target.value)}
          />
          {errors.item && (
            <p className="text-red-500 text-sm mt-1">{errors.item}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="inspector">Inspector Name *</Label>
            <Input
              id="inspector"
              placeholder="Enter inspector name"
              value={formData.inspector}
              onChange={(e) => handleInputChange("inspector", e.target.value)}
            />
            {errors.inspector && (
              <p className="text-red-500 text-sm mt-1">{errors.inspector}</p>
            )}
          </div>
          <div className="space-y-2">
            <QCRecordsTestType
              formData={formData}
              setFormData={setFormData}
              testTypes={testTypes}
            />
            {errors.testType && (
              <p className="text-red-500 text-sm mt-1">{errors.testType}</p>
            )}
          </div>
        </div>

        {/* Test Parameters and Remarks */}
        <div className="space-y-2">
          <Label htmlFor="parameters">Test Parameters *</Label>
          <Textarea
            id="parameters"
            placeholder="Enter test parameters and specifications"
            value={formData.parameters}
            onChange={(e) => handleInputChange("parameters", e.target.value)}
          />
          {errors.parameters && (
            <p className="text-red-500 text-sm mt-1">{errors.parameters}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="remarks">Remarks</Label>
          <Textarea
            id="remarks"
            placeholder="Enter any additional remarks or observations"
            value={formData.remarks}
            onChange={(e) => handleInputChange("remarks", e.target.value)}
          />
        </div>

        {/* Result and Defect Count */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="result">Result *</Label>
            <Select
              value={formData.result}
              onValueChange={(value) => handleInputChange("result", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Result" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pass">Pass</SelectItem>
                <SelectItem value="failed">Fail</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
            {errors.result && (
              <p className="text-red-500 text-sm mt-1">{errors.result}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="defect_count">Defect Count</Label>
            <Input
              id="defect_count"
              type="number"
              placeholder="e.g., 5"
              value={formData.defect_count}
              onChange={(e) =>
                handleInputChange(
                  "defect_count",
                  e.target.value.replace(/[^0-9]/g, "")
                )
              }
              min="0"
            />
            {errors.defect_count && (
              <p className="text-red-500 text-sm mt-1">{errors.defect_count}</p>
            )}
          </div>
        </div>

        {/* Image Upload */}
        <div className="space-y-3">
          <Label>Quality Control Images</Label>
          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4">
            {selectedImageFile || existingImageUrl ? (
              <div className="relative group border rounded-lg p-2 bg-muted/50 flex items-center gap-2">
                <Image className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm truncate flex-1">
                  {selectedImageFile?.name || "Existing Image"}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={removeImage}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <label
                htmlFor="qc-image-upload"
                className="cursor-pointer text-center block"
              >
                <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground mb-2">
                  Upload inspection results or defect images
                </p>
                <Button type="button" variant="outline" size="sm" asChild>
                  <span>
                    <Image className="h-4 w-4 mr-2" />
                    Choose Image
                  </span>
                </Button>
                <Input
                  id="qc-image-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onSuccess}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading
              ? "Saving..."
              : mode === "add"
              ? "Create QC Record"
              : "Update QC Record"}
          </Button>
        </div>
      </form>
    </>
  );
}
