import { useState, useEffect } from "react";
import axios from "axios";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload, Save, Building2, Mail, Phone, FileText } from "lucide-react";
import { toast } from "sonner";
import { BASE_URL } from "@/hooks/baseUrls";

export default function Settings() {
  // --- FORM STATES ---
  const [companyData, setCompanyData] = useState({
    companyName: "",
    logo: null as File | null | string,
    address: "",
    gstin: "",
    phone: "",
    email: "",
  });

  // --- VALIDATION AND UI STATES ---
  const [errors, setErrors] = useState({
    companyName: "",
    logo: "",
    address: "",
    gstin: "",
    phone: "",
    email: "",
  });
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const token = localStorage.getItem("token");

  // Fetch company info on component mount
  useEffect(() => {
    const fetchCompanyInfo = async () => {
      if (!token) return;
      try {
        const res = await axios.get(`${BASE_URL}/company-info/get/${token}`);
        const data = res.data;
        setCompanyData({
          companyName: data.company_name || "",
          logo: data.logo_url || null,
          address: data.address || "",
          gstin: data.gstin || "",
          phone: data.phone || "",
          email: data.email || "",
        });
        if (data.logo_url) setPreviewUrl(data.logo_url);
      } catch (error) {
        console.error(error);
        toast.error("Failed to fetch company info");
      }
    };
    fetchCompanyInfo();
  }, [token]);

  // --- VALIDATION LOGIC WITH REGEX ---
  const validate = () => {
    const newErrors = {
      companyName: "",
      logo: "",
      address: "",
      gstin: "",
      phone: "",
      email: "",
    };

    if (!/^[A-Za-z0-9\s.,&-]{3,}$/.test(companyData.companyName))
      newErrors.companyName = "Company name must be at least 3 characters.";
    if (!companyData.logo) newErrors.logo = "Company logo is required.";
    if (!/^.{15,}$/.test(companyData.address.trim()))
      newErrors.address = "Address must be at least 15 characters long.";
    // Indian GSTIN format validation
    if (
      !/^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}Z[A-Z\d]{1}$/.test(
        companyData.gstin
      )
    )
      newErrors.gstin = "Enter a valid 15-character GSTIN.";
    // 10-digit Indian mobile number validation
    if (!/^[6-9]\d{9}$/.test(companyData.phone))
      newErrors.phone = "Enter a valid 10-digit mobile number.";
    // Standard email format validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(companyData.email))
      newErrors.email = "Enter a valid email address.";

    setErrors(newErrors);
    return Object.values(newErrors).every((error) => error === "");
  };

  // --- HANDLERS ---
  const handleInputChange = (field: string, value: string) => {
    const processedValue = field === "gstin" ? value.toUpperCase() : value;
    setCompanyData((prev) => ({ ...prev, [field]: processedValue }));
    if (errors[field as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [field as keyof typeof errors]: "" }));
    }
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024)
        return toast.error("Logo file size must be less than 5MB.");
      if (!file.type.startsWith("image/"))
        return toast.error("Please upload a valid image file.");

      setCompanyData((prev) => ({ ...prev, logo: file }));
      setPreviewUrl(URL.createObjectURL(file));
      if (errors.logo) setErrors((prev) => ({ ...prev, logo: "" }));
    }
  };

  const handleSave = async () => {
    if (!validate()) {
      toast.error("Please correct the errors before saving.");
      return;
    }
    if (!token) return toast.error("Authentication token missing");

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("companyName", companyData.companyName);
      formData.append("gstin", companyData.gstin);
      formData.append("phone", companyData.phone);
      formData.append("email", companyData.email);
      formData.append("address", companyData.address);
      formData.append("token", token);

      if (companyData.logo instanceof File) {
        formData.append("companyLogo", companyData.logo);
      }

      await axios.post(`${BASE_URL}/company-info/upsert`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Company settings saved successfully!");
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to save settings.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Manage your company information and preferences
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" /> Company Logo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col items-center gap-4">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Logo preview"
                    className="h-24 w-24 object-contain rounded-lg border"
                  />
                ) : (
                  <div className="h-24 w-24 border-2 border-dashed rounded-lg flex items-center justify-center">
                    <Upload className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
                <div className="flex flex-col items-center gap-2">
                  <Label htmlFor="logo-upload" className="cursor-pointer">
                    <div className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
                      <Upload className="h-4 w-4" /> Upload Logo
                    </div>
                  </Label>
                  <input
                    id="logo-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                  <p className="text-xs text-muted-foreground text-center">
                    PNG, JPG up to 5MB
                  </p>
                </div>
              </div>
              {errors.logo && (
                <p className="text-red-500 text-sm text-center">
                  {errors.logo}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" /> Company Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="company-name">Company Name *</Label>
                <Input
                  id="company-name"
                  value={companyData.companyName}
                  onChange={(e) =>
                    handleInputChange("companyName", e.target.value)
                  }
                  placeholder="Enter company name"
                />
                {errors.companyName && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.companyName}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="gstin" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" /> GSTIN *
                </Label>
                <Input
                  id="gstin"
                  value={companyData.gstin}
                  maxLength={15}
                  onChange={(e) => handleInputChange("gstin", e.target.value)}
                  placeholder="Enter 15-digit GSTIN"
                />
                {errors.gstin && (
                  <p className="text-red-500 text-sm mt-1">{errors.gstin}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" /> Phone Number *
                </Label>
                <Input
                  id="phone"
                  value={companyData.phone}
                  maxLength={10}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  placeholder="Enter 10-digit mobile number"
                />
                {errors.phone && (
                  <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" /> Email Address *
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={companyData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="Enter email address"
                />
                {errors.email && (
                  <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" /> Company Address *
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="address">Complete Address</Label>
                <Textarea
                  id="address"
                  value={companyData.address}
                  onChange={(e) => handleInputChange("address", e.target.value)}
                  placeholder="Enter complete address including city, state, and pincode"
                  rows={4}
                />
                {errors.address && (
                  <p className="text-red-500 text-sm mt-1">{errors.address}</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-center">
          <Button
            onClick={handleSave}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            {loading ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </div>
    </MainLayout>
  );
}
