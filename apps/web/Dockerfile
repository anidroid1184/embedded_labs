FROM node:24-bookworm-slim
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@10.33.0 --activate
COPY apps/web/package.json apps/web/pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY apps/web/ ./
ENV VITE_API_PROXY_TARGET=http://api:8080
EXPOSE 5173
CMD ["pnpm", "dev", "--host", "0.0.0.0", "--port", "5173"]
