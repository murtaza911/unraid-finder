FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* ./
COPY client/package.json ./client/
COPY server/package.json ./server/
RUN npm install
COPY client/ ./client/
COPY server/ ./server/
RUN npm run build --workspace=client
RUN npm run build --workspace=server

FROM node:20-alpine
WORKDIR /app
COPY --from=build /app/server/dist ./server/dist
COPY --from=build /app/server/package.json ./server/
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/client/dist ./client/dist
RUN mkdir -p /mnt/user /app/data
ENV NODE_ENV=production
ENV PORT=3000
ENV BROWSE_ROOT=/mnt/user
ENV DATA_DIR=/app/data
EXPOSE 3000
WORKDIR /app/server
CMD ["node", "dist/index.js"]
