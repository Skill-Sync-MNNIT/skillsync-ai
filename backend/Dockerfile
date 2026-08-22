FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

# Install dependencies
RUN npm ci

COPY backend ./backend

# Expose port
EXPOSE 5000

# Start the server
CMD ["npm", "start"]
