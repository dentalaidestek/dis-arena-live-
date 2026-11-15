FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends python3 python3-venv ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY scripts/requirements.txt /app/scripts/requirements.txt
RUN python3 -m venv /opt/arena-python && /opt/arena-python/bin/pip install --no-cache-dir -r scripts/requirements.txt
ENV PATH="/opt/arena-python/bin:$PATH" ARENA_HOST=0.0.0.0 ARENA_DATA_DIR=/app/data
COPY --from=build /app/node_modules /app/node_modules
COPY --from=build /app/dist /app/dist
COPY --from=build /app/server /app/server
COPY --from=build /app/src /app/src
COPY --from=build /app/scripts /app/scripts
COPY --from=build /app/package.json /app/package.json
RUN mkdir /app/data && chown node:node /app/data
USER node
EXPOSE 8787
CMD ["npm","start"]
