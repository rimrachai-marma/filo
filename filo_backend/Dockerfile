# ─── Stage 1: Install dependencies ──────────────────────────────────────────
FROM oven/bun:1.3.14-alpine AS deps

WORKDIR /app

# Copy package manifest + lockfile first (layer cache)
COPY package.json bun.lockb* ./

RUN bun install --frozen-lockfile


# ─── Stage 2: Generate Prisma client ─────────────────────────────────────────
FROM deps AS prisma

COPY prisma ./prisma
COPY prisma.config.ts ./
COPY tsconfig.json ./
COPY src ./src

RUN DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy" bunx prisma generate


# ─── Stage 3: Production image ───────────────────────────────────────────────
FROM oven/bun:1.3.14-alpine AS runner

WORKDIR /app

# Non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy everything needed at runtime
COPY --from=prisma /app/node_modules ./node_modules
COPY --from=prisma /app/src ./src
COPY --from=prisma /app/prisma ./prisma
COPY --from=prisma /app/prisma.config.ts ./
COPY package.json tsconfig.json index.ts ./

ENV NODE_ENV=production
ENV PORT=8080

# Create writable dirs for temp uploads
RUN mkdir -p ./uploads ./temp_uploads && chown -R appuser:appgroup /app

USER appuser

EXPOSE 8080

CMD ["bun", "run", "index.ts"]