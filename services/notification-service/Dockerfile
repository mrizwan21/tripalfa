FROM node:18-alpine
RUN apk add --no-cache wget
WORKDIR /app
COPY services/notification-service/package*.json ./
RUN npm install --omit=dev
COPY services/notification-service .
EXPOSE 3005
CMD ["npm", "start"]
