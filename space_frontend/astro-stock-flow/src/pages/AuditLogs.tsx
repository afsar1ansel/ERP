// AuditLog.tsx
import { useState, useCallback, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Download } from "lucide-react";
import { Link } from "react-router-dom";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import axios from "axios";
import { BASE_URL } from "@/hooks/baseUrls";
import { AuditLogTable } from "@/components/AuditLog/AuditLogTable";
import { useToast } from "@/hooks/use-toast";

// Interface for a single Audit Log record
interface AuditLog {
  id: number;
  action_type: string;
  admin_id: number;
  admin_username: string;
  created_at: string;
  detail: string;
  event_time: string;
  extra: string | null;
  http_method: string;
  ip_address: string;
  new_value: string | null;
  object_id: string | number | null;
  object_table: string;
  old_value: string | null;
  route: string;
  status: number;
  user_agent: string;
}

// Interface for the full API response
interface AuditLogsResponse {
  data: AuditLog[];
  errFlag: number;
  message: string;
  pagination: {
    current_page: number;
    per_page: number;
    total_pages: number;
    total_records: number;
  };
}

// --- API Calls ---

// GET: Fetch all audit logs with pagination
export const fetchAuditLogs = async ({
  page,
  per_page,
  token,
}: {
  page: number;
  per_page: number;
  token: string;
}): Promise<AuditLogsResponse> => {
  // Use simple string template for URL construction
  const urlString = `${BASE_URL}/auditlogs/get-all-logs/${token}?page=${page}&per_page=${per_page}`;

  const { data } = await axios.get(urlString); // <-- Use urlString directly
  console.log("fetchAuditLogs", data);
  return data;
};

// GET: Download audit logs as CSV
export const downloadAuditLogs = async ({
  startDate,
  endDate,
  token,
}: {
  startDate: string;
  endDate: string;
  token: string;
}) => {
 const urlString = `${BASE_URL}/auditlogs/download-logs/${token}?start_date=${startDate}&end_date=${endDate}`;


  // The responseType must be 'blob' to handle a file download (like CSV)
  const response = await axios.get(urlString, {
    responseType: "blob",
  });

  // Create a link element to trigger the download
  const urlBlob = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement("a");
  link.href = urlBlob;
  link.setAttribute("download", `audit-logs-${startDate}-to-${endDate}.csv`);
  document.body.appendChild(link);
  link.click();
  link.remove();
};

const AuditLogPage = () => {
  const { toast } = useToast();
  const Token = localStorage.getItem("token") || "";

  // State for log data
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  // State for pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20); // Default per_page for API
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // State for CSV download date range (simplified implementation)
  const [csvStartDate, setCsvStartDate] = useState("2025-01-01");
  const [csvEndDate, setCsvEndDate] = useState("2025-12-31");

  const fetchLogData = useCallback(async () => {
    if (!Token) return;
    setLoading(true);
    try {
      const logsData = await fetchAuditLogs({
        page: currentPage,
        per_page: pageSize,
        token: Token,
      });

      console.log(logsData);

      if (logsData.errFlag === 0) {
        setLogs(logsData.data);
        setTotalRecords(logsData.pagination.total_records);
        setTotalPages(logsData.pagination.total_pages);
      } else {
        toast({
          title: "Error fetching logs",
          description: logsData.message || "An unknown error occurred.",
          variant: "destructive",
        });
        setLogs([]);
      }
    } catch (error) {
      console.error("Failed to fetch audit logs:", error);
      toast({
        title: "API Error",
        description: "Could not connect to the audit log service.",
        variant: "destructive",
      });
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, Token, toast]);

  useEffect(() => {
    fetchLogData();
  }, [fetchLogData]);

  const handleDownloadCSV = async () => {
    try {
      await downloadAuditLogs({
        startDate: csvStartDate,
        endDate: csvEndDate,
        token: Token,
      });
      toast({
        title: "Download Initiated",
        description: "Your audit log CSV is downloading.",
      });
    } catch (error) {
      console.error("CSV download failed:", error);
      toast({
        title: "Download Failed",
        description: "Could not download the audit log file.",
        variant: "destructive",
      });
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header and Download Button */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">Audit Log</h1>
            <p className="text-muted-foreground">
              View all administrator activity and system events.
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            {/* Simple Date Range Picker Mock-up */}
            <div className="text-sm text-muted-foreground flex gap-2 items-center">
              <span>
                From:{" "}
                <input
                  type="date"
                  value={csvStartDate}
                  onChange={(e) => setCsvStartDate(e.target.value)}
                  className="border rounded px-1 py-0.5"
                />
              </span>
              <span>
                To:{" "}
                <input
                  type="date"
                  value={csvEndDate}
                  onChange={(e) => setCsvEndDate(e.target.value)}
                  className="border rounded px-1 py-0.5"
                />
              </span>
            </div>

            <Button onClick={handleDownloadCSV} disabled={!Token}>
              <Download className="h-4 w-4 mr-2" />
              Download CSV
            </Button>
          </div>
        </div>

        {/* Audit Log Table Card */}
        <Card>
          <CardHeader>
            <CardTitle>System Activity Logs</CardTitle>
          </CardHeader>
          <CardContent>
            <AuditLogTable
              logs={logs}
              loading={loading}
              currentPage={currentPage}
              pageSize={pageSize}
              totalRecords={totalRecords}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
            />
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default AuditLogPage;
