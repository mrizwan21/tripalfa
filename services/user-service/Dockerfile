FROM node:18-alpine
RUN apk add --no-cache wget
WORKDIR /app
COPY services/user-service/package*.json ./
RUN npm install
COPY database/prisma ./database/prisma
RUN npx prisma generate --schema=./database/prisma/schema.prisma
COPY services/user-service .
EXPOSE 3004
CMD ["npm", "start"]
