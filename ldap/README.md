# Security backports для python-ldap 3.4.4

Подготовлено 2026-09-18. CVE-2025-61912 и CVE-2025-61911 применимы к предоставленным исходникам и исправлены переносом официальных изменений апстрима. Версия остаётся **3.4.4**.

Исходный файл: `python-ldap-3.4.4.tar.gz`.
SHA-256: `98c03c14724636351964606a307bf946fa6248630c2d6b89938a6911b6b84c99`.

Обратите внимание: корневой каталог внутри этого тарбола называется **`python-ldap-python-ldap-3.4.4`**.

## Порядок применения

1. `0001-Fix-CVE-2025-61912-escape-DN-NUL-as-RFC-4514-hex.patch`
2. `0002-Fix-CVE-2025-61911-require-strings-for-filter-escapi.patch`

Каждый патч создан отдельным `git commit` и экспортирован через `git format-patch`. Базовый коммит импорта тарбола в серию не включён.

```sh
tar -xzf python-ldap-3.4.4.tar.gz
cd python-ldap-python-ldap-3.4.4
git init
git add .
git commit -m 'Import pristine python-ldap 3.4.4'
PATCH_DIR=/Users/bixenonoff/WORK/Personal_files/ldap
git am "$PATCH_DIR/0001-Fix-CVE-2025-61912-escape-DN-NUL-as-RFC-4514-hex.patch"
git am "$PATCH_DIR/0002-Fix-CVE-2025-61911-require-strings-for-filter-escapi.patch"
```

Для существующего чистого Git-репозитория на исходниках 3.4.4 шаги `git init/add/commit` не нужны. Имя и email Git должны быть настроены.

## Сборка и тесты

Для C-расширения требуются компилятор, заголовки Python/OpenLDAP и зависимости SASL/TLS согласно исходной конфигурации `setup.cfg`. Эти требования патчами не меняются. Пример окружения:

```sh
python3 -m venv .venv
.venv/bin/python -m pip install 'setuptools<81' wheel pyasn1 pyasn1_modules
.venv/bin/python setup.py build_ext --inplace
PYTHONPATH=Lib .venv/bin/python -bb -Werror -m unittest -v \
  Tests/t_ldap_dn.py Tests/t_ldap_filter.py
.venv/bin/python setup.py sdist bdist_wheel
```

Полный upstream-набор (требует совместимого slapd, CLI-инструментов, схем и TLS-возможностей):

```sh
PYTHONPATH=Lib .venv/bin/python -bb -Werror -m unittest discover -v -s Tests -p 't_*'
```

Набор, предусмотренный исходным `tox.ini` для macOS:

```sh
PYTHONPATH=Lib CI_DISABLED=INIT_FD .venv/bin/python -bb -Werror -m unittest -v \
  Tests/t_cidict.py Tests/t_ldap_dn.py Tests/t_ldap_filter.py \
  Tests/t_ldap_functions.py Tests/t_ldap_modlist.py \
  Tests/t_ldap_schema_tokenizer.py Tests/t_ldapurl.py \
  Tests/t_ldif.py Tests/t_untested_mods.py
```

## Совместимость

Сохранены версия 3.4.4, публичные сигнатуры, зависимости и требование Python >=3.6. Нативный C-код не изменялся. Производственные изменения совпадают с исправлениями апстрима для 3.4.5; другие изменения этого релиза не переносились.

Намеренные изменения небезопасного поведения:

- NUL в `escape_dn_chars` заменяется на текстовую последовательность `\00` согласно RFC 4514, а не на обратную косую черту с буквальным NUL. Строка с буквальной последовательностью `\00` по-прежнему экранируется отдельно и не превращается в NUL.
- `escape_filter_chars` принимает `str`, включая подклассы. Для списков, словарей, bytes и остальных нестроковых значений во всех режимах теперь возникает `TypeError`. Это устраняет обход через контейнеры в режиме 1. Режимы 0/1/2 для строк сохранены.

## Результаты проверок

- CPython 3.9.6 и 3.12.14: macOS-набор — **72 теста, OK (expected failures=1)**. Единственный expected failure — исходный `TestLDAPUrl.test_bad_urls`.
- Все **13 тестов DN/фильтров** проходят с настоящим `_ldap`, в том числе из собранного wheel. Добавлено четыре новых тестовых метода; обновлены существующие upstream-ожидания.
- Полный набор на macOS: до патчей **104 теста / 12 errors**, после — **108 тестов / те же 12 errors**. Ошибки связаны с системными slapd/TLS-возможностями; полный набор успешным не объявляется. Подробности в `ОБОСНОВАНИЕ.md`.
- Успешны сборки sdist/wheel, независимое ревью, `git diff --check`, применение через `git am` к чистому тарболу, повторная сборка и 72 теста после применения. Git tree совпадает с рабочим.

Python 3.6 и остальные платформы полной upstream-матрицы не запускались. Исходники, окружения, сборки и журналы оставлены в `/Users/bixenonoff/WORK/ldap`. Каталог выдачи содержит только два патча, этот README и обоснование.

## SHA-256 патчей

```text
397a76436101d7eceb58db6e030f3620f0a33f701dbdf7ce958592141650a4ff  0001-Fix-CVE-2025-61912-escape-DN-NUL-as-RFC-4514-hex.patch
81c3c0f1e79e406f02e3d06ec7e1e238984ac94a036ba5e19deeeaea73428b29  0002-Fix-CVE-2025-61911-require-strings-for-filter-escapi.patch
```
