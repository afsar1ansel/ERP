import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

type FileType = "pdf" | "excel" | "csv";

interface GenerateReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerate: (options: {
    start_date: string;
    end_date: string;
    doc_type: FileType;
  }) => void;
  defaultStart?: string; // yyyy-mm-dd
  defaultEnd?: string; // yyyy-mm-dd
  defaultType?: FileType;
  isVendor?: boolean;
}

const today = (): string => {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

export const GenerateReportModal: React.FC<GenerateReportModalProps> = ({
  open,
  onOpenChange,
  onGenerate,
  defaultStart,
  defaultEnd,
  defaultType = "pdf",
  isVendor,
}) => {
  const [startDate, setStartDate] = useState<string>(defaultStart ?? "");
  const [endDate, setEndDate] = useState<string>(defaultEnd ?? "");
  const [fileType, setFileType] = useState<FileType>(defaultType);
  const [loading, setLoading] = useState(false);



  useEffect(() => {
    if (open) {
      // initialize defaults when modal opens
      if (isVendor) {
        // For vendor reports, we don't need dates
        setStartDate("");
        setEndDate("");
      } else {
        setStartDate(defaultStart ?? "");
        setEndDate(defaultEnd ?? today());
      }
      setFileType(defaultType);
    }
  }, [open, defaultStart, defaultEnd, defaultType, isVendor]);

  const validate = (): boolean => {
       if (isVendor) {
         return true;
       }
    if (!startDate || !endDate) {
      toast.error("Please select both start and end dates.");
      return false;
    }
    if (new Date(startDate) > new Date(endDate)) {
      toast.error("Start date cannot be after end date.");
      return false;
    }
    return true;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    setLoading(true);
    try {
      onGenerate({
        start_date: startDate,
        end_date: endDate,
        doc_type: fileType,
      });
      onOpenChange(false);
    } catch (err) {
      console.error("Modal generate error:", err);
      toast.error("Failed to start report generation.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Generate Report</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          {!isVendor && (
            <>
              <div>
                <Label>From</Label>
                <Input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  aria-label="start date"
                />
              </div>

              <div>
                <Label>To</Label>
                <Input
                  type="date"
                  required
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  aria-label="end date"
                />
              </div>
            </>
          )}

          <div>
            <Label>File Type</Label>
            {/* Replace with your UI library select if you have one */}
            <Select
              onValueChange={(val) => setFileType(val as FileType)}
              defaultValue={fileType}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select file type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pdf">PDF</SelectItem>
                <SelectItem value="excel">Excel (.xlsx)</SelectItem>
                <SelectItem value="csv">CSV</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Generating..." : "Generate"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default GenerateReportModal;
