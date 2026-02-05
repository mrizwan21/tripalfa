FROM node:18-alpine
RUN apk add --no-cache wget
WORKDIR /app
COPY services/inventory-service/package*.json ./
RUN npm install
COPY database/prisma ./database/prisma
RUN npx prisma generate --schema=./database/prisma/schema.prisma
COPY services/inventory-service .
EXPOSE 3002
CMD ["npm", "start"]
