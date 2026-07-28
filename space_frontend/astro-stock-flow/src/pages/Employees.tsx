import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmployeesTable } from "@/components/employees/EmployeesTable";
import { DepartmentsTable } from "@/components/employees/DepartmentsTable";
import { AddEmployeeForm } from "@/components/employees/AddEmployeeForm";
// import { AddDepartmentForm } from "@/components/employees/AddDepartmentForm";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Users, Building2, Search } from "lucide-react";

// ✅ Add Employee
import axios from "axios";
import { BASE_URL } from "@/hooks/baseUrls";
// import { EditDispatchForm } from "@/components/dispatch/EditDispatchForm";
import { DepartmentForm } from "@/components/employees/EditDepartmentForm";
import { useLocation } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ✅ Add Employee (FormData)
export const addEmployee = async (
  employeeCode: string,
  name: string,
  phone: string,
  email: string,
  departmentId: string | number,
  role: string,
  token: string
) => {
  try {
    const formData = new FormData();
    formData.append("employeeCode", employeeCode);
    formData.append("name", name);
    formData.append("phone", phone);
    formData.append("email", email);
    formData.append("departmentId", departmentId.toString());
    formData.append("role", role);
    formData.append("token", token);

    const res = await axios.post(`${BASE_URL}/employees/add`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  } catch (err) {
    console.error("Error adding employee:", err);
    throw err;
  }
};

// ✅ Update Employee (FormData)
export const updateEmployee = async (
  employeeId: string | number,
  employeeCode: string,
  name: string,
  phone: string,
  email: string,
  departmentId: string | number,
  role: string,
  empStatus: string,

  token
) => {
  try {
    const formData = new FormData();
    formData.append("employeeId", employeeId.toString());
    formData.append("employeeCode", employeeCode);
    formData.append("name", name);
    formData.append("phone", phone);
    formData.append("email", email);
    formData.append("departmentId", departmentId.toString());
    formData.append("role", role);
    formData.append("token", token);
    formData.append("empStatus", empStatus);

    const res = await axios.post(`${BASE_URL}/employees/update`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  } catch (err) {
    console.error("Error updating employee:", err);
    throw err;
  }
};

// ✅ Get All Employees
export const getAllEmployees = async (token: string) => {
  try {
    const res = await axios.get(`${BASE_URL}/employees/get-all/${token}`);
    return res.data;
  } catch (err) {
    console.error("Error fetching employees:", err);
    throw err;
  }
};

// ✅ Get Employee Details
export const getEmployeeDetails = async (
  employeeId: string | number,
  token: string
) => {
  try {
    const res = await axios.get(
      `${BASE_URL}/employees/get-details/${employeeId}/${token}`
    );
    return res.data;
  } catch (err) {
    console.error("Error fetching employee details:", err);
    throw err;
  }
};

// ✅ Change Employee Status
export const changeEmployeeStatus = async (
  employeeId: string | number,
  status: string | number,
  token: string
) => {
  try {
    const res = await axios.get(
      `${BASE_URL}/employees/change-status/${employeeId}/${status}/${token}`
    );
    return res.data;
  } catch (err) {
    console.error("Error changing employee status:", err);
    throw err;
  }
};

// 🔹 Helper to build FormData from an object
const buildFormData = (data: Record<string, any>): FormData => {
  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      formData.append(key, value);
    }
  });
  return formData;
};

// 🔹 Add department
export const addDepartment = async (payload: {
  departmentCode: string;
  departmentName: string;
  departmentDescription: string;
  departmentHeadEmpId: number | string;
  location: string;
  employeesCount: string | number;
  budget: string | number;
  token: string;
}) => {
  const url = `${BASE_URL}/departments/add`;
  const formData = buildFormData(payload);

  return await axios.post(url, formData);
};

// 🔹 Update department
export const updateDepartment = async (payload: {
  departmentId: string | number;
  departmentCode: string;
  departmentName: string;
  departmentDescription: string;
  departmentHeadEmpId: string;
  location: string;
  employeesCount: string | number;
  budget: string | number;
  token: string;
}) => {
  const url = `${BASE_URL}/departments/update`;
  const formData = buildFormData(payload);
  return await axios.post(url, formData);
};

// 🔹 Get all departments
export const getAllDepartments = async (token: string) => {
  const url = `${BASE_URL}/departments/get-all/${token}`;
  return await axios.get(url);
};

// 🔹 Get department details
export const getDepartmentDetails = async (
  departmentId: string | number,
  token: string
) => {
  const url = `${BASE_URL}/departments/get-details/${departmentId}/${token}`;
  return await axios.get(url);
};

