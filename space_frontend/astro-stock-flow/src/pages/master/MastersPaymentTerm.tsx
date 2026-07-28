import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Plus, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import axios from "axios";
import { BASE_URL } from "@/hooks/baseUrls";
import { PaymentTermsTable } from "@/components/masters/PaymentTermsTable";
import { PaymentTermsForm } from "@/components/masters/PaymentTermsForm";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

// --- INTERFACE ---
export interface PaymentTerm {
  id: number;
  term_name: string;
  status: number; // 0 | 1
  created_at: string;
  updated_at: string;
  created_admin_id: number;
  updated_admin_id: number | null;
}

// --- API FUNCTIONS (CRUD Operations for Payment Terms) ---

// POST: Add a new payment term
export const addPaymentTerm = async ({
  termName,
  token,
}: {
  termName: string;
  token: string;
}) => {
  console.log(termName);
  const formData = new FormData();
  formData.append("termName", termName);
  formData.append("token", token);

  const { data } = await axios.post(
    `${BASE_URL}/payment-terms/add-payment-term`,
    formData
  );
  console.log(data);
  return data;
};

// POST: Update an existing payment term
export const updatePaymentTerm = async ({
  paymentTermId,
  termName,
  token,
}: {
  paymentTermId: number;
  termName: string;
  token: string;
}) => {
  const formData = new FormData();
  formData.append("paymentTermId", String(paymentTermId));
  formData.append("termName", termName);
  formData.append("token", token);

  const { data } = await axios.post(
    `${BASE_URL}/payment-terms/update-payment-term`,
    formData
  );
  console.log(data);
  return data;
};

// GET: Fetch all payment terms
export const fetchPaymentTerms = async (token: string) => {
  const { data } = await axios.get(
    `${BASE_URL}/payment-terms/get-payment-terms/${token}`
  );
  return data; // Assuming the API returns an array of payment terms
};

// GET: Change payment term status
export const changePaymentTermStatus = async ({
  paymentTermId,
  status,
  token,
}: {
  paymentTermId: number;
  status: number;
  token: string;
}) => {
  const { data } = await axios.get(
    `${BASE_URL}/payment-terms/change-payment-term-status/${paymentTermId}/${status}/${token}`
  );
  return data;
};

// POST: Delete a payment term (hypothetical, using POST for safety)
export const deletePaymentTerm = async ({
  paymentTermId,
  token,
}: {
  paymentTermId: number;
  token: string;
}) => {
  const formData = new FormData();
  formData.append("paymentTermId", String(paymentTermId));
  formData.append("token", token);

  const { data } = await axios.post(
    `${BASE_URL}/payment-terms/delete-payment-term`,
    formData
  );
  return data;
};

const MastersPaymentTerm = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  // State to hold the list of payment terms
  const [paymentTerms, setPaymentTerms] = useState<PaymentTerm[]>([]);

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link to="/master">Master Data</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbPage>Payment Terms</BreadcrumbPage>
              </BreadcrumbList>
            </Breadcrumb>
            <div className="flex items-center gap-2">
              <Link to="/master">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Master Data
                </Button>
              </Link>
            </div>
            <h1 className="text-3xl font-bold">Payment Term Management</h1>
            <p className="text-muted-foreground">
              Manage standard payment terms (e.g., Net 30, COD, Prepay).
            </p>
          </div>
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Payment Term
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Payment Terms</CardTitle>
            <CardDescription>
              View and manage all your payment terms
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Pass state and setter to the table */}
            <PaymentTermsTable
              paymentTerms={paymentTerms}
              setPaymentTerms={setPaymentTerms}
            />
          </CardContent>
        </Card>

        {/* Form for adding/editing a payment term */}
        <PaymentTermsForm
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
          setPaymentTerms={setPaymentTerms}
        />
      </div>
    </MainLayout>
  );
};

export default MastersPaymentTerm;
