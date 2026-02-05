FROM node:18-alpine
RUN apk add --no-cache wget
WORKDIR /app
COPY services/payment-service/package*.json ./
RUN npm install
COPY database/prisma ./database/prisma
RUN npx prisma generate --schema=./database/prisma/schema.prisma
COPY services/payment-service .
EXPOSE 3003
CMD ["npm", "start"]
