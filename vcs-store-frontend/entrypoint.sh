#!/bin/bash
set -Eeuo pipefail

log_info() {
  echo "[$(date +'%Y-%m-%d %H:%M:%S')] INFO: $*" >&2
}

log_error() {
  echo "[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $*" >&2
}

trap 'log_error "Script failed on line $LINENO"' ERR

if [[ -n "${API_URL:-}" ]]; then
  log_info "Reemplazando API_URL por ${API_URL}"

  html_dir="/usr/share/nginx/html"
  if [[ ! -d "$html_dir" ]]; then
    log_error "Directorio no encontrado: $html_dir"
    exit 1
  fi

  for url in "https://api.vyro.boutique" "https://api-qa.vyro.boutique" "http://localhost:8000"; do
    files=$(find "$html_dir" -type f \( -name "*.js" -o -name "*.html" \) 2>/dev/null)
    if [[ -z "$files" ]]; then
      log_info "No se encontraron archivos .js ni .html en $html_dir, se omite reemplazo para $url"
      continue
    fi
    echo "$files" | xargs sed -i "s|$url|${API_URL}|g" 2>/dev/null || true
    log_info "Reemplazo completado para $url"
  done
else
  log_info "API_URL no definida, se usan las URLs del build"
fi

exec nginx -g "daemon off;"
