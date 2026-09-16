# Проверки бэкпортов

## Среда

macOS ARM64, Python 3.9.6, SQLite. Виртуальное окружение `../.venv`; зависимости фиксированы в `test-results/python-dependencies.txt`. Для GIS использованы реальные библиотеки GEOS 3.11.4 (wheel Shapely 2.0.7) и GDAL 3.9.3 (wheel rasterio 1.4.3). Эти зависимости установлены только для проверки: требования самого Django не изменены.

## Результаты

| Проверка | Результат | Лог |
|---|---|---|
| Исправленные исходники: cache, signed cookies, signing, HTTP, ASGI, URLField, queries, annotations, aggregation, FilteredRelation | 1573 теста; OK, 201 skipped, 2 expected failures | `test-results/core-full.log` |
| Чистый исходный архив: модули уже исправленных CVE | 938 тестов; OK, 17 skipped, 2 expected failures | `test-results/baseline-core.log` |
| Целевые GIS: GEOS, raster, fields, forms (включая дополнительные endian/None тесты) | 208 тестов; OK, 1 skipped | `test-results/gis-targeted.log` |
| Та же GIS-проверка на заново распакованном архиве после git am | 208 тестов; OK, 1 skipped | `test-results/replay-gis.log` |
| Широкий GIS-набор на исходнике | 272 теста; 8 failures, 10 errors, 2 skipped | `test-results/gis-baseline.log` |
| Широкий GIS-набор с патчами | 293 теста; те же 8 failures, 10 errors, 2 skipped | `test-results/gis-full.log` |
| Сравнение проблем широкого GIS-набора | Идентичные 18 test ID, новых failures/errors нет | `test-results/gis-comparison.log` |
| Применение серии git am | Все 6 успешно, дерево идентично рабочему | `test-results/replay.log` |
| Применение обычным patch -p1 | Все 6 успешно, дерево идентично | `test-results/patch-p1.log` |
| Проверка синтаксиса всех изменённых/новых Python-файлов по грамматике 3.8 | Успешно, 29 файлов | `test-results/static-checks.log` |
| Проверка whitespace / чистоты Git | git diff --check без ошибок, рабочее дерево чистое | `test-results/static-checks.log` |

Широкий GIS-набор **не объявляется полностью успешным**. Сборка GDAL в wheel не имеет части OGR-возможностей/драйверов, включая TIGER, и отличается по ряду операций с геометриями/SRS; каждое из 18 падений воспроизводится на неизменённом исходном архиве в той же среде. Они не скрыты исключениями или изменением тестов. Целевые тесты затронутых GEOS, растров, полей и форм проходят.

Не выполнялись интеграционные проверки с реальными PostGIS, Oracle, MySQL/MariaDB, SpatiaLite и внешними cache-серверами, а также запуск на Windows и всех поддерживаемых Python. На Windows-специфичные уже исправленные CVE проверены защитный код, исходные upstream-патчи и доступные регрессионные тесты; замеров NFKC на Windows не делалось. Синтаксическая проверка Python 3.8 не заменяет полноценный запуск на Python 3.8.

## Подтверждение регрессий до исправления

- `6873-before.log`: другая пара cookie name/salt принимает подпись — BadSignature не возникает. Три дополнительных ошибки до применения связаны с ещё отсутствующими новыми helpers. После патча 33 cookie/signing теста проходят.
- `8404-before.log`: для трёх вариантов регистра private повторно выдаётся первый ответ вместо нового.
- `48587-before.log`: четыре ошибочных has_vary_header результата и четыре случая кэширования wildcard. В этом итоговом red-логе исправлен импорт тестового helper; это не NameError.
- `48588-before.log`: защита обходится посторонней/обновляемой cookie — два падения.
- `53877-before.log`: реальный GDAL буфер имеет 35519 байт вместо 35486, лишние 33 байта. После — 39 raster-тестов, OK, один skip.
- `15830-before.log`: вложенность 199 не отклоняется исходным GEOSGeometry. Для безопасного воспроизведения использован малый относительно crash-порога вход, а не payload, вызывающий segmentation fault.
- `15830-endian-before.log`: upstream-реализация пропускает big-endian hex-WKB collection с ненулевым SRID. После исправления byte order тест проходит.
- `15830-none-before.log`: три теста показывают, что upstream-реализация не передаёт явный None. Исправлено с сохранением значения, заданного в подклассе, при пропущенном аргументе.

## Команды для воспроизведения

Из корня исправленного `django-4.2.30` с Python и установленными тестовыми зависимостями:

```sh
PYTHONPATH=. ../.venv/bin/python tests/runtests.py \
  cache signed_cookies_tests signing httpwrappers requests_tests asgi \
  forms_tests.field_tests.test_urlfield queries annotations aggregation \
  filtered_relation --parallel 1
```

Для локального подготовленного окружения, из каталога с архивом:

```sh
.venv/bin/python validation/run_gis.py \
  gis_tests.geos_tests gis_tests.gdal_tests.test_raster \
  gis_tests.test_fields gis_tests.test_geoforms
```

`validation/run_gis.py` настраивает штатный Django DiscoverRunner для DB-независимых GIS-тестов и задаёт пути к wheel-библиотекам через `validation/gis_settings.py`. Обычный `tests/runtests.py gis_tests` требует GIS backend даже для этих тестов. Тестовая обвязка не входит в патчи пакета. Для окружения с настоящим GIS backend следует использовать стандартный Django runner и своё settings-модуль.

Повторное применение серии проверено независимо на чистой распаковке, не через git checkout уже исправленного дерева. Итоговый Git tree: `ba44c0f33a3cf1bfba59fd154f1ef7f0424f1e6b`.
