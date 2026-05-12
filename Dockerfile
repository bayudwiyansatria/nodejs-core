#-----------------------------------------------------------------------------------------------------------------------
# Docker Base
#-----------------------------------------------------------------------------------------------------------------------
FROM node:26-bookworm-slim AS base
LABEL maintainer="bayudwiyansatria@gmail.com"
WORKDIR /app

#-----------------------------------------------------------------------------------------------------------------------
# Docker Build
#-----------------------------------------------------------------------------------------------------------------------
FROM base AS build
WORKDIR /app

# Metadata
COPY package.json package.json
COPY package-lock.json package-lock.json

# TypeScript
COPY tsconfig.base.json tsconfig.base.json
COPY tsconfig.test.json tsconfig.test.json
COPY tsconfig.json tsconfig.json

# ESLint
COPY .eslintrc.json .eslintrc.json

# Jest
COPY jest.config.json jest.config.json

# TypeDoc
COPY typedoc.json typedoc.json

# Rollup
COPY rollup.config.ts rollup.config.ts

COPY src src
COPY test test

RUN npm ci

RUN npm run build

RUN npm run test
RUN npm run build:docs


#-----------------------------------------------------------------------------------------------------------------------
# Docker Release
#-----------------------------------------------------------------------------------------------------------------------
FROM base AS release

COPY --from=build /app/dist .
COPY --from=build /app/lib .

CMD ["tail", "-f", "/dev/null"]
