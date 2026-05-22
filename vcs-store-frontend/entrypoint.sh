#!/bin/sh
set -e

if [ -n "$API_URL" ]; then
  echo "entrypoint: reemplazando API_URL por $API_URL"
  for url in "https://api.vyro.boutique" "https://api-qa.vyro.boutique" "http://localhost:8000"; do
    find /usr/share/nginx/html -type f \( -name "*.js" -o -name "*.html" \) -exec sed -i "s|$url|$API_URL|g" {} +
  done
fi

exec nginx -g "daemon off;"
