# Устранение уязвимостей без изменения версии приложения: prometheus-server

> **Статус:** обновление vendored-зависимостей описано как план и ещё не выполнено; флажки отмечать только по сохранённым результатам проверок.

**Цель:** устранить все 9 находок из входного списка для `prometheus-server-3.2.1-1.sl9^1`.

**Неизменяемая версия приложения:** `3.2.1`. Исходный RPM: `prometheus-server-3.2.1-1.sl9^1`. Сохранить RPM `Version: 3.2.1` и исходную базу приложения; для пересборки разрешено увеличить только `Release`. Нельзя подменять исходники новым релизом или повышать версию собственного main-модуля, в том числе для обхода несовместимости зависимостей.

**Архитектура:** Сохранить Prometheus 3.2.1; исправления трёх CVE самого приложения переносить из upstream согласно [BACKPORTS.md](BACKPORTS.md), применяя [patches/series](patches/series) к этой базе. Пересобрать UI вместе с сервером: старые скомпилированные web assets могут сохранить XSS. Затем отдельно обновить vendored-зависимости по шагу 3. UNKNOWN — отсутствующая метаинформация сканера, а не версия для go get собственного main-модуля.

**Стек:** Go, Go modules/vendor, RPM для sl9, образ STAK. Дата проверки источников: 17.09.2026.

**Спецификация:** [исходный список](../findings.tsv); идентификатор образа `STAK-prometheus-server-pvs___1.0-20260914.0422`. Группировка выполнена строго по последнему столбцу, включая суффиксы `^`.

## Ограничения и выбранные версии

Входной отчёт не содержит SRPM, spec-файлов и результатов сборки. Ниже сохранены проверенные при подготовке первоначального плана advisory-пороги и кандидаты версий зависимостей; совместимость с неизменяемой базой приложения ещё необходимо подтвердить. Пути упаковки установить из SRPM. Более новые уже используемые безопасные версии библиотек не понижать. Несовместимость устранять адаптацией вызовов и переносом необходимых изменений на исходную базу; пока это не выполнено и не проверено, выпуск заблокирован.

