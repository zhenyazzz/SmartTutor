FROM node:lts-slim

# Обновляем системные пакеты для исправления уязвимостей
RUN apt-get update && apt-get upgrade -y && \
    apt-get install -y --no-install-recommends dumb-init && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Создаем non-root пользователя для безопасности
RUN groupadd -r nodejs && useradd -r -g nodejs nodejs

WORKDIR /app

# Копируем package.json и package-lock.json
COPY package*.json ./

# Удаляем package-lock.json и устанавливаем зависимости заново
# Это исправляет проблему с опциональными зависимостями Rollup
RUN rm -f package-lock.json && \
    npm install --legacy-peer-deps && \
    npm cache clean --force

# Копируем весь код приложения
COPY . .

# Меняем владельца файлов на non-root пользователя
RUN chown -R nodejs:nodejs /app

# Переключаемся на non-root пользователя
USER nodejs

# Открываем порт
EXPOSE 5173

# Используем dumb-init для правильной обработки сигналов
ENTRYPOINT ["dumb-init", "--"]

# Запускаем dev сервер
CMD ["npm", "run", "dev", "--", "--host"]

