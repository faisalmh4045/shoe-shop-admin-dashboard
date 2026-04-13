"use client";

import { Button } from "@/components/ui/button";
import { MutateButton } from "@/components/shared/mutate-button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type {
  ProductVariantForProductDetail,
  VariantGroupAttributeForProductDetail,
} from "@/types";
import { formatCurrency } from "@/lib/utils";

export type VariantsTableProps = {
  groupAttributes: VariantGroupAttributeForProductDetail[];
  variants: ProductVariantForProductDetail[];
  onAdd: () => void;
  onEdit: (variant: ProductVariantForProductDetail) => void;
};

function optionLabel(
  variant: ProductVariantForProductDetail,
  attributeId: string,
): string {
  const row = variant.variant_attribute_values.find(
    (v) => v.attribute_id === attributeId,
  );
  return row?.option_text ?? "—";
}

export function VariantsTable({
  groupAttributes,
  variants,
  onAdd,
  onEdit,
}: VariantsTableProps) {
  const hasVariants = variants.length > 0;

  return (
    <div className="flex flex-col gap-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-14">Image</TableHead>
            {groupAttributes.map((ga) => (
              <TableHead key={ga.id}>{ga.attribute_name}</TableHead>
            ))}
            <TableHead>SKU</TableHead>
            <TableHead className="text-right">Price</TableHead>
            <TableHead className="text-right">Qty</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-24 text-right"> </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {!hasVariants ? (
            <TableRow>
              <TableCell
                colSpan={6 + groupAttributes.length}
                className="text-center text-sm text-muted-foreground"
              >
                No variants to show.
              </TableCell>
            </TableRow>
          ) : (
            variants.map((v) => {
              const thumb = v.variant_images[0]?.image_url;
              return (
                <TableRow key={v.id}>
                  <TableCell>
                    {thumb ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={thumb}
                        alt=""
                        className="size-10 rounded border object-cover"
                      />
                    ) : (
                      <div className="size-10 rounded border bg-muted" />
                    )}
                  </TableCell>
                  {groupAttributes.map((ga) => (
                    <TableCell key={ga.id} className="text-sm">
                      {optionLabel(v, ga.attribute_id)}
                    </TableCell>
                  ))}
                  <TableCell className="font-mono text-sm">{v.sku}</TableCell>
                  <TableCell className="text-right text-sm">
                    {v.price != null ? formatCurrency(Number(v.price)) : "—"}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {v.quantity}
                  </TableCell>
                  <TableCell className="text-sm">{v.status}</TableCell>
                  <TableCell className="text-right">
                    <MutateButton
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(v)}
                    >
                      Edit
                    </MutateButton>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
      <div className="flex justify-end">
        <Button type="button" onClick={() => onAdd()}>
          Add variant
        </Button>
      </div>
    </div>
  );
}
