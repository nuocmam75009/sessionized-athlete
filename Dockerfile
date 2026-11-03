# ---- Dépendances (installation reproductible depuis le lockfile) ----
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ---- Build ----
FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Seules les variables NEXT_PUBLIC_ sont figées ici, dans le bundle du
# navigateur. API_URL et COOKIE_DOMAIN sont lues au démarrage du conteneur :
# la même image sert tous les environnements.
ARG NEXT_PUBLIC_COACH_APP_URL=http://localhost:3002
ENV NEXT_PUBLIC_COACH_APP_URL=$NEXT_PUBLIC_COACH_APP_URL
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ---- Image finale : serveur standalone, sans node_modules complet ----
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

# server.js ne sert public/ et .next/static que s'ils sont copiés à côté de lui.
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/public ./public

# Utilisateur non privilégié fourni par l'image node.
USER node
EXPOSE 3000
CMD ["node", "server.js"]
