# syntax=docker/dockerfile:1
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json .npmrc ./
RUN npm ci

FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# NEXT_PUBLIC_* di-inline ke bundel klien saat build, jadi harus ada di sini.
# Env lain (DATABASE_URL, AUTH_*) dibaca saat runtime dari /etc/horashub/app.env.
ARG NEXT_PUBLIC_ROOT_DOMAIN
ENV NEXT_PUBLIC_ROOT_DOMAIN=$NEXT_PUBLIC_ROOT_DOMAIN
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production HOSTNAME=0.0.0.0 PORT=3000 NEXT_TELEMETRY_DISABLED=1
RUN addgroup -g 1001 -S nodejs && adduser -u 1001 -S nextjs -G nodejs
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
# src/db/index.ts require('ws') sebagai fallback WebSocket; tidak ikut ter-trace ke standalone.
COPY --from=deps /app/node_modules/ws ./node_modules/ws
USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
