import { z } from "zod";

export const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters long.")
    .max(60, "Name must be 60 characters or fewer."),
  email: z.string().trim().email("Enter a valid email address."),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters long.")
    .regex(/[a-zA-Z]/, "Password must include at least one letter.")
    .regex(/[0-9]/, "Password must include at least one number."),
});

export const loginSchema = registerSchema.pick({
  email: true,
  password: true,
});

type AuthField = "name" | "email" | "password";

export type AuthActionState = {
  message?: string;
  fieldErrors?: Partial<Record<AuthField, string[]>>;
};

export function getFieldErrors(error: z.ZodError): AuthActionState["fieldErrors"] {
  return error.flatten().fieldErrors;
}
