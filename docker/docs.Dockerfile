#-----------------------------------------------------------------------------------------------------------------------
# Docker Base
#-----------------------------------------------------------------------------------------------------------------------
FROM nginx:stable AS base
LABEL maintainer="bayudwiyansatria@gmail.com"
WORKDIR /usr/share/nginx/html

#-----------------------------------------------------------------------------------------------------------------------
# Docker Build
#-----------------------------------------------------------------------------------------------------------------------
FROM node:26-bookworm-slim AS build
WORKDIR /app

# Metadata
COPY package.json package.json
COPY package-lock.json package-lock.json

# TypeScript
COPY tsconfig.base.json tsconfig.base.json
COPY tsconfig.test.json tsconfig.test.json
COPY tsconfig.json tsconfig.json

# ESLint
COPY eslint.config.ts eslint.config.ts

# Jest
COPY jest.config.json jest.config.json

# TypeDoc
COPY typedoc.json typedoc.json

# Rollup
COPY rollup.config.ts rollup.config.ts

COPY src src
COPY test test

# Docs
COPY README.md README.md
COPY CHANGELOG.md CHANGELOG.md
COPY CONTRIBUTING.md CONTRIBUTING.md
COPY CODE_OF_CONDUCT.md CODE_OF_CONDUCT.md
COPY SECURITY.md SECURITY.md
COPY SUPPORT.md SUPPORT.md
COPY LICENSE LICENSE
COPY docs docs

# Build
RUN npm ci

RUN npm run build

RUN npm run test

RUN npm run build:docs
RUN npm run build:docs:book

#-----------------------------------------------------------------------------------------------------------------------
# Docker Release
#-----------------------------------------------------------------------------------------------------------------------
FROM base AS release

COPY docker/nginx/index.html .
COPY docker/nginx/default.conf /etc/nginx/conf.d/default.conf

COPY --from=build /app/dist .

EXPOSE 80
