// AuditLogTable.tsx
import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Eye, Loader2 } from "lucide-react";
import { PaginationControls } from "../ui/pagination-controls";
import { formatDateTime } from "@/hooks/DateFormater";

// Re-defining the AuditLog interface for component-level clarity
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

interface AuditLogTableProps {
  logs: AuditLog[];
  loading: boolean;
  currentPage: number;
  pageSize: number;
  totalRecords: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (newPageSize: number) => void;
}

const getActionVariant = (actionType: string) => {
  switch (actionType) {
    case "LOGIN_SUCCESS":
      return "default"; // Use "default" for a major success action
    case "CREATE":
    case "ADD":
      return "success"; // Use "success" for creation
    case "UPDATE":
      // Changed from "warning" to "default" as "warning" is not a valid type
      return "default";
    case "DELETE":
      return "destructive"; // Use "destructive" for removal
    case "PAGE_VIEW":
      return "secondary"; // Use "secondary" for simple viewing actions
    default:
      return "outline";
  }
};

export const AuditLogTable: React.FC<AuditLogTableProps> = ({
  logs,
  loading,
  currentPage,
  pageSize,
  totalRecords,
  totalPages,
  onPageChange,
  onPageSizeChange,
}) => {
  const [viewDetailsOpen, setViewDetailsOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const handleViewDetails = (log: AuditLog) => {
    setSelectedLog(log);
    setViewDetailsOpen(true);
  };

  const getExtraDetails = (
    extra: string | null,
  ): Record<string, any> | string => {
    if (!extra) return "N/A";
    try {
      // Assuming 'extra' is a JSON string
      const parsed = JSON.parse(extra);
      return parsed;
    } catch (e) {
      return extra; // Return as plain string if parsing fails
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="mr-2 h-6 w-6 animate-spin" />
        <span className="text-lg">Loading Audit Logs...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Time</TableHead>
              <TableHead>Admin</TableHead>
              <TableHead>Action Type</TableHead>
              <TableHead>Details</TableHead>
              <TableHead>Target Table</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.length > 0 ? (
              logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="font-medium">
                    {formatDateTime(log.event_time)}
                  </TableCell>
                  <TableCell>{log.admin_username}</TableCell>
                  <TableCell>
                    <Badge variant={getActionVariant(log.action_type)}>
                      {log.action_type}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {log.detail}
                  </TableCell>
                  <TableCell>{log.object_table}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewDetails(log)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No audit logs found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls */}
      <PaginationControls
        currentPage={currentPage}
        totalPages={totalPages}
        pageSize={pageSize}
        totalItems={totalRecords}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
      />

      {/* View Details Dialog */}
      <Dialog open={viewDetailsOpen} onOpenChange={setViewDetailsOpen}>
        <DialogContent className="sm:max-w-md md:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Audit Log Details - ID: {selectedLog?.id}</DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4 py-4 text-sm">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {/* Column 1 */}
                <div className="space-y-1">
                  <p className="font-medium">Event Time</p>
                  <p className="text-muted-foreground">
                    {formatDateTime(selectedLog.event_time)}
                  </p>
                  <p className="font-medium mt-2">Admin User</p>
                  <p className="text-muted-foreground">
                    {selectedLog.admin_username} (ID: {selectedLog.admin_id})
                  </p>
                </div>
                {/* Column 2 */}
                <div className="space-y-1">
                  <p className="font-medium">Action Type</p>
                  <Badge variant={getActionVariant(selectedLog.action_type)}>
                    {selectedLog.action_type}
                  </Badge>
                  <p className="font-medium mt-2">Target Table</p>
                  <p className="text-muted-foreground">
                    {selectedLog.object_table} (ID:{" "}
                    {selectedLog.object_id || "N/A"})
                  </p>
                </div>
                {/* Column 3 */}
                <div className="space-y-1">
                  <p className="font-medium">IP Address</p>
                  <p className="text-muted-foreground">
                    {selectedLog.ip_address}
                  </p>
                  <p className="font-medium mt-2">HTTP Method</p>
                  <p className="text-muted-foreground">
                    {selectedLog.http_method}
                  </p>
                </div>
              </div>

              <div className="space-y-1">
                <p className="font-medium">Detail</p>
                <p className="text-muted-foreground p-2 border rounded bg-gray-50 dark:bg-gray-800">
                  {selectedLog.detail}
                </p>
              </div>

              <div className="space-y-1">
                <p className="font-medium">Route</p>
                <p className="text-muted-foreground p-2 border rounded bg-gray-50 dark:bg-gray-800">
                  {selectedLog.route}
                </p>
              </div>

              {selectedLog.old_value ||
              selectedLog.new_value ||
              selectedLog.extra ? (
                <div className="space-y-1">
                  <p className="font-medium">Value/Extra Data</p>
                  <pre className="text-xs text-muted-foreground whitespace-pre-wrap break-all p-3 border rounded bg-gray-100 dark:bg-gray-900 max-h-40 overflow-auto">
                    {/* Render Old/New Values if present */}
                    {selectedLog.old_value &&
                      `OLD VALUE:\n${selectedLog.old_value}\n\n`}
                    {selectedLog.new_value &&
                      `NEW VALUE:\n${selectedLog.new_value}\n\n`}

                    {/* Render Extra details */}
                    <div className="space-y-1">
                      <p className="font-bold text-xs">EXTRA:</p>
                      {typeof getExtraDetails(selectedLog.extra) ===
                      "string" ? (
                        <p className="text-muted-foreground">
                          {selectedLog.extra || "N/A"}
                        </p>
                      ) : (
                        <p className="text-muted-foreground">
                          {JSON.stringify(
                            getExtraDetails(selectedLog.extra),
                            null,
                            2,
                          )}
                        </p>
                      )}
                    </div>
                  </pre>
                </div>
              ) : null}

              <div className="space-y-1">
                <p className="font-medium">User Agent</p>
                <p className="text-xs text-muted-foreground p-2 border rounded bg-gray-50 dark:bg-gray-800">
                  {selectedLog.user_agent}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
