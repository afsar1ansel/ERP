import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Search, Plus, Eye, Edit, Check, X } from "lucide-react";

const purchaseOrderData = [
  {
    id: "PO-2024-001",
    vendor: "ABC Leather Suppliers",
    date: "2024-03-15",
    items: 3,
    totalAmount: "₹1,25,000",
    expectedDelivery: "2024-03-22",
    status: "Approved",
    brand: "Space Luggage"
  },
  {
    id: "PO-2024-002", 
    vendor: "XYZ Hardware Co.",
    date: "2024-03-14",
    items: 5,
    totalAmount: "₹45,650",
    expectedDelivery: "2024-03-20",
    status: "Pending",
    brand: "Brand Alpha"
  },
  {
    id: "PO-2024-003",
    vendor: "Best Zipper Merchants",
    date: "2024-03-13",
    items: 2,
    totalAmount: "₹32,400",
    expectedDelivery: "2024-03-18",
    status: "Received",
    brand: "Space Luggage"
  },
  {
    id: "PO-2024-004",
    vendor: "Quality Fabric Mills",
    date: "2024-03-12",
    items: 4,
    totalAmount: "₹89,750",
    expectedDelivery: "2024-03-25",
    status: "Created",
    brand: "Brand Beta"
  }
];

export function PurchaseOrders() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Purchase Orders</CardTitle>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Create PO
          </Button>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search PO number or vendor..."
              className="pl-10"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>PO Number</TableHead>
              <TableHead>Vendor</TableHead>
              <TableHead>Brand</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Expected Delivery</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {purchaseOrderData.map((po) => (
              <TableRow key={po.id} className="hover:bg-muted/50">
                <TableCell className="font-medium">{po.id}</TableCell>
                <TableCell>{po.vendor}</TableCell>
                <TableCell>
                  <Badge variant="outline">{po.brand}</Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">{po.date}</TableCell>
                <TableCell>{po.items} items</TableCell>
                <TableCell className="font-medium">{po.totalAmount}</TableCell>
                <TableCell className="text-muted-foreground">{po.expectedDelivery}</TableCell>
                <TableCell>
                  <Badge 
                    variant={
                      po.status === "Received" ? "default" :
                      po.status === "Approved" ? "default" :
                      po.status === "Pending" ? "secondary" : "outline"
                    }
                  >
                    {po.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                    {po.status === "Created" && (
                      <Button variant="ghost" size="sm">
                        <Check className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}