# Дополнительные исправления для OpenSearch Dashboards 2.14.0

Проверено 2026-09-16 на том же исходном `2.14.0.tar.gz`:

```text
SHA-256 3113c0c831864be82aa9f1174593ba341c127f90513dabca23cde5d06fcb3078
```

В запросе CVE-2026-59711 указана дважды; рассмотрена один раз. Этот каталог дополняет предыдущий `patches/`, не изменяя его содержимое.

## Результат

| Идентификатор | Применимость | Действие |
|---|---|---|
| CVE-2026-82417 | Применима к qs 6.11.0, закреплённому в `yarn.lock`. При сериализации объект с невызываемым `constructor.isBuffer` вызывает TypeError. Воспроизведено также через `parse` → `stringify` с `plainObjects` и `allowPrototypes`. | `0005-qs-isbuffer-CVE-2026-82417.patch`: backport проверки `typeof ... === 'function'` в `lib/utils.js` и браузерном `dist/qs.js`. |
| CVE-2026-59711 | **Неприменима к предоставленному архиву.** Advisory относится к пакету showdown и вставке metadata title при `completeHTMLDocument`. Ни showdown, ни эта настройка в исходном дереве не обнаружены; showdown отсутствует во всех 114 проверенных manifests/lock-файлах. | Патч не требуется; результаты инвентаризации сохранены в `evidence/inventory.json`. |

Наличие Markdown-редактора не означает наличие showdown. Вывод неприменимости относится к этому архиву и его зафиксированным зависимостям, а не к сторонним плагинам, установленным позднее. Для qs подтверждён дефект библиотеки; удалённая эксплуатация конкретного HTTP-маршрута Dashboards не проверялась.

## Порядок применения

**Сначала применить предыдущие патчи 0001–0004 из `../patches/`, затем патч 0005 из этого каталога.** Он добавляет recipe в существующий установщик. Без установщика и postinstall/production hooks из 0001 один patch 0005 не активирует исправление зависимостей. Отдельный второй установщик не создаётся.

Из корня исходников, куда уже применены 0001–0004:

```sh
set -eu
EXTRA=/absolute/path/to/patches-extra
patch -p1 --dry-run < "$EXTRA/0005-qs-isbuffer-CVE-2026-82417.patch"
patch -p1 < "$EXTRA/0005-qs-isbuffer-CVE-2026-82417.patch"
```

Далее — штатные Node.js 18.19.0, Yarn 1.22.19 и процедура сборки:

```sh
yarn osd bootstrap
node scripts/security_backports/apply.cjs .
node scripts/security_backports/apply.cjs . --check
# Затем штатная сборка целевых платформ.
```

Если зависимости уже установлены, выполнить два `node`-вызова и пересобрать артефакт. Если использовался `--ignore-scripts`, явное применение обязательно до сборки/запуска. При production install сработает hook из предыдущего комплекта: новый recipe будет найден автоматически. Уже собранный frontend bundle необходимо пересобрать.

Скрипт проверяет версии и исходные/исправленные SHA-256, обрабатывает вложенные копии qs, безопасен при повторном вызове. Неизвестная версия или изменённый файл останавливают применение. `--check` ничего не записывает. После переустановки зависимостей исправление должно применяться снова.

`dependency-diffs/qs-6.11.0.patch` — человекочитаемый diff самих файлов библиотеки. Основной patch 0005 уже включает эти изменения в recipe; вручную применять оба варианта не нужно.

## Совместимость

Это точечный перенос upstream-исправления, без перехода на qs 6.16.0. `package.json`, `yarn.lock`, версия Dashboards и версия qs не меняются. Сохраняются синхронный API, параметры parse/stringify, CommonJS и UMD browser export, распознавание настоящих Buffer и совместимых объектов через вызываемый `constructor.isBuffer`.

Меняется только попытка вызвать не-функцию: такое значение больше не считается признаком Buffer и сериализуется как обычные данные. Поведение вызываемых пользовательских `isBuffer`, включая их собственные исключения, намеренно не переопределяется.

