# Use official PHP 8.2 image with Apache
FROM php:8.2-apache

# Install required system packages
RUN apt-get update && apt-get install -y \
    libjpeg-dev \
    libpng-dev \
    libfreetype6-dev \
    unzip \
    git \
 && docker-php-ext-configure gd --with-freetype --with-jpeg \
 && docker-php-ext-install gd

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Enable Apache mod_rewrite
RUN a2enmod rewrite

# Set working directory
WORKDIR /var/www/

# Copy project files
COPY . /var/www/

# Run composer install
RUN composer install --no-dev --optimize-autoloader

# Set permissions
RUN chown -R www-data:www-data /var/www/

# Symlink public directory
RUN rm -rf /var/www/html && ln -s /var/www/public /var/www/html
