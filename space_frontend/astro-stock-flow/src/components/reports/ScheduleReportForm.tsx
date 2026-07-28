// ScheduleReportForm.tsx

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Plus } from "lucide-react";
import { toast } from "sonner";
import { BASE_URL } from "@/hooks/baseUrls";

const formSchema = z.object({
  reportType: z.string().min(1, "Report type is required"),
  reportName: z.string().min(1, "Report name is required"),
  frequency: z.string().min(1, "Frequency is required"),
  time: z.string().min(1, "Time is required"),
  recipients: z
    .array(z.string().email("Please enter a valid email"))
    .min(1, "At least one recipient is required"),
  format: z.string().min(1, "Format is required"),
});

type FormData = z.infer<typeof formSchema>;

interface ScheduleReportFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editData?: {
    id: string;
    report_name: string;
    report_type: string;
    frequency: string;
    execution_time: string;
    export_format: string;
    recipients: string[];
    status?: string;
  } | null;
  token: string;
}

const reportTypes = [
  "Raw Material Report",
  "Consumption Report",
  "Finished Goods Report",
  "Vendor Performance",
  "Quality Report",
  "Material Inward Report",
];

const frequencies = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
];

const formats = [
  { value: "pdf", label: "PDF" },
  { value: "csv", label: "CSV" },
];

export function ScheduleReportForm({
  open,
  onOpenChange,
  editData,
  token,
}: ScheduleReportFormProps) {
  const [newRecipient, setNewRecipient] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      reportType: "",
      reportName: "",
      frequency: "",
      time: "",
      recipients: [],
      format: "pdf",
    },
  });

  // Watch the recipients from form state
  const recipients = form.watch("recipients");

  // Initialize form with edit data when component mounts or editData changes
  useEffect(() => {
    if (editData) {
      form.reset({
        reportType: editData.report_type,
        reportName: editData.report_name,
        frequency: editData.frequency,
        time: editData.execution_time,
        recipients: editData.recipients,
        format: editData.export_format,
      });
    } else {
      form.reset({
        reportType: "",
        reportName: "",
        frequency: "",
        time: "",
        recipients: [],
        format: "pdf",
      });
    }
    setNewRecipient("");
  }, [editData, open, form]);

  const addRecipient = () => {
    if (newRecipient.trim() && !recipients.includes(newRecipient.trim())) {
      const updatedRecipients = [...recipients, newRecipient.trim()];
      form.setValue("recipients", updatedRecipients, { shouldValidate: true });
      setNewRecipient("");
    }
  };

  const removeRecipient = (email: string) => {
    const updatedRecipients = recipients.filter((r) => r !== email);
    form.setValue("recipients", updatedRecipients, { shouldValidate: true });
  };

  const handleSubmit = async (data: FormData) => {
    setIsSubmitting(true);

  let type = "";

  switch (data.reportType) {
    case "Raw Material Report":
      type = "raw-materials-stock-report";
      break;
    case "Consumption Report":
      type = "raw-material-consumption-report";
      break;
    case "Finished Goods Report":
      type = "finished-goods-stock-report";
      break;
    case "Material Inward Report":
      type = "material-inward-report";
      break;
    case "Vendor Performance":
      type = "vendor-performance-report";
      break;
    case "Quality Report":
      type = "qc-records-report";
      break;
    default:
      type = "";
      break;
  }

    try {
      const formData = new FormData();
      formData.append("token", token);
      formData.append("report_name", data.reportName);
      // formData.append("report_type", data.reportType);
      formData.append("report_type", type);
      formData.append("frequency", data.frequency);
      formData.append("time", data.time);
      formData.append("export_format", data.format);

      // Append recipients as a single comma-separated string
      formData.append("recipients", data.recipients.join(","));

      let url = `${BASE_URL}/schedule/create`;
      let method = "POST";

      // If editing, include the ID and use update endpoint
      if (editData) {
        formData.append("id", editData.id);
        url = `${BASE_URL}/schedule/update`;
      }

      const response = await fetch(url, {
        method: method,
        body: formData,
      });

      const result = await response.json();

      if (result.errFlag === 0) {
        const action = editData ? "updated" : "scheduled";
        toast.success(`Report ${action} successfully!`);
        form.reset();
        setNewRecipient("");
        onOpenChange(false);
      } else {
        toast.error(
          result.message ||
            `Failed to ${editData ? "update" : "schedule"} report`
        );
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error(
        `An error occurred while ${
          editData ? "updating" : "scheduling"
        } the report`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    form.reset();
    setNewRecipient("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {editData ? "Edit Scheduled Report" : "Schedule New Report"}
          </DialogTitle>
          <DialogDescription>
            {editData
              ? "Update the scheduled report settings"
              : "Set up automated report generation and delivery"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="reportType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Report Type</FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select report type" />
                        </SelectTrigger>
                        <SelectContent>
                          {reportTypes.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="reportName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Report Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter custom report name"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="frequency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Frequency</FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select frequency" />
                        </SelectTrigger>
                        <SelectContent>
                          {frequencies.map((freq) => (
                            <SelectItem key={freq.value} value={freq.value}>
                              {freq.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Time</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="format"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Export Format</FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select format" />
                        </SelectTrigger>
                        <SelectContent>
                          {formats.map((format) => (
                            <SelectItem key={format.value} value={format.value}>
                              {format.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Recipients Section */}
            <div className="space-y-4">
              <FormLabel>Recipients</FormLabel>

              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="Enter email address"
                  value={newRecipient}
                  onChange={(e) => setNewRecipient(e.target.value)}
                  onKeyPress={(e) =>
                    e.key === "Enter" && (e.preventDefault(), addRecipient())
                  }
                />
                <Button
                  type="button"
                  onClick={addRecipient}
                  size="sm"
                  disabled={!newRecipient.trim()}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {recipients && recipients.length > 0 && (
                <div className="flex flex-wrap gap-2 p-3 border rounded-md bg-muted/50">
                  {recipients.map((email, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      {email}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => removeRecipient(email)}
                      />
                    </Badge>
                  ))}
                </div>
              )}

              {/* This will show validation errors for recipients */}
              <FormField
                control={form.control}
                name="recipients"
                render={({ field }) => (
                  <FormItem>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? editData
                    ? "Updating..."
                    : "Scheduling..."
                  : editData
                  ? "Update Schedule"
                  : "Schedule Report"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
