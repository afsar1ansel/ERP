// app.tsx
import React, { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { StatusBar, Style } from "@capacitor/status-bar";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { MainLayout } from "@/components/layout/MainLayout";
import { AIChatAssistant } from "@/components/chat/AIChatAssistant";


// Import your pages...
import Index from "./pages/Index";
import Login from "./pages/Login";
import Employees from "./pages/Employees";
import RawMaterials from "./pages/RawMaterials";
import FinishedGoods from "./pages/FinishedGoods";
import Purchases from "./pages/Purchases";
import Master from "./pages/Master";
import MasterBrands from "./pages/master/MasterBrands";
import MasterRawMaterialCategories from "./pages/master/MasterRawMaterialCategories";
import MasterProductSKUs from "./pages/master/MasterProductSKUs";
import MasterStockLocations from "./pages/master/MasterStockLocations";
import MasterProductCategories from "./pages/master/MasterProductCategories";
import MasterProductionStages from "./pages/master/MasterProductionStages";
import Vendors from "./pages/Vendors";
import Production from "./pages/Production";
import Dispatch from "./pages/Dispatch";
import Clients from "./pages/Clients";
import QualityControl from "./pages/QualityControl";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import Stocktransection from "./pages/Stocktransection";
import AdminUsers from "./pages/master/AdminUsers";
import MasterClientType from "./pages/master/MasterClientType";
import MasterUnitMeasurment from "./pages/master/MasterUnitMeasurment";
import MastersPaymentTerm from "./pages/master/MastersPaymentTerm";
import AuditLogPage from "./pages/AuditLogs";
import OrderPage from "./pages/Order";
import MasterProductionStagesCategories from "./pages/master/MasterProductionStagesCategories";
import EmployeeLogin from "./pages/EmployeeLogin";
import EmployeeTask from "./pages/EmployeeTask";

const queryClient = new QueryClient();

// Set the native status bar color to match app header (light: white card bg)
if (Capacitor.isNativePlatform()) {
  StatusBar.setBackgroundColor({ color: "#ffffff" });
  StatusBar.setStyle({ style: Style.Light }); // dark icons on light background
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange
    >
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <a
            href="https://thirdeyegfx.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="fixed bottom-4 right-4 text-xs bg-background/80 backdrop-blur-sm px-2 py-1 rounded-md text-muted-foreground/70 z-50 transition-colors duration-300 hover:text-foreground/90 hover:bg-background/90"
          >
            @Powered by Third Eye Creative
          </a>

          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/employee-login" element={<EmployeeLogin />} />

            {/* Protected Routes */}
            <Route
              path="/employee-task"
              element={
                <ProtectedRoute requiredPermission="employee_task">
                  <EmployeeTask />
                </ProtectedRoute>
              }
            />
            <Route
              path="/"
              element={
                //  <MainLayout>
                <ProtectedRoute requiredPermission="Dashboard">
                  <Index />
                </ProtectedRoute>
                //  </MainLayout>
              }
            />

            <Route
              path="/employees"
              element={
                //   <MainLayout>
                <ProtectedRoute requiredPermission="Employees">
                  <Employees />
                </ProtectedRoute>
                // </MainLayout>
              }
            />

            <Route
              path="/raw-materials"
              element={
                //  <MainLayout>
                <ProtectedRoute requiredPermission="Raw Materials">
                  <RawMaterials />
                </ProtectedRoute>
                //  </MainLayout>
              }
            />

            <Route
              path="/finished-goods"
              element={
                //  <MainLayout>
                <ProtectedRoute requiredPermission="Finished Goods">
                  <FinishedGoods />
                </ProtectedRoute>
                //  </MainLayout>
              }
            />

            <Route
              path="/purchases"
              element={
                //  <MainLayout>
                <ProtectedRoute requiredPermission="Purchases">
                  <Purchases />
                </ProtectedRoute>
                //  </MainLayout>
              }
            />

            <Route
              path="/master"
              element={
                //  <MainLayout>
                <ProtectedRoute requiredPermission="Master Data">
                  <Master />
                </ProtectedRoute>
                //  </MainLayout>
              }
            />

            <Route
              path="/master/brands"
              element={
                // <MainLayout>
                <ProtectedRoute requiredPermission="Master Data">
                  <MasterBrands />
                </ProtectedRoute>
                // </MainLayout>
              }
            />

            <Route
              path="/master/raw-material-categories"
              element={
                //  <MainLayout>
                <ProtectedRoute requiredPermission="Master Data">
                  <MasterRawMaterialCategories />
                </ProtectedRoute>
                //  </MainLayout>
              }
            />

            <Route
              path="/master/product-skus"
              element={
                // <MainLayout>
                <ProtectedRoute requiredPermission="Master Data">
                  <MasterProductSKUs />
                </ProtectedRoute>
                //   </MainLayout>
              }
            />

            <Route
              path="/master/stock-locations"
              element={
                // <MainLayout>
                <ProtectedRoute requiredPermission="Master Data">
                  <MasterStockLocations />
                </ProtectedRoute>
                // </MainLayout>
              }
            />

            <Route
              path="/master/product-categories"
              element={
                // <MainLayout>
                <ProtectedRoute requiredPermission="Master Data">
                  <MasterProductCategories />
                </ProtectedRoute>
                // </MainLayout>
              }
            />

            <Route
              path="/master/production-stages-categories"
              element={
                //   <MainLayout>
                <ProtectedRoute requiredPermission="Master Data">
                  <MasterProductionStagesCategories />
                </ProtectedRoute>
                // </MainLayout>
              }
            />

            <Route
              path="/master/production-stages"
              element={
                //   <MainLayout>
                <ProtectedRoute requiredPermission="Master Data">
                  <MasterProductionStages />
                </ProtectedRoute>
                // </MainLayout>
              }
            />

            <Route
              path="/master/admin_users"
              element={
                //  <MainLayout>
                <ProtectedRoute requiredPermission="Master Data">
                  <AdminUsers />
                </ProtectedRoute>
                // </MainLayout>
              }
            />

            <Route
              path="/master/client-types"
              element={
                //  <MainLayout>
                <ProtectedRoute requiredPermission="Master Data">
                  <MasterClientType />
                </ProtectedRoute>
                // </MainLayout>
              }
            />

            <Route
              path="/master/unit-measurements"
              element={
                //  <MainLayout>
                <ProtectedRoute requiredPermission="Master Data">
                  <MasterUnitMeasurment />
                </ProtectedRoute>
                // </MainLayout>
              }
            />

            <Route
              path="/master/payment-terms"
              element={
                //  <MainLayout>
                <ProtectedRoute requiredPermission="Master Data">
                  <MastersPaymentTerm />
                </ProtectedRoute>
                // </MainLayout>
              }
            />

            <Route
              path="/vendors"
              element={
                // <MainLayout>
                <ProtectedRoute requiredPermission="Vendors">
                  <Vendors />
                </ProtectedRoute>
                //  </MainLayout>
              }
            />

            <Route
              path="/production"
              element={
                // <MainLayout>
                <ProtectedRoute requiredPermission="Production">
                  <Production />
                </ProtectedRoute>
                // </MainLayout>
              }
            />

            <Route
              path="/dispatch"
              element={
                //  <MainLayout>
                <ProtectedRoute requiredPermission="Dispatch">
                  <Dispatch />
                </ProtectedRoute>
                ///MainLayout>
              }
            />

            <Route
              path="/clients"
              element={
                // <MainLayout>
                <ProtectedRoute requiredPermission="Clients">
                  <Clients />
                </ProtectedRoute>
                //  </MainLayout>
              }
            />

            <Route
              path="/qc"
              element={
                //  <MainLayout>
                <ProtectedRoute requiredPermission="Quality Control">
                  <QualityControl />
                </ProtectedRoute>
                //  </MainLayout>
              }
            />

            <Route
              path="/reports"
              element={
                // <MainLayout>
                <ProtectedRoute requiredPermission="Reports">
                  <Reports />
                </ProtectedRoute>
                //  </MainLayout>
              }
            />

            <Route
              path="/settings"
              element={
                // <MainLayout>
                <ProtectedRoute requiredPermission="Settings">
                  <Settings />
                </ProtectedRoute>
                // </MainLayout>
              }
            />

            <Route
              path="/stock-transection"
              element={
                // <MainLayout>
                <ProtectedRoute requiredPermission="Stock Transaction">
                  <Stocktransection />
                </ProtectedRoute>
                //  </MainLayout>
              }
            />

            <Route
              path="/audit-logs"
              element={
                // <MainLayout>
                <ProtectedRoute requiredPermission="Audit Logs">
                  <AuditLogPage />
                </ProtectedRoute>
                //  </MainLayout>
              }
            />

            <Route
              path="/orders"
              element={
                // <MainLayout>
                <ProtectedRoute requiredPermission="Orders">
                  <OrderPage />
                </ProtectedRoute>
                //  </MainLayout>
              }
            />

            {/* Catch-all route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          {/* Global ERP AI Chat Assistant Floating Action Drawer */}
          <AIChatAssistant mode="floating" />
        </BrowserRouter>

      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
