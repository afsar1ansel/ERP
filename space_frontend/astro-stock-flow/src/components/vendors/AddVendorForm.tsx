import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Upload, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { addVendor, updateVendor } from "@/pages/Vendors";
import axios from "axios";
import { BASE_URL } from "@/hooks/baseUrls";
import CategoryMaterialSelect from "./CategoryMaterialSelect";

interface AddVendorFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "add" | "edit";
  vendor?: any;
  onSuccess?: () => void;
}

export const AddVendorForm = ({
  open,
  onOpenChange,
  mode,
  vendor,
  onSuccess,
}: AddVendorFormProps) => {
  const { toast } = useToast();
  const token = localStorage.getItem("token") || "";

  const [loading, setLoading] = useState(false);
  const [brands, setBrands] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [paymentTermsOptions, setPaymentTermsOptions] = useState<any[]>([]);

  const initialFormData = {
    vendorId: "",
    name: "",
    contactPerson: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    gstNumber: "",
    panNumber: "",
    bankName: "",
    bankAccount: "",
    ifscCode: "",
    paymentTerms: "",
    creditLimit: "",
    brand: "",
    notes: "",
    isActive: true,
    logo: null as File | null | string, // Can be File, null, or string (URL)
    categories: [] as string[],
    materials: [] as string[],
  };

  const [formData, setFormData] = useState(initialFormData);

  // --- VALIDATION STATE ---
  // A new state to hold error messages for each field.
  const [errors, setErrors] = useState({
    name: "",
    contactPerson: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    gstNumber: "",
    panNumber: "",
    bankName: "",
    bankAccount: "",
    ifscCode: "",
    paymentTerms: "",
    creditLimit: "",
    logo: "",
    categories: "",
    materials: "",
  });

  // --- DATA PREFILL LOGIC ---
  // Prefills the form when in 'edit' mode.
  useEffect(() => {
    if (mode === "edit" && vendor) {
      console.log("Edit mode data:", vendor);
      const categories =
        vendor.raw_materials
          ?.map((m: any) => m.raw_material_category_name)
          .filter((v: any, i: number, a: any[]) => v && a.indexOf(v) === i) ||
        [];

      const materials =
        vendor.raw_materials?.map((m: any) => m.raw_material_id.toString()) ||
        [];

      setFormData({
        vendorId: vendor.id?.toString() || "",
        name: vendor.vendor_name || "",
        contactPerson: vendor.contact_person || "",
        email: vendor.email || "",
        phone: vendor.phone || "",
        address: vendor.address || "",
        city: vendor.city || "",
        state: vendor.state || "",
        pincode: vendor.pincode || "",
        gstNumber: vendor.gst_no || "",
        panNumber: vendor.pan_no || "",
        bankName: vendor.bank_name || "",
        bankAccount: vendor.account_no || "",
        ifscCode: vendor.ifsc_code || "",
        paymentTerms: vendor.payment_terms || "",
        creditLimit: vendor.credit_limit || "",
        brand: vendor.brand_id?.toString() || "",
        notes: vendor.notes || "",
        isActive: vendor.status === 1,
        logo: vendor.vender_logo, // This will be a URL string in edit mode
        categories,
        materials,
      });
    } else {
      // Reset form for 'add' mode or when dialog closes.
      setFormData(initialFormData);
    }
    // Clear all validation errors when the form mode or data changes.
    setErrors({
      name: "",
      contactPerson: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      state: "",
      pincode: "",
      gstNumber: "",
      panNumber: "",
      bankName: "",
      bankAccount: "",
      ifscCode: "",
      paymentTerms: "",
      creditLimit: "",
      logo: "",
      categories: "",
      materials: "",
    });
  }, [mode, vendor, open]);

  // --- INPUT CHANGE HANDLER ---
  // Updates form data and clears the specific field's error.
  const handleInputChange = (
    field: keyof typeof formData,
    value: string | boolean | File | null | string[]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // As the user types, clear the validation error for that field.
    if (errors[field as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [field as keyof typeof errors]: "" }));
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleInputChange("logo", file);
    }
  };

  // --- VALIDATION FUNCTION ---
  // This function checks all form fields against specific rules and regex patterns.
  const validateForm = () => {
    const newErrors: any = {};

    // Basic Information
    if (!/^[A-Za-z\s.&-]{3,}$/.test(formData.name))
      newErrors.name = "Enter a valid vendor name.";
    if (!/^[A-Za-z\s.]{3,}$/.test(formData.contactPerson))
      newErrors.contactPerson = "Enter a valid contact person name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      newErrors.email = "Enter a valid email address.";
    if (!/^\d{5,15}$/.test(formData.phone))
      newErrors.phone = "Enter a valid mobile number (5-15 digits).";

    // Address
    if (!formData.address.trim()) newErrors.address = "Address is required.";
    if (!/^[A-Za-z\s-]{2,}$/.test(formData.city))
      newErrors.city = "Enter a valid city name.";
    if (!/^[A-Za-z\s-]{2,}$/.test(formData.state))
      newErrors.state = "Enter a valid state name.";
    if (!/^\d{6}$/.test(formData.pincode))
      newErrors.pincode = "Enter a valid 6-digit pincode.";

    // Tax & Legal (Indian formats)
    if (!formData.gstNumber || !formData.gstNumber.trim()) {
      newErrors.gstNumber = "GST Number is required.";
    }
    if (!formData.panNumber || !formData.panNumber.trim()) {
      newErrors.panNumber = "PAN Number is required.";
    }

    // Banking
    if (!/^[A-Za-z\s-]{3,}$/.test(formData.bankName))
      newErrors.bankName = "Enter a valid bank name.";
    if (!formData.bankAccount || !formData.bankAccount.trim()) {
      newErrors.bankAccount = "Bank Account Number is required.";
    }
    // Changed [A-Z] to [A-Za-z] to allow lowercase typing
    if (!formData.ifscCode || !formData.ifscCode.trim()) {
      newErrors.ifscCode = "IFSC Code is required.";
    }
    if (!formData.paymentTerms)
      newErrors.paymentTerms = "Select payment terms.";
    if (Number(formData.creditLimit) <= 0)
      newErrors.creditLimit = "Credit limit must be a positive number.";

    // Logo (Required only in 'add' mode)
    // if (mode === "add" && !formData.logo)
    //   newErrors.logo = "Vendor logo is required.";

    // Categories & Materials
    if (formData.categories.length === 0)
      newErrors.categories = "At least one category must be selected.";
    // if (formData.materials.length === 0)
    //   newErrors.materials = "At least one material must be selected.";

    setErrors(newErrors);
    // Returns true if the newErrors object is empty, false otherwise.
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // --- EXECUTE VALIDATION ---
    // The form submission is stopped if validateForm() returns false.
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fill all required fields correctly.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const apiPayload = {
        vendorName: formData.name,
        contactPerson: formData.contactPerson,
        email: formData.email,
        phone: formData.phone,
        brandId: formData.brand,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode,
        gstNo: formData.gstNumber,
        panNo: formData.panNumber,
        bankName: formData.bankName,
        accountNo: formData.bankAccount,
        ifscCode: formData.ifscCode,
        paymentTerms: formData.paymentTerms,
        creditLimit: formData.creditLimit,
        notes: formData.notes,
        vendorLogo: formData.logo,
        raw_materials: formData.materials,
        categories: formData.categories,
        token,
      };

      if (mode === "add") {
        const res = await addVendor(apiPayload);
        if (res.errFlag !== 0) throw new Error(res.message);
        toast({
          title: "Success",
          description:
            res?.message || `Vendor ${formData.name} added successfully!`,
        });
      } else {
        const res = await updateVendor({
          ...apiPayload,
          vendorId: formData.vendorId,
        });
        if (res.errFlag !== 0) throw new Error(res.message);
        toast({
          title: "Success",
          description:
            res?.message || `Vendor ${formData.name} updated successfully!`,
        });
      }

      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      console.error("Vendor error:", error);
      const errorMessage =
        error?.message || "Something went wrong. Please try again.";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetches brands and categories for the dropdowns
  const fetchAllApiData = async () => {
    try {
      const [brandsRes, categoriesRes] = await Promise.all([
        axios.get(`${BASE_URL}/brands/get-brands/${token}`),
        axios.get(
          `${BASE_URL}/raw-material-categories/get-categories/${token}`
        ),
      ]);
      setBrands(
        brandsRes.data.map((b: any) => ({
          id: String(b.id),
          name: b.brand_name,
        }))
      );
      setCategories(
        categoriesRes.data.map((c: any) => ({
          id: String(c.id),
          name: c.category_name,
        }))
      );
    } catch (error) {
      console.error("Error fetching dropdown data:", error);
    }
  };

  // Fetch payment terms from the API
  const fetchPaymentTerms = async () => {
    try {
      const response = await axios.get(
        `${BASE_URL}/payment-terms/get-payment-terms/${token}`
      );
      setPaymentTermsOptions(response.data);
    } catch (error) {
      console.error("Error fetching payment terms:", error);
    }
  };

  useEffect(() => {
    if (open) {
      fetchAllApiData();
      fetchPaymentTerms();
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "add" ? "Add New Vendor" : "Edit Vendor"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* --- JSX WITH ERROR DISPLAY --- */}
          {/* Each field now has a <p> tag below it to show the validation error. */}

          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Vendor Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="Enter vendor name"
                />
                {errors.name && (
                  <p className="text-red-500 text-sm">{errors.name}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactPerson">Contact Person *</Label>
                <Input
                  id="contactPerson"
                  value={formData.contactPerson}
                  onChange={(e) =>
                    handleInputChange("contactPerson", e.target.value)
                  }
                  placeholder="Enter contact person name"
                />
                {errors.contactPerson && (
                  <p className="text-red-500 text-sm">{errors.contactPerson}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="Enter email address"
                />
                {errors.email && (
                  <p className="text-red-500 text-sm">{errors.email}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone *</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  maxLength={15}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  placeholder="Enter phone number"
                />
                {errors.phone && (
                  <p className="text-red-500 text-sm">{errors.phone}</p>
                )}
              </div>
              <div className="space-y-2">
                {/* Category/Material Select has its own internal validation display */}
                <CategoryMaterialSelect
                  token={token}
                  baseUrl={BASE_URL}
                  categoriesValue={formData.categories}
                  materialsValue={formData.materials}
                  mode={mode}
                  onChange={(val) => {
                    handleInputChange(
                      "categories",
                      val.categories.map((c: any) =>
                        typeof c === "string" ? c : c.id ?? c.name
                      )
                    );
                    handleInputChange(
                      "materials",
                      val.materials.map((m: any) =>
                        typeof m === "string" ? m : m.id ?? m.name
                      )
                    );
                  }}
                />
                {errors.categories && (
                  <p className="text-red-500 text-sm">{errors.categories}</p>
                )}
                {errors.materials && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.materials}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Address Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Address Information</h3>
            <div className="space-y-2">
              <Label htmlFor="address">Address *</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => handleInputChange("address", e.target.value)}
                placeholder="Enter complete address"
                rows={2}
              />
              {errors.address && (
                <p className="text-red-500 text-sm">{errors.address}</p>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => handleInputChange("city", e.target.value)}
                  placeholder="Enter city"
                />
                {errors.city && (
                  <p className="text-red-500 text-sm">{errors.city}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State *</Label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={(e) => handleInputChange("state", e.target.value)}
                  placeholder="Enter state"
                />
                {errors.state && (
                  <p className="text-red-500 text-sm">{errors.state}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="pincode">Pincode *</Label>
                <Input
                  id="pincode"
                  value={formData.pincode}
                  maxLength={6}
                  onChange={(e) => handleInputChange("pincode", e.target.value)}
                  placeholder="Enter pincode"
                />
                {errors.pincode && (
                  <p className="text-red-500 text-sm">{errors.pincode}</p>
                )}
              </div>
            </div>
          </div>

          {/* Tax & Legal Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Tax & Legal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="gstNumber">GST Number *</Label>
                <Input
                  id="gstNumber"
                  value={formData.gstNumber}
                  onChange={(e) =>
                    handleInputChange("gstNumber", e.target.value.toUpperCase())
                  }
                  placeholder="Enter GST number"
                />
                {errors.gstNumber && (
                  <p className="text-red-500 text-sm">{errors.gstNumber}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="panNumber">PAN Number *</Label>
                <Input
                  id="panNumber"
                  value={formData.panNumber}
                  onChange={(e) =>
                    handleInputChange("panNumber", e.target.value.toUpperCase())
                  }
                  placeholder="Enter PAN number"
                />
                {errors.panNumber && (
                  <p className="text-red-500 text-sm">{errors.panNumber}</p>
                )}
              </div>
            </div>
          </div>

          {/* Banking Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Banking Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bankName">Bank Name *</Label>
                <Input
                  id="bankName"
                  value={formData.bankName}
                  onChange={(e) =>
                    handleInputChange("bankName", e.target.value)
                  }
                  placeholder="Enter bank name"
                />
                {errors.bankName && (
                  <p className="text-red-500 text-sm">{errors.bankName}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="bankAccount">Account Number *</Label>
                <Input
                  id="bankAccount"
                  value={formData.bankAccount}
                  onChange={(e) =>
                    handleInputChange("bankAccount", e.target.value)
                  }
                  placeholder="Enter account number"
                />
                {errors.bankAccount && (
                  <p className="text-red-500 text-sm">{errors.bankAccount}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="ifscCode">IFSC Code *</Label>
                <Input
                  id="ifscCode"
                  value={formData.ifscCode}
                  onChange={(e) =>
                    handleInputChange("ifscCode", e.target.value.toUpperCase())
                  }
                  placeholder="Enter IFSC code"
                />
                {errors.ifscCode && (
                  <p className="text-red-500 text-sm">{errors.ifscCode}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="paymentTerms">Payment Terms *</Label>
                <Select
                  value={formData.paymentTerms}
                  onValueChange={(value) =>
                    handleInputChange("paymentTerms", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment terms" />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentTermsOptions.map((term) => (
                      <SelectItem key={term.id} value={term.term_name}>
                        {term.term_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.paymentTerms && (
                  <p className="text-red-500 text-sm">{errors.paymentTerms}</p>
                )}
              </div>
            </div>
            <div className="space-y-2 md:w-1/2 pr-2">
              <Label htmlFor="creditLimit">Credit Limit *</Label>
              <Input
                id="creditLimit"
                type="number"
                value={formData.creditLimit}
                onChange={(e) =>
                  handleInputChange("creditLimit", e.target.value)
                }
                placeholder="Enter credit limit amount"
              />
              {errors.creditLimit && (
                <p className="text-red-500 text-sm">{errors.creditLimit}</p>
              )}
            </div>
          </div>

          {/* Logo Upload & Notes */}
          <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Logo *</h3>
              <div className="space-y-2">
                <Label htmlFor="logo">Vendor Logo</Label>
                <div className="border-2 border-dashed border-border rounded-lg p-4 text-center">
                  {formData.logo ? (
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4 overflow-hidden">
                        <div className="h-16 w-16 relative rounded-md overflow-hidden border">
                          <img
                            src={
                              typeof formData.logo === "string"
                                ? formData.logo
                                : URL.createObjectURL(formData.logo)
                            }
                            alt="Vendor Logo"
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <span className="text-sm text-muted-foreground truncate max-w-[150px]">
                          {typeof formData.logo === "string"
                            ? "Current Logo"
                            : formData.logo.name}
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleInputChange("logo", null)}
                        className="text-destructive hover:text-destructive/90"
                      >
                        <X className="h-4 w-4" />
                        <span className="sr-only">Remove logo</span>
                      </Button>
                    </div>
                  ) : (
                    <label
                      htmlFor="logoUpload"
                      className="cursor-pointer flex flex-col items-center"
                    >
                      <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                      <span className="text-sm text-muted-foreground">
                        Upload vendor logo
                      </span>
                      <input
                        id="logoUpload"
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
                {errors.logo && (
                  <p className="text-red-500 text-sm">{errors.logo}</p>
                )}
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Notes</h3>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange("notes", e.target.value)}
                placeholder="Additional notes about the vendor..."
                rows={5}
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading
                ? "Saving..."
                : mode === "add"
                  ? "Add Vendor"
                  : "Update Vendor"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddVendorForm;
