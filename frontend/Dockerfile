FROM node:20-alpine AS builder

RUN apk add --no-cache python3 make g++

WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps

COPY . .

ENV NODE_OPTIONS=--max-old-space-size=4096 \
    GENERATE_SOURCEMAP=false

RUN npx craco build || { echo "Build falhou, tentando com menos memória..."; NODE_OPTIONS=--max-old-space-size=2048 npx craco build; }

FROM nginx:alpine
COPY --from=builder /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY docker-entrypoint.sh /docker-entrypoint.d/40-runtime-env.sh
RUN chmod +x /docker-entrypoint.d/40-runtime-env.sh
EXPOSE 3000
CMD ["nginx", "-g", "daemon off;"]
