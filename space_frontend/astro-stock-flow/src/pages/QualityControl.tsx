import { useEffect, useState, useMemo } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AddQCRecordForm } from "@/components/quality/AddQCRecordForm";
import { DefectTypesTable } from "@/components/quality/DefectTypesTable";
import { AddDefectTypeForm } from "@/components/quality/AddDefectTypeForm";
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
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  ClipboardCheck,
  Bug,
  ToggleRight,
  ToggleLeft,
  Edit,
  Eye,
} from "lucide-react";
import axios from "axios";
import { BASE_URL } from "@/hooks/baseUrls";
import { get } from "http";

// const qcData = [
//   {
//     id: "QC-2024-089",
//     entityType: "GRN",
//     entityId: "GRN-2024-001",
//     item: "Genuine Leather - Black",
//     inspector: "Rahul Verma",
//     date: "2024-03-15",
//     result: "Pass",
//     remarks: "Quality meets standards"
//   },
//   {
//     id: "QC-2024-090",
//     entityType: "Production",
//     entityId: "PRD-2024-001",
//     item: "Professional Laptop Bag",
//     inspector: "Priya Singh",
//     date: "2024-03-15",
//     result: "Fail",
//     remarks: "Stitching defects found"
//   },
//   {
//     id: "QC-2024-091",
//     entityType: "GRN",
//     entityId: "GRN-2024-002",
//     item: "YKK Zipper - Silver",
//     inspector: "Amit Kumar",
//     date: "2024-03-14",
//     result: "Pending",
//     remarks: "Awaiting inspection"
//   },
//   {
//     id: "QC-2024-092",
//     entityType: "Finished Goods",
//     entityId: "FG-2024-045",
//     item: "Travel Duffel Bag",
//     inspector: "Sunita Sharma",
//     date: "2024-03-14",
//     result: "Pass",
//     remarks: "All parameters within limits"
//   }
// ];

// ✅ Add Quality Control Record
export const addQCRecord = async (data: {
  entityType: string;
  entityId: string;
  itemName: string;
  inspectorName: string;
  testTypeId: string;
  testParameters: string;
  remarks: string;
  result: string;
  qcImage?: File | null;
  token: string;
}) => {
  try {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, value as string | Blob);
      }
    });

    const response = await axios.post(`${BASE_URL}/qc-records/add`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return response.data;
  } catch (error: any) {
    console.error("Error adding QC record:", error);
    throw error;
  }
};

// ✅ Update Quality Control Record
export const updateQCRecord = async (data: {
  qcId: string;
  qcCode: string;
  entityType: string;
  entityId: string;
  itemName: string;
  inspectorName: string;
  testTypeId: string;
  testParameters: string;
  remarks: string;
  result: string;
  qcImage: File | null;
  token: string;
}) => {
  try {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, value as string | Blob);
      }
    });

    const response = await axios.post(
      `${BASE_URL}/qc-records/update`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    return response.data;
  } catch (error: any) {
    console.error("Error updating QC record:", error);
    throw error;
  }
};

// ✅ Get All Quality Control Records
export const getAllQCRecords = async (token: string) => {
  try {
    const response = await axios.get(`${BASE_URL}/qc-records/get-all/${token}`);
    console.log(response.data);

    return response.data;
  } catch (error: any) {
    console.error("Error fetching all QC records:", error);
    throw error;
  }
};

// ✅ Get QC Records by Entity
export const getQCRecordsByEntity = async (
  entityType: string,
  entityId: string,
  token: string
) => {
  try {
    const response = await axios.get(
      `${BASE_URL}/qc-records/get-by-entity/${entityType}/${entityId}/${token}`
    );
    return response.data;
  } catch (error: any) {
    console.error("Error fetching QC records by entity:", error);
    throw error;
  }
};

// ✅ Change QC Record Status
export const changeQCRecordStatus = async (
  qcId: string,
  status: string,
  token: string
) => {
  try {
    const response = await axios.get(
      `${BASE_URL}/qc-records/change-status/${qcId}/${status}/${token}`
    );
    return response.data;
  } catch (error: any) {
    console.error("Error changing QC record status:", error);
    throw error;
  }
};

