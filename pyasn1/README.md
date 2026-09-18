# Исправления безопасности pyasn1 0.5.1

Подготовлено 18 сентября 2026 года для предоставленного `v0.5.1.tar.gz`.

SHA-256 исходного тарбола:
`a35391ba1743d91ab96d9339dee049a291e609564f1827f303e6751075c1e510`.

Все четыре CVE применимы и исправлены переносом соответствующих изменений апстрима. В CVE-2026-59885 неприменима только часть про RELATIVE-OID: этот тип отсутствует в 0.5.1. Подробности, источники и результаты проверок — в `ОБОСНОВАНИЕ.md`.

## Порядок применения

Применять к корню исходников pyasn1 0.5.1 строго в следующем порядке:

1. `0001-Fix-CVE-2026-30922-bound-ASN.1-decoder-nesting.patch`
2. `0002-Fix-CVE-2026-59886-bound-REAL-float-conversion-work.patch`
3. `0003-Fix-CVE-2026-59884-bound-long-form-tag-decoding.patch`
4. `0004-Fix-CVE-2026-59885-process-OID-arcs-in-linear-time.patch`

Каждый патч получен командой `git format-patch` из отдельного `git commit` и содержит исправление и проверки. Корневой коммит импорта тарбола в серию не включён.

Пример для чистой распаковки (настройте имя и email Git, если они ещё не заданы):

```sh
tar -xzf v0.5.1.tar.gz
cd pyasn1-0.5.1
git init
git add .
git commit -m 'Import pristine pyasn1 0.5.1'
PATCH_DIR=/Users/bixenonoff/WORK/Personal_files/pyasn1
git am "$PATCH_DIR/0001-Fix-CVE-2026-30922-bound-ASN.1-decoder-nesting.patch"
git am "$PATCH_DIR/0002-Fix-CVE-2026-59886-bound-REAL-float-conversion-work.patch"
git am "$PATCH_DIR/0003-Fix-CVE-2026-59884-bound-long-form-tag-decoding.patch"
git am "$PATCH_DIR/0004-Fix-CVE-2026-59885-process-OID-arcs-in-linear-time.patch"
python3 -Werror -m unittest discover -s tests
PYTHONPATH=. python3 tests/benchmark_security_oid.py
```

Для существующего Git-репозитория на чистых исходниках 0.5.1 шаги `git init/add/commit` не нужны. Сборка в окружении с setuptools и wheel:

```sh
python3 setup.py sdist bdist_wheel
```

## Совместимость

Версия остаётся **0.5.1**, зависимости, публичные сигнатуры и форматы корректных обычных данных не изменены. Сохранены совместимые с Python 2.7 конструкции; новые тесты используют штатные compatibility helpers этой версии. Для OID сохранены возвращаемые tuple, в том числе `native=True`.

Необходимые изменения обработки экстремальных данных совпадают с апстримом:

- Декодер отклоняет вложенность свыше лимита 100 и длинные tag ID более 20 октетов с `PyAsn1Error`. Это ограничения безопасности; ранее такие входы могли обрабатываться до исчерпания ресурсов. Абсолютная неизменность множества принимаемых входов не заявляется.
- REAL преобразуется без построения огромного целого; переполнение даёт `OverflowError`, а `prettyPrint()` — `<overflow>`. Декодирование и повторное кодирование REAL с большим показателем сохранено. Десятичная нормализация теперь сохраняет целочисленную точность, как в исправлении апстрима.
- OID не получает нового ограничения числа дуг: изменён алгоритм накопления, а не допустимая длина.

## Проверки

На CPython 3.9.6 и 3.12.14: **1183 теста, OK** с `-Werror`. До исправлений: 1165 исходных тестов, OK. Добавлено 18 regression-тестов и отдельная проверка масштабирования OID. Python 2.7 и остальные версии из upstream tox-матрицы не были доступны для выполнения; их runtime-совместимость не заявляется как проверенная.

Проверены сборка sdist/wheel, импорт собранного wheel и DER round-trip, чистое применение всех патчей через `git am`, повторные 1183 теста и совпадение Git tree с рабочим репозиторием. Независимое ревью замечаний не выявило.

Рабочий репозиторий, материалы апстрима, исходные журналы и сборки оставлены в `/Users/bixenonoff/WORK/pyasn1`. В каталоге выдачи находятся только четыре патча, этот README и обоснование.

## SHA-256 патчей

```text
fb897d00419e2fc7c8eb66985d7dc356c8b436f9c676ce31d2cd3980600436ae  0001-Fix-CVE-2026-30922-bound-ASN.1-decoder-nesting.patch
2f80d352215720cf6a596c4b3a2b156e7bdae44414730f547b86b19e0f0940b0  0002-Fix-CVE-2026-59886-bound-REAL-float-conversion-work.patch
cc320cb66fca366de089912dfc63c1e376f31309a7fe0aed18654e7e818fc236  0003-Fix-CVE-2026-59884-bound-long-form-tag-decoding.patch
8562b65fc4a4c19f950bf2d24a1b934f37a5f64f30bf439fafafa39ca16b429c  0004-Fix-CVE-2026-59885-process-OID-arcs-in-linear-time.patch
```
