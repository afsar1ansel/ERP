import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { MainLayout } from "@/components/layout/MainLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  Factory, 
  Calendar, 
  Package, 
  RefreshCcw,
  MessageSquare,
  ChevronRight,
  Building2
} from "lucide-react";
import { BASE_URL } from "@/hooks/baseUrls";
import axios from "axios";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface BillOfMaterial {
  material_code: string;
  material_name: string;
  quantity: string;
  total_required: string;
  unit: string;
}

interface AssignedStage {
  batch_id: number;
  batch_stage_id: number;
  batch_status: string;
  completed_qty: string;
  expected_completion_date: string;
  floor: number;
  order_id: number | null;
  planned_qty: string;
  product_name: string;
  production_code: string;
  stage_name: string;
  stage_status: string;
  bill_of_materials?: BillOfMaterial[];
}

export default function EmployeeTask() {
  const [stages, setStages] = useState<AssignedStage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const username = localStorage.getItem("username");
  const token = localStorage.getItem("token");
  const { toast } = useToast();

  // Dialog State
  const [selectedStage, setSelectedStage] = useState<AssignedStage | null>(null);
  const [stageNotes, setStageNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchAssignedStages = async (silent = false) => {
    if (!token) return;
    if (!silent) setIsLoading(true);
    try {
      const response = await axios.get(`${BASE_URL}/employees/assigned-stages/${token}`);
      if (response.data.errFlag === 0) {
        const fetchedStages = response.data.stages || [];
        // Sort: incomplete first, completed at last
        const sortedStages = [...fetchedStages].sort((a: AssignedStage, b: AssignedStage) => {
          const statusA = a.stage_status?.toLowerCase();
          const statusB = b.stage_status?.toLowerCase();
          const isDoneA = statusA === 'completed' || statusA === 'complete' || statusA === 'done';
          const isDoneB = statusB === 'completed' || statusB === 'complete' || statusB === 'done';
          
          if (isDoneA && !isDoneB) return 1;
          if (!isDoneA && isDoneB) return -1;
          return 0;
        });
        setStages(sortedStages);
      } else {
        toast({
          title: "Error",
          description: response.data.message || "Failed to fetch tasks.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching stages:", error);
      toast({
        title: "Error",
        description: "Could not connect to the server.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAssignedStages();
  }, []);

  const handleUpdateProgress = async (status: string = "complete") => {
    if (!selectedStage || !token) return;

    setIsSubmitting(true);
    const formData = new FormData();
    formData.append("batchStageId", selectedStage.batch_stage_id.toString());
    formData.append("status", status);
    formData.append("notes", stageNotes);
    formData.append("token", token);

    try {
      const response = await axios.post(`${BASE_URL}/production-batches/update-stage-progress`, formData);
      if (response.data.errFlag === 0) {
        toast({
          title: "Success",
          description: status === "in-progress" ? "Task started!" : "Task marked as completed!",
        });
        setSelectedStage(null);
        setStageNotes("");
        fetchAssignedStages(true); // Silent refresh
      } else {
        toast({
          title: "Error",
          description: response.data.message || "Failed to update task.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error updating progress:", error);
      toast({
        title: "Error",
        description: "Failed to update progress.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    const s = status?.toLowerCase();
    switch (s) {
      case "completed":
      case "complete":
      case "done":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "in_progress":
      case "in-progress":
      case "inprogress":
      case "active":
        return <Factory className="h-4 w-4 text-blue-600" />;
      case "on_hold":
      case "hold":
        return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const s = status?.toLowerCase();
    switch (s) {
      case "completed":
      case "complete":
      case "done":
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-green-200">Done</Badge>;
      case "in_progress":
      case "in-progress":
      case "inprogress":
      case "active":
        return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200">Active</Badge>;
      case "on_hold":
      case "hold":
        return <Badge variant="destructive">Hold</Badge>;
      case "pending":
      case "scheduled":
        return <Badge variant="outline" className="text-gray-500">Pending</Badge>;
      default:
        return <Badge variant="outline" className="text-gray-500">{status || "Pending"}</Badge>;
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">My Tasks</h1>
            <p className="text-muted-foreground mt-1">
              Welcome back, <span className="font-semibold text-foreground">{username}</span>. Manage your assigned production stages.
            </p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => {
              setIsRefreshing(true);
              fetchAssignedStages();
            }}
            disabled={isLoading || isRefreshing}
          >
            <RefreshCcw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="animate-pulse">
                <div className="h-64 bg-muted rounded-lg"></div>
              </Card>
            ))}
          </div>
        ) : stages.length === 0 ? (
          <Card className="border-dashed py-12">
            <CardContent className="flex flex-col items-center justify-center text-center space-y-3">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                <Clock className="h-6 w-6 text-muted-foreground" />
              </div>
              <div className="space-y-1">
                <p className="text-lg font-medium">No tasks assigned</p>
                <p className="text-sm text-muted-foreground">
                  You don't have any production stages assigned to you at the moment.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {stages.map((stage) => (
              <Card key={stage.batch_stage_id} className="overflow-hidden hover:shadow-lg transition-all duration-200 border-l-4 border-l-primary shadow-sm flex flex-col h-full">
                <CardHeader className="pb-3 bg-muted/20">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="font-mono text-[10px] tracking-wider uppercase border-primary/20 text-primary">
                        {stage.production_code}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground font-bold flex items-center gap-1 uppercase tracking-widest">
                        <Building2 className="h-3 w-3" />
                        Floor {stage.floor}
                      </span>
                    </div>
                    <CardTitle className="text-lg font-bold tracking-tight leading-snug line-clamp-2">
                      {stage.product_name}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-4 space-y-6 flex-grow flex flex-col">
                  {/* Status & Stage Info */}
                  <div className="flex items-center justify-between p-3 bg-indigo-50/50 rounded-lg border border-indigo-100">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center shadow-sm border border-indigo-100 text-indigo-600">
                        {getStatusIcon(stage.stage_status)}
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold text-indigo-600/60 tracking-wider">Current Stage</p>
                        <p className="text-lg font-black text-indigo-600 leading-none uppercase">{stage.stage_name}</p>
                      </div>
                    </div>
                    {getStatusBadge(stage.stage_status)}
                  </div>

                  {/* Task Details Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1 p-3 bg-muted/30 rounded-lg border border-muted-foreground/10">
                      <p className="text-muted-foreground font-bold text-[10px] uppercase tracking-wider flex items-center gap-2">
                         <Calendar className="h-3 w-3" />
                         Due Date
                      </p>
                      <div className="text-sm font-bold">
                        {formatDate(stage.expected_completion_date)}
                      </div>
                    </div>
                    <div className="space-y-1 p-3 bg-muted/30 rounded-lg border border-muted-foreground/10">
                      <p className="text-muted-foreground font-bold text-[10px] uppercase tracking-wider flex items-center gap-2">
                         <Package className="h-3 w-3" />
                         Quantity
                      </p>
                      <div className="text-sm font-bold">
                        {Math.round(parseFloat(stage.planned_qty))} <span className="text-[10px] font-medium text-muted-foreground">units</span>
                      </div>
                    </div>
                  </div>



                  {/* Materials Section - Scrollable Table */}
                  {stage.bill_of_materials && stage.bill_of_materials.length > 0 && (
                    <div className="space-y-2 mt-2 flex-grow">
                      <div className="flex items-center gap-2 text-muted-foreground/80 mb-2 px-1">
                        <AlertTriangle className="h-3 w-3" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Required Components</span>
                      </div>
                      <div className="bg-white rounded-lg shadow-sm border border-muted-foreground/10 overflow-hidden">
                        <div className="max-h-[200px] overflow-y-auto">
                          <table className="w-full text-xs text-left">
                            <thead className="bg-muted/50 text-[9px] uppercase tracking-wider font-bold text-muted-foreground sticky top-0">
                              <tr>
                                <th className="px-3 py-2 border-b">Material</th>
                                <th className="px-3 py-2 border-b text-right">Required</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-muted-foreground/10">
                              {stage.bill_of_materials.map((item, idx) => (
                                <tr key={idx} className="hover:bg-primary/[0.02] transition-colors">
                                  <td className="px-3 py-2 font-medium text-foreground/80 leading-tight">
                                    {item.material_name}
                                  </td>
                                  <td className="px-3 py-2 text-right whitespace-nowrap">
                                    <span className="px-2 py-0.5 rounded bg-muted font-bold text-[10px]">
                                      {parseFloat(item.total_required).toFixed(2)} {item.unit}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="pt-4 mt-auto">
                    {(stage.stage_status?.toLowerCase() === 'completed' || stage.stage_status?.toLowerCase() === 'done' || stage.stage_status?.toLowerCase() === 'complete') ? (
                      <Button 
                        className="w-full h-12 text-sm font-bold uppercase tracking-wider group shadow-sm bg-green-50 text-green-700 border-green-200 hover:bg-green-100" 
                        variant="outline"
                        disabled
                      >
                        <span className="flex items-center gap-2">
                          <CheckCircle className="h-5 w-5" />
                          Done
                        </span>
                      </Button>
                    ) : (stage.stage_status?.toLowerCase() === 'pending' || stage.stage_status?.toLowerCase() === 'scheduled') ? (
                      <Button 
                        className="w-full h-12 text-sm font-bold uppercase tracking-wider group shadow-sm" 
                        onClick={() => setSelectedStage(stage)}
                        disabled={isLoading || isRefreshing}
                      >
                        <span className="flex items-center gap-2">
                          Start Working
                          <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </span>
                      </Button>
                    ) : (
                      <Button 
                        className="w-full h-12 text-sm font-bold uppercase tracking-wider group shadow-sm" 
                        onClick={() => setSelectedStage(stage)}
                      >
                        <span className="flex items-center gap-2">
                          Mark as Complete
                          <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </span>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Completion Dialog */}
        <Dialog open={!!selectedStage} onOpenChange={(open) => !open && setSelectedStage(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {["pending", "scheduled"].includes(selectedStage?.stage_status?.toLowerCase()) ? (
                  <>
                    <Clock className="h-5 w-5 text-blue-600" />
                    Start Stage: {selectedStage?.stage_name}
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    Complete Stage: {selectedStage?.stage_name}
                  </>
                )}
              </DialogTitle>
              <CardDescription>
                {["pending", "scheduled"].includes(selectedStage?.stage_status?.toLowerCase()) 
                  ? "Are you ready to start working on this stage?"
                  : "Confirm that you have finished the work for this stage."}
              </CardDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="p-4 bg-muted/50 rounded-lg space-y-2 text-sm">
                <p><span className="font-semibold">Batch:</span> {selectedStage?.production_code}</p>
                <p><span className="font-semibold">Product:</span> {selectedStage?.product_name}</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Notes (Optional)
                </label>
                <Input
                  placeholder="e.g., Finished all units on time"
                  value={stageNotes}
                  onChange={(e) => setStageNotes(e.target.value)}
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button 
                  variant="outline" 
                  className="flex-1" 
                  onClick={() => setSelectedStage(null)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button 
                  className="flex-1" 
                  onClick={() => handleUpdateProgress(
                    ["pending", "scheduled"].includes(selectedStage?.stage_status?.toLowerCase()) 
                      ? "in-progress" 
                      : "complete"
                  )}
                  disabled={isSubmitting}
                >
                   {isSubmitting ? "Updating..." : (
                     ["pending", "scheduled"].includes(selectedStage?.stage_status?.toLowerCase()) 
                       ? "Start Working" 
                       : "Mark as Complete"
                   )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
