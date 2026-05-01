"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { login } from "@/actions/auth.actions";
import { LoginSchema, type LoginInput } from "@/validations/auth.validations";

export default function LoginPage() {
  const form = useForm<LoginInput>({
    resolver: zodResolver(LoginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (values: LoginInput) => {
    const fd = new FormData();
    fd.set("email", values.email);
    fd.set("password", values.password);

    const result = await login(fd);
    if (result && !result.success) {
      form.setError("root", { message: result.error });
    }
  };

  const fillDemo = () => {
    form.setValue("email", "demo@shoeshop.com");
    form.setValue("password", "12345678");
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          Welcome back, admin
        </h1>
        <p className="text-sm text-muted-foreground">
          Access your ShoeShop dashboard
        </p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="user@example.com"
            className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            {...form.register("email")}
          />
          {form.formState.errors.email && (
            <p className="text-sm text-destructive">
              {form.formState.errors.email.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-medium">
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            {...form.register("password")}
          />
          {form.formState.errors.password && (
            <p className="text-sm text-destructive">
              {form.formState.errors.password.message}
            </p>
          )}
        </div>

        {form.formState.errors.root && (
          <p className="text-sm text-destructive">
            {form.formState.errors.root.message}
          </p>
        )}

        <Button
          type="submit"
          className="h-10 w-full"
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting ? "Signing in..." : "Sign in"}
        </Button>
      </form>

      {/* Demo section */}
      <div className="rounded-lg border border-dashed border-border bg-muted p-4 text-sm text-muted-foreground">
        <div className="flex items-center justify-between">
          <p className="font-medium">Demo account</p>
          <Button type="button" variant="outline" size="sm" onClick={fillDemo}>
            Use demo
          </Button>
        </div>
        <p>
          Email: <span className="font-medium">demo@shoeshop.com</span>
        </p>
        <p>
          Password: <span className="font-medium">12345678</span>
        </p>
      </div>
    </div>
  );
}
