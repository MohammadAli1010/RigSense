"use client";

import Link from "next/link";
import { useActionState } from "react";

import { loginAction } from "@/actions/auth";
import { AuthCard } from "@/components/auth/auth-card";
import { FormField } from "@/components/auth/form-field";
import type { AuthActionState } from "@/lib/validators";

const initialState: AuthActionState = {};

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, initialState);

  return (
    <AuthCard
      title="Log in"
      description="Pick up where you left off in your private builds, benchmarks, and saved planning sessions."
      footer={
        <>
          Need an account?{" "}
          <Link href="/register" className="text-cyan-300 hover:text-cyan-200">
            Register here
          </Link>
          .
        </>
      }
    >
      <form action={action} className="space-y-5">
        <FormField
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          errors={state.fieldErrors?.email}
          required
        />
        <FormField
          label="Password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="Enter your password"
          errors={state.fieldErrors?.password}
          required
        />
        {state.message ? (
          <p className="rounded-2xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">
            {state.message}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {pending ? "Logging in..." : "Log in"}
        </button>
      </form>
    </AuthCard>
  );
}
