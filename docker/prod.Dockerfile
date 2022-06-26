FROM node:16.15.0-alpine

COPY ./package*.json ./

RUN npm ci
COPY . .

RUN npm run build
COPY . .
 
EXPOSE 8080

CMD ["npm", "run" ,"start:production"]

