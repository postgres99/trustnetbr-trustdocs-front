FROM node:20-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:1.27-alpine
ENV API_UPSTREAM=http://api:8080
COPY docker/nginx.conf.template /etc/nginx/templates/default.conf.template
COPY docker/10-enable-https.sh /docker-entrypoint.d/10-enable-https.sh
RUN chmod +x /docker-entrypoint.d/10-enable-https.sh
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 8080 8443
