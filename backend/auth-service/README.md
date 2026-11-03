# Auth Service – Spring Boot + Keycloak + PostgreSQL

Serwis uwierzytelniania działający jako **OAuth2 Resource Server**.  
Keycloak wydaje tokeny JWT, a ten serwis je waliduje i przechowuje lokalne profile użytkowników w Postgresie.

## Porty

| Usługa          | Port  |
|-----------------|-------|
| Auth Service    | **8082** |
| Keycloak        | 8080  |
| Postgres (app)  | 5432  |

## Endpointy

| Metoda | Ścieżka              | Auth? | Opis |
|--------|----------------------|-------|------|
| POST   | `/api/auth/register` | Nie   | Rejestracja (Keycloak + lokalny profil) |
| POST   | `/api/auth/login`    | Nie   | Logowanie → access_token + refresh_token |
| GET    | `/api/auth/me`       | **Tak** (Bearer JWT) | Dane profilu zalogowanego użytkownika |
| GET    | `/api/auth/profile`  | **Tak** | Alias do `/me` |
| GET    | `/api/auth/getProfileData` | **Tak** | Alias do `/me` |

---

## 1. Uruchom infrastrukturę (Docker)

```bash
cd auth-service
docker compose up -d
```

Poczekaj aż Keycloak będzie gotowy (pierwszy start ~30–60 s):

```bash
docker compose logs -f keycloak
```

Gdy zobaczysz `Keycloak ... started` → możesz konfigurować realm.

---

## 2. Konfiguracja Keycloak (raz)

Otwórz **http://localhost:8080** → zaloguj się: `admin` / `admin`.

### 2.1. Utwórz Realm
1. Create realm → nazwa: **`auth-realm`** → Create.

### 2.2. Role realm
1. Realm roles → Create role:
    - `ADMIN` – tylko ręcznie / przez innego admina (publiczny `/register` tego nie pozwala)
    - `DISPATCHER`
    - `COURIER`

### 2.3. Client do logowania (publiczny / confidential)
1. Clients → Create client
    - Client ID: **`auth-service`**
    - Client authentication: **ON**
    - Standard flow: ON
    - Direct access grants: **ON** (potrzebne do password grant / login)
2. Credentials → skopiuj **Client secret** → wklej do `application.yml` jako `keycloak.client-secret`.

### 2.4. Client Admin (Service Account – do rejestracji użytkowników)
1. Clients → Create client
    - Client ID: **`auth-service-admin`**
    - Client authentication: **ON**
    - Service accounts roles: **ON**
2. Credentials → skopiuj secret → `keycloak.admin-client-secret`.
3. Service account roles → Assign role → Filter by clients → `realm-management` → dodaj:
    - `manage-users`
    - `view-users`
    - `query-users`
    - `manage-realm` (opcjonalnie)

### 2.5. (Opcjonalnie) Testowy użytkownik / pierwszy ADMIN ręcznie
Users → Add user → Credentials → Set password → Role mapping → ASSIGN `ADMIN` / `DISPATCHER` / `COURIER`.

**Uwaga:** publiczny `POST /api/auth/register` akceptuje tylko `DISPATCHER` i `COURIER`.  
Rola `ADMIN` → `403 Forbidden` (nie da się samemu nadać).

---

## 3. Uruchom Spring Boot lokalnie

```bash
# w katalogu auth-service
./mvnw spring-boot:run
# albo
mvn spring-boot:run
```

Aplikacja startuje na **http://localhost:8081**.

Upewnij się, że w `application.yml` masz poprawne sekrety klientów Keycloak.

---

## 4. Przykładowe requesty

### Register
```bash
curl -X POST http://localhost:8081/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jan",
    "surname": "Kowalski",
    "email": "jan@example.com",
    "password": "Secret123!",
    "role": "COURIER"
  }'
```

### Login
```bash
curl -X POST http://localhost:8081/api/auth/login \
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

### Get profile data
```bash
curl http://localhost:8081/api/auth/me \
  -H "Authorization: Bearer eyJ..."
```

---


## Uwagi

- **Issuer URI** w `application.yml` musi być dokładnie taki jak claim `iss` w tokenie.  
  Gdy Spring Boot działa lokalnie, a Keycloak w Dockerze → używaj `http://localhost:8080/realms/auth-realm`.
- W kontenerze (gdy odkomentujesz serwis `auth-service`) JWKS pobierasz z sieci Docker (`http://keycloak:8080/...`), a issuer nadal zostaje `localhost` (bo tak go widzi przeglądarka/klient).
- Role w JWT są mapowane z `realm_access.roles` → Spring `ROLE_ADMIN` / `ROLE_COURIER`.
- `ddl-auto: update` – w produkcji zmień na `validate` + Flyway/Liquibase.
