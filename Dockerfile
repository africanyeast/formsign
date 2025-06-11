# Use official PHP + Apache image
FROM php:8.2-apache

# Install GD extension for image handling
RUN docker-php-ext-install gd

# Enable Apache mod_rewrite (optional)
RUN a2enmod rewrite

# Copy project files to web root
COPY . /var/www/html/

# Set working directory
WORKDIR /var/www/html

# Set file permissions
RUN chown -R www-data:www-data /var/www/html
