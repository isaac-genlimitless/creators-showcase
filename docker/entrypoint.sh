#!/bin/sh
set -e
# Run migrations then start the standalone server
npx prisma migrate deploy --schema=./prisma/schema.prisma
exec node server.js
