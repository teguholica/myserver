FROM keymetrics/pm2:8-slim

RUN apt-get -y update && apt-get -y install git

RUN mkdir -p /home/app
RUN mkdir -p /home/repo

COPY ./gitserver/src /home/admin/gitserver/src
COPY ./gitserver/package.json /home/admin/gitserver/package.json
WORKDIR /home/admin/gitserver
RUN npm install

COPY ./gateway/src /home/admin/gateway/src
COPY ./gateway/package.json /home/admin/gateway/package.json
WORKDIR /home/admin/gateway
RUN npm install

COPY ./cli/src /home/admin/cli/src
COPY ./cli/package.json /home/admin/cli/package.json
WORKDIR /home/admin/cli
RUN npm install
RUN yarn link
RUN chmod +x /usr/local/bin/admin

COPY ./config.json /home/admin/config.json
COPY ./pm2.yml /home/admin/pm2.yml

WORKDIR /home/admin

CMD pm2-runtime pm2.yml