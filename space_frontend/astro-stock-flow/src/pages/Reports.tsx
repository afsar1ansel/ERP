// Reports.tsx

import React, { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScheduleReportForm } from "@/components/reports/ScheduleReportForm";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  BarChart3,
  TrendingUp,
  Download,
  Calendar,
  FileText,
  PieChart,
  Activity,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { BASE_URL } from "@/hooks/baseUrls";
import GenerateReportModal from "./GenerateReportModal";

type FileType = "pdf" | "excel" | "csv";

interface ScheduledReport {
  id: string;
  report_name: string;
  report_type: string;
  frequency: string;
  execution_time: string;
  export_format: string;
  recipients: string[];
  status?: string;
  created_at?: string;
  updated_at?: string;
}

const reportTypes = [
  {
    title: "Raw Material Report",
    description: "Current stock of raw materials by location and category",
    icon: BarChart3,
    color: "text-primary",
    lastGenerated: "2024-03-15 09:30 AM",
  },
  {
    title: "Consumption Report",
    description: "Raw material consumption by SKU and date range",
    icon: TrendingUp,
    color: "text-success",
    lastGenerated: "2024-03-15 08:15 AM",
  },
  {
    title: "Finished Goods Report",
    description: "All finished goods manufacturing status and details",
    icon: Activity,
    color: "text-warning",
    lastGenerated: "2024-03-14 05:45 PM",
  },
  {
    title: "Vendor Performance",
    description: "On-time delivery rates and quality metrics",
    icon: Users,
    color: "text-destructive",
    lastGenerated: "2024-03-14 03:20 PM",
  },
  {
    title: "Quality Report",
    description: "Defect rates and inspection results over time",
    icon: PieChart,
    color: "text-primary",
    lastGenerated: "2024-03-13 11:00 AM",
  },
  {
    title: "Material Inward Report",
    description: "Details of all raw material receipts and inspections",
    icon: FileText,
    color: "text-success",
    lastGenerated: "2024-03-13 02:30 PM",
  },
];