// 🔹 Change status
export const changeDepartmentStatus = async (
  departmentId: string | number,
  status: string | number,
  token: string
) => {
  const url = `${BASE_URL}/departments/change-status/${departmentId}/${status}/${token}`;
  return await axios.get(url);
};

import { Input } from "@/components/ui/input";
// import { Plus, Users, Building2, Search } from "lucide-react";

// ... existing imports ...

export default function Employees() {
  const [isAddEmployeeDialogOpen, setIsAddEmployeeDialogOpen] = useState(false);
  const [isAddDepartmentDialogOpen, setIsAddDepartmentDialogOpen] =
    useState(false);
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedDepartmentId, setSelectedDepartmentId] =
    useState<string>("all");
  const [searchInput, setSearchInput] = useState(""); // Add search state
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const token = localStorage.getItem("token") || "";

  const location = useLocation();
  const result = location.state?.result;


  const getAllemployees = async (token: string) => {
    try {
      const res = await getAllEmployees(token);
      console.log(res);

      setEmployees(res);
      setIsDataLoaded(true);
    } catch (err) {
      console.error("Error fetching employees:", err);
      setIsDataLoaded(true);
      throw err;
    }
  };

  const getAllDepartmentsFetch = async (token) => {
    try {
      const res = await getAllDepartments(token);
      const data = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.data)
          ? res.data.data
          : [];

      setDepartments(data);
      console.log("Departments fetched:", data);
    } catch (err) {
      console.error("Error fetching departments:", err);
      setDepartments([]); // prevent map error
    }
  };

  useEffect(() => {
    getAllemployees(token);
    getAllDepartmentsFetch(token);
  }, []);

  // Combined filtering logic
  const filteredEmployees = employees.filter((employee) => {
    // Filter by Department
    const matchesDepartment =
      selectedDepartmentId === "all" ||
      employee.department_id == selectedDepartmentId;

    // Filter by Search
    const searchLower = searchInput.toLowerCase().trim();
    const matchesSearch =
      !searchLower ||
      (employee.name?.toLowerCase() || "").includes(searchLower) ||
      (employee.email?.toLowerCase() || "").includes(searchLower) ||
      (employee.employee_code?.toLowerCase() || "").includes(searchLower);

    return matchesDepartment && matchesSearch;
  });

  const employeesToDisplay = filteredEmployees;

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Users className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Employees & Departments
            </h1>
            <p className="text-muted-foreground">
              Manage your workforce and organizational structure
            </p>
          </div>
        </div>

        <Tabs defaultValue="employees" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="employees" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Employees
            </TabsTrigger>
            <TabsTrigger
              value="departments"
              className="flex items-center gap-2"
            >
              <Building2 className="h-4 w-4" />
              Departments
            </TabsTrigger>
          </TabsList>

          <TabsContent value="employees" className="space-y-4">
            <div className="flex justify-end">
              <Dialog
                open={isAddEmployeeDialogOpen}
                onOpenChange={setIsAddEmployeeDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add New Employee
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Add New Employee</DialogTitle>
                  </DialogHeader>
                  <AddEmployeeForm
                    onSuccess={() => setIsAddEmployeeDialogOpen(false)}
                    refreshEmployees={() => getAllemployees(token)}
                  />
                </DialogContent>
              </Dialog>
            </div>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle>All Employees</CardTitle>
                <div className="flex items-center gap-4">
                  <div className="relative max-w-sm w-64">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search employees..."
                      className="pl-10"
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                    />
                  </div>
                  <Select
                    value={selectedDepartmentId}
                    onValueChange={setSelectedDepartmentId}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by Department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Departments</SelectItem>
                      {departments.map((department) => (
                        <SelectItem key={department.id} value={department.id}>
                          {department.department_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <EmployeesTable
                  employees={employeesToDisplay}
                  setEmployees={setEmployees}
                  searchResult={result}
                  isDataLoaded={isDataLoaded}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="departments" className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={() => setIsAddDepartmentDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add New Department
              </Button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>All Departments</CardTitle>
              </CardHeader>
              <CardContent>
                <DepartmentsTable
                  departments={departments}
                  setDepartments={setDepartments}
                  setIsAddDepartmentDialogOpen={setIsAddDepartmentDialogOpen}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <DepartmentForm
        onSuccess={() => getAllDepartmentsFetch(token)}
        mode="add"
        department={null}
        isOpen={isAddDepartmentDialogOpen}
        onOpenChange={setIsAddDepartmentDialogOpen}
      />
    </MainLayout>
  );
}
