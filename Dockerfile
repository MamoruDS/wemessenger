FROM node:11-slim
RUN apt-get update && apt-get install -y curl git
RUN curl https://gist.githubusercontent.com/MamoruDS/aafadad0405a603302343444364f96c5/raw/e6c836e82546ea764af0bc71551e9958fe1c9210/puppeteer_debian_dependencies.txt --output dependencies.txt
RUN apt-get install -y $(cat dependencies.txt)
RUN curl -s https://raw.githubusercontent.com/Intervox/node-webp/latest/bin/install_webp | bash

ENV execfile main.js
WORKDIR /app

CMD node ${execfile}