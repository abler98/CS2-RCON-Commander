# Use Node.js LTS (Long Term Support) alpine image for a small footprint
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (including dev deps needed for the build)
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the frontend (outputs to /app/dist)
RUN npm run build

# Expose the port the app runs on
EXPOSE 3000

# Set production environment
ENV NODE_ENV=production

# Start the server using tsx (which handles the server.ts file directly)
# In production, server.ts serves the static files from the dist folder.
CMD ["npx", "tsx", "server.ts"]
