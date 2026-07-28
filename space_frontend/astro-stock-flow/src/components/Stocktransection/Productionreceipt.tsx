import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import axios from "axios";
import { BASE_URL } from "@/hooks/baseUrls";

export function StocktransectionTable() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const token = localStorage.getItem("token") || "";

  const getAllTransactions = async (token: string) => {
    try {
      const res = await axios.get(
        `${BASE_URL}/production-receipts/get-all/${token}`
      );
      setTransactions(res.data);
    } catch (err) {
      console.error("Error fetching stock transactions:", err);
    }
  };

  useEffect(() => {
    getAllTransactions(token);
  }, []);

  return (
    <div className="rounded-md border w-full overflow-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Product Name</TableHead>
            <TableHead>Production Code</TableHead>
            <TableHead>Received Qty</TableHead>
            <TableHead>SKU ID</TableHead>
            <TableHead>Brand ID</TableHead>
            <TableHead>Created At</TableHead>
            <TableHead>Updated At</TableHead>
            <TableHead>Notes</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="font-medium">
                {item.sku_product_name}
              </TableCell>

              <TableCell>{item.production_code}</TableCell>

              <TableCell>{item.received_qty}</TableCell>

              <TableCell>{item.sku_id}</TableCell>
              <TableCell>{item.sku_brand_id}</TableCell>

              <TableCell>
                {new Date(item.created_at).toLocaleString()}
              </TableCell>

              <TableCell>
                {item.updated_at
                  ? new Date(item.updated_at).toLocaleString()
                  : "—"}
              </TableCell>

              <TableCell>{item.notes || "—"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
