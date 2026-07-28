import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { usePermissions } from "@/hooks/usePermissions";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { BASE_URL } from "@/hooks/baseUrls";
import { useToast } from "@/hooks/use-toast";
import logo from "../../public/space.jpg";
import "../LoginBackground.scss";

export default function EmployeeLogin() {
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { getFirstAllowedRoute } = usePermissions();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const formData = new FormData();
    formData.append("phone", phone);
    formData.append("password", password);
    const backendUrl = `${BASE_URL}/employees/validate-user`;

    try {
      if (!phone) {
        setError("Phone number is required.");
        setIsLoading(false);
        return;
      }

      if (!password) {
        setError("Password is required.");
        setIsLoading(false);
        return;
      }

      const response = await axios.post(backendUrl, formData);

      // Check the errFlag from the API response
      if (response.data.errFlag === 0) {
        console.log("Employee Login Successful:", response.data);

        // Store token and username in localStorage
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("username", response.data.employeeName); // Use employeeName as username for compatibility
        localStorage.setItem("userType", "employee"); // Flag to distinguish employee login if needed
        
        const permissionsString = JSON.stringify(response.data.page_access);
        const encodedPermissions = btoa(permissionsString);
        localStorage.setItem("permission", encodedPermissions);

        // Redirect user
        toast({
          title: "Success",
          description: `Login Successful! Welcome, ${response.data.employeeName}`,
        });

        // We need to wait a bit or use the returned route if available
        // For employees, they usually go to /employee-task
        const firstRoute = response.data.page_access?.[0]?.page_route || "/employee-task";
        navigate(firstRoute);
      } else {
        setError(response.data.message || "An unknown error occurred.");
      }
    } catch (err: any) {
      console.error("Employee Login request failed:", err);
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Could not connect to the server.";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-screen overflow-hidden">
      <div className="animated-background"></div>
      <div className="min-h-screen flex flex-col items-center justify-center p-4 -mt-16">
        <div className="mb-4">
          <img src={logo} alt="logo" className="h-20 w-72" />
        </div>
        <Card className="w-full max-w-md shadow-2xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Employee Login</CardTitle>
            <CardDescription className="text-center">
              Sign in to your employee portal
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="text"
                  placeholder="Enter your phone number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {error && (
                <p className="text-sm text-red-600 text-center">{error}</p>
              )}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  "Signing In..."
                ) : (
                  <>
                    <LogIn className="mr-2 h-4 w-4" />
                    Sign In
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
