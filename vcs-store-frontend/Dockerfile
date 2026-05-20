ARG BUILD_CONFIG=production

FROM node:20-alpine AS build
ARG BUILD_CONFIG
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build -- --configuration=${BUILD_CONFIG}

FROM nginx:alpine
COPY --from=build /app/dist/vcs-store-front/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
EXPOSE 80
ENTRYPOINT ["/entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
