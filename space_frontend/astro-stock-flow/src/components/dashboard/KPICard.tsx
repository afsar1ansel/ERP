import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge";
// import { LucideIcon } from "lucide-react";

interface KpiCardData {
  title: string;
  value: string;
  change: string;
  changeType: "positive" | "negative";
  icon: React.ComponentType<any>; // Type for Lucide icons
  subtitle: string;
}

export function KPICard({ title, value, change, changeType, icon: Icon, subtitle }: KpiCardData) {
  const changeVariant = changeType === "positive" ? "success" : 
                       changeType === "negative" ? "destructive" : "secondary";

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        )}
        {/* <div className="flex items-center mt-2">
          <Badge variant={changeVariant} className="text-xs">
            {change}
          </Badge>
        </div> */}
      </CardContent>
    </Card>
  );
}