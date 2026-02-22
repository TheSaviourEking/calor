FROM oven/bun:1

WORKDIR /app

COPY mini-services/live-stream/package.json mini-services/live-stream/bun.lock* ./
RUN bun install --frozen-lockfile || bun install

# Copy the prisma schema from the root of the repo
COPY prisma ./prisma
RUN bunx prisma generate

# Copy the rest of the live-stream code
COPY mini-services/live-stream ./

EXPOSE 3032
CMD ["bun", "index.ts"]
