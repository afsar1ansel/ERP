import { useState, useEffect } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { BASE_URL } from "@/hooks/baseUrls";

interface Client {
  id: number;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  type: string;
  status: string;
  city: string;
  totalOrders: number;
  outstanding: number;
  totalValue?: number;
  lastOrder?: string;
  creditLimit: number;
  // Real API properties
  billing_addr_city: string;
  billing_addr_pincode: string;
  billing_addr_state: string;
  billing_address: string;
  client_name: string;
  client_type: string;
  contact_person: string;
  credit_limit: string;
  gst_number: string;
  notes: string;
  payment_terms: string;
  shipping_addr_city: string;
  shipping_addr_pincode: string;
  shipping_addr_state: string;
  shipping_address: string;
  website: string;
  [key: string]: any;
}

interface EditClientFormProps {
  client: Client;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fetchClients: () => void;
}

export function EditClientForm({
  client,
  open,
  onOpenChange,
  fetchClients,
}: EditClientFormProps) {
  const { toast } = useToast();
  const token = localStorage.getItem("token");

  // State for payment terms
  const [paymentTermsOptions, setPaymentTermsOptions] = useState<any[]>([]);
  const [clientName, setClientName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [clientTypeOptions, setClientTypeOptions] = useState<any[]>([]);
  const [clientType, setClientType] = useState("");
  const [clientStatus, setClientStatus] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [gstNumber, setGstNumber] = useState("");
  const [creditLimit, setCreditLimit] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("");
  const [billingAddress, setBillingAddress] = useState("");
  const [billingCity, setBillingCity] = useState("");
  const [billingState, setBillingState] = useState("");
  const [billingPincode, setBillingPincode] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [shippingCity, setShippingCity] = useState("");
  const [shippingState, setShippingState] = useState("");
  const [shippingPincode, setShippingPincode] = useState("");
  const [sameAsBilling, setSameAsBilling] = useState(false);
  const [notes, setNotes] = useState("");

  // Helper function to clean and trim data
  const cleanData = (value: string) => {
    return value ? value.trim() : "";
  };

  // Fetch payment terms from the API
  const fetchPaymentTerms = async () => {
    try {
      const response = await axios.get(
        `${BASE_URL}/payment-terms/get-payment-terms/${token}`
      );
      setPaymentTermsOptions(response.data);
    } catch (error) {
      console.error("Error fetching payment terms:", error);
    }
  };

  // Fetch client types from the API
  const fetchClientTypes = async () => {
    try {
      const response = await axios.get(
        `${BASE_URL}/client-types/get-client-types/${token}`
      );
      setClientTypeOptions(response.data);
    } catch (error) {
      console.error("Error fetching client types:", error);
      toast({
        title: "Error",
        description: "Failed to fetch client types",
        variant: "destructive",
      });
    }
  };

  // Populate form with client data when dialog opens
  useEffect(() => {
    if (client && open) {
      console.log("Original client data:", client);

      // Basic Information - clean and trim all values
      setClientName(cleanData(client.client_name || client.name || ""));
      setContactPerson(
        cleanData(client.contact_person || client.contactPerson || "")
      );

      // Handle client type - clean and map if needed
      const rawClientType = cleanData(client.client_type || client.type || "");
      setClientType(rawClientType);

      setClientStatus(client.status?.toString() || "1");
      setEmail(cleanData(client.email || ""));
      setPhone(cleanData(client.phone || ""));
      setWebsite(cleanData(client.website || ""));

      // Business Information
      setGstNumber(cleanData(client.gst_number || ""));
      setCreditLimit(
        cleanData(client.credit_limit || client.creditLimit?.toString() || "")
      );

      // Handle payment terms - clean and ensure it matches options
      const rawPaymentTerms = cleanData(client.payment_terms || "");
      setPaymentTerms(rawPaymentTerms);

      // Address Information
      setBillingAddress(cleanData(client.billing_address || ""));
      setBillingCity(cleanData(client.billing_addr_city || client.city || ""));
      setBillingState(cleanData(client.billing_addr_state || ""));
      setBillingPincode(cleanData(client.billing_addr_pincode || ""));
      setShippingAddress(cleanData(client.shipping_address || ""));
      setShippingCity(cleanData(client.shipping_addr_city || ""));
      setShippingState(cleanData(client.shipping_addr_state || ""));
      setShippingPincode(cleanData(client.shipping_addr_pincode || ""));

      // Check if shipping address is same as billing
      const isSameShipping =
        cleanData(client.shipping_address) ===
          cleanData(client.billing_address) &&
        cleanData(client.shipping_addr_city) ===
          cleanData(client.billing_addr_city) &&
        cleanData(client.shipping_addr_state) ===
          cleanData(client.billing_addr_state) &&
        cleanData(client.shipping_addr_pincode) ===
          cleanData(client.billing_addr_pincode);

      setSameAsBilling(
        isSameShipping || client.shipping_address === "Same as billing address"
      );

      // Additional Information
      setNotes(cleanData(client.notes || ""));

      // Log the cleaned values for debugging
      console.log("Cleaned form data:", {
        clientType: rawClientType,
        paymentTerms: rawPaymentTerms,
        clientName: cleanData(client.client_name || client.name || ""),
        contactPerson: cleanData(
          client.contact_person || client.contactPerson || ""
        ),
        billingAddress: cleanData(client.billing_address || ""),
        billingCity: cleanData(client.billing_addr_city || client.city || ""),
        billingState: cleanData(client.billing_addr_state || ""),
        billingPincode: cleanData(client.billing_addr_pincode || ""),
      });
    }
  }, [client, open]);

  useEffect(() => {
    if (client && open) {
      // Populate form with client data when dialog opens
      setPaymentTerms(client.payment_terms || ""); // Set initial payment terms from client data
      fetchPaymentTerms(); // Fetch payment terms when the dialog opens
      fetchClientTypes(); // Fetch client types when the dialog opens
    }
  }, [client, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (
      !clientName ||
      !contactPerson ||
      !clientType ||
      !email ||
      !phone ||
      !billingAddress ||
      !billingCity ||
      !billingState ||
      !billingPincode
    ) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    formData.append("client_id", client.id.toString());
    formData.append("client_name", clientName);
    formData.append("contact_person", contactPerson);
    formData.append("client_type", clientType);
    formData.append("email", email);
    formData.append("phone", phone);
    formData.append("website", website);
    formData.append("gst_number", gstNumber);
    formData.append("credit_limit", creditLimit);
    formData.append("payment_terms", paymentTerms);
    formData.append("billing_address", billingAddress);
    formData.append("billing_addr_city", billingCity);
    formData.append("billing_addr_state", billingState);
    formData.append("billing_addr_pincode", billingPincode);
    formData.append("shipping_address", shippingAddress);
    formData.append("shipping_addr_city", shippingCity);
    formData.append("shipping_addr_state", shippingState);
    formData.append("shipping_addr_pincode", shippingPincode);
    formData.append("notes", notes);
    formData.append("token", token || "");

    console.log("FormData being sent:", Object.fromEntries(formData));

    try {
      const response = await fetch(`${BASE_URL}/clients/update`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      console.log("API Response:", data);

      if (data.errFlag === 0) {
        toast({
          title: "Success",
          description: `Client "${clientName}" has been updated successfully.`,
        });
        onOpenChange(false);
        fetchClients(); // <-- Refresh table
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to update client.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.log("Error updating client:", error);
      toast({
        title: "Error",
        description: "An error occurred while updating the client.",
        variant: "destructive",
      });
    }
  };

  const copyBillingToShipping = () => {
    if (sameAsBilling) {
      setShippingAddress(billingAddress);
      setShippingCity(billingCity);
      setShippingState(billingState);
      setShippingPincode(billingPincode);
    }
  };

  // Update shipping address when billing address changes and sameAsBilling is checked
  useEffect(() => {
    if (sameAsBilling) {
      copyBillingToShipping();
    }
  }, [
    billingAddress,
    billingCity,
    billingState,
    billingPincode,
    sameAsBilling,
  ]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Client</DialogTitle>
          <DialogDescription>
            Update client information and business details.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Client Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Client Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="clientName">Client Name *</Label>
                  <Input
                    id="clientName"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="Enter client/company name"
                  />
                </div>
                <div>
                  <Label htmlFor="contactPerson">Contact Person *</Label>
                  <Input
                    id="contactPerson"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    placeholder="Primary contact person"
                  />
                </div>
                <div>
                  <Label htmlFor="clientType">Client Type *</Label>
                  <Select value={clientType} onValueChange={setClientType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select client type">
                        {clientType || "Select client type"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {clientTypeOptions.map((type) => (
                        <SelectItem key={type.id} value={type.type_name}>
                          {type.type_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="clientStatus">Status</Label>
                  <Select value={clientStatus} onValueChange={setClientStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status">
                        {clientStatus === "1" ? "Active" : "Inactive"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Active</SelectItem>
                      <SelectItem value="0">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="client@example.com"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone *</Label>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1-234-567-8900"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://example.com"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Business Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Business Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="gstNumber">GST Number</Label>
                  <Input
                    id="gstNumber"
                    value={gstNumber}
                    onChange={(e) => setGstNumber(e.target.value)}
                    placeholder="GST registration number"
                  />
                </div>
                <div>
                  <Label htmlFor="creditLimit">Credit Limit</Label>
                  <Input
                    id="creditLimit"
                    type="number"
                    value={creditLimit}
                    onChange={(e) => setCreditLimit(e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label htmlFor="paymentTerms">Payment Terms</Label>
                  <Select value={paymentTerms} onValueChange={setPaymentTerms}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment terms">
                        {paymentTerms || "Select payment terms"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {paymentTermsOptions.map((term) => (
                        <SelectItem key={term.id} value={term.term_name}>
                          {term.term_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Address Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Address Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Billing Address */}
              <div>
                <h4 className="font-medium mb-3">Billing Address</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Label htmlFor="billingAddress">Address *</Label>
                    <Textarea
                      id="billingAddress"
                      value={billingAddress}
                      onChange={(e) => setBillingAddress(e.target.value)}
                      placeholder="Street address, building, apartment"
                      rows={2}
                    />
                  </div>
                  <div>
                    <Label htmlFor="billingCity">City *</Label>
                    <Input
                      id="billingCity"
                      value={billingCity}
                      onChange={(e) => setBillingCity(e.target.value)}
                      placeholder="City"
                    />
                  </div>
                  <div>
                    <Label htmlFor="billingState">State *</Label>
                    <Input
                      id="billingState"
                      value={billingState}
                      onChange={(e) => setBillingState(e.target.value)}
                      placeholder="State"
                    />
                  </div>
                  <div>
                    <Label htmlFor="billingPincode">Pincode *</Label>
                    <Input
                      id="billingPincode"
                      value={billingPincode}
                      onChange={(e) => setBillingPincode(e.target.value)}
                      placeholder="Pincode"
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Shipping Address */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium">Shipping Address</h4>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="sameAsBilling"
                      checked={sameAsBilling}
                      onChange={(e) => setSameAsBilling(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <Label htmlFor="sameAsBilling" className="text-sm">
                      Same as billing address
                    </Label>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Label htmlFor="shippingAddress">Address</Label>
                    <Textarea
                      id="shippingAddress"
                      value={shippingAddress}
                      onChange={(e) => setShippingAddress(e.target.value)}
                      placeholder="Street address, building, apartment"
                      rows={2}
                      disabled={sameAsBilling}
                    />
                  </div>
                  <div>
                    <Label htmlFor="shippingCity">City</Label>
                    <Input
                      id="shippingCity"
                      value={shippingCity}
                      onChange={(e) => setShippingCity(e.target.value)}
                      placeholder="City"
                      disabled={sameAsBilling}
                    />
                  </div>
                  <div>
                    <Label htmlFor="shippingState">State</Label>
                    <Input
                      id="shippingState"
                      value={shippingState}
                      onChange={(e) => setShippingState(e.target.value)}
                      placeholder="State"
                      disabled={sameAsBilling}
                    />
                  </div>
                  <div>
                    <Label htmlFor="shippingPincode">Pincode</Label>
                    <Input
                      id="shippingPincode"
                      value={shippingPincode}
                      onChange={(e) => setShippingPincode(e.target.value)}
                      placeholder="Pincode"
                      disabled={sameAsBilling}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Additional Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Additional Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any additional notes about the client..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Update Client</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
