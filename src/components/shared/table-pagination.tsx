import Link from "next/link";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type TablePaginationProps = {
  page: number;
  pageSize: number;
  count: number;
  basePath: string;
  className?: string;
};

export function TablePagination({
  page,
  pageSize,
  count,
  basePath,
  className,
}: TablePaginationProps) {
  const totalPages = Math.max(1, Math.ceil(count / pageSize));
  const hasPrev = page > 1;
  const hasNext = page * pageSize < count;

  const href = (p: number) => (p <= 1 ? basePath : `${basePath}?page=${p}`);

  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 border-t pt-4",
        className,
      )}
    >
      <p className="text-sm text-muted-foreground">
        Page {count === 0 ? 0 : page} of {count === 0 ? 0 : totalPages}
      </p>
      <div className="flex gap-2">
        {hasPrev ? (
          <Button variant="outline" size="sm" asChild>
            <Link href={href(page - 1)} prefetch={false}>
              Previous
            </Link>
          </Button>
        ) : (
          <Button variant="outline" size="sm" disabled>
            Previous
          </Button>
        )}
        {hasNext ? (
          <Button variant="outline" size="sm" asChild>
            <Link href={href(page + 1)} prefetch={false}>
              Next
            </Link>
          </Button>
        ) : (
          <Button variant="outline" size="sm" disabled>
            Next
          </Button>
        )}
      </div>
    </div>
  );
}
