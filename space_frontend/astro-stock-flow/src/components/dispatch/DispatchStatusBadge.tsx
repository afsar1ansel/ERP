import { Badge } from "@/components/ui/badge";
import { Clock, Package, Truck, CheckCircle } from "lucide-react";

interface DispatchStatusBadgeProps {
  status: "pending" | "packed" | "shipped" | "delivered";
}

export const DispatchStatusBadge = ({ status }: DispatchStatusBadgeProps) => {
  const getStatusConfig = (status: string) => {
    switch ((status || "").toLowerCase()) {
      case "pending":
        return {
          variant: "secondary" as const,
          icon: Clock,
          label: "Pending"
        };
      case "packed":
        return {
          variant: "default" as const,
          icon: Package,
          label: "Packed"
        };
      case "shipped":
        return {
          variant: "secondary" as const,
          icon: Truck,
          label: "Shipped"
        };
      case "delivered":
        return {
          variant: "default" as const,
          icon: CheckCircle,
          label: "Delivered"
        };
      default:
        return {
          variant: "outline" as const,
          icon: Clock,
          label: status
        };
    }
  };

  const config = getStatusConfig(status);
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className="gap-1">
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
};