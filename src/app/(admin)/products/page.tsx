import Link from "next/link";
import { Plus } from "lucide-react";

import { ProductTable } from "@/components/products/product-table";
import { TablePagination } from "@/components/shared/table-pagination";
import { Button } from "@/components/ui/button";
import { requireAdmin } from "@/dal/auth.dal";
import { getProducts } from "@/dal/products.dal";

const PAGE_SIZE = 10;

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  await requireAdmin();
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
  const { data, count } = await getProducts(page, PAGE_SIZE);

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 lg:p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Products</h1>
        <Button asChild>
          <Link href="/products/new">
            <Plus data-icon="inline-start" />
            Add product
          </Link>
        </Button>
      </div>

      {count === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-border bg-muted/30 px-6 py-16 text-center">
          <p className="text-sm text-muted-foreground">
            No products yet. Create your first product to see it here.
          </p>
          <Button asChild>
            <Link href="/products/new">
              <Plus data-icon="inline-start" />
              Add product
            </Link>
          </Button>
        </div>
      ) : (
        <>
          <ProductTable data={data} />
          <TablePagination
            page={page}
            pageSize={PAGE_SIZE}
            count={count}
            basePath="/products"
          />
        </>
      )}
    </div>
  );
}
