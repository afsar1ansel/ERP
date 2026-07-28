import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, Clock, User, Calendar, ArrowUp } from "lucide-react";

interface CriticalOrder {
  id: string;
  batchNumber: string;
  product: string;
  customer: string;
  quantity: number;
  dueDate: string;
  progress: number;
  assignedHead: string;
  daysLeft: number;
  blockers: string[];
  escalated: boolean;
}

const mockCriticalOrders: CriticalOrder[] = [
  {
    id: "1",
    batchNumber: "PRD-2024-005",
    product: "Executive Briefcase Premium",
    customer: "Corporate Solutions Ltd.",
    quantity: 150,
    dueDate: "2024-03-25",
    progress: 45,
    assignedHead: "Priya Sharma",
    daysLeft: 3,
    blockers: ["Leather quality issue", "Zipper supplier delay"],
    escalated: true
  },
  {
    id: "2",
    batchNumber: "PRD-2024-006",
    product: "Travel Duffel Bag Elite",
    customer: "Tourism Board",
    quantity: 500,
    dueDate: "2024-03-28",
    progress: 20,
    assignedHead: "Rajesh Kumar",
    daysLeft: 6,
    blockers: ["Raw material shortage"],
    escalated: false
  },
  {
    id: "3",
    batchNumber: "PRD-2024-007", 
    product: "Professional Laptop Bag",
    customer: "Tech Solutions Inc.",
    quantity: 75,
    dueDate: "2024-03-30",
    progress: 80,
    assignedHead: "Amit Singh",
    daysLeft: 8,
    blockers: [],
    escalated: false
  }
];

export function CriticalOrdersCard() {
  const getDaysLeftColor = (days: number) => {
    if (days <= 2) return "text-red-600";
    if (days <= 5) return "text-orange-600";
    return "text-yellow-600";
  };

  const getProgressColor = (progress: number, daysLeft: number) => {
    const expectedProgress = Math.max(0, 100 - (daysLeft * 10));
    if (progress < expectedProgress - 20) return "bg-red-500";
    if (progress < expectedProgress) return "bg-orange-500";
    return "bg-green-500";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-red-600" />
          Critical Orders Monitor
          <Badge variant="destructive" className="ml-2">
            {mockCriticalOrders.length} Active
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {mockCriticalOrders.map((order) => (
            <div 
              key={order.id} 
              className={`border rounded-lg p-4 ${
                order.escalated ? 'border-red-200 bg-red-50' : 'border-orange-200 bg-orange-50'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold">{order.batchNumber}</h4>
                    {order.escalated && (
                      <Badge variant="destructive" className="text-xs">
                        <ArrowUp className="h-3 w-3 mr-1" />
                        ESCALATED
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">
                    {order.product} - {order.quantity} units
                  </p>
                  <p className="text-sm font-medium">Customer: {order.customer}</p>
                </div>
                <div className="text-right">
                  <div className={`text-lg font-bold ${getDaysLeftColor(order.daysLeft)}`}>
                    {order.daysLeft} days left
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Due: {new Date(order.dueDate).toLocaleDateString()}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {/* Progress */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Production Progress</span>
                    <span className="text-sm">{order.progress}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${getProgressColor(order.progress, order.daysLeft)}`}
                      style={{ width: `${order.progress}%` }}
                    />
                  </div>
                </div>

                {/* Assignment */}
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4" />
                  <span>Production Head: <strong>{order.assignedHead}</strong></span>
                </div>

                {/* Blockers */}
                {order.blockers.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-red-700">
                      <AlertTriangle className="h-4 w-4" />
                      Active Blockers:
                    </div>
                    <div className="space-y-1">
                      {order.blockers.map((blocker, index) => (
                        <div key={index} className="text-sm text-red-600 bg-red-100 p-2 rounded">
                          • {blocker}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2">
                  <Button size="sm" variant="outline">
                    <Calendar className="h-3 w-3 mr-1" />
                    Reschedule
                  </Button>
                  <Button size="sm" variant="outline">
                    <User className="h-3 w-3 mr-1" />
                    Reassign
                  </Button>
                  {!order.escalated && (
                    <Button size="sm" variant="destructive">
                      <ArrowUp className="h-3 w-3 mr-1" />
                      Escalate
                    </Button>
                  )}
                  <Button size="sm">
                    View Details
                  </Button>
                </div>
              </div>
            </div>
          ))}
          
          {mockCriticalOrders.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No critical orders at the moment</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}