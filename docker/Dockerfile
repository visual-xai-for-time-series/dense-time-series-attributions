# builder
FROM node:19 as build-step

RUN mkdir /app
WORKDIR /app

COPY ./app/frontend /app

RUN yarn
RUN yarn build

# main container
FROM python:3.10

COPY --from=build-step /app/build /var/www/html

RUN mkdir -p /app
WORKDIR /app

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && \
    apt-get install -y \
    nginx

COPY ./app/backend /app
RUN mkdir -p data/

RUN pip install --no-cache-dir -r requirements.txt

EXPOSE 80
EXPOSE 443

ENV LISTEN_PORT 80

STOPSIGNAL SIGQUIT

COPY ./docker/nginx.conf /etc/nginx/nginx.conf

# COPY --chmod=755 ./docker/start.sh ./start.sh
COPY ./docker/start.sh ./start.sh
RUN chmod a+x ./start.sh

CMD ["./start.sh"]
