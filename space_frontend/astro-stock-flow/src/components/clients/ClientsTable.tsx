import { useEffect, useState } from "react";
import {
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ClientProfileDialog } from "./ClientProfileDialog";
import { EditClientForm } from "./EditClientForm";
import axios from "axios";
import { BASE_URL } from "@/hooks/baseUrls";

// Define a type for our client object for better type safety
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

interface ClientsTableProps {
  clients: Client[];
  fetchClients: () => void;
}

export function ClientsTable({ clients, fetchClients }: ClientsTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const token = localStorage.getItem("token");

  const { toast } = useToast();

  useEffect(() => {
    fetchClients();
  }, []);

  const filteredClients = clients.filter((client) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      client.name.toLowerCase().includes(searchLower) ||
      client.contactPerson.toLowerCase().includes(searchLower) ||
      client.email.toLowerCase().includes(searchLower);

    // Normalize status to string "1" or "0"
    const normalizedStatus =
      client.status.toString() == "1" || client.status.toString() === "1"
        ? "1"
        : "0";
    const matchesStatus =
      statusFilter === "all" || normalizedStatus === statusFilter;

    // Normalize type to lowercase "business" or "individual"
    const normalizedType = (client.type || client.client_type || "")
      .toString()
      .toLowerCase();
    const matchesType = typeFilter === "all" || normalizedType === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            Active
          </Badge>
        );
      case "inactive":
        return <Badge variant="secondary">Inactive</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "business":
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

  const handleViewClient = (client: Client) => {
    setSelectedClient(client);
    setProfileDialogOpen(true);
  };

  const handleEditClient = (client: Client) => {
    setSelectedClient(client);
    setEditDialogOpen(true);
  };

  async function handleToggleStatus(employee) {
    const newStatus = employee.status === 1 ? 0 : 1;
    try {
      const res = await axios.get(
        `${BASE_URL}/clients/change-status/${employee.id}/${newStatus}/${token}`
      );
      console.log(res);

      if (res.data.errFlag !== 0) {
        toast({
          title: "Error",
          description: res.data.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Employee Status Updated",
        description: `${employee.name}'s status has been updated to ${
          newStatus === 1 ? "Active" : "Inactive"
        }.`,
      });
      fetchClients();
    } catch (err) {
      console.error("Error fetching employees:", err);
      throw err;
    }
  }

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search clients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="1">Active</SelectItem>
            <SelectItem value="0">Inactive</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="business">Business</SelectItem>
            <SelectItem value="individual">Individual</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Client Name</TableHead>
              <TableHead>Contact Person</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>City</TableHead>
              <TableHead className="text-right">Total Orders</TableHead>
              <TableHead className="text-right">Outstanding</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredClients.map((client) => (
              <TableRow key={client.id}>
                <TableCell className="font-medium">{client.name}</TableCell>
                <TableCell>{client.contactPerson}</TableCell>
                <TableCell>{client.email}</TableCell>
                <TableCell>{client.phone}</TableCell>
                <TableCell>
                  {getTypeBadge(
                    (client.type || client.client_type || "")
                      .toString()
                      .toLowerCase()
                  )}
                </TableCell>
                <TableCell>
                  {getStatusBadge(
                    client.status.toString() == "1" ||
                      client.status.toString() == "1"
                      ? "active"
                      : "inactive"
                  )}
                </TableCell>
                <TableCell>{client.city}</TableCell>
                <TableCell className="text-right">
                  {client.totalOrders}
                </TableCell>
                <TableCell className="text-right">
                  ${client.outstanding.toLocaleString()}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => handleViewClient(client)}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleEditClient(client)}
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Edit Client
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={() => {
                          setSelectedClient(client);
                          setDeleteConfirmOpen(true);
                        }}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Client
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Client Profile Dialog */}
      {selectedClient && (
        <ClientProfileDialog
          client={selectedClient}
          open={profileDialogOpen}
          onOpenChange={setProfileDialogOpen}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Client</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this client?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleToggleStatus(selectedClient)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Client Dialog */}
      {selectedClient && (
        <EditClientForm
          client={selectedClient}
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          fetchClients={fetchClients}
        />
      )}
    </div>
  );
}
