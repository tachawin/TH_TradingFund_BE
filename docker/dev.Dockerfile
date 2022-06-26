FROM node:16.15.0-alpine

WORKDIR /app/src

RUN apk add --no-cache curl

COPY ./package*.json ./

RUN npm ci
COPY . .

EXPOSE 8080

CMD ["npm", "run", "start:dev"]
