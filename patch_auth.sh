#!/bin/bash

# Patch src/services/auth/service.ts
sed -i 's/email: string;/email: string;\n  role: string;/g' src/services/auth/service.ts

# Fix authenticateUserByPassword return types in auth/service.ts
sed -i 's/id: user.id,/id: user.id,\n      role: user.role,/g' src/services/auth/service.ts

# Patch src/auth.ts to include role in token and session
cat << 'INNER_EOF' > auth_patch.js
const fs = require('fs');
let code = fs.readFileSync('src/auth.ts', 'utf8');

code = code.replace(/async jwt\(\{ token, user \}\) \{/, 'async jwt({ token, user }) {\n      if (user?.role) {\n        token.role = user.role;\n      }');
code = code.replace(/async session\(\{ session, token \}\) \{/, 'async session({ session, token }) {\n      if (token?.role) {\n        (session.user as any).role = token.role;\n      }');

fs.writeFileSync('src/auth.ts', code);
INNER_EOF
node auth_patch.js
rm auth_patch.js

