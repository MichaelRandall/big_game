# Use official lightweight Node image
FROM node:20-slim

# Create app directory
WORKDIR /usr/src/app

# Copy package files and install production dependencies
COPY package*.json ./
RUN npm ci --only=production

# Bundle app source code
COPY . .

# Cloud Run passes the port as an environment variable
EPOSE 8080

# Start the server
CMD [ "npm", "start" ]


