# Use official PHP 8.2 image with Apache
FROM php:8.2-apache

# Install required system packages for GD image processing
RUN apt-get update && apt-get install -y \
    libjpeg-dev \
    libpng-dev \
    libfreetype6-dev \
 && docker-php-ext-configure gd --with-freetype --with-jpeg \
 && docker-php-ext-install gd

# Enable Apache mod_rewrite (optional but good to have)
RUN a2enmod rewrite

# Set working directory and copy source code into container
WORKDIR /var/www/

# Copy the entire project into the container
COPY . /var/www/

# Remove default Apache web root and symlink /public to /var/www/html
RUN rm -rf /var/www/html && ln -s /var/www/public /var/www/html

# Fix file permissions
RUN chown -R www-data:www-data /var/www/
