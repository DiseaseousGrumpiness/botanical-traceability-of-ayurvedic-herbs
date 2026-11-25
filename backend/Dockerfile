FROM node:22-alpine

ENV NODE_ENV=production
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY src/app.js src/fabric.js src/ipfs.js src/server.js ./src/

USER node
EXPOSE 3001
CMD ["node", "src/server.js"]
