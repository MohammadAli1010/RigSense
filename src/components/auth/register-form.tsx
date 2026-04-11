"use client";

import Link from "next/link";
import { useActionState } from "react";

import { registerAction } from "@/actions/auth";
import { AuthCard } from "@/components/auth/auth-card";
import { FormField } from "@/components/auth/form-field";
import type { AuthActionState } from "@/lib/validators";

const initialState: AuthActionState = {};

export function RegisterForm() {
  const [state, action, pending] = useActionState(registerAction, initialState);

  return (
    <AuthCard
      title="Create your account"
      description="Start with private saved builds today and publish your best completed rigs later when you are ready."
      footer={
        <>
          Already registered?{" "}
          <Link href="/login" className="text-cyan-300 hover:text-cyan-200">
            Log in here
          </Link>
          .
        </>
      }
    >
      <form action={action} className="space-y-5">
        <FormField
          label="Name"
          name="name"
          type="text"
          autoComplete="name"
          placeholder="Your display name"
          errors={state.fieldErrors?.name}
          required
        />
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
          autoComplete="new-password"
          placeholder="At least 8 characters"
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
          {pending ? "Creating account..." : "Create account"}
        </button>
      </form>
    </AuthCard>
  );
}
