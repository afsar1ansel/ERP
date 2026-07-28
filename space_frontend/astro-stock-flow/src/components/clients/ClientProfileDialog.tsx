import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BASE_URL } from "@/hooks/baseUrls";

import {
  Building2,
  Mail,
  Phone,
  Globe,
  MapPin,
  CreditCard,
  Calendar,
  DollarSign,
  Package,
  TrendingUp,
} from "lucide-react";
import { useEffect, useState } from "react";

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

interface Order {
  created_admin_id: number;
  created_at: string;
  customer_id: number;
  customer_name: string;
  dispatch_date: string;
  dispatch_id: string;
  dispatch_status: string;
  grand_total: string;
  id: number;
  items: OrderItem[];
  notes: string;
  order_reference: string;
  priority: string;
  shipping_address: string;
  status: number;
  tracking: string;
  updated_admin_id: number;
  updated_at: string;
}

interface OrderItem {
  available_unit: string;
  created_at: string;
  dispatch_order_id: number;
  id: number;
  ordered_quantity: string;
  product_id: number;
  product_image: string;
  product_name: string;
  total: string;
  unit_price: string;
  updated_at: string;
}

interface ClientProfileDialogProps {
  client: Client;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ClientProfileDialog({
  client,
  open,
  onOpenChange,
}: ClientProfileDialogProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch orders when dialog opens
  useEffect(() => {
    if (open && client.id) {
      fetchOrders();
    }
  }, [open, client.id]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);

      const Token = localStorage.getItem("token");

      const response = await fetch(
        `${BASE_URL}/dispatch-orders/get-by-customer/${client.id}/${Token}`
      );
      console.log(
        `${BASE_URL}/dispatch-orders/get-by-customer/${client.id}/${Token}`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch orders: ${response.status}`);
      }

      const ordersData: Order[] = await response.json();
      console.log(ordersData);
      setOrders(ordersData);
    } catch (err) {
      console.error("Error fetching orders:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch orders");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch (error) {
      return "Invalid Date";
    }
  };

  const getStatusBadge = (status: string | number) => {
    const statusValue =
      typeof status === "number"
        ? status === 1
          ? "active"
          : "inactive"
        : status;

    switch (statusValue) {
      case "active":
      case "1":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            Active
          </Badge>
        );
      case "inactive":
      case "0":
        return <Badge variant="secondary">Inactive</Badge>;
      default:
        return <Badge variant="outline">{statusValue}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type?.toLowerCase()) {
      case "business":
      case "corporate":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700">
            Business
          </Badge>
        );
      case "individual":
        return (
          <Badge variant="outline" className="bg-purple-50 text-purple-700">
            Individual
          </Badge>
        );
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const getOrderStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "delivered":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            Delivered
          </Badge>
        );
      case "shipped":
        return (
          <Badge variant="default" className="bg-blue-100 text-blue-800">
            Shipped
          </Badge>
        );
      case "pending":
        return (
          <Badge variant="default" className="bg-yellow-100 text-yellow-800">
            Pending
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Calculate values from real data
  const clientName = client.client_name || client.name;
  const contactPerson = client.contact_person || client.contactPerson;
  const email = client.email;
  const phone = client.phone;
  const clientType = client.client_type || client.type;
  const city = client.billing_addr_city || client.city;
  const totalOrders = client.total_orders || client.totalOrders;
  const creditLimit = parseFloat(client.credit_limit) || client.creditLimit;
  const outstanding = client.outstanding || client.Outstanding || 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl">{clientName}</DialogTitle>
              <DialogDescription className="flex items-center gap-2 mt-1">
                Contact: {contactPerson} • {getTypeBadge(clientType)} •{" "}
                {getStatusBadge(client.status)}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="orders">Order History</TabsTrigger>
            {/* <TabsTrigger value="financial">Financial</TabsTrigger> */}
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Contact Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Contact Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{city}</span>
                  </div>
                  {client.website && (
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <a
                        href={client.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline"
                      >
                        {client.website}
                      </a>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Business Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Business Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Total Orders:
                    </span>
                    <span className="text-sm font-medium">{totalOrders}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Total Value:
                    </span>
                    <span className="text-sm font-medium">
                      ${(client.totalValue || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Last Order:
                    </span>
                    <span className="text-sm font-medium">
                      {client.lastOrder || "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Outstanding:
                    </span>
                    <span className="text-sm font-medium text-orange-600">
                      ${outstanding.toLocaleString()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Business Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Business Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <span className="text-sm text-muted-foreground block">
                      GST Number
                    </span>
                    <span className="text-sm font-medium">
                      {client.gst_number}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground block">
                      Credit Limit
                    </span>
                    <span className="text-sm font-medium">
                      ${creditLimit.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground block">
                      Payment Terms
                    </span>
                    <span className="text-sm font-medium">
                      {client.payment_terms}
                    </span>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <span className="text-sm text-muted-foreground block mb-2">
                      Billing Address
                    </span>
                    <p className="text-sm">
                      {client.billing_address}
                      <br />
                      {client.billing_addr_city}, {client.billing_addr_state}
                      <br />
                      {client.billing_addr_pincode}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground block mb-2">
                      Shipping Address
                    </span>
                    <p className="text-sm">
                      {client.shipping_address}
                      <br />
                      {client.shipping_addr_city}, {client.shipping_addr_state}
                      <br />
                      {client.shipping_addr_pincode}
                    </p>
                  </div>
                </div>

                <Separator />

                <div>
                  <span className="text-sm text-muted-foreground block mb-2">
                    Notes
                  </span>
                  <p className="text-sm">
                    {client.notes || "No notes available for this client."}
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="orders" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Orders</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-4">Loading orders...</div>
                ) : error ? (
                  <div className="text-center py-4 text-red-600">
                    Error: {error}
                    <Button
                      variant="outline"
                      size="sm"
                      className="ml-2"
                      onClick={fetchOrders}
                    >
                      Retry
                    </Button>
                  </div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">
                    No orders found for this client.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <div
                        key={order.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex items-center gap-4">
                          <div>
                            <div className="font-medium">
                              {order.dispatch_id !== "0"
                                ? order.dispatch_id
                                : `ORD-${order.id}`}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {order.order_reference}
                            </div>
                          </div>
                          <div>
                            <div className="text-sm">
                              {formatDate(order.created_at)}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {order.items.length} items
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="font-medium">
                              ${parseFloat(order.grand_total).toLocaleString()}
                            </div>
                            {getOrderStatusBadge(order.dispatch_status)}
                          </div>
                          {/* <Button variant="outline" size="sm">
                            View
                          </Button> */}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="financial" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Credit Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Credit Limit:
                    </span>
                    <span className="text-sm font-medium">
                      ${creditLimit.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Outstanding:
                    </span>
                    <span className="text-sm font-medium text-orange-600">
                      ${outstanding.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Available Credit:
                    </span>
                    <span className="text-sm font-medium text-green-600">
                      ${(creditLimit - outstanding).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Payment Terms:
                    </span>
                    <span className="text-sm font-medium">
                      {client.payment_terms}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Payment History
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Payments Made:
                    </span>
                    <span className="text-sm font-medium">42</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      On-time Payments:
                    </span>
                    <span className="text-sm font-medium text-green-600">
                      95%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Last Payment:
                    </span>
                    <span className="text-sm font-medium">Jan 10, 2024</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Payment Method:
                    </span>
                    <span className="text-sm font-medium">Bank Transfer</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Transactions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2 border-b">
                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="text-sm font-medium">
                          Payment Received
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Jan 10, 2024
                        </div>
                      </div>
                    </div>
                    <span className="text-sm font-medium text-green-600">
                      +$18,750
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b">
                    <div className="flex items-center gap-3">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="text-sm font-medium">Order Invoice</div>
                        <div className="text-sm text-muted-foreground">
                          Jan 5, 2024
                        </div>
                      </div>
                    </div>
                    <span className="text-sm font-medium">$12,500</span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="text-sm font-medium">
                          Payment Received
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Dec 28, 2023
                        </div>
                      </div>
                    </div>
                    <span className="text-sm font-medium text-green-600">
                      +$9,200
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
