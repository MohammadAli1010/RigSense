"use server";

import { AuthError } from "next-auth";

import { signIn, signOut } from "@/auth";
import {
  getFieldErrors,
  type AuthActionState,
  loginSchema,
  registerSchema,
} from "@/lib/validators";
import { registerUserAccount } from "@/services/auth/service";

export async function loginAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      fieldErrors: getFieldErrors(parsed.error),
    };
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: "/profile",
    });

    return {};
  } catch (error) {
    if (error instanceof AuthError) {
      return {
        message: "Invalid email or password.",
      };
    }

    throw error;
  }
}

export async function registerAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      fieldErrors: getFieldErrors(parsed.error),
    };
  }

  const registration = await registerUserAccount(parsed.data);

  if (registration.status === "email-taken") {
    return {
      fieldErrors: {
        email: ["An account already exists for that email address."],
      },
    };
  }

  await signIn("credentials", {
    email: parsed.data.email,
    password: parsed.data.password,
    redirectTo: "/profile",
  });

  return {};
}

export async function logoutAction() {
  await signOut({
    redirectTo: "/",
  });
}
