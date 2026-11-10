FROM osrm/osrm-backend:latest

WORKDIR /data
COPY infra/osrm/lodzkie-latest.osm.pbf /data/lodzkie-latest.osm.pbf
COPY infra/osrm/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 5000

VOLUME /data

ENTRYPOINT ["/entrypoint.sh"]
