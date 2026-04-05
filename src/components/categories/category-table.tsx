import Link from "next/link";

import { CategoryRowActions } from "@/components/categories/category-row-actions";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { CategoryListRow } from "@/types";

function statusBadgeVariant(
  status: CategoryListRow["status"],
): "default" | "secondary" | "destructive" | "outline" {
  return status ? "secondary" : "destructive";
}

export function CategoryTable({ data }: { data: CategoryListRow[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Category</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Include in menu</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((row) => (
          <TableRow key={row.id}>
            <TableCell>
              <Link
                href={`/categories/${row.id}/edit`}
                className="font-medium underline-offset-4 hover:text-primary hover:underline"
              >
                {row.title}
              </Link>
              <p className="text-xs text-muted-foreground">{row.slug}</p>
            </TableCell>
            <TableCell>
              <Badge variant={statusBadgeVariant(row.status)}>
                {row.status ? "Enabled" : "Disabled"}
              </Badge>
            </TableCell>
            <TableCell>{row.include_in_nav ? "Yes" : "No"}</TableCell>
            <TableCell className="text-right">
              <CategoryRowActions id={row.id} title={row.title} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
