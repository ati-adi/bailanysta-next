# Production image for Bailanysta (Next.js + libSQL).
# База по умолчанию — SQLite-файл в /app/data; примонтируйте туда volume.
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL=file:/app/data/bailanysta.db
COPY --from=build /app/package.json /app/package-lock.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/next.config.ts ./
# Контейнер работает от root: примонтированный volume принадлежит root,
# а libSQL должен иметь права на запись в /app/data.
RUN mkdir -p /app/data
EXPOSE 3000
CMD ["npm", "start"]
