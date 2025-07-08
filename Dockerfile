# Use Node.js for development
FROM node:20

# Set working directory
WORKDIR /app

# Copy package.json and install dependencies
COPY package.json package-lock.json* ./
RUN npm install

# Copy the rest of the app
COPY . .

# Expose Angular dev server port
EXPOSE 4200

# Start Angular app
CMD ["npx", "ng", "serve", "cagetrackmanager", "--host", "0.0.0.0"]
