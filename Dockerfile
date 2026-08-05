# Next.js 14 (App Router) pro nethost cluster.
#
# Staví se do `output: 'standalone'` (viz next.config.mjs) — Next tím vygeneruje
# server.js s jen těmi závislostmi, které aplikace opravdu volá. Výsledný obraz
# je řádově menší než kopírovat celé node_modules a nepotřebuje `next start`.
#
# Vzor odpovídá tomu, jak v tomhle clusteru běží frenkee-web: Node, port 3000,
# obraz z GHCR.

FROM node:22-bookworm-slim AS deps
WORKDIR /app
# `npm ci` schválně, ne `install`: staví přesně podle package-lock.json,
# takže build je reprodukovatelný a nezvedne verzi pod rukama.
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Telemetrii Nextu vypínáme — build běží v clusteru a nemá volat ven.
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:22-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

# Nonroot. Uživatel 1001 odpovídá tomu, co v clusteru běží u ostatních webů.
RUN groupadd -g 1001 nodejs && useradd -u 1001 -g nodejs -m nextjs

# `standalone` nese server.js + minimální node_modules; `static` a `public`
# se kopírují zvlášť, protože je standalone build záměrně nepřibaluje.
COPY --from=build --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=build --chown=nextjs:nodejs /app/public ./public

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
