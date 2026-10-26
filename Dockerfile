FROM httpd:2.4
RUN sed -i '/LoadModule proxy_module/s/^#//g; /LoadModule proxy_http_module/s/^#//g; /LoadModule headers_module/s/^#//g' /usr/local/apache2/conf/httpd.conf \
    && printf '\nProxyPreserveHost On\nProxyPass /api/ http://backend:8000/api/\nProxyPassReverse /api/ http://backend:8000/api/\n' >> /usr/local/apache2/conf/httpd.conf
WORKDIR /usr/local/apache2/htdocs/
EXPOSE 80
