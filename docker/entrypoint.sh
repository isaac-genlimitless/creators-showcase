#!/bin/sh
set -e
# Run migrations with the Prisma CLI pinned in the image (/prisma-cli), then start the standalone server.
# Never `npx prisma` here: the standalone output has no prisma binary, so npx would download one at start-up.
node /prisma-cli/node_modules/prisma/build/index.js migrate deploy --schema=./prisma/schema.prisma
exec node server.js
