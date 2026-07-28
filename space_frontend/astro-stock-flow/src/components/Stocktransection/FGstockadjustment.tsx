import { useEffect, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge"; // Kept for styling the adjustment type
import { useToast } from "@/hooks/use-toast";
import { BASE_URL } from "@/hooks/baseUrls";
import axios from "axios";

// Define a type for the adjustment data for better TypeScript support
type StockAdjustment = {
  id: number;
  finished_good_name: string;
  adjustment_type: "increase" | "decrease";
  adjustment_qty: string;
  reason: string;
  notes: string;
  created_at: string;
  status: number;
};

export function FGstockadjustment() {
  const { toast } = useToast();
  const token = localStorage.getItem("token");
  const [adjustments, setAdjustments] = useState<StockAdjustment[]>([]);

  const fetchStockAdjustments = async (authToken: string | null) => {
    if (!authToken) {
      toast({
        title: "Authentication Error",
        description: "No token found, please log in again.",
        variant: "destructive",
      });
      return;
    }

    try {
      const res = await axios.get(
        `${BASE_URL}/finished-goods/get-fg-stock-adjustments/${authToken}`
      );
      // Assuming the API returns an array of adjustment objects
      setAdjustments(res.data);
    } catch (error) {
      console.error("Failed to fetch stock adjustments:", error);
      toast({
        title: "API Error",
        description: "Could not fetch stock adjustments from the server.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchStockAdjustments(token);
  }, []); // The empty dependency array ensures this runs once on component mount

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Product Name</TableHead>
            <TableHead>Adjustment Date</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Reason</TableHead>
            <TableHead>Quantity</TableHead>
            <TableHead>Notes</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {adjustments.map((adjustment) => (
            <TableRow key={adjustment.id}>
              <TableCell className="font-medium">
                {adjustment.finished_good_name}
              </TableCell>
              <TableCell>
                {new Date(adjustment.created_at).toLocaleDateString()}
              </TableCell>
              <TableCell>
                <Badge
                  variant={
                    adjustment.adjustment_type === "decrease"
                      ? "destructive"
                      : "default"
                  }
                >
                  {adjustment.adjustment_type}
                </Badge>
              </TableCell>
              <TableCell>{adjustment.reason}</TableCell>
              <TableCell>{parseFloat(adjustment.adjustment_qty).toFixed(2)}</TableCell>
              <TableCell>{adjustment.notes}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}