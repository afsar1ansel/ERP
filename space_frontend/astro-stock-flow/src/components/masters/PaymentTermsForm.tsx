import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  addPaymentTerm,
  updatePaymentTerm,
  fetchPaymentTerms,
  PaymentTerm,
} from "@/pages/master/MastersPaymentTerm";

interface PaymentTermsFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  paymentTerm?: PaymentTerm | null; // Optional prop for edit mode
  mode?: "add" | "edit";
  setPaymentTerms: React.Dispatch<React.SetStateAction<PaymentTerm[]>>;
}

export const PaymentTermsForm = ({
  open,
  onOpenChange,
  paymentTerm,
  mode = "add",
  setPaymentTerms,
}: PaymentTermsFormProps) => {
  const { toast } = useToast();

  // --- FORM STATES ---
  const [formData, setFormData] = useState({
    name: "",
  });

  // --- VALIDATION AND UI STATES ---
  const [errors, setErrors] = useState({ name: "" });
  const [loading, setLoading] = useState(false);

  // Pre-fill form in edit mode
  useEffect(() => {
    if (paymentTerm && mode === "edit") {
      setFormData({
        name: paymentTerm.term_name,
      });
    } else {
      // Reset form for add mode
      setFormData({ name: "" });
    }
    // Clear validation errors when the dialog opens or mode changes
    setErrors({ name: "" });
  }, [paymentTerm, mode, open]);

  // --- VALIDATION LOGIC WITH REGEX ---
  const validateForm = () => {
    const newErrors = { name: "" };

    // Payment Term Name: At least 2 characters, allows letters, numbers, and spaces.
    if (!/^[A-Za-z0-9\s&-]{2,}$/.test(formData.name)) {
      newErrors.name = "Payment Term name must be at least 2 characters long.";
    }

    setErrors(newErrors);
    // Return true if all error messages are empty strings
    return Object.values(newErrors).every((error) => error === "");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please check the form for errors and try again.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const authToken = localStorage.getItem("token") || "";
      let response;

      if (mode === "add") {
        console.log(formData.name);
        response = await addPaymentTerm({
          termName: formData.name,
          token: authToken,
        });
      } else if (paymentTerm) {
        response = await updatePaymentTerm({
          paymentTermId: paymentTerm.id,
          termName: formData.name,
          token: authToken,
        });
      }

      if (response?.errFlag !== 0) {
        throw new Error(
          response?.message ||
            `Failed to ${mode === "edit" ? "update" : "add"} payment term.`
        );
      }

      // Refresh the payment term list in the parent component
      const paymentTermsData = await fetchPaymentTerms(authToken);
      setPaymentTerms(paymentTermsData);

      toast({
        title: mode === "edit" ? "Payment Term Updated" : "Payment Term Added",
        description: `${
          formData.name || paymentTerm?.term_name
        } has been saved successfully.`,
      });
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // --- INPUT HANDLER ---
  const handleInputChange = (value: string) => {
    setFormData((prev) => ({ ...prev, name: value }));
    // Clear the error for the specific field when the user starts typing
    if (errors.name) {
      setErrors((prev) => ({ ...prev, name: "" }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {mode === "edit" ? "Edit Payment Term" : "Add New Payment Term"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label htmlFor="paymentTermName">Payment Term Name *</Label>
              <Input
                id="paymentTermName"
                value={formData.name}
                onChange={(e) => handleInputChange(e.target.value)}
                placeholder="e.g., Net 30"
              />
              {errors.name && (
                <p className="text-red-500 text-sm mt-1">{errors.name}</p>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading
                ? "Saving..."
                : mode === "edit"
                ? "Update Term"
                : "Add Term"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
