# DOM en Línea Municipal — Frontend (modo desarrollo con Vite)
# Para producción se construyen los estáticos con `npm run build`.
FROM node:20-alpine

WORKDIR /app

# Instalar dependencias primero (aprovecha la caché de capas)
COPY package.json package-lock.json ./
RUN npm ci

# Resto del código
COPY . .

EXPOSE 5173

# Vite en modo dev, escuchando en todas las interfaces (red Docker)
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]