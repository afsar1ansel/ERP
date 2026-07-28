import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Play, Pause, CheckCircle, Clock, User, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ProductionStage {
  id: string;
  name: string;
  sequence: number;
  status: "pending" | "in_progress" | "completed" | "on_hold";
  progress: number;
  assignedTo: string;
  estimatedHours: number;
  actualHours: number;
  startDate?: string;
  endDate?: string;
  notes: string;
  qualityCheck: boolean;
}

interface ProductionBatch {
  id: string;
  batchNumber: string;
  product: string;
  quantity: number;
  priority: "low" | "normal" | "high" | "critical";
  overallProgress: number;
  stages: ProductionStage[];
}

const mockProductionBatches: ProductionBatch[] = [
  {
    id: "1",
    batchNumber: "PRD-2024-001",
    product: "Professional Laptop Bag",
    quantity: 500,
    priority: "high",
    overallProgress: 60,
    stages: [
      {
        id: "1",
        name: "Material Cutting",
        sequence: 1,
        status: "completed",
        progress: 100,
        assignedTo: "Rajesh Kumar",
        estimatedHours: 8,
        actualHours: 7,
        startDate: "2024-03-10",
        endDate: "2024-03-10",
        notes: "All materials cut according to specifications",
        qualityCheck: true
      },
      {
        id: "2", 
        name: "Stitching & Assembly",
        sequence: 2,
        status: "in_progress",
        progress: 75,
        assignedTo: "Priya Sharma",
        estimatedHours: 16,
        actualHours: 12,
        startDate: "2024-03-11",
        notes: "Progress going well, minor delay due to thread quality issue",
        qualityCheck: false
      },
      {
        id: "3",
        name: "Hardware Installation",
        sequence: 3,
        status: "pending",
        progress: 0,
        assignedTo: "Amit Singh",
        estimatedHours: 6,
        actualHours: 0,
        notes: "",
        qualityCheck: false
      },
      {
        id: "4",
        name: "Quality Control",
        sequence: 4,
        status: "pending",
        progress: 0,
        assignedTo: "Sunita Patel",
        estimatedHours: 4,
        actualHours: 0,
        notes: "",
        qualityCheck: true
      },
      {
        id: "5",
        name: "Final Packaging",
        sequence: 5,
        status: "pending",
        progress: 0,
        assignedTo: "Rahul Verma",
        estimatedHours: 3,
        actualHours: 0,
        notes: "",
        qualityCheck: false
      }
    ]
  },
  {
    id: "2",
    batchNumber: "PRD-2024-002",
    product: "Travel Duffel Bag",
    quantity: 300,
    priority: "critical",
    overallProgress: 25,
    stages: [
      {
        id: "6",
        name: "Material Cutting",
        sequence: 1,
        status: "completed",
        progress: 100,
        assignedTo: "Rajesh Kumar",
        estimatedHours: 6,
        actualHours: 6,
        startDate: "2024-03-12",
        endDate: "2024-03-12",
        notes: "Completed on schedule",
        qualityCheck: true
      },
      {
        id: "7",
        name: "Stitching & Assembly", 
        sequence: 2,
        status: "on_hold",
        progress: 20,
        assignedTo: "Priya Sharma",
        estimatedHours: 12,
        actualHours: 2,
        startDate: "2024-03-13",
        notes: "On hold due to zipper quality issues",
        qualityCheck: false
      }
    ]
  }
];

