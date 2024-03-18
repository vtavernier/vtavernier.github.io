FROM docker.io/library/node:21

RUN apt-get update -q && \
    apt-get install -y --no-install-recommends \
        libnss3 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 libxcomposite1 \
        libxdamage1 libxfixes3 libxrandr2 libgbm1 libxkbcommon0 libasound2 && \
    rm -rf /var/apt/lists/*

COPY entrypoint.sh /
ENTRYPOINT ["/entrypoint.sh"]
