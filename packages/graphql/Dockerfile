# This dockerfile must run in the context of the repo root directory
FROM node:8.7-slim

EXPOSE 3000

COPY .yarnrc ./
COPY package.json ./
COPY yarn.lock ./
COPY lerna.json ./

COPY packages ./packages

RUN npx lerna bootstrap --include=graphql --only=production

CMD ["yarn", "--cwd", "packages/graphql", "start"]
