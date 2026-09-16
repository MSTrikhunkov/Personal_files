# Применимость всех запрошенных CVE

Основание — код предоставленного архива, а не только список поддерживаемых версий в CVE. Отсутствие Django 4.2 в поздних advisory после EOL само по себе не означает неприменимость.

| Идентификатор из запроса | Результат для исходного 4.2.30 | Артефакт / основание |
|---|---|---|
| CVE-2026-8404 | Применима | Патч 0002: mixed-case private обходил проверку в UpdateCacheMiddleware. |
| CVE-2026-6873 | Применима | Патч 0001; legacy-режим и ограничения полного устранения описаны в README. |
| CVE-2026-53878 | Неприменима | В 4.2 нет DomainNameValidator / validate_domain_name; API добавлен в 5.1. |
| CVE-53877 | Неполный ID; обработана как CVE-2026-53877 | Патч 0005: GDALRaster передавал sys.getsizeof(bytes) вместо len(bytes). |
| CVE-2026-48588 | Применима | Патч 0004: посторонняя cookie в запросе обходила защиту от кэширования новой чувствительной cookie. |
| CVE-2026-48587 | Применима | Патч 0003: очистка пробелов и добавление отсутствующего в 4.2 wildcard guard. |
| CVE-2026-3902 | Уже исправлена в 4.2.30 | ASGIRequest игнорирует имена заголовков с `_`. |
| CVE-2026-33034 | Уже исправлена в 4.2.30 | HttpRequest.body проверяет фактический размер seekable-потока; для прочих потоков читает не более limit + 1. |
| CVE-2026-25673 | Уже исправлена в 4.2.29 | URLField.to_python определяет схему без urlsplit / NFKC-нормализации. |
| CVE-2026-15830 | Применима | Патч 0006: границы WKT/WKB, формы, модельные поля, SpatialProxy, DB-конвертеры. |
| CVE-2026-1287 | Уже исправлена в 4.2.28 | Запрет управляющих символов в алиасах SQL. |
| CVE-2026-1207 | Уже исправлена в 4.2.28 | Проверка типа int индексов raster bands перед SQL-подстановкой. |
| CVE-2025-64459 | Уже исправлена в 4.2.26 | Q проверяет `_connector` по допустимому набору. |
| CVE-2025-64458 | Уже исправлена в 4.2.26, с последующей совместимой корректировкой | Ограничение redirect URL перед urlparse; в 4.2.30 предел 16384. |
| CVE-2025-59681 | Уже исправлена в 4.2.25 | Символ `#` запрещён в SQL-алиасах. |
| CVE-2025-5783 | Неприменима: другой продукт | PHPGurukul Employee Record Management System 1.3, SQL injection в editmyexp.php. |

Повторные/пустые патчи для уже исправленных или отсутствующих компонентов не создавались. Каждый из шести `.patch` соответствует ровно одной CVE.

## Доказательства уже имеющихся исправлений

Пути ниже относятся к исходному архиву. Оригинальные 4.2-коммиты перечислены в [SOURCES.md](SOURCES.md), исходные патчи сохранены в `../upstream`.

