import Image from "next/image";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ProductListRow } from "@/types";
import { formatCurrency } from "@/lib/utils";

function statusBadgeVariant(
  status: ProductListRow["status"],
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "ENABLED":
      return "secondary";
    case "DISABLED":
      return "destructive";
    default:
      return "outline";
  }
}

export function ProductTable({ data }: { data: ProductListRow[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[4.5rem] text-center font-medium">
            Thumbnail
          </TableHead>
          <TableHead>Product</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Price</TableHead>
          <TableHead className="text-right">Stock</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((row) => (
          <TableRow key={row.id}>
            <TableCell className="w-[4.5rem] align-middle">
              <div className="flex justify-center">
                {row.thumbnail_url ? (
                  <Image
                    src={row.thumbnail_url}
                    alt=""
                    width={40}
                    height={40}
                    unoptimized
                    className="size-10 rounded-md bg-muted object-cover"
                  />
                ) : (
                  <div
                    className="flex size-10 items-center justify-center rounded-md bg-muted text-[10px] text-muted-foreground"
                    aria-hidden
                  >
                    —
                  </div>
                )}
              </div>
            </TableCell>
            <TableCell>
              <Link
                href={`/products/${row.id}/edit`}
                className="font-medium underline-offset-4 hover:text-primary hover:underline"
              >
                {row.title}
              </Link>
              <p className="text-xs text-muted-foreground">{row.sku}</p>
            </TableCell>
            <TableCell>{row.categories?.title ?? "—"}</TableCell>
            <TableCell>
              <Badge variant={statusBadgeVariant(row.status)}>
                {row.status}
              </Badge>
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {formatCurrency(row.price)}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {row.quantity > 0 ? row.quantity : "Out of stock"}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
