#!/usr/bin/env bash
# deploy.sh — run on the server as user 'work'
# Usage: bash deploy.sh
set -euo pipefail

APP_DIR="/opt/medquest"
REPO_URL="https://github.com/studenthubkz/MedQuest.git"
BACKEND_DIR="$APP_DIR/backend"
VENV="$BACKEND_DIR/venv"

echo "=== [1/6] Updating system packages ==="
sudo apt-get update -q
sudo apt-get install -y python3 python3-pip python3-venv nginx certbot python3-certbot-nginx git

echo "=== [2/6] Cloning / pulling repository ==="
if [ -d "$APP_DIR/.git" ]; then
    git -C "$APP_DIR" pull
else
    sudo git clone "$REPO_URL" "$APP_DIR"
    sudo chown -R work:work "$APP_DIR"
fi

echo "=== [3/6] Creating Python virtual environment ==="
if [ ! -d "$VENV" ]; then
    python3 -m venv "$VENV"
fi
"$VENV/bin/pip" install --upgrade pip -q
"$VENV/bin/pip" install -r "$BACKEND_DIR/requirements.txt" -q

echo "=== [4/6] Setting up .env ==="
if [ ! -f "$BACKEND_DIR/.env" ]; then
    cp "$BACKEND_DIR/.env.example" "$BACKEND_DIR/.env"
    # Generate a random secret key
    SECRET=$(python3 -c "import secrets; print(secrets.token_hex(32))")
    sed -i "s|change-me-in-production|$SECRET|" "$BACKEND_DIR/.env"
    echo "  .env created with a new SECRET_KEY"
    echo "  Review $BACKEND_DIR/.env before continuing!"
fi

echo "=== [5/6] Running Alembic migrations ==="
cd "$BACKEND_DIR"
"$VENV/bin/alembic" upgrade head

echo "=== [6/6] Installing systemd service ==="
sudo cp "$APP_DIR/deploy/medquest.service" /etc/systemd/system/medquest.service
sudo systemctl daemon-reload
sudo systemctl enable medquest
sudo systemctl restart medquest
sudo systemctl status medquest --no-pager

echo ""
echo "=== Backend is running at http://127.0.0.1:8000 ==="
echo ""
echo "=== Configuring nginx + SSL ==="
sudo cp "$APP_DIR/deploy/nginx-medquest.conf" /etc/nginx/sites-available/medquest
sudo ln -sf /etc/nginx/sites-available/medquest /etc/nginx/sites-enabled/medquest
sudo rm -f /etc/nginx/sites-enabled/default

# Obtain SSL cert via Let's Encrypt (certbot will edit the nginx config automatically)
sudo certbot --nginx -d 94-131-90-78.sslip.io --non-interactive --agree-tos -m admin@medquest.kz

sudo nginx -t && sudo systemctl reload nginx

echo ""
echo "======================================================"
echo "  Backend is now live at https://94-131-90-78.sslip.io"
echo "  API docs: https://94-131-90-78.sslip.io/docs"
echo "======================================================"
