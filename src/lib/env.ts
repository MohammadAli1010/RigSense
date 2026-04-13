import { z } from "zod";

const runtimeEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  AUTH_SECRET: z.string().min(1, "AUTH_SECRET is required."),
  AUTH_URL: z.string().url("AUTH_URL must be a valid URL."),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required."),
  DIRECT_DATABASE_URL: z.string().min(1).optional(),
  SHADOW_DATABASE_URL: z.string().min(1).optional(),
});

function formatEnvErrors(error: z.ZodError) {
  return error.issues
    .map((issue) => {
      const path = issue.path.join(".") || "env";

      return `${path}: ${issue.message}`;
    })
    .join("; ");
}

function parseRuntimeEnv() {
  const parsed = runtimeEnvSchema.safeParse(process.env);

  if (!parsed.success) {
    throw new Error(`Invalid runtime environment variables: ${formatEnvErrors(parsed.error)}`);
  }

  return parsed.data;
}

export const env = parseRuntimeEnv();

export function getPrismaToolingEnv() {
  const parsed = z
    .object({
      DIRECT_DATABASE_URL: z.string().min(1, "DIRECT_DATABASE_URL is required."),
      SHADOW_DATABASE_URL: z.string().min(1, "SHADOW_DATABASE_URL is required."),
    })
    .safeParse(process.env);

  if (!parsed.success) {
    throw new Error(`Invalid Prisma tooling environment variables: ${formatEnvErrors(parsed.error)}`);
  }

  return parsed.data;
}

export const isDevelopment = env.NODE_ENV === "development";
export const isProduction = env.NODE_ENV === "production";
export const isTest = env.NODE_ENV === "test";
