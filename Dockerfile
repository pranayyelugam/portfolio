# Build stage
FROM node:20-alpine as build

WORKDIR /app

COPY package*.json ./
RUN npm install --legacy-peer-deps

COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine
# Copy to /portfolio subdirectory so serving matches the 'base' config
COPY --from=build /app/dist /usr/share/nginx/html/portfolio
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
