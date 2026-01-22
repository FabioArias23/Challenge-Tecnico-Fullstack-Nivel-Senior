FROM node:18-alpine

WORKDIR /app

# CAMBIO CLAVE: Copiamos SOLO package.json (sin el lock)
# Esto obliga a Docker a calcular las dependencias limpias para Linux
COPY package.json ./

# Instalamos limpiamente
RUN npm install

# Ahora copiamos el resto del código
COPY . .

EXPOSE 3000

# Usamos el comando del package.json que corresponda
CMD ["npm", "run", "start:dev"]