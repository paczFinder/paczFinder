#!/bin/sh
set -e

DATA_DIR=/data
PBF="$DATA_DIR/lodzkie-latest.osm.pbf"
OSRM="$DATA_DIR/lodzkie-latest.osrm"

mkdir -p "$DATA_DIR"

if [ -f "$PBF" ] && [ ! -f "$OSRM" ]; then
  echo "Przetwarzanie mapy: osrm-extract..."
  osrm-extract -p /opt/car.lua "$PBF"
  echo "Przetwarzanie mapy: osrm-partition..."
  osrm-partition "$OSRM"
  echo "Przetwarzanie mapy: osrm-customize..."
  osrm-customize "$OSRM"
fi

if [ -f "$OSRM" ]; then
  echo "Uruchamianie osrm-routed na porcie 5000..."
  exec osrm-routed --algorithm mld "$OSRM"
else
  echo "Brak pliku mapy .osrm ani .osm.pbf w $DATA_DIR."
  echo "Włóż lodzkie-latest.osm.pbf do $DATA_DIR i zrestartuj kontener."
  exec sleep infinity
fi
