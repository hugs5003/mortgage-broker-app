FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --include=dev

COPY . .

EXPOSE 5000

CMD ["npx", "tsx", "src/index.ts"]
