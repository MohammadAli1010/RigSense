import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

import { env } from "@/lib/env";
import { loginSchema } from "@/lib/validators";
import { authenticateUserByPassword } from "@/services/auth/service";

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: env.AUTH_SECRET,
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      credentials: {
        email: {
          label: "Email",
          type: "email",
        },
        password: {
          label: "Password",
          type: "password",
        },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);

        if (!parsed.success) {
          return null;
        }

        const user = await authenticateUserByPassword(parsed.data.email, parsed.data.password);

        if (!user) {
          return null;
        }

        return user;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if ((user as unknown as { role: string })?.role) {
        token.role = (user as unknown as { role: string }).role;
      }
      if (user?.id) {
        token.id = user.id;
      }

      return token;
    },
    async session({ session, token }) {
      if (token?.role) {
        (session.user as unknown as { role: string }).role = token.role;
      }
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }

      return session;
    },
  },
});
