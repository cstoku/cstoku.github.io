FROM alpine

ARG HUGO_VERSION
ENV PATH /usr/local/bin:$PATH

VOLUME /data
WORKDIR /data
EXPOSE 1313
CMD hugo server

RUN mkdir /tmp/hugo && \
    apk add --no-cache git

ADD https://github.com/gohugoio/hugo/releases/download/v${HUGO_VERSION}/hugo_${HUGO_VERSION}_Linux-64bit.tar.gz /tmp/hugo.tar.gz
RUN tar -x -C /tmp/hugo -f /tmp/hugo.tar.gz && \
    mv /tmp/hugo/hugo /usr/local/bin/ && \
    rm -rf /tmp/hugo


