"use client";

import { formatCurrency, formatDate } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { DashboardOrder } from "@/types";

interface RecentOrdersTableProps {
  orders: DashboardOrder[];
}

const statusStyles = {
  NEW: "bg-blue-100 text-blue-800",
  PROCESSING: "bg-yellow-100 text-yellow-800",
  COMPLETED: "bg-green-100 text-green-800",
  CANCELED: "bg-red-100 text-red-800",
} as const;

export function RecentOrdersTable({ orders }: RecentOrdersTableProps) {
  return (
    <Card>
      <div className="p-6">
        <h3 className="mb-4 text-lg font-semibold text-foreground">
          Recent Orders
        </h3>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground">
                  Order Number
                </TableHead>
                <TableHead className="text-muted-foreground">Date</TableHead>
                <TableHead className="text-muted-foreground">Email</TableHead>
                <TableHead className="text-muted-foreground">Method</TableHead>
                <TableHead className="text-muted-foreground">Status</TableHead>
                <TableHead className="text-right text-muted-foreground">
                  Amount
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="py-8 text-center text-muted-foreground"
                  >
                    No orders found
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((order) => {
                  const status =
                    order.order_status as keyof typeof statusStyles;
                  return (
                    <TableRow
                      key={order.id}
                      className="border-b border-border hover:bg-muted/50"
                    >
                      <TableCell className="font-medium text-foreground">
                        {order.order_number}
                      </TableCell>
                      <TableCell>{formatDate(order.placed_at)}</TableCell>
                      <TableCell>{order.email}</TableCell>
                      <TableCell>{order.payment_method}</TableCell>
                      <TableCell>
                        <Badge
                          className={statusStyles[status]}
                          variant="outline"
                        >
                          {status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium text-foreground">
                        {formatCurrency(order.total ?? 0)}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </Card>
  );
}
