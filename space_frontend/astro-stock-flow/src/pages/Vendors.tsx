import { useEffect, useRef, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Search,
  Plus,
  Phone,
  Mail,
  Star,
  Package,
  Users,
  TrendingUp,
  Edit,
  ToggleRight,
  ToggleLeft,
  Download,
  Upload,
} from "lucide-react";
import { AddVendorForm } from "@/components/vendors/AddVendorForm";
import axios from "axios";
import { BASE_URL } from "@/hooks/baseUrls";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "react-router-dom";

// ✅ Get all vendors
export const getAllVendors = async (token: string) => {
  const res = await axios.get(`${BASE_URL}/vendors/get-vendors/${token}`);
  return res.data;
};

// ✅ Get vendor details with materials
export const getVendorDetails = async (
  vendorId: string | number,
  token: string
) => {
  const res = await axios.get(
    `${BASE_URL}/vendors/get-vendor-details/${vendorId}/${token}`
  );
  return res.data;
};

// ✅ Add a vendor (with file + raw materials)
export const addVendor = async ({
  vendorName,
  contactPerson,
  email,
  phone,
  brandId,
  address,
  city,
  state,
  pincode,
  gstNo,
  panNo,
  bankName,
  accountNo,
  ifscCode,
  paymentTerms,
  creditLimit,
  notes,
  vendorLogo, // File
  raw_materials, // Array of { raw_material_id: number }
  token,
}: any) => {
  const formData = new FormData();
  formData.append("vendorName", vendorName);
  formData.append("contactPerson", contactPerson);
  formData.append("email", email);
  formData.append("phone", phone);
  formData.append("brandId", brandId);
  formData.append("address", address);
  formData.append("city", city);
  formData.append("state", state);
  formData.append("pincode", pincode);
  formData.append("gstNo", gstNo);
  formData.append("panNo", panNo);
  formData.append("bankName", bankName);
  formData.append("accountNo", accountNo);
  formData.append("ifscCode", ifscCode);
  formData.append("paymentTerms", paymentTerms);
  formData.append("creditLimit", creditLimit);
  formData.append("notes", notes);
  formData.append("token", token);

  console.log(raw_materials, "raw_materials");

  if (vendorLogo) {
    formData.append("vendorLogo", vendorLogo);
  }

  if (raw_materials?.length > 0) {
    formData.append(
      "raw_materials",
      JSON.stringify(
        raw_materials.map((raw_material: any) => {
          return {
            raw_material_id: raw_material,
          };
        })
      )
    );
  }

  const res = await axios.post(`${BASE_URL}/vendors/add-vendor`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

// ✅ Update a vendor
export const updateVendor = async ({
  vendorId,
  vendorName,
  contactPerson,
  email,
  phone,
  brandId,
  address,
  city,
  state,
  pincode,
  gstNo,
  panNo,
  bankName,
  accountNo,
  ifscCode,
  paymentTerms,
  creditLimit,
  notes,
  vendorLogo, // File
  raw_materials, // Array of { raw_material_id: number }
  token,
}: any) => {
  const formData = new FormData();

  formData.append("vendorId", vendorId);
  formData.append("vendorName", vendorName);
  formData.append("contactPerson", contactPerson);
  formData.append("email", email);
  formData.append("phone", phone);
  formData.append("brandId", brandId);
  formData.append("address", address);
  formData.append("city", city);
  formData.append("state", state);
  formData.append("pincode", pincode);
  formData.append("gstNo", gstNo);
  formData.append("panNo", panNo);
  formData.append("bankName", bankName);
  formData.append("accountNo", accountNo);
  formData.append("ifscCode", ifscCode);
  formData.append("paymentTerms", paymentTerms);
  formData.append("creditLimit", creditLimit);
  formData.append("notes", notes);
  formData.append("token", token);


  //  [{ raw_material_id: 101 }, { raw_material_id: 102 }];

  if (vendorLogo) {
    formData.append("vendorLogo", vendorLogo);
  }

  if (raw_materials?.length > 0) {
    formData.append(
      "raw_materials",
      JSON.stringify(
        raw_materials.map((raw_material: any) => {
          return {
            raw_material_id: raw_material,
          };
        })
      )
    );
  }

  console.log(Object.fromEntries(formData));

  const res = await axios.post(`${BASE_URL}/vendors/update-vendor`, formData, {
  });
  console.log(res.data);
  return res.data;
};

// ✅ Change vendor status
export const changeVendorStatus = async (
  vendorId: string | number,
  status: string | number,
  token: string
) => {
  const res = await axios.get(
    `${BASE_URL}/vendors/change-vendor-status/${vendorId}/${status}/${token}`
  );
  return res.data;
};

const Vendors = () => {
  const [vendorData, setVendorData] = useState<any[]>([]);
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [onTimeDelivery, setOnTimeDelivery] = useState(0);

  // modal state
  const [vendorModalOpen, setVendorModalOpen] = useState(false);
  const [vendorMode, setVendorMode] = useState<"add" | "edit">("add");
  const [selectedVendor, setSelectedVendor] = useState<any>(null);

  const token = localStorage.getItem("token") || "";

  const location = useLocation();
  const result = location.state?.result;
  console.log(result)


  useEffect(() => {
    if (!searchInput.trim()) {
      setFilteredData(vendorData);
      return;
    }

    const lowerSearch = searchInput.toLowerCase().trim();
    const filtered = vendorData.filter((item) => {
      const name = item?.vendor_name?.toLowerCase() || "";
      const brand = item?.brand?.toLowerCase() || "";
      return name.includes(lowerSearch) || brand.includes(lowerSearch);
    });
    setFilteredData(filtered);
  }, [searchInput, vendorData]);

  const fetchTheVendors = async () => {
    const res = await getAllVendors(token);
    setVendorData(res);
    if (res && Array.isArray(res) && res.length > 0) {
      const totalOnTimePercentage = res.reduce((sum, vendor) => {
        // Convert on_time_percentage to number (it's already 0 in your data)
        const percentage = Number(vendor.on_time_percentage) || 0;
        return sum + percentage;
      }, 0);

      const averageOnTimePercentage = totalOnTimePercentage / res.length;
      setOnTimeDelivery(Number(averageOnTimePercentage.toFixed(2)));
    } else {
      setOnTimeDelivery(0);
    }

    setFilteredData(res);
  };

  useEffect(() => {
    fetchTheVendors();
  }, []);

  // ✅ Open Add Modal
  const handleAddVendor = () => {
    setVendorMode("add");
    setSelectedVendor(null);
    setVendorModalOpen(true);
  };

  // ✅ Open Edit Modal
  const handleEditVendor = (vendor: any) => {
    setVendorMode("edit");
    setSelectedVendor(vendor);
    setVendorModalOpen(true);
  };

  // ✅ Toggle vendor status
  const handleToggleStatus = async (vendor: any) => {
    const newStatus = vendor.status === 1 ? 0 : 1;
    await changeVendorStatus(vendor.id, newStatus, token);
    fetchTheVendors();
  };

  // Handler functions
  const [isDownloading, setIsDownloading] = useState(false);
  const { toast } = useToast();
  const [isBulkUploadDialogOpen, setIsBulkUploadDialogOpen] = useState(false);

  const handleDownloadTemplate = async () => {
    setIsDownloading(true);
    try {
      const token = localStorage.getItem("token") || "";
      if (!token) {
        // Show user-friendly error
        toast({
          title: "Authentication Error",
          description: "You must be logged in to download the template.",
          variant: "destructive",
        });
        return;
      }

      const response = await fetch(
        `${BASE_URL}/vendors/bulk-upload-template/download/${token}`,
        {
          method: "GET",
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          toast({
            title: "Unauthorized",
            description: "You are not authorized to download this template.",
            variant: "destructive",
          });
          return;
        }
        if (response.status === 404) {
          toast({
            title: "Not Found",
            description: "Template not found.",
            variant: "destructive",
          });
          return;
        }
        throw new Error(`Server error: ${response.status}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;

      // Get filename from header or use default
      const contentDisposition = response.headers.get("Content-Disposition");
      const filename =
        contentDisposition?.match(/filename="?(.+)"?/)?.[1] ||
        "bulk_upload_template.xlsx";

      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading template:", error);
      toast({
        title: "Error",
        description: "Failed to download template. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (file && isValidFileType(file)) {
      setSelectedFile(file);
      console.log("File selected:", file.name);
    } else {
      toast({
        title: "Invalid File",
        description: "Please select a valid Excel or CSV file.",
        variant: "destructive",
      });
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragOver(false);

    const files = event.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (isValidFileType(file)) {
        setSelectedFile(file);
        console.log("File dropped:", file.name);
      } else {
        toast({
          title: "Invalid File",
          description: "Please drop a valid Excel or CSV file.",
          variant: "destructive",
        });
      }
    }
  };

  const isValidFileType = (file) => {
    const validTypes = [
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "text/csv",
      "application/csv",
      "application/vnd.ms-excel.sheet.macroEnabled.12",
    ];
    return (
      validTypes.includes(file.type) ||
      file.name.endsWith(".xlsx") ||
      file.name.endsWith(".xls") ||
      file.name.endsWith(".csv")
    );
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    const token = localStorage.getItem("token") || "";

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("token", token);

    try {
      const response = await fetch(`${BASE_URL}/vendors/bulk-upload`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      console.log(data);

      if (response.ok) {
        if (data.errFlag !== 0) {
          toast({
            title: "Error",
            description: data.message,
            variant: "destructive",
          });
          return;
        }
        toast({
          title: "Success",
          description: "Raw materials uploaded successfully",
        });
        setSelectedFile(null);
        setIsBulkUploadDialogOpen(false);
      } else {
        throw new Error(data.message || "Upload failed");
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      toast({
        title: "Error",
        description: "Failed to upload file. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleClearFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  //auto scroller 
  const rowRefs = useRef<{ [key: number]: HTMLTableRowElement | null }>({});
  const [hasScrolled, setHasScrolled] = useState(false);

  useEffect(() => {
    if (result && vendorData.length > 0 && !hasScrolled) {
      const vendorId = result.id;
      const vendor = vendorData.find((vend) => vend.id === vendorId);

      if (vendor) {
        // Scroll to the row after a short delay to ensure DOM is updated
        setTimeout(() => {
          const rowElement = rowRefs.current[vendorId];
          if (rowElement) {
            rowElement.scrollIntoView({
              behavior: "smooth",
              block: "center",
            });

            // Add highlight effect
            rowElement.classList.add("highlight-search-result");
            setTimeout(() => {
              rowElement.classList.remove("highlight-search-result");
            }, 3000);
          }
        }, 100);

        setHasScrolled(true);
      }
    }
  }, [vendorData, result, hasScrolled]);

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Vendor Management
            </h1>
            <p className="text-muted-foreground">
              Manage supplier relationships and vendor information
            </p>
          </div>
          <div>
            <Button onClick={handleAddVendor}>
              <Plus className="h-4 w-4 mr-2" />
              Add Vendor
            </Button>

            <Dialog
              open={isBulkUploadDialogOpen}
              onOpenChange={setIsBulkUploadDialogOpen}
            >
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Upload className="h-4 w-4 mr-2" />
                  Bulk Upload
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Bulk Stock Upload</DialogTitle>
                </DialogHeader>
                <div className="space-y-6">
                  {/* Download Template Section */}
                  <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg">
                    <Download className="h-8 w-8 mb-2 text-gray-500" />
                    <h3 className="text-lg font-medium">Download Template</h3>
                    <p className="text-sm text-gray-500 text-center mb-4">
                      Download the Excel template with pre-filled headers to
                      fill in your stock data
                    </p>
                    <Button onClick={handleDownloadTemplate} variant="default">
                      <Download className="h-4 w-4 mr-2" />
                      Download Template
                    </Button>
                  </div>

                  {/* Upload Section */}
                  <div
                    className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg transition-colors ${isDragOver
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-300"
                      }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <Upload className="h-8 w-8 mb-2 text-gray-500" />
                    <h3 className="text-lg font-medium">
                      Upload Filled Template
                    </h3>
                    <p className="text-sm text-gray-500 text-center mb-4">
                      Drag and drop your filled Excel file here, or click to
                      browse
                    </p>

                    {/* Show selected file name and clear option */}
                    {selectedFile && (
                      <div className="flex items-center gap-2 mb-3 p-2 bg-green-50 rounded border border-green-200">
                        <span className="text-sm text-green-700 flex-1">
                          Selected: {selectedFile.name}
                        </span>
                        <button
                          onClick={handleClearFile}
                          className="text-red-500 hover:text-red-700 text-sm"
                          type="button"
                        >
                          ✕
                        </button>
                      </div>
                    )}

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".xlsx, .xls, .csv"
                      onChange={handleFileSelect}
                      className="hidden"
                      id="bulk-upload-file"
                    />

                    <div className="flex gap-2 flex-wrap justify-center">
                      <label
                        htmlFor="bulk-upload-file"
                        className="cursor-pointer"
                      >
                        <Button
                          variant="outline"
                          type="button"
                          onClick={() =>
                            document.getElementById("bulk-upload-file").click()
                          }
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          {selectedFile ? "Change File" : "Choose File"}
                        </Button>
                      </label>

                      {/* Upload button that appears after file selection */}
                      {selectedFile && (
                        <>
                          <Button
                            onClick={handleUpload}
                            variant="default"
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            Upload File
                          </Button>

                          {/* Optional: Clear button for better UX */}
                          <Button
                            onClick={handleClearFile}
                            variant="outline"
                            className="text-red-600 border-red-600 hover:bg-red-50"
                          >
                            Clear
                          </Button>
                        </>
                      )}
                    </div>

                    <p className="text-xs text-gray-400 mt-2">
                      Supported formats: .xlsx, .xls, .csv
                    </p>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="h-4 w-4" />
                Total Vendors
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{vendorData.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Package className="h-4 w-4" />
                Active Vendors
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">
                {vendorData.filter((v) => v.status === 1).length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Star className="h-4 w-4" />
                Avg Rating
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                On-Time Delivery
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{onTimeDelivery}%</div>
            </CardContent>
          </Card>
        </div>

        {/* Vendors Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Vendors</CardTitle>
              <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search vendors..."
                  className="pl-10"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  {/* <TableHead>Vendor ID</TableHead> */}
                  <TableHead>Name</TableHead>
                  {/* <TableHead>Brand</TableHead> */}
                  <TableHead>Contact Person</TableHead>
                  <TableHead>Contact Info</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>On-Time %</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData?.map((vendor) => (
                  <TableRow
                    key={vendor.id}
                    className="hover:bg-muted/50"
                    ref={(el) => (rowRefs.current[vendor.id] = el)}
                  >
                    {/* <TableCell className="font-medium">{vendor.id}</TableCell> */}
                    <TableCell>{vendor.vendor_name}</TableCell>
                    {/* <TableCell>
                      <Badge variant="outline">{vendor.brand_name}</Badge>
                    </TableCell> */}
                    <TableCell>{vendor.contact_person}</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-3 w-3" />
                          {vendor.phone}
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="h-3 w-3" />
                          {vendor.email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-current text-warning" />
                        {vendor?.rating}
                      </div>
                    </TableCell>
                    <TableCell>
                      {vendor?.on_time_percentage == 0
                        ? "N/A"
                        : `${vendor?.on_time_percentage}%`}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          vendor.status === 1
                            ? "default"
                            : vendor.status === "Warning"
                              ? "secondary"
                              : "destructive"
                        }
                      >
                        {vendor.status === 1 ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditVendor(vendor)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleStatus(vendor)}
                        >
                          {vendor.status === 1 ? (
                            <ToggleRight className="h-4 w-4" />
                          ) : (
                            <ToggleLeft className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Add/Edit Vendor Modal */}
        <AddVendorForm
          open={vendorModalOpen}
          onOpenChange={setVendorModalOpen}
          mode={vendorMode}
          vendor={selectedVendor}
          onSuccess={() => fetchTheVendors()} // refresh after add/update
        />
      </div>
    </MainLayout>
  );
};

export default Vendors;