const QualityControl = () => {
  const [isAddQCDialogOpen, setIsAddQCDialogOpen] = useState(false);
  const [isAddDefectDialogOpen, setIsAddDefectDialogOpen] = useState(false);

  const [qcRecords, setQCRecords] = useState([]);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const token = localStorage.getItem("token");

  const [mods, setMods] = useState<"add" | "edit">("add");
  const [selectedQCRecord, setSelectedQCRecord] = useState(null);
  //  const [isAddDefectDialogOpen, setIsAddDefectDialogOpen] = useState(false);
  const [defectMode, setDefectMode] = useState<"add" | "edit">("add");
  const [editingDefect, setEditingDefect] = useState<any>(null);
  const [allDefect, setAllDefect] = useState<any[]>([]);
  const [searchedQCRecords, setSearchedQCRecords] = useState([]);

  const [searchInput, setSearchInput] = useState("");

  const getAllQCRecordsFetch = async (token) => {
    const res = await getAllQCRecords(token);
    setQCRecords(res);
    console.log(res);
    setIsAddQCDialogOpen(false);
  };

  useEffect(() => {
    getAllQCRecordsFetch(token);
    getAllDefectFetch();
  }, []);

  useEffect(() => {
    const filteredRecords = qcRecords.filter(
      (record: any) =>
        record?.item_name
          ?.toLowerCase()
          ?.includes(searchInput?.toLowerCase()) ||
        record?.inspector_name
          ?.toLowerCase()
          ?.includes(searchInput?.toLowerCase())
    );
    setSearchedQCRecords(filteredRecords);
  }, [searchInput, qcRecords]);

  const getAllDefectFetch = async () => {
    try {
      const res = `${BASE_URL}/defect-types/get-defect-types/${token}`;
      const response = await axios.get(res);
      console.log(response.data);
      setAllDefect(response.data);
    } catch (err) {
      console.log(err);
    }
  };

  const formateDate = (date) => {
    const dateObj = new Date(date);
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, "0");
    const day = String(dateObj.getDate()).padStart(2, "0");

    return `${day}-${month}-${year}`;
  };

  const handleStatusChange = async (qcId, status) => {
    const res = await changeQCRecordStatus(qcId, status, token);
    getAllQCRecordsFetch(token);
  };

  // Helper to check if a date is today
  function isToday(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();
    return (
      date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth() &&
      date.getDate() === now.getDate()
    );
  }

  // Memoize stats so they update when qcRecords changes
  const { pendingInspections, failedItems, quarantinedItems, passRateToday } =
    useMemo(() => {
      const pendingInspections = qcRecords.filter(
        (r: any) => r.result?.toLowerCase() === "pending"
      ).length;

      const failedItems = qcRecords.filter(
        (r: any) => r.result?.toLowerCase() === "failed"
      ).length;

      // If you have a field for quarantined, use it. Otherwise, set to 0 or filter by a custom rule.
      const quarantinedItems = 0; // Placeholder, update if you have a quarantined field

      // Pass Rate (Today) - use updated_at
      const todayRecords = qcRecords.filter(
        (r: any) => r.updated_at && isToday(r.updated_at)
      );
      const passedToday = todayRecords.filter(
        (r: any) => r.result?.toLowerCase() === "pass"
      ).length;
      const totalToday = todayRecords.length;
      const passRateToday =
        totalToday > 0 ? ((passedToday / totalToday) * 100).toFixed(1) : "0.0";

      return {
        pendingInspections,
        failedItems,
        quarantinedItems,
        passRateToday,
      };
    }, [qcRecords]);

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <ClipboardCheck className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Quality Control & Defects
            </h1>
            <p className="text-muted-foreground">
              Manage quality inspections, compliance tracking, and defect
              categories
            </p>
          </div>
        </div>

        {/* Delete Confirmation Dialog */}
        <AlertDialog
          open={deleteConfirmOpen}
          onOpenChange={setDeleteConfirmOpen}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete QC Record</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this QC Record?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  const newStatus = selectedQCRecord.status == 1 ? 0 : 1;
                  handleStatusChange(selectedQCRecord.id, newStatus);
                }}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Tabs defaultValue="qc-records" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="qc-records" className="flex items-center gap-2">
              <ClipboardCheck className="h-4 w-4" />
              QC Records
            </TabsTrigger>
            <TabsTrigger
              value="defect-types"
              className="flex items-center gap-2"
            >
              <Bug className="h-4 w-4" />
              Defect Types
            </TabsTrigger>
          </TabsList>

          <TabsContent value="qc-records" className="space-y-4">
            <div className="flex justify-end">
              <Dialog
                open={isAddQCDialogOpen}
                onOpenChange={setIsAddQCDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button onClick={() => setMods("add")}>
                    <Plus className="h-4 w-4 mr-2" />
                    New QC Record
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl  max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>
                      {mods === "edit" ? "Edit QC Record" : "Add New QC Record"}
                    </DialogTitle>
                  </DialogHeader>
                  <AddQCRecordForm
                    mode={mods}
                    onSuccess={() => getAllQCRecordsFetch(token)}
                    selectedQCRecord={selectedQCRecord}
                    token={token}
                    baseUrl={BASE_URL}
                  />
                </DialogContent>
              </Dialog>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Pending Inspections
                  </CardTitle>
                  <Clock className="h-4 w-4 text-warning" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-warning">
                    {pendingInspections}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Pass Rate (Today)
                  </CardTitle>
                  <CheckCircle className="h-4 w-4 text-success" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-success">
                    {passRateToday}%
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Failed Items
                  </CardTitle>
                  <XCircle className="h-4 w-4 text-destructive" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-destructive">
                    {failedItems}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Quarantined
                  </CardTitle>
                  <AlertTriangle className="h-4 w-4 text-warning" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-warning">
                    {quarantinedItems}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* QC Records Table */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Quality Control Records</CardTitle>
                  <div className="relative max-w-sm">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search QC records..."
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
                      <TableHead>QC ID</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Entity ID</TableHead>
                      <TableHead>Item</TableHead>
                      <TableHead>Inspector</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Result</TableHead>
                      <TableHead>Remarks</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {searchedQCRecords?.map((record) => (
                      <TableRow key={record.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium">
                          {record.qc_code}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{record.entity_type}</Badge>
                        </TableCell>
                        <TableCell>{record.entity_id}</TableCell>
                        <TableCell>{record.item_name}</TableCell>
                        <TableCell>{record.inspector_name}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {formateDate(record.created_at)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              record.result === "Pass"
                                ? "default"
                                : record.result === "failed"
                                ? "destructive"
                                : "secondary"
                            }
                          >
                            <div className="flex items-center gap-1">
                              {record.result === "Pass" && (
                                <CheckCircle className="h-3 w-3" />
                              )}
                              {record.result === "failed" && (
                                <XCircle className="h-3 w-3" />
                              )}
                              {record.result === "pending" && (
                                <Clock className="h-3 w-3" />
                              )}
                              {record.result}
                            </div>
                          </Badge>
                        </TableCell>
                        <TableCell>{record.remarks}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedQCRecord(record);
                              setIsAddQCDialogOpen(true);
                              setMods("edit");
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedQCRecord(record);
                              setDeleteConfirmOpen(true);
                            }}
                          >
                            {record.status == 1 ? (
                              <ToggleRight className="h-4 w-4" />
                            ) : (
                              <ToggleLeft className="h-4 w-4" />
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="defect-types" className="space-y-4">
            <div className="flex justify-end">
              <Dialog
                open={isAddDefectDialogOpen}
                onOpenChange={(open) => {
                  setIsAddDefectDialogOpen(open);
                  if (!open) {
                    // Reset when dialog closes
                    setEditingDefect(null);
                    setDefectMode("add");
                  }
                }}
              >
                <DialogTrigger asChild>
                  <Button
                    onClick={() => {
                      setDefectMode("add");
                      setEditingDefect(null);
                    }}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add New Defect Type
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>
                      {defectMode === "edit"
                        ? "Edit Defect Type"
                        : "Add New Defect Type"}
                    </DialogTitle>
                  </DialogHeader>
                  <AddDefectTypeForm
                    onSuccess={() => {
                      setIsAddDefectDialogOpen(false);
                      setEditingDefect(null);
                      setDefectMode("add");
                      getAllDefectFetch();
                    }}
                    defect={editingDefect}
                  />
                </DialogContent>
              </Dialog>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Defect Types Master</CardTitle>
              </CardHeader>
              <CardContent>
                <DefectTypesTable
                  allDefects={allDefect}
                  onEditDefect={(defect) => {
                    setEditingDefect(defect);
                    setDefectMode("edit");
                    setIsAddDefectDialogOpen(true);
                  }}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default QualityControl;
