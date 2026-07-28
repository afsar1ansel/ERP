import { useEffect, useRef, useState } from "react";
import { Plus, Users, Building2, Phone, Mail, Upload, Download } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClientsTable } from "@/components/clients/ClientsTable";
import { AddClientForm } from "@/components/clients/AddClientForm";
import { BASE_URL } from "@/hooks/baseUrls";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { BASE_URL as API_BASE } from "@/hooks/baseUrls";


export default function Clients() {
  const [addClientOpen, setAddClientOpen] = useState(false);
  const [clients, setClients] = useState([]);
  const [clientStats, setClientStats] = useState([
    { title: "Total Clients", value: "0", icon: Users, color: "text-blue-600" },
    {
      title: "Active Clients",
      value: "0",
      icon: Building2,
      color: "text-green-600",
    },
    {
      title: "New This Month",
      value: "0",
      icon: Phone,
      color: "text-purple-600",
    },
    // {
    //   title: "Pending Follow-ups",
    //   value: "0", 
    //   icon: Mail,
    //   color: "text-orange-600",
    // },
  ]);
    const [isBulkUploadDialogOpen, setIsBulkUploadDialogOpen] = useState(false);

  const fetchClients = async () => {
    const Token = localStorage.getItem("token");
    if (!Token) return;
    try {
      const response = await fetch(`${BASE_URL}/clients/get-all/${Token}`);
      const data = await response.json();
      const formattedClients = data.map((apiClient: any) => ({
        id: apiClient.id,
        name: apiClient.client_name?.trim() || "N/A",
        contactPerson: apiClient.contact_person?.trim() || "N/A",
        email: apiClient.email?.trim() || "N/A",
        phone: apiClient.phone?.trim() || "N/A",
        type:
          apiClient.client_type?.trim().toLowerCase() === "corporate"
            ? "business"
            : "individual",
        status: apiClient.status, // keep as number for stats
        city: apiClient.billing_addr_city?.trim() || "N/A",
        totalOrders: apiClient.total_orders ?? 0,
        outstanding: apiClient.Outstanding ?? 0,
        creditLimit: parseFloat(apiClient.credit_limit) || 0,
        totalValue: apiClient.total_value ?? 0,
        lastOrder: apiClient.last_order ?? "",
        created_at: apiClient.created_at,
        ...apiClient,
      }));
      setClients(formattedClients);

      // --- Calculate stats ---
      const totalClients = formattedClients.length;
      const activeClients = formattedClients.filter(
        (c) => c.status === 1
      ).length;
      const now = new Date();
      const newThisMonth = formattedClients.filter((c) => {
        if (!c.created_at) return false;
        const created = new Date(c.created_at);
        return (
          created.getFullYear() === now.getFullYear() &&
          created.getMonth() === now.getMonth()
        );
      }).length;

      setClientStats([
        {
          title: "Total Clients",
          value: totalClients.toString(),
          icon: Users,
          color: "text-blue-600",
        },
        {
          title: "Active Clients",
          value: activeClients.toString(),
          icon: Building2,
          color: "text-green-600",
        },
        {
          title: "New This Month",
          value: newThisMonth.toString(),
          icon: Phone,
          color: "text-purple-600",
        },
        // {
        //   title: "Pending Follow-ups",
        //   value: "0",
        //   icon: Mail,
        //   color: "text-orange-600",
        // },
      ]);
    } catch (error) {
      console.error("Error fetching clients:", error);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);


   // Handler functions
    const [isDownloading, setIsDownloading] = useState(false);
      const { toast } = useToast();
  
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
          `${API_BASE}/clients/bulk-upload-template/download/${token}`,
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
      const response = await fetch(`${API_BASE}/clients/bulk-upload`, {
        method: "POST",
        body: formData,
      });
  
      const data = await response.json();
      console.log(data);
  
      if (response.ok) {
  
        if(data.errFlag !== 0){
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




  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Clients</h1>
            <p className="text-muted-foreground">
              Manage your customer relationships
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={() => setAddClientOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Client
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

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clientStats.map((stat, index) => (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Clients Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Clients</CardTitle>
          </CardHeader>
          <CardContent>
            <ClientsTable clients={clients} fetchClients={fetchClients} />
          </CardContent>
        </Card>

        {/* Add Client Form */}
        <AddClientForm
          open={addClientOpen}
          onOpenChange={setAddClientOpen}
          fetchClients={fetchClients}
        />
      </div>
    </MainLayout>
  );
}
