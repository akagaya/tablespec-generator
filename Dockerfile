# Base
FROM node:24-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Dev
FROM base AS dev
COPY . .
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

# Build
FROM base AS build
COPY . .
RUN npm run build

# Prod
FROM nginx:alpine AS prod
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

