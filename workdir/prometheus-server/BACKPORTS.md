# Backport трёх CVE на Prometheus 3.2.1

Версия приложения **3.2.1 сохраняется**. Подготовлены три отдельных git-коммита и три файла, полученные `git format-patch`. Исправления не меняют `go.mod`, `go.sum`, `VERSION`, npm manifests/lock-файлы. Обновление vendored-библиотек из исходного отчёта остаётся отдельной работой по [README.md](README.md).

## База и происхождение

- Upstream: https://github.com/prometheus/prometheus
- Тег: `v3.2.1`.
- Точный базовый commit: `804c49d58f3f3784c77c9c8ec17c9062092cae27`.
- Ветка подготовки: `security-backports-v3.2.1`; рабочий репозиторий в комплект не входит.
- Итоговый commit: `78c7e6149b4da8aeb1627769036a31ac71e4c4e2`.
- Оригинальные upstream-изменения доступны по ссылкам ниже; **применять файлы из `patches/series`**, адаптированные к 3.2.1.

| CVE | Upstream-исправление | Локальный коммит | Патч |
|---|---|---|---|
| CVE-2026-42154 | [PR 18584](https://github.com/prometheus/prometheus/pull/18584), commit `327393517041139946b96d03c90252e6f5fe4063`, merge `04055ee19081d89d25ca124eec744744991db3c2` | `7aa5708` | [0001](patches/0001-CVE-2026-42154-snappy-decoded-length.patch) |
| CVE-2026-42151 | [PR 18587](https://github.com/prometheus/prometheus/pull/18587), commit `cc085686844f66d29b724772e5fac6bee3c0b322`, merge `cb493a437beae76c40f4b51240b35ac1e7a3e493` | `97c555a` | [0002](patches/0002-CVE-2026-42151-azuread-secret-redaction.patch) |
| CVE-2026-44903 | [commit 38f23b9](https://github.com/prometheus/prometheus/commit/38f23b9075ced1de2b82d2dad8b2bebb1ecd5b7d) | `78c7e61` | [0003](patches/0003-CVE-2026-44903-heatmap-label-escaping.patch) |

Ссылки на advisory: [remote read](https://github.com/prometheus/prometheus/security/advisories/GHSA-8rm2-7qqf-34qm), [Azure AD](https://github.com/prometheus/prometheus/security/advisories/GHSA-wg65-39gg-5wfj), [heatmap XSS](https://github.com/prometheus/prometheus/security/advisories/GHSA-fw8g-cg8f-9j28).

## Что перенесено и что адаптировано

### 0001 — remote-read / Snappy

В `storage/remote/codec.go` перед выделяющим память `snappy.Decode` вызывается `snappy.DecodedLen`, и длина сверяется с существующим `decodeReadLimit` (32 MiB). Производственное изменение совпадает с upstream. Регрессионный тест upstream размещён в конце существующего `codec_test.go`, поскольку контекст более новой версии не применялся автоматически.

Преднамеренное изменение поведения: запрос с декларируемым распакованным размером больше 32 MiB отклоняется. Лимит существовал для сжатого тела и ранее; теперь он защищает и распаковку. Допустимые небольшие remote-read запросы продолжают обрабатываться.

### 0002 — Azure AD OAuth secret

Поле `OAuthConfig.ClientSecret` переведено со `string` на существующий `config_util.Secret`; в вызове Azure SDK выполняется явное преобразование обратно в строку. Адаптировано расположение imports в 3.2.1, как и в upstream типизирован тестовый секрет.

Дополнительно добавлен `TestOAuthClientSecretRedacted`: секрет считывается из YAML и сохраняется для аутентификации, но при сериализации конфигурации выводится `<secret>`. Формат входной конфигурации и значение, получаемое SDK, не меняются. Вывод секрета через конфигурацию прекращается.

### 0003 — old-ui heatmap

Оригинальное изменение `Graph.tsx` применяется без смысловых изменений: подпись `le` проходит через уже существующую `escapeHTML`. Добавлен тест реального formatter, передаваемого Flot: вредоносный HTML превращается в текст, DOM не создаёт `img`, обычные `0.5` / `+Inf` и пустая подпись сохраняются.

**Обязательно пересобрать старый React UI и встроенные assets.** Один изменённый TSX при использовании старых готовых assets не устраняет CVE в RPM. Флаг `--enable-feature=old-ui` и возможности приложения не удаляются.

## Как применить к исходникам SRPM

Upstream-тег не содержит патчей дистрибутива sl9. Перед интеграцией сравнить его с распакованным `%prep` вашего SRPM; при отличиях проверить применение и конфликты именно на дереве дистрибутива. Сам SRPM пользователем не предоставлен.

1. Сохранить `Version: 3.2.1`, source tarball той же версии, текущие настройки/флаги. Исходники в комплект не входят: получить отдельный checkout, выбрать точную базу и создать рабочую ветку.

```sh
git clone https://github.com/prometheus/prometheus.git prometheus-source
cd prometheus-source
git checkout --detach 804c49d58f3f3784c77c9c8ec17c9062092cae27
```

2. Проверить SHA256 файлов (`patches/SHA256SUMS`) и применить строго по `series`.

```sh
# Из каталога prometheus-server:
(cd patches && shasum -a 256 -c SHA256SUMS)

# В отдельном checkout исходников; PATCH_DIR — абсолютный путь к patches.
PATCH_DIR=/Users/bixenonoff/WORK/workdir/prometheus-server/patches
while IFS= read -r patch_name; do
  git am "$PATCH_DIR/$patch_name" || exit 1
done < "$PATCH_DIR/series"
```

При подготовке серия проверена через `git am` на чистой базе; результат сохранён в таблице ниже.

3. Добавить три `Patch` к существующему spec. Номера выбирать свободные; пример порядка:

```spec
Patch1001: 0001-CVE-2026-42154-snappy-decoded-length.patch
Patch1002: 0002-CVE-2026-42151-azuread-secret-redaction.patch
Patch1003: 0003-CVE-2026-44903-heatmap-label-escaping.patch
```

Если `%prep` уже использует `%autosetup -p1`, не добавлять повторное применение. Иначе использовать штатный для дистрибутива `%patch` с `-p1`. Проверить весь `%prep` и новые проверки в `%check`. Увеличить только `Release`; не маркировать приложение как 3.11.3.

4. Пересобрать React assets **до** сборки/embedding Go-бинарников, используя штатный `web/ui/build_ui.sh` и исходные lock-файлы. Пересобрать все поставляемые бинарники, затем RPM и STAK-образ.
5. Применить план обновления vendored-зависимостей из README, сохраняя версию приложения, и повторить проверки уже на совокупном изменении.

## Фактически выполненные проверки

Среда проверки: macOS arm64, `go1.27.1`, Node `v24.19.0`; Go зависимости и npm lock-файлы исходной версии сохранены. Это проверка upstream-бэкпорта, не сертификация RPM для sl9. Рекомендованный в плане builder Go 1.26.8 отдельно не запускался.

| Проверка | До исправления | После исправления |
|---|---|---|
| `TestDecodeReadRequestTooLarge` | FAIL: нет раннего отказа по лимиту | PASS |
| `TestOAuthClientSecretRedacted` | FAIL: секрет присутствует в YAML | PASS |
| Полные тесты `storage/remote/azuread`, `storage/remote` | — | PASS обоих пакетов |
| Graph heatmap regression | FAIL: formatter вернул HTML | PASS |
| Graph, GraphHelpers, GraphHeatmapHelpers, utils | — | 4 suite, 83 теста PASS |
| Production-сборка старого React UI | — | PASS; source map содержит исправленный formatter; lint warnings в незатронутых файлах |
| git am трёх патчей на чистую базу | — | PASS; итоговое дерево совпало с проверенным |
| Version/go.mod/go.sum/npm manifests и lock-файлы | — | Не изменены |
| Независимое review | — | Неразрешённых замечаний нет |

Подробные рабочие логи и build artifacts удалены при очистке. Таблица фиксирует ранее выполненные проверки; тесты при очистке повторно не запускались.

Команды повторной проверки Go:

```sh
# Из корня отдельно полученного checkout после применения патчей:
GOTOOLCHAIN=local go test -mod=readonly ./storage/remote/azuread ./storage/remote -count=1
```

Команды UI в среде с Node/npm:

```sh
cd web/ui
npm ci --ignore-scripts --no-audit --no-fund
npm run build --workspace @prometheus-io/lezer-promql
cd react-app
npm ci --ignore-scripts --no-audit --no-fund
CI=true npm test -- --watchAll=false --runTestsByPath \
  src/pages/graph/Graph.test.tsx \
  src/pages/graph/GraphHelpers.test.ts \
  src/pages/graph/GraphHeatmapHelpers.test.ts \
  src/utils/utils.test.ts
```

Для воспроизводимой регрессии применять только изменения `*_test.go` / `Graph.test.tsx` к чистому базовому checkout и запускать указанные новые тесты; затем применять production-изменения. Ожидаемые результаты до и после указаны в таблице.

## Как были созданы файлы patch

При подготовке реальные изменения зафиксированы тремя `git commit` с CVE, upstream SHA/PR и описанием адаптации в сообщениях. Экспорт выполнен:

```sh
git format-patch --full-index \
  --base=804c49d58f3f3784c77c9c8ec17c9062092cae27 \
  --output-directory ../patches \
  804c49d58f3f3784c77c9c8ec17c9062092cae27..HEAD
```

Имена экспортированных файлов сокращены до `000N-CVE-...patch`; содержимое mail-patch сохранено. Порядок — `patches/series`, контрольные суммы — `patches/SHA256SUMS`.

## Оставшиеся проверки поставки

Не выполнялись сборка полного RPM/образа sl9 и интеграция с непредоставленными distro patches; необходимо проверить конфигурации, remote-read и Azure AD на стенде, а также наличие исправленного JS в фактически отдаваемом старом UI. Backport исправляет код при прежней версии: версионный сканер может продолжать показывать три CVE. Закрывать их следует подтверждённой применённой серией, успешной регрессией, provenance и VEX, привязанными к checksum нового RPM/образа. Не подменять номер версии и не отключать находки без этих доказательств.
