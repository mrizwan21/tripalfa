FROM node:18-slim

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install --omit=dev

COPY . .
RUN npm run build || true

EXPOSE 3000

CMD ["npm", "start"]
