import { useRef, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Plus, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { ProductSKUsTable } from "@/components/masters/ProductSKUsTable";
import { ProductSKUForm } from "@/components/forms/ProductSKUForm";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Download, Upload, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";
import { BASE_URL } from "@/hooks/baseUrls";
import { Input } from "@/components/ui/input";
// import { BASE_URL as API_BASE } from "@/hooks/baseUrls";

export const getAllProductSKUs = async (token: string) => {
  const { data } = await axios.get(`${BASE_URL}/product-skus/get-all/${token}`);
  console.log(data);
  return data;
};
export const changeProductStatus = async (
  productId: number,
  status: number,
  token: string,
) => {
  const { data } = await axios.get(
    `${BASE_URL}/product-skus/change-status/${productId}/${status}/${token}`,
  );
  return data;
};

// Function to add a new product SKU with raw materials

export async function addProductSku({
  productName,
  brandId,
  productCategoryId,
  productDescription,
  productImage, // should be a File or Blob if uploading
  rawMaterials,
  labourFreightCharge,
  token,
}) {
  try {
    const formData = new FormData();
    formData.append("productName", productName);
    formData.append("brandId", brandId);
    formData.append("productCategoryId", productCategoryId);
    formData.append("productDescription", productDescription);
    formData.append("labourFreightCharge", labourFreightCharge.toString());
    formData.append("token", token);

    if (productImage) {
      formData.append("productImage", productImage); // file input
    }

    // stringify array of objects
    formData.append("rawMaterials", JSON.stringify(rawMaterials));

    const response = await axios.post(
      `${BASE_URL}/product-skus/add`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );

    return response.data;
  } catch (error) {
    console.error("Error adding product SKU:", error);
    throw error.response?.data || error.message;
  }
}
export async function updateProductSku({
  productName,
  brandId,
  productCategoryId,
  productDescription,
  productImage, // should be a File or Blob if uploading
  rawMaterials,
  labourFreightCharge,
  token,
  productId,
}) {
  try {
    const formData = new FormData();
    formData.append("productName", productName);
    formData.append("brandId", brandId);
    formData.append("productCategoryId", productCategoryId);
    formData.append("productDescription", productDescription);
    formData.append("labourFreightCharge", labourFreightCharge.toString());
    formData.append("token", token);
    formData.append("productId", productId.toString());

    if (productImage) {
      formData.append("productImage", productImage); // file input
    }

    // stringify array of objects
    formData.append("rawMaterials", JSON.stringify(rawMaterials));

    const response = await axios.post(
      `${BASE_URL}/product-skus/update`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );

    return response.data;
  } catch (error) {
    console.error("Error adding product SKU:", error);
    throw error.response?.data || error.message;
  }
}

interface RawMaterial {
  material_name: string;
  quantity: number;
  unit: string;
}

interface ProductSKU {
  id: number;
  product_name: string;
  product_description: string;
  product_image: string;
  product_image_public_id: string;
  status: number;

  brand_id: number;
  brand_name: string;

  product_category_id: number;
  product_category_name: string;
  product_category_brand: string;
  rawMaterials?: RawMaterial[];
  min_stock_level: number;
  labour_freight_charge?: number;

  created_admin_id: number;
  updated_admin_id: number;
  created_at: string; // ISO date string
  updated_at: string; // ISO date string
}

const MasterProductSKUs = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [mockProductSKUs, setMockProductSKUs] = useState<ProductSKU[]>([]);
  const [searchQuery, setSearchQuery] = useState(""); // Add search query state
  const [isBulkUploadDialogOpen, setIsBulkUploadDialogOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const { toast } = useToast();

  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);
  const token = localStorage.getItem("token") || "";

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
        `${BASE_URL}/product-skus/download-template/${token}`,
        {
          method: "GET",
        },
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

    const formData = new FormData();
    formData.append("excelFile", selectedFile);
    formData.append("token", token);

    try {
      const response = await fetch(`${BASE_URL}/product-skus/bulk-upload`, {
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

  // Filter products based on search query
  const filteredProductSKUs = mockProductSKUs.filter((product) =>
    product.product_name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link to="/master">Master Data</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbPage>Product SKUs</BreadcrumbPage>
              </BreadcrumbList>
            </Breadcrumb>
            <div className="flex items-center gap-2">
              <Link to="/master">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Master Data
                </Button>
              </Link>
            </div>
            <h1 className="text-3xl font-bold">Product SKU Management</h1>
            <p className="text-muted-foreground">
              Manage your product SKUs and their raw material requirements
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button onClick={() => setIsFormOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Product SKU
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
                  <DialogTitle>Bulk SKU Upload</DialogTitle>
                </DialogHeader>
                <div className="space-y-6">
                  {/* Download Template Section */}
                  <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg">
                    <Download className="h-8 w-8 mb-2 text-gray-500" />
                    <h3 className="text-lg font-medium">Download Template</h3>
                    <p className="text-sm text-gray-500 text-center mb-4">
                      Download the Excel template with pre-filled headers to
                      fill in your SKU data
                    </p>
                    <Button onClick={handleDownloadTemplate} variant="default">
                      <Download className="h-4 w-4 mr-2" />
                      Download Template
                    </Button>
                  </div>

                  {/* Upload Section */}
                  <div
                    className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg transition-colors ${
                      isDragOver
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

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Product SKUs</CardTitle>
                <CardDescription>
                  View and manage all your product SKUs with their raw materials
                </CardDescription>
              </div>
              <div className="relative w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ProductSKUsTable
              mockProductSKUs={filteredProductSKUs} // Pass filtered data
              setMockProductSKUs={setMockProductSKUs}
            />
          </CardContent>
        </Card>

        <ProductSKUForm
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
          setMockProductSKUs={setMockProductSKUs}
        />
      </div>
    </MainLayout>
  );
};

export default MasterProductSKUs;
