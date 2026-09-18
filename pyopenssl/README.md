# Security backports для pyOpenSSL 24.1.0

Дата подготовки: 2026-09-18. Обе уязвимости, CVE-2026-27459 и CVE-2026-27448, применимы и исправлены переносом изменений апстрима. Версия библиотеки остаётся **24.1.0**.

Исходный тарбол: `24.1.0.tar.gz`.
SHA-256: `b309acd58d0fbff8fc43fbd65f91ae9639c5d60e513a2d35643d01969f6eb1f1`.

## Порядок применения

1. `0001-Fix-CVE-2026-27459-reject-oversized-DTLS-cookies.patch`
2. `0002-Fix-CVE-2026-27448-abort-TLS-on-SNI-callback-excepti.patch`

Патчи подготовлены отдельными `git commit` и экспортированы через `git format-patch`. Коммит импорта тарбола в серию не включён. Применять из корня исходников:

```sh
tar -xzf 24.1.0.tar.gz
cd pyopenssl-24.1.0
git init
git add .
git commit -m 'Import pristine pyOpenSSL 24.1.0'
PATCH_DIR=/Users/bixenonoff/WORK/Personal_files/pyopenssl
git am "$PATCH_DIR/0001-Fix-CVE-2026-27459-reject-oversized-DTLS-cookies.patch"
git am "$PATCH_DIR/0002-Fix-CVE-2026-27448-abort-TLS-on-SNI-callback-excepti.patch"
```

Для существующего чистого Git-репозитория 24.1.0 пропустите `git init/add/commit`. Если имя и email Git не настроены, настройте их перед коммитом/`git am`.

## Проверка и сборка

Пример отдельного тестового окружения:

```sh
python3 -m venv .venv
.venv/bin/python -m pip install 'cryptography==42.0.8' 'pytest<9' pytest-rerunfailures pretend setuptools wheel
PYTHONPATH=src .venv/bin/python -m pytest -q
PYTHONPATH=src .venv/bin/python -m pytest -q tests/test_ssl.py -k 'TestDTLS or TestServerNameCallback'
.venv/bin/python setup.py sdist bdist_wheel
```

Для проверки минимальной зависимости используйте отдельное окружение с `cryptography==41.0.5`. Тестовые зависимости не добавлялись в runtime-зависимости пакета.

## Совместимость и изменения поведения

Сохранены публичные сигнатуры, версия 24.1.0 и требования `Python >=3.7`, `cryptography>=41.0.5,<43`. Производственный код изменений совпадает по логике с официальными security-коммитами; переход на pyOpenSSL 26.0.0 или cryptography 46 не требуется.

Изменяется только небезопасное поведение, на которое направлены патчи:

- Слишком длинный DTLS-cookie отклоняется до записи в C-буфер. Исключение `ValueError` передаётся через уже существующий механизм callback errors. Лимит берётся из `DTLS1_COOKIE_LENGTH`; при отсутствии константы используется **255**, как в апстриме. На проверенных bindings работает этот fallback.
- Исключение класса `Exception` в SNI callback передаётся `sys.excepthook`, а handshake прерывается fatal TLS alert вместо продолжения соединения. Нормальные callbacks и передачи TLS/DTLS сохраняются.

## Результаты

- CPython 3.9.6 / cryptography 41.0.5: полный итоговый запуск — **511 passed, 1 skipped**.
- CPython 3.12.14 / cryptography 42.0.8: полный итоговый запуск — **510 passed, 1 failed, 1 skipped**. Не прошёл исходный нестабильный `TestConnection.test_wantWriteError`, воспроизводившийся до патчей.
- При явном исключении двух исходных платформозависимых тестов, `test_wantWriteError` и `TestMemoryBIO.test_unexpected_EOF`: **509 passed, 1 skipped, 2 deselected** на втором окружении. Это не подмена полного запуска; оба результата приведены отдельно.
- Все 8 новых регрессионных случаев проходят; независимый рецензент также выполнил их на cryptography 42.0.8.
- Сборки sdist/wheel успешны; 14 TLS/DTLS-тестов проходят при импорте именно собранного wheel.
- Проверены `git am` на чистом тарболе, совпадение Git tree и повторные **509 passed, 1 skipped, 2 deselected** после применения.

Подробности исходных сбоев, upstream-ссылки и коммиты — в `ОБОСНОВАНИЕ.md`. Python 3.7 и полная матрица ОС/интерпретаторов не запускались.

Рабочие исходники, окружения, журналы и сборки оставлены в `/Users/bixenonoff/WORK/pyopenssl`. В каталоге выдачи находятся только два патча, README и обоснование.

## SHA-256 патчей

```text
cc9b5a864fc54b6c14bd4b2538fc5b08e6144c00da0b3a0d7c8d1de0b8142aa1  0001-Fix-CVE-2026-27459-reject-oversized-DTLS-cookies.patch
b1c7940368862e3ba57632ebc53ef0b09773555c85b19fe95c3d31d10a7f476a  0002-Fix-CVE-2026-27448-abort-TLS-on-SNI-callback-excepti.patch
```
