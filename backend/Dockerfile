# Use 'bookworm' (Debian 12) which comes with Python 3.11 natively
FROM node:20-bookworm-slim

# Install FFmpeg and Python 3.11
RUN apt-get update && apt-get install -y \
    python3 \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Set up the working directory
WORKDIR /app

# Copy your package.json and install Node modules
COPY package*.json ./
RUN npm install

# Copy the rest of your backend files
COPY . .

# Open the port
EXPOSE 8080

# Start the engine
CMD ["node", "server.js"]