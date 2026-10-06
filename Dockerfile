FROM node:24.21.0-alpine AS build
WORKDIR /app
RUN npm install --global pnpm@12.9.1
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
RUN pnpm install --frozen-lockfile
COPY . .
ARG SITE_URL
ARG RAILWAY_PUBLIC_DOMAIN
ARG CONTENT_DIR=src/content
ENV SITE_URL=$SITE_URL \
    RAILWAY_PUBLIC_DOMAIN=$RAILWAY_PUBLIC_DOMAIN \
    CONTENT_DIR=$CONTENT_DIR
RUN pnpm exec astro build

FROM caddy:2.11.4-alpine
COPY Caddyfile /etc/caddy/Caddyfile
COPY --from=build /app/dist /srv
ENV PORT=8080 \
    X_ROBOTS_TAG=all
EXPOSE 8080
CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile", "--adapter", "caddyfile"]
