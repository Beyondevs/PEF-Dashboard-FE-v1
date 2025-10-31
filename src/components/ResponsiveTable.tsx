import * as React from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MobileCard } from "@/components/MobileCard";
import { cn } from "@/lib/utils";

export interface ColumnDef<T> {
  key: string;
  header: string;
  render: (item: T) => React.ReactNode;
  mobileRender?: (item: T) => React.ReactNode;
  mobilePriority?: number;
}

export interface ResponsiveTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  getRowKey: (item: T) => string;
  className?: string;
  mobileCardProps?: (item: T) => {
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
  };
  emptyMessage?: string;
}

export function ResponsiveTable<T>({
  data,
  columns,
  getRowKey,
  className,
  mobileCardProps,
  emptyMessage = "No items found",
}: ResponsiveTableProps<T>) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <div className={cn("space-y-3", className)}>
        {data.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">{emptyMessage}</div>
        ) : (
          data.map((item) => {
            const cardProps = mobileCardProps
              ? mobileCardProps(item)
              : {
                  title: String(item),
                  metadata: columns
                    .filter((col) => col.mobilePriority !== undefined)
                    .sort((a, b) => (a.mobilePriority || 0) - (b.mobilePriority || 0))
                    .slice(0, 3)
                    .map((col) => ({
                      label: col.header,
                      value: String(col.mobileRender ? col.mobileRender(item) : col.render(item)),
                    })),
                };

            return (
              <MobileCard
                key={getRowKey(item)}
                {...cardProps}
                expandable={true}
              >
                <div className="space-y-2">
                  {columns.map((col) => (
                    <div key={col.key} className="flex justify-between gap-2 text-sm">
                      <span className="text-muted-foreground">{col.header}:</span>
                      <span className="font-medium text-right">{col.mobileRender ? col.mobileRender(item) : col.render(item)}</span>
                    </div>
                  ))}
                </div>
              </MobileCard>
            );
          })
        )}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table className={className}>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead key={column.key}>{column.header}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="text-center py-8 text-muted-foreground">
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            data.map((item) => (
              <TableRow key={getRowKey(item)}>
                {columns.map((column) => (
                  <TableCell key={column.key}>{column.render(item)}</TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