export function ProductionStagesTable() {
  const { toast } = useToast();
  const [selectedBatch, setSelectedBatch] = useState<ProductionBatch | null>(null);
  const [stageUpdate, setStageUpdate] = useState({
    stageId: "",
    progress: "",
    notes: "",
    actualHours: ""
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed": return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "in_progress": return <Play className="h-4 w-4 text-blue-600" />;
      case "on_hold": return <Pause className="h-4 w-4 text-orange-600" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "default";
      case "in_progress": return "secondary"; 
      case "on_hold": return "destructive";
      default: return "outline";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical": return "destructive";
      case "high": return "secondary";
      case "normal": return "outline";
      default: return "outline";
    }
  };

  const handleStageUpdate = () => {
    console.log("Stage update:", stageUpdate);
    toast({
      title: "Stage Updated",
      description: "Production stage has been updated successfully.",
    });
    setStageUpdate({ stageId: "", progress: "", notes: "", actualHours: "" });
  };

  return (
    <div className="space-y-6">
      {mockProductionBatches.map((batch) => (
        <Card key={batch.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-3">
                  <span>{batch.batchNumber}</span>
                  <Badge variant={getPriorityColor(batch.priority)}>
                    {batch.priority.toUpperCase()}
                  </Badge>
                </CardTitle>
                <p className="text-muted-foreground mt-1">
                  {batch.product} - {batch.quantity} units
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">{batch.overallProgress}%</div>
                <div className="text-sm text-muted-foreground">Overall Progress</div>
              </div>
            </div>
            <Progress value={batch.overallProgress} className="mt-2" />
          </CardHeader>
          
          <CardContent>
            <div className="space-y-4">
              {batch.stages.map((stage, index) => (
                <div key={stage.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-sm font-medium">
                        {stage.sequence}
                      </div>
                      {getStatusIcon(stage.status)}
                      <div>
                        <h4 className="font-medium">{stage.name}</h4>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <User className="h-3 w-3" />
                          {stage.assignedTo}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={getStatusColor(stage.status)}>
                        {stage.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setStageUpdate({
                                stageId: stage.id,
                                progress: stage.progress.toString(),
                                notes: stage.notes,
                                actualHours: stage.actualHours.toString()
                              });
                            }}
                          >
                            Update
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Update Stage: {stage.name}</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="progress">Progress (%)</Label>
                              <Input
                                id="progress"
                                type="number"
                                max="100"
                                value={stageUpdate.progress}
                                onChange={(e) => setStageUpdate(prev => ({ 
                                  ...prev, 
                                  progress: e.target.value 
                                }))}
                              />
                            </div>
                            <div>
                              <Label htmlFor="actualHours">Actual Hours Worked</Label>
                              <Input
                                id="actualHours"
                                type="number"
                                value={stageUpdate.actualHours}
                                onChange={(e) => setStageUpdate(prev => ({ 
                                  ...prev, 
                                  actualHours: e.target.value 
                                }))}
                              />
                            </div>
                            <div>
                              <Label htmlFor="notes">Notes & Comments</Label>
                              <Textarea
                                id="notes"
                                value={stageUpdate.notes}
                                onChange={(e) => setStageUpdate(prev => ({ 
                                  ...prev, 
                                  notes: e.target.value 
                                }))}
                                placeholder="Update notes, issues, or comments..."
                              />
                            </div>
                            <div className="flex justify-end space-x-2">
                              <Button variant="outline">Cancel</Button>
                              <Button onClick={handleStageUpdate}>Update Stage</Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-3">
                    <div>
                      <div className="text-sm text-muted-foreground">Progress</div>
                      <div className="flex items-center gap-2">
                        <Progress value={stage.progress} className="flex-1" />
                        <span className="text-sm font-medium">{stage.progress}%</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Timeline</div>
                      <div className="text-sm">
                        {stage.actualHours}h / {stage.estimatedHours}h
                        {stage.actualHours > stage.estimatedHours && (
                          <AlertCircle className="h-3 w-3 text-orange-500 inline ml-1" />
                        )}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Dates</div>
                      <div className="text-sm">
                        {stage.startDate ? `Started: ${stage.startDate}` : "Not started"}
                        {stage.endDate && <div>Ended: {stage.endDate}</div>}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Quality Check</div>
                      <div className="text-sm">
                        {stage.qualityCheck ? (
                          <Badge variant="outline" className="text-xs">Required</Badge>
                        ) : (
                          <span className="text-muted-foreground">Not required</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {stage.notes && (
                    <div className="text-sm text-muted-foreground bg-muted p-2 rounded">
                      <strong>Notes:</strong> {stage.notes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}