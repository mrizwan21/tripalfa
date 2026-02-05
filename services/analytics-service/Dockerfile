FROM node:18-alpine
RUN apk add --no-cache wget
WORKDIR /app
COPY services/analytics-service/package*.json ./
RUN npm install
COPY database/prisma ./database/prisma
RUN npx prisma generate --schema=./database/prisma/schema.prisma
COPY services/analytics-service .
EXPOSE 3006
CMD ["npm", "start"]
