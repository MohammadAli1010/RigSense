#!/bin/bash
# Insert enum Role
sed -i '/enum JobStatus/a \
\
enum Role {\n  USER\n  MODERATOR\n  ADMIN\n}' prisma/schema.prisma

# Insert role field to User model
sed -i '/reputationScore Int/a \  role            Role            @default(USER)' prisma/schema.prisma
