FROM node:lts-alpine

# Обновляем системные пакеты для исправления уязвимостей
RUN apk update && apk upgrade --no-cache && \
    apk add --no-cache dumb-init && \
    rm -rf /var/cache/apk/*

# Создаем non-root пользователя для безопасности
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Копируем package.json и package-lock.json
COPY package*.json ./

# Устанавливаем зависимости от имени root
RUN npm ci && npm cache clean --force

# Копируем весь код приложения
COPY . .

# Меняем владельца файлов на non-root пользователя
RUN chown -R nodejs:nodejs /app

# Переключаемся на non-root пользователя
USER nodejs

# Открываем порт
EXPOSE 3000

# Используем dumb-init для правильной обработки сигналов
ENTRYPOINT ["dumb-init", "--"]

# Команда запуска: сначала seed, потом dev
CMD ["sh", "-c", "npm run seed && npm run dev"]