const Reports: React.FC = () => {
  const [scheduleFormOpen, setScheduleFormOpen] = useState(false);
  const [generateModalOpen, setGenerateModalOpen] = useState(false);
  const [selectedReportTitle, setSelectedReportTitle] = useState<string | null>(
    null
  );
  const [isvendor, setIsVendor] = useState(false);
  const [editingReport, setEditingReport] = useState<ScheduledReport | null>(
    null
  );
  const [scheduledReports, setScheduledReports] = useState<ScheduledReport[]>(
    []
  );
  const [loading, setLoading] = useState(true);

  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  // Fetch scheduled reports from API
  useEffect(() => {
    fetchScheduledReports();
  }, []);

  async function fetchScheduledReports() {
    try {
      setLoading(true);
      const response = await fetch(`${BASE_URL}/schedule/get-all/${token}`, {
        method: "GET",
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Fetched scheduled reports:", data);

      if (data.errFlag === 0 && data.data) {
        // Transform the API data to match our interface
        const transformedReports: ScheduledReport[] = data.data.map(
          (report: any) => ({
            id: report.id.toString(),
            report_name: report.report_name,
            report_type: report.report_type,
            frequency: report.frequency,
            execution_time: report.execution_time
              .split(":")
              .slice(0, 2)
              .join(":"), // Convert "HH:MM:SS" to "HH:MM"
            export_format: report.export_format,
            recipients: report.recipients,
            status: report.status === 1 ? "Active" : "Paused",
            created_at: report.created_at,
            updated_at: report.updated_at,
          })
        );

        setScheduledReports(transformedReports);
      } else {
        toast.error(data.message || "Failed to fetch scheduled reports");
      }
    } catch (error) {
      console.error("Error fetching scheduled reports:", error);
      toast.error("Failed to load scheduled reports");
    } finally {
      setLoading(false);
    }
  }

  const handleGenerateReport = async (
    reportTitle: string,
    options: { start_date: string; end_date: string; doc_type: FileType }
  ) => {
    toast.success(`Generating ${reportTitle}...`);
    let endpoint = "";
    switch (reportTitle) {
      case "Raw Material Report":
        endpoint = `${BASE_URL}/reports/raw-materials-stock-report`;
        break;
      case "Consumption Report":
        endpoint = `${BASE_URL}/reports/raw-material-consumption-report`;
        break;
      case "Finished Goods Report":
        endpoint = `${BASE_URL}/reports/finished-goods-stock-report`;
        break;
      case "Vendor Performance":
        endpoint = `${BASE_URL}/reports/vendor-performance-report`;
        break;
      case "Quality Report":
        endpoint = `${BASE_URL}/reports/qc-records-report`;
        break;
      case "Material Inward Report":
        endpoint = `${BASE_URL}/reports/material-inward-report`;
        break;
      default:
        endpoint = `${BASE_URL}/reports/generate/${token}`;
        break;
    }

    const form = new FormData();
    if (endpoint.includes("/vendor-performance-report/")) {
      form.append("token", token || "");
    } else {
      form.append("start_date", options.start_date);
      form.append("end_date", options.end_date);
      form.append("token", token || "");
    }

    let docTypeValue = options.doc_type;
    if (options.doc_type === "excel") docTypeValue = "excel";
    form.append("doc_type", docTypeValue);

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        body: form,
      });

      const contentType = response.headers.get("content-type");
      const contentDisposition = response.headers.get("content-disposition");

      if (contentType && contentType.includes("application/json")) {
        const json = await response.json();
        if (json.errFlag === 1) {
          toast.error(json.message || "Error generating report");
          return;
        } else {
          toast.success(json.message || "Report request accepted.");
          return;
        }
      }

      if (
        contentType &&
        (contentType.includes("application/pdf") ||
          contentType.includes("text/csv") ||
          contentType.includes(
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          ))
      ) {
        const blob = await response.blob();

        let filename = `${reportTitle.replace(/\s+/g, "_").toLowerCase()}_${
          options.start_date
        }_to_${options.end_date}`;

        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(
            /filename\*?=(?:UTF-8'')?["']?([^;"']+)["']?/i
          );
          if (filenameMatch && filenameMatch[1]) {
            try {
              filename = decodeURIComponent(filenameMatch[1]);
            } catch {
              filename = filenameMatch[1];
            }
          }
        } else {
          if (options.doc_type === "pdf") filename += ".pdf";
          else if (options.doc_type === "excel") filename += ".xlsx";
          else if (options.doc_type === "csv") filename += ".csv";
        }

        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);

        toast.success("Report downloaded successfully!");
        return;
      }

      const text = await response.text();
      console.warn("Unknown response:", contentType, text);
      toast.error("Unknown response format from server.");
    } catch (err) {
      console.error("Error generating report", err);
      toast.error("Failed to generate report.");
    }
  };

  const openGenerateModalFor = (title: string) => {
    if (title === "Vendor Performance") {
      setIsVendor(true);
    } else {
      setIsVendor(false);
    }
    setSelectedReportTitle(title);
    setGenerateModalOpen(true);
  };

  const handleGenerateFromModal = (options: {
    start_date: string;
    end_date: string;
    doc_type: FileType;
  }) => {
    if (!selectedReportTitle) {
      toast.error("No report selected.");
      return;
    }
    void handleGenerateReport(selectedReportTitle, options);
    setSelectedReportTitle(null);
  };

  const handleEditReport = (report: ScheduledReport) => {
    setEditingReport(report);
    setScheduleFormOpen(true);
  };

  const handleCloseForm = () => {
    setScheduleFormOpen(false);
    setEditingReport(null);
    // Refresh the list after form closes (in case of updates)
    fetchScheduledReports();
  };

  const handleFormSuccess = () => {
    // Refresh the list when form submission is successful
    fetchScheduledReports();
  };


  /* Replace window.confirm with Dialog logic */
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [reportToToggle, setReportToToggle] = useState<ScheduledReport | null>(
    null
  );

  const handleStatusClick = (report: ScheduledReport) => {
    setReportToToggle(report);
    setStatusDialogOpen(true);
  };

  const confirmStatusToggle = async () => {
    if (!reportToToggle) return;

    const newStatus = reportToToggle.status === "Active" ? "Paused" : "Active";
    const statusValue = reportToToggle.status === "Active" ? "0" : "1";

    try {
      const form = new FormData();
      form.append("token", token || "");
      form.append("id", reportToToggle.id);
      form.append("status", statusValue);

      const response = await fetch(`${BASE_URL}/schedule/update-status`, {
        method: "POST",
        body: form,
      });

      const data = await response.json();
      console.log("data", data);

      if (data.errFlag === 0) {
        toast.success(data.message || `Schedule ${newStatus} successfully`);
        fetchScheduledReports();
      } else {
        toast.error(data.message || "Failed to update status");
      }
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update status");
    } finally {
      setStatusDialogOpen(false);
      setReportToToggle(null);
    }
  };

  const formatFrequencyDisplay = (frequency: string, executionTime: string) => {
    const time = executionTime.split(":").slice(0, 2).join(":");
    switch (frequency) {
      case "daily":
        return `Daily at ${time}`;
      case "weekly":
        return `Weekly at ${time}`;
      case "monthly":
        return `Monthly at ${time}`;
      case "quarterly":
        return `Quarterly at ${time}`;
      default:
        return `${frequency} at ${time}`;
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Reports & Analytics
            </h1>
            <p className="text-muted-foreground">
              Generate insights and track performance across your operations
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setScheduleFormOpen(true)}>
              <Calendar className="h-4 w-4 mr-2" />
              Schedule Report
            </Button>
          </div>
        </div>

        {/* Report Types */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reportTypes.map((report, index) => {
            const Icon = report.icon;
            return (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-muted">
                        <Icon className={`h-5 w-5 ${report.color}`} />
                      </div>
                      <div>
                        <CardTitle className="text-base">
                          {report.title}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          {report.description}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex justify-between items-center">
                    <div className="text-xs text-muted-foreground">
                      Last: {report.lastGenerated}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openGenerateModalFor(report.title)}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Generate
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Scheduled Reports */}
        <Card>
          <CardHeader>
            <CardTitle>Scheduled Reports</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <p>Loading scheduled reports...</p>
              </div>
            ) : scheduledReports.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  No scheduled reports found.
                </p>
                <Button
                  onClick={() => setScheduleFormOpen(true)}
                  className="mt-4"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule Your First Report
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {scheduledReports.map((report, index) => (
                  <div
                    key={report.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex-1">
                      <h4 className="font-medium">{report.report_name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {formatFrequencyDisplay(
                          report.frequency,
                          report.execution_time
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Type: {report.report_type} • Format:{" "}
                        {report.export_format.toUpperCase()}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-sm text-muted-foreground">
                        {report.recipients.length} recipient
                        {report.recipients.length !== 1 ? "s" : ""}
                      </div>
                      <Badge
                        onClick={() => handleStatusClick(report)}
                        className="cursor-pointer hover:opacity-80 transition-opacity"
                        variant={
                          report.status === "Active" ? "default" : "secondary"
                        }
                      >
                        {report.status}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditReport(report)}
                      >
                        Edit
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

         {/* Status Toggle Dialog */}
         <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Status Change</DialogTitle>
              <DialogDescription>
                Are you sure you want to{" "}
                {reportToToggle?.status === "Active" ? "Pause" : "Activate"} the
                report "{reportToToggle?.report_name}"?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setStatusDialogOpen(false)}
              >
                No
              </Button>
              <Button onClick={confirmStatusToggle}>Yes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <ScheduleReportForm
          open={scheduleFormOpen}
          onOpenChange={handleCloseForm}
          editData={editingReport}
          token={token || ""}
        />

        {/* Generate modal */}
        <GenerateReportModal
          open={generateModalOpen}
          onOpenChange={(v) => {
            setGenerateModalOpen(v);
            if (!v) setSelectedReportTitle(null);
          }}
          onGenerate={(opts) => handleGenerateFromModal(opts)}
          defaultEnd={undefined}
          defaultStart={undefined}
          isVendor={isvendor}
        />
      </div>
    </MainLayout>
  );
};

export default Reports;
