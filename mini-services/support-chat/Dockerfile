FROM oven/bun:1

WORKDIR /app

COPY mini-services/support-chat/package.json mini-services/support-chat/bun.lock* ./
RUN bun install --frozen-lockfile || bun install

# Copy the prisma schema from the root of the repo
COPY prisma ./prisma
RUN bunx prisma generate

# Copy the rest of the support-chat code
COPY mini-services/support-chat ./

EXPOSE 3031
CMD ["bun", "index.ts"]
