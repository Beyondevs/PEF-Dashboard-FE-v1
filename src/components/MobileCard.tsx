import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

export interface MobileCardProps {
  title: string;
  subtitle?: string;
  badges?: Array<{
    label: string;
    variant?: "default" | "secondary" | "outline" | "destructive";
  }>;
  metadata?: Array<{
    label: string;
    value: string | number;
    icon?: React.ReactNode;
  }>;
  actions?: React.ReactNode;
  expandable?: boolean;
  defaultExpanded?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export function MobileCard({
  title,
  subtitle,
  badges = [],
  metadata = [],
  actions,
  expandable = false,
  defaultExpanded = false,
  className,
  children,
}: MobileCardProps) {
  const [isExpanded, setIsExpanded] = React.useState(defaultExpanded);

  return (
    <Card className={cn("overflow-hidden transition-all duration-200 hover:shadow-md active:scale-[0.99] animate-slide-up", className)}>
      <CardHeader className="pb-3 space-y-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base font-semibold line-clamp-2">{title}</CardTitle>
            {subtitle && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{subtitle}</p>
            )}
          </div>
          {expandable && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-9 w-9 p-0 shrink-0 touch-manipulation"
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>

        {badges.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {badges.map((badge, index) => (
              <Badge key={index} variant={badge.variant || "secondary"} className="text-xs">
                {badge.label}
              </Badge>
            ))}
          </div>
        )}
      </CardHeader>

      {(metadata.length > 0 || actions || (expandable && isExpanded && children)) && (
        <CardContent className="pt-0 space-y-3">
          {metadata.length > 0 && (
            <div className="flex flex-col gap-2">
              {metadata.map((item, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  {item.icon && <span className="text-muted-foreground shrink-0">{item.icon}</span>}
                  <span className="text-muted-foreground shrink-0">{item.label}:</span>
                  <span className="font-medium text-foreground truncate">{item.value}</span>
                </div>
              ))}
            </div>
          )}

          {actions && (
            <div className="flex flex-wrap gap-2 pt-1">{actions}</div>
          )}

          {expandable && isExpanded && children && (
            <div className="pt-2 border-t">{children}</div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
