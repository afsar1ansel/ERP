import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { usePermissions } from "@/hooks/usePermissions";
import axios from "axios"; // Import axios
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
import { LogoText } from "@/components/common/LogoText";
import "../LoginBackground.scss";


export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(""); // State for handling login errors
  const [isLoading, setIsLoading] = useState(false); // State for loading indicator
  const navigate = useNavigate();
  const { toast } = useToast();
  const { getFirstAllowedRoute } = usePermissions();

  useEffect(() => {
    // if local storage dont have permission we clear the whole localstorage if it has permission we redirect to dashboard

    if (localStorage.getItem("permission") && localStorage.getItem("token")) {
      navigate("/");
    } else {
      localStorage.removeItem("token");
      localStorage.removeItem("username");
      localStorage.removeItem("permission");
      localStorage.removeItem("logo");
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const formData = new FormData();
    formData.append("email", email);
    formData.append("password", password);
    const backendUrl = `${BASE_URL}/admin-users/validate-user`;

    try {
      if (!email) {
        setError("Email is required.");
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
        // --- SUCCESS LOGIC ---
        console.log("Login Successful:", response.data);

        // Store token and username in localStorage
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("username", response.data.username);
        const permissionsString = JSON.stringify(response.data.page_access);
        // const permissionsString = JSON.stringify(per);
        const encodedPermissions = btoa(permissionsString);
        localStorage.setItem("permission", encodedPermissions);

        // Redirect user to the dashboard
        fetchCompanyInfo();
        const firstRoute = getFirstAllowedRoute();
        navigate(firstRoute);
        toast({
          title: "Success",
          description: `Login Successful!`,
        });
      } else {
        // --- ERROR LOGIC (errFlag is 1 or another non-zero value) ---
        // If the API indicates an error, set the error state with its message
        setError(response.data.message || "An unknown error occurred.");
      }
    } catch (err: any) {
      // This catches network errors or if the server is down
      console.error("Login request failed:", err);
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Could not connect to the server.";
      setError(errorMessage);
    } finally {
      setIsLoading(false); // Stop loading regardless of outcome
    }
  };

  if (localStorage.getItem("token") !== null) {
    return <Navigate to={getFirstAllowedRoute()} />;
  }

  const fetchCompanyInfo = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await axios.get(`${BASE_URL}/company-info/get/${token}`);
      const data = res.data;
      localStorage.setItem("logo", data.logo_url || "");
      console.log(data);
    } catch (error) {
      console.error(error);
      // toast("Failed to fetch company info");
    }
  };

  return (
    <div className="relative min-h-screen w-screen overflow-hidden">
      {/* 1. The Animated Background Layer: Fixed position, low z-index */}
      <div className="animated-background"></div>
      <div className="min-h-screen flex flex-col items-center justify-center p-4 -mt-16">
        <div className="mb-6">
          <LogoText iconSize="w-11 h-11" textSize="text-2xl" subtextSize="text-[10px]" />
        </div>

        <Card className="w-full max-w-md shadow-2xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Welcome Back</CardTitle>
            <CardDescription className="text-center">
              Sign in to your manufacturing dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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

              {/* Display error message if it exists */}
              {error && (
                <p className="text-sm text-red-600 text-center">{error}</p>
              )}

              {/* <div className="flex items-center justify-between">
              <Link
                to="/forgot-password"
                className="text-sm text-primary hover:underline"
              >
                Forgot password?
              </Link>
            </div> */}
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
            {/* <div className="mt-6 text-center text-sm">
            Don't have an account?{" "}
            <Link to="/signup" className="text-primary hover:underline">
              Sign up
            </Link>
          </div> */}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
