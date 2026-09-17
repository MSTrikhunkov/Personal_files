# Consul 1.16.1: security backport

База — официальный [`hashicorp/consul v1.16.1`](https://github.com/hashicorp/consul/releases/tag/v1.16.1), commit `e0ab4d29fc4482fbdddd9811b2b4c4a0a38f38fc`. Патчи подготовлены в git-ветке `security/backports-v1.16.1`, итоговый commit `e5cc9d8c9af65505428bcb47260a8352465322a1`. Патчи созданы `git format-patch`; порядок — [patches/series](patches/series), контрольные суммы — [patches/SHA256SUMS](patches/SHA256SUMS).

Версия приложения, все `go.mod`, `go.sum`, `package.json` и lock-файлы сохранены. Vendored зависимости и toolchain рассматриваются отдельно в [README.md](README.md).

## Происхождение и покрытие

| CVE | Backport | Upstream commit | Исправление |
|---|---|---|---|
| CVE-2025-11375 | `4fc2d62` | [`e794201d0c618333d81ad775270f7b32801178fb`](https://github.com/hashicorp/consul/commit/e794201d0c618333d81ad775270f7b32801178fb) | Event payload: лимит 300 байт и ограниченное чтение. |
| CVE-2025-11374 | `98432bc` | [`72a358cd02533477536ad4bd2b781f520fa7fac6`](https://github.com/hashicorp/consul/commit/72a358cd02533477536ad4bd2b781f520fa7fac6) | KV body: ограничение KVMaxValueSize независимо от Content-Length. |
| CVE-2024-10086 | `46270ef` | [`07fae7bb0be8593cc98c38b1ef4a49ed9188932f`](https://github.com/hashicorp/consul/commit/07fae7bb0be8593cc98c38b1ef4a49ed9188932f) | Явный безопасный Content-Type HTTP ошибок. |
| CVE-2024-10005 | `e5cc9d8` | [`d9206fc7e284a9244af4d62f8653a63ca30bd00c`](https://github.com/hashicorp/consul/commit/d9206fc7e284a9244af4d62f8653a63ca30bd00c) | Нормализация входящего пути перед Envoy RBAC и Mesh HTTP настройки. |
| CVE-2024-10006 | `e5cc9d8` | тот же upstream commit | Contains/IgnoreCase, политика underscore headers, сохранение в API/protobuf/UI. |

Все пять проблем применимы к v1.16.1. Последние две исправлены одним согласованным backport, как в upstream: они разделяют Mesh HTTP схему, protobuf и xDS. Оригинальные upstream-изменения доступны по ссылкам в таблице. Исходники, вспомогательные инструменты и подробные логи удалены из комплекта; ниже сохранены результаты проверок.

Официальные бюллетени: [HCSEC-2025-28](https://discuss.hashicorp.com/t/hcsec-2025-28-consuls-event-endpoint-is-vulnerable-to-denial-of-service/76723), [HCSEC-2025-29](https://discuss.hashicorp.com/t/hcsec-2025-29-consuls-kv-endpoint-is-vulnerable-to-denial-of-service/76724), [HCSEC-2024-24](https://discuss.hashicorp.com/t/hcsec-2024-24-consul-vulnerable-to-reflected-xss-on-content-type-error-manipulation), [HCSEC-2024-22](https://discuss.hashicorp.com/t/hcsec-2024-22-consul-l7-intentions-vulnerable-to-url-path-bypass), [HCSEC-2024-23](https://discuss.hashicorp.com/t/hcsec-2024-23-consul-l7-intentions-vulnerable-to-headers-bypass).

## Адаптации

- Event: сохранён upstream лимит 300 байт; неизвестная длина отклоняется. Дополнительно фактическое чтение ограничено `http.MaxBytesReader`, включая заниженный Content-Length. Пустое событие сохраняет nil payload. События больше 300 байт теперь получают HTTP 413, неизвестная длина — HTTP 400.
- KV: вместо upstream отдельной ветки без длины с `maxSize+1` используется единый reader с точным KVMaxValueSize. Превышение на один байт возвращает HTTP 413. Сохранены пустые записи и исходные ошибки чтения. Число прочитанных байт ограничено независимо от длины потока.
- XSS: Content-Type задаётся до вызова endpoint, потому что установка после WriteHeader опоздает. Общий обработчик ошибки также ставит `text/plain; charset=utf-8`. Успешный reverse proxy снимает fallback перед копированием upstream Content-Type; snapshot получает `application/octet-stream` в callback успешного ответа до стриминга. Регрессии проверяют HTML ошибки, ранний WriteHeader, ровно один JSON Content-Type proxy и snapshot save/restore.
- L7: перенесены все upstream параметры нормализации, включая opt-out; server validation, deep copy, API structs, protobuf schema/conversions, UI model/form/helper/pageobject/mock API. Это предотвращает потерю новых полей при редактировании правила в UI. В старом xDS HeaderMatcher заменён на StringMatcher, уже поддерживаемый исходной go-control-plane v0.11.0; зависимость не обновлялась.
- Дополнительно исправлены обнаруженные при review недостатки upstream UI: checkbox отражает сохранённое IgnoreCase из changeset, а переход к Present/Regex сбрасывает несовместимый флаг. Все три сценария подтверждены браузерными red/green регрессиями.
- Protobuf: использован исходный protoc-gen-go v1.30.0; изменена только нужная схема. Все исходные buf managed FileOptions и compiler metadata сохранены через CodeGeneratorRequest. Готовые сгенерированные файлы включены в патч; повторная генерация для его применения не требуется. Большой generated diff связан с новыми enum/message и смещением индексов. Copyright/SPDX сохранены.
- Golden JSON обновлены только семантически: normalizePath и StringMatcher. Форматирование неизменных fixtures сохранено.

## Defaults и настройки L7

Входящие HTTP/HTTP2/gRPC listener по умолчанию получают `normalize_path=true`, как в upstream security fix. Это изменение поведения действует при сохранённой версии приложения 1.16.1. Opt-out `http.incoming.request_normalization.insecure_disable_path_normalization=true` возвращает прежнее поведение и ослабляет защиту. Отключённую нормализацию без проверки эквивалентности обработки пути Envoy/backend нельзя считать устранённой уязвимостью.

Прочие defaults сохранены: `merge_slashes=false`, escaped slash action `IMPLEMENTATION_SPECIFIC_DEFAULT`, underscore header action `ALLOW`. Для приложений, которым не нужны нестандартные пути/заголовки, доступна более строгая mesh конфигурация:

```hcl
Kind = "mesh"
http {
  incoming {
    request_normalization {
      merge_slashes = true
      path_with_escaped_slashes_action = "REJECT_REQUEST"
      headers_with_underscores_action = "REJECT_REQUEST"
    }
  }
}
```

Патч не переписывает существующие intentions. Правила заголовков нужно пересмотреть с учётом регистра и объединения повторяющихся значений: IgnoreCase применим к Exact/Prefix/Suffix/Contains; Contains либо подходящий Regex позволяет искать значение в объединённом заголовке. Regex и Present нельзя комбинировать с IgnoreCase. Default-deny policy и согласованная интерпретация путей Envoy/backend остаются существенными. Наличие новых опций само по себе не исправляет произвольное существующее правило.

При custom `envoy_public_listener_json` connection manager задаёт пользователь: эта upstream ветка не получает автоматическую нормализацию. Её нужно явно включить в custom JSON либо перейти на генерируемый listener.

## Проверки

Среда Go: macOS arm64, Go 1.27.1, исходные зависимости, `-mod=readonly`. Для тестирования старой версии vet отключён. Полный `go test ./...` и Envoy end-to-end integration не запускались.

| Проверка | Результат при подготовке патчей |
|---|---|
| Все пять CVE на исходном v1.16.1 с регрессионными тестами | Воспроизведены: превышение Event/KV, HTML ошибки, отсутствие нормализации и потеря параметров заголовка. |
| Целевые регрессии после backport | PASS, включая границы размера, неизвестную/заниженную длину и ранний HTTP статус. |
| Полные пакеты xDS, structs, pbconfigentry | PASS. |
| Расширенные Event/KVS/HTTP wrapper/proxy/snapshot проверки | PASS, включая успешные streaming-ответы. |
| UI serialization и route-match | До исправления: 2 FAIL; после: 2 PASS. |
| Три дополнительных сценария формы | До адаптации: 3 FAIL; после: PASS. |
| Расширенная проверка формы/helper | 5 PASS, 1 ранее отключённый тест SKIP, 0 FAIL. |
| Применение серии через git am к чистому v1.16.1 | PASS; итоговое дерево совпало с проверенным. |
| Версия, dependency manifests, lock-файлы, diff --check | Без изменений версий; diff чистый. |
| Независимое review | Замечания устранены; неразрешённых замечаний в проверенном объёме нет. |

UI проверялся на Node 16.20.2 / Chromium 151 с исходным yarn.lock. Полные UI tests, production UI build, сборка RPM/sl9 и Envoy E2E не выполнялись. Подробные рабочие логи удалены при очистке; таблица фиксирует ранее выполненные проверки, а не новый запуск тестов.

Команды повторной проверки из корня отдельно полученного checkout после применения патчей:

```sh
GOTOOLCHAIN=local go test -mod=readonly -p 4 -vet=off ./agent/xds ./agent/structs ./proto/private/pbconfigentry -count=1
GOTOOLCHAIN=local go test -mod=readonly -p 4 -vet=off ./agent -run 'Test(Event.*|KVS.*|HTTPAPI.*|HTTP_wrap.*|Security.*|Snapshot.*|UIEndpoint_MetricsProxy)$' -count=1
```

Команды UI с Node 16.20.2 / Yarn Classic и установленным Chrome/Chromium:

```sh
# Из корня отдельно полученного checkout:
cd ui
yarn install --frozen-lockfile
cd packages/consul-ui
CONSUL_NSPACES_ENABLED=0 node ../../node_modules/ember-cli/bin/ember test --filter=security
```

Если Testem не обнаруживает Chromium, задать `browser_paths.Chrome` в локальной тестовой конфигурации. Это настройка тестового окружения, не изменение приложения.

## Применение

Исходники в комплект не входят. Проверить SHA256SUMS из каталога patches, затем отдельно получить официальный репозиторий:

```sh
git clone https://github.com/hashicorp/consul.git consul-source
cd consul-source
git checkout --detach e0ab4d29fc4482fbdddd9811b2b4c4a0a38f38fc
git am /path/to/consul/patches/000*.patch
```

Собрать Go бинарник и UI assets штатным процессом Consul 1.16.1 из исправленных исходников. Готовый официальный бинарник и встроенный UI bundle исходного релиза автоматически не изменяются. Новые поля конфигурации при rolling deployment применять после обновления участвующих server/control-plane узлов: старый код их не сохраняет.
