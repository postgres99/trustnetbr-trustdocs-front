#!/bin/sh
set -eu

HTTPS_CONF="/etc/nginx/conf.d/https.conf"

if [ "${ENABLE_HTTPS:-false}" != "true" ]; then
    : > "$HTTPS_CONF"
    exit 0
fi

if [ ! -f "${TLS_CERTIFICATE_PATH}" ] || [ ! -f "${TLS_CERTIFICATE_KEY_PATH}" ]; then
    echo "TLS certificate files were not found. Check TLS_CERTIFICATES_PATH, TLS_CERTIFICATE_PATH and TLS_CERTIFICATE_KEY_PATH." >&2
    exit 1
fi

cat > "$HTTPS_CONF" <<EOF
server {
    listen 8443 ssl;
    server_name _;

    ssl_certificate ${TLS_CERTIFICATE_PATH};
    ssl_certificate_key ${TLS_CERTIFICATE_KEY_PATH};
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers off;

    root /usr/share/nginx/html;
    index index.html;

    client_max_body_size 21m;

    location = /healthz {
        access_log off;
        add_header Content-Type text/plain;
        return 200 "healthy\\n";
    }

    location /api/ {
        proxy_pass ${API_UPSTREAM};
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
        proxy_read_timeout 120s;
        proxy_send_timeout 120s;
    }

    location /swagger/ {
        proxy_pass ${API_UPSTREAM};
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
    }

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    location ~* \.(?:css|js|jpg|jpeg|png|webp|svg|ico|woff2?)$ {
        expires 7d;
        add_header Cache-Control "public, immutable";
        try_files \$uri =404;
    }
}
EOF
