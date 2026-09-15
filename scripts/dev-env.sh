#!/bin/bash
export ALBUM_ID=$(PGPASSWORD='dike123' psql -h localhost -U postgres -d uzidb -t -c "
  SELECT id FROM albums WHERE title = 'Rwendo Rwedu' LIMIT 1;
" | tr -d ' ')

export FAN_TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"fan@uzinduziafrica.com","password":"Password123!"}' \
  | jq -r .token)

export ADMIN_TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@uzinduziafrica.com","password":"Password123!"}' \
  | jq -r .token)

echo "ALBUM_ID  = $ALBUM_ID"
echo "FAN_TOKEN = ${FAN_TOKEN:0:20}...  (${#FAN_TOKEN} chars)"
echo "ADMIN_TOKEN = ${ADMIN_TOKEN:0:20}...  (${#ADMIN_TOKEN} chars)"

export ARTIST_TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"artist@uzinduziafrica.com","password":"Password123!"}' \
  | jq -r .token)

echo "ARTIST_TOKEN = ${ARTIST_TOKEN:0:20}...  (${#ARTIST_TOKEN} chars)"