Использовать Go **1.26.8** (либо проверенную более новую стабильную patch-версию поддерживаемой ветки); закрепить toolchain и builder image digest в рецепте сборки. Доступность 1.26.8 проверена по [официальному списку Go](https://go.dev/dl/?mode=json). Для x/crypto 0.56.0 требуется Go ≥1.26.0. Старый системный Go sl9 нельзя считать достаточным без проверки.

| Модуль из отчёта | Версия в отчёте | Кандидат версии зависимости / действие для приложения |
|---|---|---|
| `github.com/golang-jwt/jwt/v5` | `v5.2.1` | v5.2.2 |
| `github.com/prometheus/prometheus` | `UNKNOWN` | Prometheus **3.2.1**, backport: [BACKPORTS.md](BACKPORTS.md), [patches/series](patches/series) |
| `go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracehttp` | `v1.34.0` | v1.44.0 |
| `golang.org/x/oauth2` | `v0.25.0` | v0.36.0 |
| `google.golang.org/grpc` | `v1.70.0` | v1.83.2 |

Кандидаты зависимостей — комбинация для проверки сборкой, а не гарантия совместимости и не разрешение менять версию приложения. Для каждой CVE ниже указан отдельный порог исправления. Условия веток важны: например, 1.82.2 исправляет CVE-2026-84445, но не является общей целью для всех перечисленных проблем gRPC.

Дополнительно согласовать `x/crypto v0.56.0`, `x/net v0.58.0`, `x/text v0.41.0` во всех графах, где эти модули присутствуют. Это предотвращает сохранение или появление других CVE из исходного списка в транзитивных зависимостях. `grpc v1.83.2` требует `x/net v0.58.0` и `x/text v0.41.0`; его требование `x/crypto v0.55.0` следует поднять до `v0.56.0`. Go MVS может выбрать ещё более высокие версии: фиксировать итоговые go.mod/go.sum и заново сканировать их.

Существующие стабильные модули OpenTelemetry `otel`, `trace`, `metric`, `sdk`, `sdk/metric` и OTLP trace exporters согласовать на **1.44.0**. Версия 1.43.0 уже исправляет CVE-2026-39882/39883, но вновь уязвима по CVE-2026-41178; 1.44.0 избегает этой комбинации. Модули `contrib` и экспериментальные модули имеют свою нумерацию: не присваивать им автоматически 1.44.0.

## Покрытие всех находок

**Справочные upstream-пороги:** версии в этой таблице показывают минимальные исправленные релизы соответствующих веток по advisory. Они не являются целевыми версиями приложения. Для собственного кода Consul/Prometheus доказательство исправления — применённый backport и регрессионные тесты; RPM Version остаётся исходной. Номер строки соответствует исходному TSV, начиная с 1.

| Строка TSV | CVE / GHSA | Модуль | Версия в отчёте | Исправленные upstream-версии (только справка) | Источник |
|---:|---|---|---|---|---|
| 4 | CVE-2025-30204 | `github.com/golang-jwt/jwt/v5` | `v5.2.1` | 5.2.2 | [advisory](https://pkg.go.dev/vuln/GO-2025-3553) |
| 12 | CVE-2026-44903 | `github.com/prometheus/prometheus` | `UNKNOWN` | 0.311.3 | [advisory](https://pkg.go.dev/vuln/GO-2026-5381) |
| 13 | CVE-2026-42154 | `github.com/prometheus/prometheus` | `UNKNOWN` | 0.305.2 / 0.311.3 | [advisory](https://pkg.go.dev/vuln/GO-2026-5264) |
| 14 | CVE-2026-42151 | `github.com/prometheus/prometheus` | `UNKNOWN` | 0.311.3 | [advisory](https://pkg.go.dev/vuln/GO-2026-5710) |
| 16 | CVE-2026-39882 | `go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracehttp` | `v1.34.0` | 1.43.0 | [advisory](https://pkg.go.dev/vuln/GO-2026-4985) |
| 80 | CVE-2025-22868 | `golang.org/x/oauth2` | `v0.25.0` | 0.27.0 | [advisory](https://pkg.go.dev/vuln/GO-2025-3488) |
| 86 | CVE-2026-84445 | `google.golang.org/grpc` | `v1.70.0` | 1.82.2 / 1.83.2 / 1.85.0-dev.0.20260825072537-93e31b48545e | [advisory](https://pkg.go.dev/vuln/GO-2026-6443) |
| 91 | CVE-2026-84304 | `google.golang.org/grpc` | `v1.70.0` | 1.83.1 | [advisory](https://pkg.go.dev/vuln/GO-2026-6348) |
| 96 | CVE-2026-84303 | `google.golang.org/grpc` | `v1.70.0` | 1.83.1 | [advisory](https://pkg.go.dev/vuln/GO-2026-6441) |

## Шаг 1. Подготовить воспроизводимую исходную сборку

- [ ] Получить SRPM именно указанной сборки, spec, все Source/Patch и конфигурацию её STAK-образа; сохранить sha256 исходных артефактов и прежний RPM для отката. Зафиксировать исходный SBOM/отчёт сканера и его версию базы.
- [ ] Распаковать SRPM в отдельный build workspace. Найти все сборочные модули, vendor-архивы, локальные replace и генерируемые файлы. Не править `.codex/attachments`.

```sh
rg --files -g '*.spec' -g 'go.mod' -g 'go.sum' -g 'go.work' -g 'modules.txt' -g '*vendor*' -g 'Makefile' -g 'Dockerfile*'
rg -n 'replace|toolchain|^go |vendor|mod=|BuildRequires|Source|Patch' --glob '*.spec' --glob 'go.mod' --glob 'go.work' --glob 'Makefile' --glob 'Dockerfile*' .
go version
```

- [ ] В каждом модуле сборки сохранить `go list -mod=mod -m -json all` и проверить `Replace`, pseudo-versions и форки. Команды выполняются в подготовительном сетевом окружении; зависимости скачиваются до изолированной RPM-сборки. Не удалять нужные локальные replace.
- [ ] Собрать неизменённый пакет штатным способом и сохранить результаты как baseline для сравнения. Установить фактические пути всех Go-бинарников по списку файлов RPM.

## Шаг 2. Подготовить исходники и recipe

- [ ] Сохранить Prometheus 3.2.1; исправления трёх CVE самого приложения переносить из upstream согласно [BACKPORTS.md](BACKPORTS.md), применяя [patches/series](patches/series) к этой базе. Пересобрать UI вместе с сервером: старые скомпилированные web assets могут сохранить XSS. Затем отдельно обновить vendored-зависимости по шагу 3. UNKNOWN — отсутствующая метаинформация сканера, а не версия для go get собственного main-модуля.
- [ ] В фактически найденном spec сохранить `Version: 3.2.1` и Source базового приложения, увеличить только `Release` по правилам дистрибутива. Добавить необходимые Patch и обновлённый vendor Source-архив, сохранив патчи дистрибутива. Зафиксировать Go BuildRequires/образ сборщика и флаги сборки; проверить `rpm -qp --qf '%{VERSION}-%{RELEASE}\n'` для готового RPM.
- [ ] Изменения должны включать все затронутые `go.mod`, `go.sum`, `vendor/modules.txt`, содержимое vendor или отдельный vendor Source-архив, spec и необходимые совместимые правки исходников. Если штатная сборка использует go.work, регенерировать workspace vendor штатным для проекта способом.

## Шаг 3. Обновить зависимости и vendor

- [ ] В каждом модуле сборки применить целевые версии только к присутствующим зависимостям. Не добавлять удалённую зависимость исключительно из-за её наличия в старом отчёте. Следующий блок задаёт конкретные версии-кандидаты; он пропускает отсутствующие модули и сохраняет уже выбранные более новые версии. Проверить, что пути модулей не перенаправлены на уязвимый форк через replace.

```sh
export GOTOOLCHAIN=local
python3 - <<'PYUPGRADE'
import json, re, subprocess
targets = {'github.com/golang-jwt/jwt/v5': '5.2.2', 'go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracehttp': '1.44.0', 'golang.org/x/oauth2': '0.36.0', 'google.golang.org/grpc': '1.83.2', 'golang.org/x/crypto': '0.56.0', 'golang.org/x/net': '0.58.0', 'golang.org/x/text': '0.41.0', 'go.opentelemetry.io/otel': '1.44.0', 'go.opentelemetry.io/otel/metric': '1.44.0', 'go.opentelemetry.io/otel/trace': '1.44.0', 'go.opentelemetry.io/otel/sdk': '1.44.0', 'go.opentelemetry.io/otel/sdk/metric': '1.44.0', 'go.opentelemetry.io/otel/exporters/otlp/otlptrace': '1.44.0', 'go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracegrpc': '1.44.0'}
def version_key(v):
    match = re.fullmatch(r"v(\d+)\.(\d+)\.(\d+)", v)
    if not match:
        raise SystemExit("Нужна ручная проверка prerelease/pseudo-version: " + v)
    return tuple(map(int, match.groups()))
updates = []
for module, target in targets.items():
    result = subprocess.run(["go", "list", "-mod=mod", "-m", "-json", module],
                            text=True, capture_output=True)
    if result.returncode:
        if "not a known dependency" in result.stderr:
            print("Отсутствует; проверить удаление в SBOM:", module)
            continue
        raise SystemExit(result.stderr)
    data = json.loads(result.stdout)
    if data.get("Main"):
        raise SystemExit("Запрещено обновлять собственный main-модуль приложения: " + module)
    if data.get("Replace"):
        raise SystemExit("Проверить replace вручную до продолжения: " + module)
    current = data.get("Version", "")
    if version_key(current) < version_key("v" + target):
        updates.append(module + "@v" + target)
if updates:
    subprocess.run(["go", "get", *updates], check=True)
PYUPGRADE
go mod tidy
go mod verify
go mod vendor
go list -mod=mod -m -json all
rg -n '^# ' vendor/modules.txt
```

- [ ] Если исходная зависимость имеет pseudo-version (например старый x/net), проверить её коммит и заменить на указанную целевую release-версию через `go get module@version`, используя пару модуль/версия из таблицы, затем повторить блок. Остановка скрипта на таких версиях преднамеренная.
- [ ] Повторить блок обновления после первого разрешения графа: новая версия зависимости может добавить ранее отсутствовавшие модули. Завершить только когда повторный запуск не требует повышений, а итоговые версии всех присутствующих модулей не ниже targets. После повторного tidy/vendor сравнить итоговый граф с таблицей.
- [ ] Разрешить несовместимости API адаптацией вызывающего кода на исходной версии приложения и согласованием protobuf/gRPC/OTEL. Сохранить безопасные версии зависимостей; при необходимости перенести совместимые исправления с доказательствами и тестами. Если кандидаты ещё не удаётся собрать или проверить на этой базе, остановить выпуск до завершения адаптации/backport. Версию приложения не повышать; не считать конфликт устранённым до успешной сборки и регрессионных проверок.
- [ ] Проверить diff всех файлов, убедиться в отсутствии старых копий библиотек, vendor-архивов и небезопасных replace. `go mod verify` проверяет module cache; целостность vendor дополнительно подтвердить повторной генерацией без diff. При workspace vendoring использовать `go work vendor` вместо `go mod vendor` по реальной схеме проекта.

## Шаг 4. Проверить и собрать пакет

- [ ] В каждом реальном сборочном модуле выполнить проверки с теми же build tags/CGO-настройками, что в spec; дополнительно запустить штатные unit/integration tests проекта.

```sh
GOTOOLCHAIN=local GOFLAGS=-mod=vendor go test ./...
GOTOOLCHAIN=local GOFLAGS=-mod=vendor go vet ./...
GOTOOLCHAIN=local GOFLAGS=-mod=vendor go build ./...
GOTOOLCHAIN=local GOFLAGS=-mod=vendor govulncheck ./...
```

- [ ] Версию `govulncheck` заранее закрепить в CI; выполнить анализ с актуальной базой Go. Для зависимостей отсутствие достижимого вызова не заменяет исправления. Для main-модуля со старой версией/UNKNOWN версия сама по себе не показывает наличие backport: сопоставить результат с патчем, сборкой и регрессионным тестом, сохранить исходный вывод анализатора.
- [ ] Пересобрать SRPM/RPM в чистом sl9 buildroot штатным packaging pipeline, используя новый vendor и `-mod=vendor`, без загрузки зависимостей во время финальной сборки. Сохранить build log, checksum, compiler version и точные версии зависимостей.
- [ ] Для каждого Go executable из готового RPM выполнить `go version -m` и `govulncheck -mode=binary` с его фактическим путём. При недоступной build info дополнить проверкой сборочного manifest/SBOM; не объявлять UNKNOWN безопасным.

## Шаг 5. Функциональная проверка и выпуск

- [ ] Проверить promtool check config и promtool check rules на конфигурации стенда; scrape, PromQL, recording/alerting rules, remote write/read, OAuth2/JWT и OTLP HTTP export. Security regression: некорректный snappy remote-read запрос не приводит к аварии/неограниченному выделению памяти; клиентский секрет Azure AD скрыт в config API; значение le с HTML отображается как текст в старом UI, если он поставляется. Перед обновлением сохранить конфигурацию и snapshot TSDB, проверить чтение имеющихся данных и восстановление. Выпускать по одному экземпляру HA-пары; откат данных выполнять из проверенного snapshot, не предполагать совместимость формата с прежним бинарником.
- [ ] Пересобрать соответствующий STAK-образ с новым RPM, закрепить digest и повторно просканировать весь финальный образ тем же сканером, который дал исходный список, с актуальной базой. Проверить все слои/копии бинарников, которые учитывает этот сканер; старый уязвимый бинарник не должен оставаться в поставке.
- [ ] В отчёте «до/после» отметить каждую строку таблицы: CVE/GHSA → реальная версия → бинарник/путь → результат повторного сканирования. Если модуль удалён, подтвердить отсутствие в коде, vendor, SBOM и binaries. Для зависимостей доказать исправленную версию или полное удаление. Для CVE собственного приложения связать каждую находку с upstream commit, конкретным backport, hash собранного артефакта и тестом. Сохранять исходный результат сканирования; оставшиеся версионные срабатывания оформить проверяемым VEX/заключением о backport, а не скрыть blanket-ignore.
- [ ] Выпустить canary и сравнить функциональность, доступность, latency, CPU/RSS и error rate с baseline. При деградации остановить rollout и восстановить проверенную прежнюю сборку/данные согласно тесту восстановления; такой откат возвращает уязвимости и не считается завершением устранения.

## Критерии завершения

- [ ] Каждая строка таблицы имеет доказательство: для зависимости — исправленная версия либо полное удаление; для собственного приложения — provenance upstream/backport, успешные регрессионные тесты на исходной версии и связь с поставляемым RPM/образом. Применение патча без этих проверок не закрывает CVE.
- [ ] Исходники, vendor, фактические бинарники и SBOM согласованы; приложение и RPM `Version` остаются `3.2.1`, изменён `Release`, сохранены новые checksums/digest RPM и образа.
- [ ] Unit/integration и описанные сценарии стенда проходят. Все версионные находки зависимостей устранены. Для собственного приложения сканер может сохранить находку из-за неизменённой версии или UNKNOWN: приложены исходный отчёт и VEX/техническое заключение с CVE, upstream commit, backport/hash, результатами тестов и точной идентификацией RPM/образа. Неподтверждённые исправления блокируют выпуск. Все новые находки от обновления зависимостей разобраны до выпуска.
- [ ] Сохранены отчёты, build logs, lock-файлы, SBOM, результаты canary и проверенный план отката.

## Источники для исполнения

- [Справочный upstream-релиз с исправлениями; не целевая версия приложения](https://github.com/prometheus/prometheus/releases/tag/v3.11.3).
- [Официальная база Go Vulnerability Database](https://vuln.go.dev/); точные карточки приведены у каждой CVE.
- [go.mod github.com/golang-jwt/jwt/v5 v5.2.2](https://proxy.golang.org/github.com/golang-jwt/jwt/v5/@v/v5.2.2.mod).
- [Справочный go.mod Prometheus v0.311.3; не применять как базу](https://proxy.golang.org/github.com/prometheus/prometheus/@v/v0.311.3.mod).
- [go.mod go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracehttp v1.44.0](https://proxy.golang.org/go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracehttp/@v/v1.44.0.mod).
- [go.mod golang.org/x/oauth2 v0.27.0](https://proxy.golang.org/golang.org/x/oauth2/@v/v0.27.0.mod).
- [go.mod google.golang.org/grpc v1.83.2](https://proxy.golang.org/google.golang.org/grpc/@v/v1.83.2.mod).
- [Требования golang.org/x/crypto](https://proxy.golang.org/golang.org/x/crypto/@v/v0.56.0.mod).
- [Требования golang.org/x/net@v0.58.0](https://proxy.golang.org/golang.org/x/net/@v/v0.58.0.mod).
- [Требования golang.org/x/text@v0.41.0](https://proxy.golang.org/golang.org/x/text/@v/v0.41.0.mod).
