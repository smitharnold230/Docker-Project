FROM node:18-alpine

# Set the working directory directly inside the isolated container
WORKDIR /app

# Only copy over the package files to take advantage of Docker Layer Caching
COPY package*.json ./

# Execute the installation natively in the container - does NOT touch the host machine
RUN npm install --production

# Move the rest of the application code
COPY . .

# Expose the API port
EXPOSE 3000

# Tell the container exactly what to explicitly execute
CMD ["npm", "start"]
