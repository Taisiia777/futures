FROM node:20-alpine

# Создаем рабочую директорию
WORKDIR /app

# Копируем package.json и package-lock.json
COPY package*.json ./

# Устанавливаем зависимости
RUN npm install -g pnpm && pnpm install

# Копируем исходники
COPY . .

# Собираем TypeScript код
RUN pnpm build

# Порт для внешнего доступа (например для метрик)
EXPOSE 9090

# Запускаем приложение
CMD ["pnpm", "start"]