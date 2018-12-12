FROM node:11-slim

RUN apt-get update && apt-get install -y python make g++
ENV options --save-prod
WORKDIR /app

CMD npm install ${options}