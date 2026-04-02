import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function UnauthorizedPage() {
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-10">
      <div className="rounded-xl border bg-card p-6 shadow-sm sm:p-8">
        <h1 className="text-2xl font-semibold tracking-tight">Unauthorized</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          You don&apos;t have admin access.
        </p>

        <Button asChild className="mt-6 w-full">
          <Link href="/login">Back to login</Link>
        </Button>
      </div>
    </div>
  );
}
