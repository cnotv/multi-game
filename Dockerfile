# Want to help us make this template better? Share your feedback here: https://forms.gle/ybq9Krt8jtBL3iCk7
ARG NODE_VERSION=18.16.0

################################################################################
# Use node image for base image for all stages.
FROM node:${NODE_VERSION}-alpine as base

# Set working directory for all build stages.
WORKDIR /usr/src/app

# copy all filtes
COPY . .    
# install all deps
RUN yarn install

# vite default port
EXPOSE 5173    
CMD ["yarn", "run", "host"]