# Testy history-service

Testy używają `@QuarkusTest`, więc sprawdzają pełny przepływ:
`HTTP endpoint -> resource -> service -> repository -> H2`.

## Zakres testów

| Test | Sprawdzany zakres |
|---|---|
| `createsRouteHistory` | Utworzenie wpisu historii trasy, zapis snapshotu punktów i poprawność danych wejściowych |
| `getsRouteHistoryByIdAndPaginatedList` | Odczyt wpisu po ID oraz pobranie listy z paginacją |
| `getsHistoryByTripIdAndLatest` | Odczyt historii po `tripId` i najnowszego rekordu dla kursu |
| `rejectsDuplicateSourceRoutePlanId` | Blokada duplikatu `sourceRoutePlanId` i idempotencyjnej rejestracji |
| `rejectsInvalidRequest` | Walidacja błędnego payloadu i odmowa zapisu |
| `deletesRouteHistory` | Usunięcie wpisu i potwierdzenie, że po usunięciu endpoint zwraca `404` |

## Kolejność scenariuszy

1. utworzenie wpisu historii,
2. odczyt po ID i paginacja,
3. odczyt po `tripId` i najnowszy rekord,
4. sprawdzenie blokady duplikatu,
5. walidacja błędnego requestu,
6. usunięcie wpisu i sprawdzenie `404` po usunięciu.

