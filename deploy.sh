#!/usr/bin/env bash
# 가비아 서버(1.201.116.25) 재배포.
#   ./deploy.sh
# 로컬에서 빌드한 dist/ 와 server/ 를 올리고 서비스를 다시 시작합니다.
# .env(API 키)는 서버에 이미 올라가 있어서 건드리지 않습니다.
set -euo pipefail

KEY="${SSH_KEY:-$HOME/Downloads/SSH_KeyPair-260819220452.pem}"
HOST="ubuntu@1.201.116.25"
SSH="ssh -i $KEY"

npm run build

rsync -az -e "$SSH" --delete dist/   "$HOST:app/dist/"
rsync -az -e "$SSH" --delete server/ "$HOST:app/server/"

$SSH "$HOST" 'cd ~/app && npm install --omit=dev --silent && sudo systemctl restart timezone-relay'
sleep 2
curl -s -o /dev/null -w '배포 완료 — http://1.201.116.25 (%{http_code})\n' http://1.201.116.25/