- **CVE-2026-3902:** `django/core/handlers/asgi.py`, `ASGIRequest.__init__`: `if "_" in name: continue`. Есть `tests/asgi/tests.py::test_underscores_in_headers_ignored`. Release notes: `docs/releases/4.2.30.txt`.
- **CVE-2026-33034:** `django/http/request.py`, `HttpRequest.body` / `_check_data_too_big`: проверка размера через seek и ограниченный read. Release notes: `docs/releases/4.2.30.txt`; тесты `asgi`, `requests_tests`.
- **CVE-2026-25673:** `django/forms/fields.py`, `URLField.to_python`: схема разбирается строковыми операциями; вызова urlsplit там нет. Release notes: `docs/releases/4.2.29.txt`; `tests/forms_tests/field_tests/test_urlfield.py`.
- **CVE-2026-1287:** `django/db/models/sql/query.py`, `FORBIDDEN_ALIAS_PATTERN`: диапазоны `\x00-\x1F\x7F-\x9F`; использование `check_alias()` в ORM. Release notes: `docs/releases/4.2.28.txt`; тесты injection/control characters в annotations и aggregation.
- **CVE-2026-1207:** `django/contrib/gis/db/backends/postgis/operations.py`, `PostGISOperator.check_raster`: отдельные `isinstance(..., int)` для lhs/rhs. Release notes: `docs/releases/4.2.28.txt`; тесты `test_lookup_invalid_band_rhs` и `test_lookup_invalid_band_lhs` в rasterapp. Проверено присутствие патча, но интеграционные PostGIS-тесты без сервера не запускались.
- **CVE-2025-64459:** `django/db/models/query_utils.py`, `Q.__init__`: `_connector not in self.connectors` → ValueError. Release notes: `docs/releases/4.2.26.txt`; `tests/queries/test_q.py::test_connector_validation`.
- **CVE-2025-64458:** `django/http/response.py`, `HttpResponseRedirectBase.__init__`: длина проверяется до urlparse; `django/utils/http.py` задаёт `MAX_URL_REDIRECT_LENGTH = 16384`. Оригинальный security-коммит вводил 2048, затем upstream увеличил предел для совместимости (см. `docs/releases/4.2.27.txt`). Поэтому полное обратное наложение старого патча не проходит, но защита присутствует. Возврат к старому пределу 2048 создавал бы ненужную регрессию. Тесты: `test_redirect_url_max_length`, `test_unsafe_redirect` в httpwrappers.
- **CVE-2025-59681:** в `FORBIDDEN_ALIAS_PATTERN` присутствует `#`; общий `check_alias` вызывается при формировании алиасов. Release notes: `docs/releases/4.2.25.txt`; `test_alias_forbidden_chars` проверяет `ali#as`. Обратное наложение старого коммита не проходит из-за последующего расширения этой же регулярной строки для CVE-2026-1287.

Для первых шести пунктов выше `git apply --reverse --check --include='django/*'` с официальным 4.2-патчем успешно проходит на чистом архиве. Лог: `test-results/already-fixed-reverse-check.log`. Для 64458/59681 сверены актуальные эквиваленты защиты и выполнены тесты. Отдельный прогон соответствующих модулей на исходном архиве: 938 тестов, OK, 17 skipped, 2 expected failures.

## Неприменимые и неточные идентификаторы

**CVE-2026-53878.** Уязвим именно DomainNameValidator. В `django/core/validators.py` 4.2.30 такого класса нет, как нет и validate_domain_name. [Официальная документация](https://docs.djangoproject.com/en/5.1/ref/validators/#domainnamevalidator) указывает добавление в Django 5.1. Перенос нового API ради патча был бы ненужным изменением пакета. [Advisory июля](https://www.djangoproject.com/weblog/2026/jul/07/security-releases/) и upstream-коммит `d5d60ed0323cddaa0ce0237a26a3d49ac21ee05e` подтверждают область исправления.

**CVE-53877.** Без года строка не является полным CVE ID. По контексту списка и официальному июльскому advisory принят CVE-2026-53877. Для него выполнен реальный бэкпорт, а не формальное отклонение неполного ID.

**CVE-2025-5783.** [Первичная запись CVEProject](https://github.com/CVEProject/cvelistV5/blob/main/cves/2025/5xxx/CVE-2025-5783.json) описывает PHPGurukul Employee Record Management System 1.3, файл `/editmyexp.php`, параметр `emp3workduration`. Это не Django и не присутствующий в архиве компонент. Запись сохранена в `../upstream/CVE-2025-5783.json`.

Если имелась в виду **CVE-2025-57833**, она уже исправлена в Django 4.2.24: `Query.add_filtered_relation()` вызывает `self.check_alias(alias)`; в 4.2.30 также есть последующая проверка точек в этих алиасах. Имеются тесты `test_alias_filtered_relation_sql_injection` в annotations, прошедшие и на исходной версии. Обратное наложение старого коммита не проходит из-за изменения соседнего контекста; сама защитная проверка явно присутствует. Дополнительный патч не требуется.
