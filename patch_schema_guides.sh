#!/bin/bash
sed -i '/coverImageUrl String?/a \  isPublished   Boolean  @default(false)' prisma/schema.prisma
npx prisma format
npx prisma generate
