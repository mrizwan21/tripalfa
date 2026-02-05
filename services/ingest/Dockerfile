FROM node:18-slim

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install --omit=dev

COPY . .
# Worker might need a build step if using TS, but if it's already TS-node in start script:
# Actually checking services/ingest for build script
CMD ["npm", "start"]
