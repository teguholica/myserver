FROM keymetrics/pm2:8-slim

RUN apt-get -y update && apt-get -y install git