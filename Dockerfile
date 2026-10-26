FROM httpd:2.4

# Enable Apache reverse-proxy modules and headers.
RUN sed -i '/LoadModule proxy_module/s/^#//g; /LoadModule proxy_http_module/s/^#//g; /LoadModule headers_module/s/^#//g' /usr/local/apache2/conf/httpd.conf \
    && printf '\nProxyPreserveHost On\nProxyPass /api/ http://backend:8000/api/\nProxyPassReverse /api/ http://backend:8000/api/\n' >> /usr/local/apache2/conf/httpd.conf \
    && printf '\n<Directory "/usr/local/apache2/htdocs">\n    Require all granted\n</Directory>\n<FilesMatch "\\.(html|js|css)$">\n    Header set Cache-Control "no-cache, no-store, must-revalidate"\n    Header set Pragma "no-cache"\n    Header set Expires "0"\n</FilesMatch>\n' >> /usr/local/apache2/conf/httpd.conf

WORKDIR /usr/local/apache2/htdocs/

# Bake the public site and admin UI into the image. This avoids serving
# stale or mismatched host bind-mount files after a Docker rebuild.
COPY index.html events.html event-details.html about.html contact.html ./
COPY animations.js site-content.js ./
COPY css/ ./css/
COPY admin/ ./admin/

EXPOSE 80