Версионный сканер может продолжать отмечать qs 6.11.0. Подтверждение исправления — diff и проверка SHA-256; номер версии не повышен фиктивно.

## Выполненные проверки

На Node.js 18.19.0:

- 22 проверки нового исправления: на исходном qs 14 отказов, после patch — 0;
- в их числе 3000 сравнений обычной сериализации с оригиналом: результаты совпадают;
- реальные Buffer, совместимые объекты Buffer с сохранением `this`, null-prototype objects, строка/число/boolean/объект/массив вместо `isBuffer`;
- round-trip обоих небезопасных режимов парсинга, сохранение стандартной фильтрации prototype-ключей;
- отдельное исполнение UMD bundle в окружении без Node globals;
- применение всех пяти патчей к исходным файлам архива без fuzz/offset, откат и повторное применение;
- production task после новой установки qs выполняет backport;
- 42 регрессионных проверки предыдущего комплекта и проверка хешей ранее исправленных библиотек проходят.

Проверена функция `lib/utils.js` напрямую и сериализация через самодостаточный `dist/qs.js`. Полная установка зависимостей Dashboards, release-сборка, общий TypeScript/lint и запуск с OpenSearch не выполнялись. Полная совместимость всех пользовательских плагинов не заявляется.

Логи находятся в `evidence/`. Воспроизведение (из `prepare.py` скачивается ровно один npm-архив, SHA-512 сверяется с исходным lock-файлом; install scripts не исполняются):

```sh
set -eu
SOURCE=/absolute/path/to/patched/OpenSearch-Dashboards-2.14.0
EXTRA=/absolute/path/to/patches-extra
WORK="$(mktemp -d)"
python3 "$EXTRA/tests/prepare.py" --work "$WORK"
# Следующая команда до применения намеренно должна завершиться кодом 1:
node "$EXTRA/tests/regression.cjs" \
  "$WORK/fixtures/qs-6.11.0/node_modules/qs" \
  "$WORK/original/qs-6.11.0/package" && exit 1
node "$SOURCE/scripts/security_backports/apply.cjs" "$WORK/fixtures"
node "$EXTRA/tests/regression.cjs" \
  "$WORK/fixtures/qs-6.11.0/node_modules/qs" \
  "$WORK/original/qs-6.11.0/package"
node "$SOURCE/scripts/security_backports/apply.cjs" "$WORK/fixtures" --check
node "$EXTRA/tests/build-hook.cjs" "$SOURCE" "$WORK/original"
```

Offline-режим: добавить `--cache /directory/containing/qs-6.11.0.tgz` к prepare.py. Проверка серии из пяти патчей требует, чтобы рядом были оба каталога `patches/` и `patches-extra/`:

```sh
python3 patches-extra/tests/verify-series.py 2.14.0.tar.gz /tmp/osd-extra-series-new
```

Каталог назначения должен отсутствовать.

## Откат

`patch -R -p1 < 0005-qs-isbuffer-CVE-2026-82417.patch` удаляет recipe из исходного дерева, но не восстанавливает уже изменённый qs в node_modules. Для полного отката переустановить зависимости в чистом дереве с предыдущими патчами 0001–0004 и пересобрать артефакт. Предыдущие исправления сохраняются.

## Первичные источники

- [CVE-2026-82417: advisory qs](https://github.com/ljharb/qs/security/advisories/GHSA-4mjr-xmp4-gh2g).
- [Точечное upstream-исправление qs](https://github.com/ljharb/qs/commit/e83d321ffafb38cf210683ac31714fce6ce1c6c6).
- [CVE-2026-59711: advisory showdown](https://github.com/advisories/GHSA-cr32-g25g-vxjj).
- [Upstream-изменения showdown](https://github.com/showdownjs/showdown/commit/184a3e4e97f90e075c4512f2c4c06dcf655e91b7).

Официальные CNA JSON получены из `https://cveawg.mitre.org/api/cve/<CVE-ID>` и сохранены в `evidence/` вместе с upstream commits.
