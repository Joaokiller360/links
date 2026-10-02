FROM node:22-alpine

WORKDIR /app
ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=4010

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY src ./src

# data/ guarda content.json y leads.json: monta aquí un volumen para no perderlos al redesplegar.
RUN mkdir -p data && chown node:node data
USER node

EXPOSE 4010
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s \
  CMD wget -qO- "http://127.0.0.1:${PORT}/api/health" || exit 1

CMD ["node", "src/server.js"]
