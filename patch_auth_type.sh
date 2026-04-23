#!/bin/bash
cat << 'INNER_EOF' > src/auth.d.ts
import "next-auth";

declare module "next-auth" {
  interface User {
    id?: string;
    role?: string;
  }
  interface Session {
    user: User & {
      id: string;
      role: string;
    };
  }
}
INNER_EOF
