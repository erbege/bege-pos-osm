#!/bin/sh

# Set correct permissions
chown -R www-data:www-data /var/www/storage /var/www/bootstrap/cache

# Wait for MySQL to be ready (optional, but good practice if db is in the same docker-compose)
# Using a simple check via php
until php -r "try { new PDO('mysql:host=' . getenv('DB_HOST') . ';dbname=' . getenv('DB_DATABASE'), getenv('DB_USERNAME'), getenv('DB_PASSWORD')); echo 'Connected\n'; } catch (Exception \$e) { echo \$e->getMessage() . '\n'; exit(1); }"; do
  echo "Waiting for database connection..."
  sleep 3
done

# Clear configuration cache
php artisan config:clear
php artisan route:clear
php artisan view:clear

# Run migrations
php artisan migrate --force

# Cache configuration for production
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Execute the main process (CMD)
exec "$@"
