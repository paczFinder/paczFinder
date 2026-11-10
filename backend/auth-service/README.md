# Auth Service – Spring Boot + Keycloak + PostgreSQL

Serwis uwierzytelniania działający jako **OAuth2 Resource Server**.
Keycloak wydaje tokeny JWT, a ten serwis je waliduje, rejestruje użytkowników w Keycloaku
(przez admin API) i przechowuje lokalne profile użytkowników w Postgresie.

Serwis można uruchomić na dwa sposoby:

- **Lokalnie** – Spring Boot z IDE / Mavena, a Postgres + Keycloak z `docker-compose.yml` w tym katalogu.
- **W Kubernetesie** – cały projekt (wszystkie serwisy) przez `make up` w katalogu głównym repo (kind + skaffold + helm).

---

## Endpointy API

| Metoda | Ścieżka                        | Auth?                 | Opis |
|--------|--------------------------------|-----------------------|------|
| POST   | `/api/auth/register/courier`    | Nie                   | Rejestracja kuriera (Keycloak + lokalny profil) |
| POST   | `/api/auth/register/dispatcher` | Nie                   | Rejestracja dyspozytora (Keycloak + lokalny profil) |
| POST   | `/api/auth/login`               | Nie                   | Logowanie `{email, password}` → `access_token` + `refresh_token` |
| POST   | `/api/auth/refresh`             | Nie                   | `{refresh_token}` → nowe tokeny |
| POST   | `/api/auth/logout`              | Nie                   | `{refresh_token}` → kończy sesję w Keycloaku (204) |
| GET    | `/api/auth/profile`             | **Tak** (Bearer JWT)  | Profil zalogowanego użytkownika |

> Frontend (`react/`) nie łączy się z Keycloakiem bezpośrednio – logowanie, odświeżanie tokenów i wylogowanie
> idą przez auth-service (klient Keycloaka `auth-service` z sekretem). Błędy zwracane są w polu `message`.

---

## Adresy: lokalnie vs Kubernetes

| Co                         | Lokalnie                                   | Kubernetes (kind)                                                     |
|----------------------------|--------------------------------------------|-----------------------------------------------------------------------|
| **Auth Service**           | http://localhost:8082                      | http://localhost:30082 (NodePort) lub http://localhost:8082 (port-forward skaffolda) |
| **Keycloak**               | http://localhost:8080                      | http://localhost:30090                                                |
| Keycloak – konsola admina  | http://localhost:8080/admin (`admin`/`admin`) | http://localhost:30090/admin (`admin`/`admin`)                     |
| Keycloak – realm           | http://localhost:8080/realms/auth-realm    | http://localhost:30090/realms/auth-realm                              |
| Issuer tokenów (`iss`)     | `http://localhost:8080/realms/auth-realm`  | `http://localhost:30090/realms/auth-realm`                            |
| Postgres auth-service      | `localhost:5432` (`authdb`, `authuser`/`authpass`) | `localhost:5434` (port-forward skaffolda)                      |
| Postgres Keycloaka         | niewystawiony                              | `localhost:5435` (port-forward skaffolda)                             |

Uwagi:

- W klastrze serwis słucha na porcie **8080** 
  lokalnie na **8082**
- Port-forwardy (8082, 5434, 5435) działają tylko, gdy chodzi `skaffold dev`. NodePorty 30xxx działają zawsze, gdy chodzi klaster.
- Nie uruchamiaj jednocześnie wersji lokalnej i `skaffold dev`
- Tokeny z lokalnego Keycloaka nie zadziałają w klastrze i odwrotnie (inny `iss` i inne klucze podpisu).

---

## Uruchomienie lokalne

Wymagania: **Java 25**
### 1. Postgres + Keycloak

```bash
cd backend/auth-service
docker compose up -d
docker compose logs -f keycloak   # poczekaj na "Keycloak ... started" (~30–60 s)
```

Realm `auth-realm` (role, klienty `auth-service` i `delivery-frontend`) importuje się **automatycznie**
z `helm-chart/files/auth-realm-realm.json` (ten sam plik co w Kubernetesie) – nic nie trzeba klikać w konsoli.

### 2. Spring Boot

```bash
./mvnw spring-boot:run
```

Albo uruchom `AuthServiceApplication` z IDE. Serwis startuje na **http://localhost:8082**.
Domyślne wartości w `application.properties` pasują do `docker-compose.yml`, więc nie trzeba ustawiać zmiennych środowiskowych.

### 3. Frontend (opcjonalnie)

```bash
cd react
npm install
npm run dev     # http://localhost:5173
```

