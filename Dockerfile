
# Multi-stage build for Next.js app in nextjs_space subdirectory
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# Install dependencies from nextjs_space
COPY nextjs_space/package.json nextjs_space/yarn.lock* ./
RUN yarn install --frozen-lockfile

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY nextjs_space/ .

# Generate Prisma Client with build-time DATABASE_URL
# Use a dummy URL if not provided - the real one comes from runtime secrets
ARG DATABASE_URL=postgresql://buildtime:buildtime@localhost:5432/placeholder?schema=public
ENV DATABASE_URL=$DATABASE_URL
RUN npx prisma generate

# Build Next.js with standalone output
ENV NEXT_TELEMETRY_DISABLED 1
ENV NEXT_OUTPUT_MODE standalone
RUN yarn build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Copy Prisma-related files for migrations
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder /app/prisma ./prisma

# Create .bin directory and set up prisma symlink
RUN mkdir -p ./node_modules/.bin && \
    ln -s ../prisma/build/index.js ./node_modules/.bin/prisma

COPY --from=builder /app/scripts/startup.sh ./scripts/startup.sh

# Create uploads directory (will be mounted to GCS in production)
RUN mkdir -p /app/uploads && chown nextjs:nodejs /app/uploads

# Make startup script executable
RUN chmod +x ./scripts/startup.sh

USER nextjs

EXPOSE 8080

ENV PORT 8080
ENV HOSTNAME "0.0.0.0"

CMD ["./scripts/startup.sh"]
