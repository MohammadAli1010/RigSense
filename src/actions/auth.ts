"use server";

import { hash } from "bcryptjs";
import { AuthError } from "next-auth";

import { signIn, signOut } from "@/auth";
import { prisma } from "@/lib/db";
import {
  getFieldErrors,
  type AuthActionState,
  loginSchema,
  registerSchema,
} from "@/lib/validators";

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

  const existingUser = await prisma.user.findUnique({
    where: {
      email: parsed.data.email,
    },
  });

  if (existingUser) {
    return {
      fieldErrors: {
        email: ["An account already exists for that email address."],
      },
    };
  }

  const passwordHash = await hash(parsed.data.password, 12);

  await prisma.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      passwordHash,
    },
  });

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
