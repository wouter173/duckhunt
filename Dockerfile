FROM denoland/deno

WORKDIR /app

ADD . /app

RUN deno install

CMD ["run", "start"]