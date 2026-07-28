import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, X } from "lucide-react";

interface MaterialFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const MaterialForm = ({ open, onOpenChange }: MaterialFormProps) => {
  const [formData, setFormData] = useState({
    name: "",
    unitOfMeasurement: "",
    storageLocation: "",
    supplierInfo: "",
    category: "",
    image: null as File | null
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, image: file }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Material form submitted:", formData);
    // TODO: Handle form submission
    onOpenChange(false);
    setFormData({ name: "", unitOfMeasurement: "", storageLocation: "", supplierInfo: "", category: "", image: null });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Material</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="materialName">Material Name</Label>
            <Input
              id="materialName"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter material name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="unitOfMeasurement">Unit of Measurement</Label>
            <Select value={formData.unitOfMeasurement} onValueChange={(value) => setFormData(prev => ({ ...prev, unitOfMeasurement: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select unit" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="kg">Kilogram (kg)</SelectItem>
                <SelectItem value="g">Gram (g)</SelectItem>
                <SelectItem value="m">Meter (m)</SelectItem>
                <SelectItem value="cm">Centimeter (cm)</SelectItem>
                <SelectItem value="pcs">Pieces (pcs)</SelectItem>
                <SelectItem value="rolls">Rolls</SelectItem>
                <SelectItem value="sheets">Sheets</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="storageLocation">Storage Location</Label>
            <Input
              id="storageLocation"
              value={formData.storageLocation}
              onChange={(e) => setFormData(prev => ({ ...prev, storageLocation: e.target.value }))}
              placeholder="e.g., Warehouse A, Rack 1, Shelf 2"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="supplierInfo">Supplier Information</Label>
            <Input
              id="supplierInfo"
              value={formData.supplierInfo}
              onChange={(e) => setFormData(prev => ({ ...prev, supplierInfo: e.target.value }))}
              placeholder="Enter supplier details"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Raw Material Category</Label>
            <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fabric">Fabric</SelectItem>
                <SelectItem value="leather">Leather</SelectItem>
                <SelectItem value="hardware">Hardware</SelectItem>
                <SelectItem value="zipper">Zippers</SelectItem>
                <SelectItem value="thread">Thread</SelectItem>
                <SelectItem value="padding">Padding/Foam</SelectItem>
                <SelectItem value="accessories">Accessories</SelectItem>
                <SelectItem value="packaging">Packaging</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="materialImage">Material Image</Label>
            <div className="border-2 border-dashed border-border rounded-lg p-4 text-center">
              {formData.image ? (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{formData.image.name}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setFormData(prev => ({ ...prev, image: null }))}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <label htmlFor="imageUpload" className="cursor-pointer flex flex-col items-center">
                  <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                  <span className="text-sm text-muted-foreground">Upload material image</span>
                  <input
                    id="imageUpload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Add Material</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};