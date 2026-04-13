import { compare, hash } from "bcryptjs";

import { analytics } from "@/lib/analytics";
import { prisma } from "@/lib/db";
import { errorReporting } from "@/lib/error-reporting";
import { logger } from "@/lib/logger";

type SessionUser = {
  id: string;
  name: string;
  email: string;
};

export type RegisterUserInput = {
  name: string;
  email: string;
  password: string;
};

export type RegisterUserResult =
  | {
      status: "created";
      user: SessionUser;
    }
  | {
      status: "email-taken";
    };

export async function authenticateUserByPassword(email: string, password: string) {
  try {
    const user = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (!user) {
      analytics.track("auth_login_failed", {
        reason: "email_not_found",
      });
      return null;
    }

    const passwordMatches = await compare(password, user.passwordHash);

    if (!passwordMatches) {
      analytics.track("auth_login_failed", {
        reason: "invalid_password",
        userId: user.id,
      });
      return null;
    }

    analytics.track("auth_login_succeeded", {
      userId: user.id,
    });

    return {
      id: user.id,
      name: user.name,
      email: user.email,
    } satisfies SessionUser;
  } catch (error) {
    errorReporting.captureException(error, {
      scope: "auth.authenticate",
    });
    throw error;
  }
}

export async function registerUserAccount({ name, email, password }: RegisterUserInput): Promise<RegisterUserResult> {
  try {
    const existingUser = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (existingUser) {
      analytics.track("auth_register_rejected", {
        reason: "email_taken",
      });
      return {
        status: "email-taken",
      };
    }

    const passwordHash = await hash(password, 12);
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
      },
    });

    logger.info("auth.user_registered", {
      userId: user.id,
    });
    analytics.track("auth_register_succeeded", {
      userId: user.id,
    });

    return {
      status: "created",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    };
  } catch (error) {
    errorReporting.captureException(error, {
      scope: "auth.register",
    });
    throw error;
  }
}

export async function findUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: {
      email,
    },
  });
}