Frontend domyślnie łączy się z auth-service w Kubernetesie (`http://localhost:30082`). Dla wersji lokalnej utwórz `react/.env.local`:

```bash
VITE_AUTH_API_URL=http://localhost:8082
```

i zrestartuj `npm run dev`.

### Zatrzymanie

```bash
docker compose down        # zostawia dane w wolumenach
docker compose down -v     # usuwa też dane (Postgres + Keycloak)
```

---

## Uruchomienie w Kubernetesie

Z katalogu głównego repo:

```bash
make up      # kind create cluster + skaffold dev
make down    # usuwa klaster
```

Konfiguracja serwisu w klastrze:

- `helm-chart/templates/backend-auth-service.yaml` – Deployment + Service (NodePort 30082)
- `helm-chart/templates/auth-config.yaml` – zmienne bazy i Keycloaka (ConfigMap + Secret)
- `helm-chart/files/auth-realm-realm.json` – realm importowany do Keycloaka (jedyna kopia; używa go też lokalny `docker-compose.yml`)
 
Frontend działa z Kubernetesem bez zmian (domyślny `VITE_AUTH_API_URL` to `http://localhost:30082`).

Logi i status:

```bash
kubectl get pods
kubectl logs -f deploy/backend-auth-service
```

---

## Przykładowe requesty

Podmień `BASE` na `http://localhost:8082` (lokalnie) albo `http://localhost:30082` (Kubernetes).

### Rejestracja

```bash
curl -X POST $BASE/api/auth/register/courier \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jan",
    "surname": "Kowalski",
    "email": "jan@example.com",
    "password": "Secret123!"
  }'
```

(analogicznie `/api/auth/register/dispatcher`)

### Logowanie

```bash
curl -X POST $BASE/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "jan@example.com",
    "password": "Secret123!"
  }'
```

Odpowiedź:

```json
{
  "access_token": "eyJ...",
  "refresh_token": "eyJ...",
  "expires_in": 300,
  "refresh_expires_in": 1800,
  "token_type": "Bearer",
  "scope": "openid profile email"
}
```

### Odświeżenie tokena / wylogowanie

```bash
curl -X POST $BASE/api/auth/refresh -H "Content-Type: application/json" -d '{"refresh_token": "eyJ..."}'
curl -X POST $BASE/api/auth/logout  -H "Content-Type: application/json" -d '{"refresh_token": "eyJ..."}'
```

### Profil

```bash
curl $BASE/api/auth/profile \
  -H "Authorization: Bearer eyJ..."
```

---

## Konfiguracja (zmienne środowiskowe)

| Zmienna                   | Domyślnie (lokalnie)                                           | Kubernetes |
|---------------------------|----------------------------------------------------------------|------------|
| `DB_HOST` / `DB_PORT` / `DB_NAME` | `localhost` / `5432` / `authdb`                        | `auth-db` / `5432` / `authdb` |
| `DB_USER` / `DB_PASSWORD` | `authuser` / `authpass`                                        | to samo (Secret `auth-db-secret`) |
| `KEYCLOAK_SERVER_URL`     | `http://localhost:8080`                                        | `http://keycloak:8080` |
| `KEYCLOAK_ISSUER_URI`     | `http://localhost:8080/realms/auth-realm`                      | `http://localhost:30090/realms/auth-realm` |
| `KEYCLOAK_JWKS_URI`       | `http://localhost:8080/realms/auth-realm/protocol/openid-connect/certs` | `http://keycloak:8080/realms/auth-realm/protocol/openid-connect/certs` |
| `KEYCLOAK_REALM`          | `auth-realm`                                                   | `auth-realm` |
| `KEYCLOAK_CLIENT_ID` / `KEYCLOAK_CLIENT_SECRET` | `auth-service` / `auth-service-secret-change-in-prod` | to samo (login / refresh / logout) |
| `KEYCLOAK_ADMIN_USERNAME` / `KEYCLOAK_ADMIN_PASSWORD` | `admin` / `admin` (do rejestracji przez admin API) | to samo |

## Uwagi

- **Issuer URI** musi być dokładnie taki jak claim `iss` w tokenie, czyli taki, jak Keycloak widzi go z przeglądarki.
  Dlatego w klastrze issuer to `localhost:30090` (`KC_HOSTNAME`), a JWKS pobierany jest wewnątrz klastra z `keycloak:8080`.
- Role w JWT są mapowane z `realm_access.roles` → Spring `ROLE_COURIER` / `ROLE_DISPATCHER` / `ROLE_ADMIN`.
- CORS dopuszcza `http://localhost:5173` i `http://localhost:3000`.
- `ddl-auto=update` – w produkcji zmień na `validate` + Flyway/Liquibase.
