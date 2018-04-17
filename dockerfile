FROM node:9.4.0-alpine as build-env

# set the working directory in the image as "app"
WORKDIR /app

# copy the rest of the code
COPY package.json yarn.lock /app/

# --no-cache: download package index on-the-fly, no need to cleanup afterwards
# --virtual: bundle packages, remove whole bundle at once, when done
RUN apk add --no-cache --virtual build-dependencies make gcc g++ python

RUN yarn add --silent forever@0.15.3

RUN yarn install --silent --production=true --frozen-lockfile

RUN apk del build-dependencies

# pull in the rest of the code
COPY . .

# Stage 2 build the rest
FROM node:9.4.0-alpine

WORKDIR /app

# copy the compiled code
COPY --from=build-env /app /app

# set the default command that will run when this image is ran
ENTRYPOINT [ "yarn", "start-production" ]
