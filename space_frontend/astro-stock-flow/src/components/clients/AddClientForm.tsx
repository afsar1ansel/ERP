import { useEffect, useState } from "react";
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
import { ChartNoAxesColumnDecreasing } from "lucide-react";
import { set } from "date-fns";
import { BASE_URL } from "@/hooks/baseUrls";

interface AddClientFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fetchClients: () => void;
}

export function AddClientForm({
  open,
  onOpenChange,
  fetchClients,
}: AddClientFormProps) {
  const { toast } = useToast();
  const token = localStorage.getItem("token");

  // Basic Information
  const [clientName, setClientName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [clientTypeOptions, setClientTypeOptions] = useState<any[]>([]);
  const [clientType, setClientType] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");

  // Business Information
  const [gstNumber, setGstNumber] = useState("");
  const [creditLimit, setCreditLimit] = useState("");
  const [paymentTermsOptions, setPaymentTermsOptions] = useState<any[]>([]);
  const [paymentTerms, setPaymentTerms] = useState("");

  // Address Information
  const [billingAddress, setBillingAddress] = useState("");
  const [billingCity, setBillingCity] = useState("");
  const [billingState, setBillingState] = useState("");
  const [billingPincode, setBillingPincode] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [shippingCity, setShippingCity] = useState("");
  const [shippingState, setShippingState] = useState("");
  const [shippingPincode, setShippingPincode] = useState("");
  const [sameAsBilling, setSameAsBilling] = useState(false);

  // Additional Information
  const [notes, setNotes] = useState("");

  const [errors, setErrors] = useState({
    clientName: "",
    contactPerson: "",
    clientType: "",
    email: "",
    phone: "",
    gstNumber: "",
    billingAddress: "",
    billingCity: "",
    billingState: "",
    billingPincode: "",
    shippingAddress: "",
    shippingCity: "",
    shippingState: "",
    shippingPincode: "",
    notes: "",
  });

  // Fetch client types from the API
  const fetchClientTypes = async () => {
    try {
      const response = await axios.get(
        `${BASE_URL}/client-types/get-client-types/${token}`
      );
      // console.log(response.data);
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

  useEffect(() => {
    if (open) {
      fetchClientTypes(); // Fetch client types when the dialog opens
      fetchPaymentTerms(); // Fetch payment terms when the dialog opens
    }
  }, [open]);

  const validateForm = () => {
    let newErrors = {
      clientName: "",
      contactPerson: "",
      clientType: "",
      email: "",
      phone: "",
      gstNumber: "",
      billingAddress: "",
      billingCity: "",
      billingState: "",
      billingPincode: "",
      shippingAddress: "",
      shippingCity: "",
      shippingState: "",
      shippingPincode: "",
      notes: "",
    };
    let isValid = true;

    if (!clientName.trim()) {
      newErrors.clientName = "Client Name is required.";
      isValid = false;
    }
    if (!contactPerson.trim()) {
      newErrors.contactPerson = "Contact Person is required.";
      isValid = false;
    }
    if (!clientType) {
      newErrors.clientType = "Client Type is required.";
      isValid = false;
    }
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Valid Email is required.";
      isValid = false;
    }
     if (!phone.trim()) {
      newErrors.phone = "Phone number is required.";
      isValid = false;
    }
     if (!gstNumber.trim()) {
      newErrors.gstNumber = "GST Number is required.";
      isValid = false;
    }
    if (!billingAddress.trim()) {
      newErrors.billingAddress = "Address is required.";
      isValid = false;
    }
    if (!billingCity.trim()) {
      newErrors.billingCity = "City is required.";
      isValid = false;
    }
    if (!billingState.trim()) {
      newErrors.billingState = "State is required.";
      isValid = false;
    }
    if (!billingPincode.trim()) {
      newErrors.billingPincode = "Pincode is required.";
      isValid = false;
    }

    // Shipping Address Validation
    if (!shippingAddress.trim()) {
      newErrors.shippingAddress = "Shipping Address is required.";
      isValid = false;
    }
    if (!shippingCity.trim()) {
      newErrors.shippingCity = "Shipping City is required.";
      isValid = false;
    }
    if (!shippingState.trim()) {
      newErrors.shippingState = "Shipping State is required.";
      isValid = false;
    }
    if (!shippingPincode.trim()) {
      newErrors.shippingPincode = "Shipping Pincode is required.";
      isValid = false;
    }

    if (!notes.trim()) {
      newErrors.notes = "Notes are required.";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    // client_name: Tech Solutions Inc.
    // contact_person: John Smith
    // client_type: Corporate
    // email: john.tech@techsolutions.com
    // phone: +1-555-0101
    // website: https://techsolutions.com
    // gst_number: GST123456789
    // credit_limit: 50000.00
    // payment_terms: Net 30 days
    // billing_address: 123 Tech Park, Silicon Valley
    // billing_addr_city: San Francisco
    // billing_addr_state: California
    // billing_addr_pincode: 94105
    // shipping_address: Same as billing address
    // shipping_addr_city: San Francisco
    // shipping_addr_state: California
    // shipping_addr_pincode: 94105
    // notes: Premium corporate client with good payment history
    // token:

    const newForm = new FormData();
    newForm.append("client_name", clientName);
    newForm.append("contact_person", contactPerson);
    newForm.append("client_type", clientType);
    newForm.append("email", email);
    newForm.append("phone", phone);
    newForm.append("website", website);
    newForm.append("gst_number", gstNumber);
    newForm.append("credit_limit", creditLimit);
    newForm.append("payment_terms", paymentTerms);
    newForm.append("billing_address", billingAddress);
    newForm.append("billing_addr_city", billingCity);
    newForm.append("billing_addr_state", billingState);
    newForm.append("billing_addr_pincode", billingPincode);
    newForm.append("shipping_address", shippingAddress);
    newForm.append("shipping_addr_city", shippingCity);
    newForm.append("shipping_addr_state", shippingState);
    newForm.append("shipping_addr_pincode", shippingPincode);
    // newForm.append("same_as_billing", sameAsBilling.toString());
    newForm.append("notes", notes);
    newForm.append("token", token);

    console.log(Object.fromEntries(newForm));

    try {
      const response = await fetch(`${BASE_URL}/clients/add`, {
        method: "POST",
        body: newForm,
      });

      const data = await response.json();
      console.log(data);
      // { errFlag: 0, message: 'Client added successfully' }
      if (data.errFlag === 0) {
        toast({
          title: "Success",
          description: `Client "${clientName}" has been added successfully.`,
        });
        fetchClients(); // <-- Refresh table
      }
    } catch {
      console.log("error");
    }

    // Reset form
    resetForm();
    onOpenChange(false);
  };

  const resetForm = () => {
    setClientName("");
    setContactPerson("");
    setClientType("");
    setEmail("");
    setPhone("");
    setWebsite("");
    setGstNumber("");
    setCreditLimit("");
    setPaymentTerms("");
    setBillingAddress("");
    setBillingCity("");
    setBillingState("");
    setBillingPincode("");
    setShippingAddress("");
    setShippingCity("");
    setShippingState("");
    setShippingPincode("");
    setSameAsBilling(false);
    setNotes("");
    setErrors({
      clientName: "",
      contactPerson: "",
      clientType: "",
      email: "",
      phone: "",
      gstNumber: "",
      billingAddress: "",
      billingCity: "",
      billingState: "",
      billingPincode: "",
      shippingAddress: "",
      shippingCity: "",
      shippingState: "",
      shippingPincode: "",
      notes: "",
    });
  };

  const copyBillingToShipping = () => {
    if (sameAsBilling) {
      setShippingAddress(billingAddress);
      setShippingCity(billingCity);
      setShippingState(billingState);
      setShippingPincode(billingPincode);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Client</DialogTitle>
          <DialogDescription>
            Create a new client profile with complete contact and business
            information.
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
                    onChange={(e) => {
                      setClientName(e.target.value);
                      setErrors((prev) => ({ ...prev, clientName: "" }));
                    }}
                    placeholder="Enter client/company name"
                    className={errors.clientName ? "border-red-500" : ""}
                  />
                  {errors.clientName && (
                    <p className="text-red-500 text-sm">{errors.clientName}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="contactPerson">Contact Person *</Label>
                  <Input
                    id="contactPerson"
                    value={contactPerson}
                    onChange={(e) => {
                      setContactPerson(e.target.value);
                      setErrors((prev) => ({ ...prev, contactPerson: "" }));
                    }}
                    placeholder="Primary contact person"
                    className={errors.contactPerson ? "border-red-500" : ""}
                  />
                  {errors.contactPerson && (
                    <p className="text-red-500 text-sm">{errors.contactPerson}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="clientType">Client Type *</Label>
                  <Select
                    value={clientType}
                    onValueChange={(value) => {
                      setClientType(value);
                      setErrors((prev) => ({ ...prev, clientType: "" }));
                    }}
                  >
                    <SelectTrigger className={errors.clientType ? "border-red-500" : ""}>
                      <SelectValue placeholder="Select client type" />
                    </SelectTrigger>
                    <SelectContent>
                      {clientTypeOptions.map((type) => (
                        <SelectItem key={type.id} value={type.type_name}>
                          {type.type_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.clientType && (
                    <p className="text-red-500 text-sm">{errors.clientType}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setErrors((prev) => ({ ...prev, email: "" }));
                    }}
                    placeholder="client@example.com"
                    className={errors.email ? "border-red-500" : ""}
                  />
                  {errors.email && (
                    <p className="text-red-500 text-sm">{errors.email}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="phone">Phone *</Label>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      setErrors((prev) => ({ ...prev, phone: "" }));
                    }}
                    placeholder="+1-234-567-8900"
                    className={errors.phone ? "border-red-500" : ""}
                  />
                  {errors.phone && (
                    <p className="text-red-500 text-sm">{errors.phone}</p>
                  )}
                </div>
                <div>
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
                  <Label htmlFor="gstNumber">GST Number *</Label>
                  <Input
                    id="gstNumber"
                    value={gstNumber}
                    onChange={(e) => {
                      setGstNumber(e.target.value);
                      setErrors((prev) => ({ ...prev, gstNumber: "" }));
                    }}
                    placeholder="GST registration number"
                    className={errors.gstNumber ? "border-red-500" : ""}
                  />
                  {errors.gstNumber && (
                    <p className="text-red-500 text-sm">{errors.gstNumber}</p>
                  )}
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
                      <SelectValue placeholder="Select payment terms" />
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
                      onChange={(e) => {
                        const val = e.target.value;
                        setBillingAddress(val);
                        setErrors((prev) => ({ ...prev, billingAddress: "" }));
                        if (sameAsBilling) {
                          setShippingAddress(val);
                          setErrors((prev) => ({ ...prev, shippingAddress: "" }));
                        }
                      }}
                      placeholder="Street address, building, apartment"
                      rows={2}
                      className={errors.billingAddress ? "border-red-500" : ""}
                    />
                    {errors.billingAddress && (
                      <p className="text-red-500 text-sm">{errors.billingAddress}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="billingCity">City *</Label>
                    <Input
                      id="billingCity"
                      value={billingCity}
                      onChange={(e) => {
                        const val = e.target.value;
                        setBillingCity(val);
                        setErrors((prev) => ({ ...prev, billingCity: "" }));
                        if (sameAsBilling) {
                          setShippingCity(val);
                          setErrors((prev) => ({ ...prev, shippingCity: "" }));
                        }
                      }}
                      placeholder="City"
                      className={errors.billingCity ? "border-red-500" : ""}
                    />
                    {errors.billingCity && (
                      <p className="text-red-500 text-sm">{errors.billingCity}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="billingState">State *</Label>
                    <Input
                      id="billingState"
                      value={billingState}
                      onChange={(e) => {
                        const val = e.target.value;
                        setBillingState(val);
                        setErrors((prev) => ({ ...prev, billingState: "" }));
                        if (sameAsBilling) {
                          setShippingState(val);
                          setErrors((prev) => ({ ...prev, shippingState: "" }));
                        }
                      }}
                      placeholder="State"
                      className={errors.billingState ? "border-red-500" : ""}
                    />
                    {errors.billingState && (
                      <p className="text-red-500 text-sm">{errors.billingState}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="billingPincode">Pincode *</Label>
                    <Input
                      id="billingPincode"
                      value={billingPincode}
                      onChange={(e) => {
                        const val = e.target.value;
                        setBillingPincode(val);
                        setErrors((prev) => ({ ...prev, billingPincode: "" }));
                        if (sameAsBilling) {
                          setShippingPincode(val);
                          setErrors((prev) => ({ ...prev, shippingPincode: "" }));
                        }
                      }}
                      placeholder="Pincode"
                      className={errors.billingPincode ? "border-red-500" : ""}
                    />
                    {errors.billingPincode && (
                      <p className="text-red-500 text-sm">{errors.billingPincode}</p>
                    )}
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
                      onChange={(e) => {
                        setSameAsBilling(e.target.checked);
                        if (e.target.checked) {
                          copyBillingToShipping();
                          setShippingAddress(billingAddress);
                          setShippingCity(billingCity);
                          setShippingState(billingState);
                        }
                      }}
                    />
                    <Label htmlFor="sameAsBilling" className="text-sm">
                      Same as billing address
                    </Label>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Label htmlFor="shippingAddress">Address *</Label>
                    <Textarea
                      id="shippingAddress"
                      value={shippingAddress}
                      onChange={(e) => {
                        setShippingAddress(e.target.value);
                        setErrors((prev) => ({ ...prev, shippingAddress: "" }));
                      }}
                      placeholder="Street address, building, apartment"
                      rows={2}
                      disabled={sameAsBilling}
                      className={errors.shippingAddress ? "border-red-500" : ""}
                    />
                    {errors.shippingAddress && (
                      <p className="text-red-500 text-sm">{errors.shippingAddress}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="shippingCity">City *</Label>
                    <Input
                      id="shippingCity"
                      value={shippingCity}
                      onChange={(e) => {
                        setShippingCity(e.target.value);
                        setErrors((prev) => ({ ...prev, shippingCity: "" }));
                      }}
                      placeholder="City"
                      disabled={sameAsBilling}
                      className={errors.shippingCity ? "border-red-500" : ""}
                    />
                    {errors.shippingCity && (
                      <p className="text-red-500 text-sm">{errors.shippingCity}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="shippingState">State *</Label>
                    <Input
                      id="shippingState"
                      value={shippingState}
                      onChange={(e) => {
                        setShippingState(e.target.value);
                        setErrors((prev) => ({ ...prev, shippingState: "" }));
                      }}
                      placeholder="State"
                      disabled={sameAsBilling}
                      className={errors.shippingState ? "border-red-500" : ""}
                    />
                    {errors.shippingState && (
                      <p className="text-red-500 text-sm">{errors.shippingState}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="shippingPincode">Pincode *</Label>
                    <Input
                      id="shippingPincode"
                      value={shippingPincode}
                      onChange={(e) => {
                        setShippingPincode(e.target.value);
                        setErrors((prev) => ({ ...prev, shippingPincode: "" }));
                      }}
                      placeholder="Pincode"
                      disabled={sameAsBilling}
                      className={errors.shippingPincode ? "border-red-500" : ""}
                    />
                    {errors.shippingPincode && (
                      <p className="text-red-500 text-sm">{errors.shippingPincode}</p>
                    )}
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
                <Label htmlFor="notes">Notes *</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => {
                    setNotes(e.target.value);
                    setErrors((prev) => ({ ...prev, notes: "" }));
                  }}
                  placeholder="Any additional notes about the client..."
                  rows={3}
                  className={errors.notes ? "border-red-500" : ""}
                />
                {errors.notes && (
                  <p className="text-red-500 text-sm">{errors.notes}</p>
                )}
              </div>
            </CardContent>
          </Card>
        </form>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button type="submit" onClick={handleSubmit}>
            Add Client
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
