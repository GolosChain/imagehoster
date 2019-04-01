FROM node:10

ENV IN_DOCKER=1
WORKDIR /app
COPY package.json .
RUN npm install --only=production
COPY src src
EXPOSE 80

CMD ["npm", "start"]
