FROM nginx:alpine
WORKDIR /usr/share/nginx/html

# Nginx 기본 설정 복사
COPY ./nginx/default.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
EXPOSE 443
CMD ["nginx", "-g", "daemon off;"]