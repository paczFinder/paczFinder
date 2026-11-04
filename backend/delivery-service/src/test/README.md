# Testy delivery-service

Testy używają `@QuarkusTest`, więc sprawdzają pełny przepływ:
`HTTP endpoint -> resource -> service -> repository -> H2`.

## Zakres testów

| Test | Sprawdzany zakres |
|---|---|
| `createsAndEditsDelivery` | Utworzenie dostawy, wartości początkowe `ADDED`, edycja danych dostawy |
| `createsTripAndAssignsDelivery` | Utworzenie trasy, przypisanie dostawy, status `IN_DELIVERY`, odczyt dostaw trasy |
| `rejectsAssigningDeliveryAlreadyAssignedToAnotherTrip` | Brak możliwości przypisania tej samej dostawy do drugiej trasy |
| `rejectsDeletingVehicleAssignedToTrip` | Odmowa usunięcia pojazdu używanego przez trasę |
| `deletingTripReleasesDeliveries` | Usunięcie trasy, odpięcie dostawy i przywrócenie statusu `ADDED` |
| `finishesTripAndRejectsEditingDeliveredDelivery` | Zakończenie trasy, status `DELIVERED` i blokada edycji dostawy |
| `rejectsModifyingFinishedTrip` | Blokada dodawania dostaw i zmiany pojazdu w zakończonej trasie |
| `deletesDeliveryAndReturnsNotFound` | Usunięcie dostawy i późniejsza odpowiedź `404` |
| `supportsBatchAssignmentAndRejectsDuplicateIds` | Przypisanie wielu dostaw w batchu, obliczenie obciążenia i blokada duplikatów |
| `rejectsInvalidRequestsAndMissingResources` | Walidacja requestu oraz błędy `404` dla nieistniejącej dostawy i pojazdu |

## Kolejność scenariuszy

1. tworzenie i edycja dostawy,
2. utworzenie trasy i przypisanie dostawy,
3. sprawdzenie blokady drugiego przypisania,
4. sprawdzenie ochrony używanego pojazdu,
5. usunięcie trasy i ponowne udostępnienie dostawy,
6. zakończenie trasy i oznaczenie dostawy jako dostarczonej,
7. sprawdzenie blokady modyfikacji zakończonej trasy,
8. usunięcie dostawy,
9. test operacji batch,
10. testy walidacyjne i brakujących zasobów.
