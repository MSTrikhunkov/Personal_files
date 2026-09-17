# Устранение уязвимостей без изменения версии приложения: consul

> **Статус:** обновление vendored-зависимостей описано как план и ещё не выполнено; флажки отмечать только по сохранённым результатам проверок.

**Цель:** устранить все 48 находок из входного списка для `consul-1.16.1-1.sl9^1`.

**Неизменяемая версия приложения:** `1.16.1`. Исходный RPM: `consul-1.16.1-1.sl9^1`. Сохранить RPM `Version: 1.16.1` и исходную базу приложения; для пересборки разрешено увеличить только `Release`. Нельзя подменять исходники новым релизом или повышать версию собственного main-модуля, в том числе для обхода несовместимости зависимостей.

**Архитектура:** Сохранить Consul 1.16.1; исправления пяти CVE самого приложения переносить из upstream согласно [BACKPORTS.md](BACKPORTS.md), применяя [patches/series](patches/series) к этой базе. Затем отдельно обновить vendored-зависимости по шагу 3. UNKNOWN — отсутствующая метаинформация сканера, а не версия для go get. CoreDNS — зависимость Consul: обновлять его в исходном графе, не менять версию Consul.

**Стек:** Go, Go modules/vendor, RPM для sl9, образ STAK. Дата проверки источников: 17.09.2026.

**Спецификация:** [исходный список](../findings.tsv); идентификатор образа `STAK-consul-pvs___1.0-20260914.0422`. Группировка выполнена строго по последнему столбцу, включая суффиксы `^`.

## Ограничения и выбранные версии

Входной отчёт не содержит SRPM, spec-файлов и результатов сборки. Ниже сохранены проверенные при подготовке первоначального плана advisory-пороги и кандидаты версий зависимостей; совместимость с неизменяемой базой приложения ещё необходимо подтвердить. Пути упаковки установить из SRPM. Более новые уже используемые безопасные версии библиотек не понижать. Несовместимость устранять адаптацией вызовов и переносом необходимых изменений на исходную базу; пока это не выполнено и не проверено, выпуск заблокирован.

Использовать Go **1.26.8** (либо проверенную более новую стабильную patch-версию поддерживаемой ветки); закрепить toolchain и builder image digest в рецепте сборки. Доступность 1.26.8 проверена по [официальному списку Go](https://go.dev/dl/?mode=json). Для x/crypto 0.56.0 требуется Go ≥1.26.0. Старый системный Go sl9 нельзя считать достаточным без проверки.

| Модуль из отчёта | Версия в отчёте | Кандидат версии зависимости / действие для приложения |
|---|---|---|
| `github.com/coredns/coredns` | `v1.10.1` | v1.11.0 |
| `github.com/hashicorp/consul` | `UNKNOWN` | Consul **1.16.1**, backport: [BACKPORTS.md](BACKPORTS.md), [patches/series](patches/series) |
| `go.opentelemetry.io/otel/sdk` | `v1.16.0` | v1.44.0 |
| `golang.org/x/crypto` | `v0.11.0` | v0.56.0 |
| `golang.org/x/net` | `v0.13.0` | v0.58.0 |
| `golang.org/x/oauth2` | `v0.6.0` | v0.36.0 |
| `google.golang.org/grpc` | `v1.55.0` | v1.83.2 |

Кандидаты зависимостей — комбинация для проверки сборкой, а не гарантия совместимости и не разрешение менять версию приложения. Для каждой CVE ниже указан отдельный порог исправления. Условия веток важны: например, 1.82.2 исправляет CVE-2026-84445, но не является общей целью для всех перечисленных проблем gRPC.

Дополнительно согласовать `x/crypto v0.56.0`, `x/net v0.58.0`, `x/text v0.41.0` во всех графах, где эти модули присутствуют. Это предотвращает сохранение или появление других CVE из исходного списка в транзитивных зависимостях. `grpc v1.83.2` требует `x/net v0.58.0` и `x/text v0.41.0`; его требование `x/crypto v0.55.0` следует поднять до `v0.56.0`. Go MVS может выбрать ещё более высокие версии: фиксировать итоговые go.mod/go.sum и заново сканировать их.

Существующие стабильные модули OpenTelemetry `otel`, `trace`, `metric`, `sdk`, `sdk/metric` и OTLP trace exporters согласовать на **1.44.0**. Версия 1.43.0 уже исправляет CVE-2026-39882/39883, но вновь уязвима по CVE-2026-41178; 1.44.0 избегает этой комбинации. Модули `contrib` и экспериментальные модули имеют свою нумерацию: не присваивать им автоматически 1.44.0.

## Покрытие всех находок

**Справочные upstream-пороги:** версии в этой таблице показывают минимальные исправленные релизы соответствующих веток по advisory. Они не являются целевыми версиями приложения. Для собственного кода Consul/Prometheus доказательство исправления — применённый backport и регрессионные тесты; RPM Version остаётся исходной. Номер строки соответствует исходному TSV, начиная с 1.

| Строка TSV | CVE / GHSA | Модуль | Версия в отчёте | Исправленные upstream-версии (только справка) | Источник |
|---:|---|---|---|---|---|
| 2 | CVE-2023-30464 | `github.com/coredns/coredns` | `v1.10.1` | 1.11.0 | [advisory](https://pkg.go.dev/vuln/GO-2024-3134) |
| 6 | CVE-2025-11375 | `github.com/hashicorp/consul` | `UNKNOWN` | 1.22.0 | [advisory](https://pkg.go.dev/vuln/GO-2025-4082) |
| 7 | CVE-2025-11374 | `github.com/hashicorp/consul` | `UNKNOWN` | 1.22.0 | [advisory](https://pkg.go.dev/vuln/GO-2025-4081) |
| 8 | CVE-2024-10086 | `github.com/hashicorp/consul` | `UNKNOWN` | 1.20.0 | [advisory](https://pkg.go.dev/vuln/GO-2024-3242) |
| 9 | CVE-2024-10006 | `github.com/hashicorp/consul` | `UNKNOWN` | 1.20.1 | [advisory](https://pkg.go.dev/vuln/GO-2024-3241) |
| 10 | CVE-2024-10005 | `github.com/hashicorp/consul` | `UNKNOWN` | 1.20.1 | [advisory](https://pkg.go.dev/vuln/GO-2024-3243) |
| 17 | CVE-2026-39883 | `go.opentelemetry.io/otel/sdk` | `v1.16.0` | 1.43.0 | [advisory](https://pkg.go.dev/vuln/GO-2026-5426) |
| 19 | CVE-2026-56855 | `golang.org/x/crypto` | `v0.11.0` | 0.56.0 | [advisory](https://pkg.go.dev/vuln/GO-2026-6355) |
| 22 | CVE-2026-46598 | `golang.org/x/crypto` | `v0.11.0` | 0.52.0 | [advisory](https://pkg.go.dev/vuln/GO-2026-5033) |
| 24 | CVE-2026-46597 | `golang.org/x/crypto` | `v0.11.0` | 0.52.0 | [advisory](https://pkg.go.dev/vuln/GO-2026-5013) |
| 26 | CVE-2026-46595 | `golang.org/x/crypto` | `v0.11.0` | 0.52.0 | [advisory](https://pkg.go.dev/vuln/GO-2026-5023) |
| 27 | CVE-2026-42508 | `golang.org/x/crypto` | `v0.11.0` | 0.52.0 | [advisory](https://pkg.go.dev/vuln/GO-2026-5021) |
| 29 | CVE-2026-39835 | `golang.org/x/crypto` | `v0.11.0` | 0.52.0 | [advisory](https://pkg.go.dev/vuln/GO-2026-5015) |
| 31 | CVE-2026-39834 | `golang.org/x/crypto` | `v0.11.0` | 0.52.0 | [advisory](https://pkg.go.dev/vuln/GO-2026-5020) |
| 33 | CVE-2026-39833 | `golang.org/x/crypto` | `v0.11.0` | 0.52.0 | [advisory](https://pkg.go.dev/vuln/GO-2026-5005) |
| 35 | CVE-2026-39832 | `golang.org/x/crypto` | `v0.11.0` | 0.52.0 | [advisory](https://pkg.go.dev/vuln/GO-2026-5006) |
| 37 | CVE-2026-39831 | `golang.org/x/crypto` | `v0.11.0` | 0.52.0 | [advisory](https://pkg.go.dev/vuln/GO-2026-5019) |
| 39 | CVE-2026-39830 | `golang.org/x/crypto` | `v0.11.0` | 0.52.0 | [advisory](https://pkg.go.dev/vuln/GO-2026-5017) |
| 41 | CVE-2026-39829 | `golang.org/x/crypto` | `v0.11.0` | 0.52.0 | [advisory](https://pkg.go.dev/vuln/GO-2026-5018) |
| 42 | CVE-2026-39828 | `golang.org/x/crypto` | `v0.11.0` | 0.52.0 | [advisory](https://pkg.go.dev/vuln/GO-2026-5014) |
| 44 | CVE-2026-39827 | `golang.org/x/crypto` | `v0.11.0` | 0.52.0 | [advisory](https://pkg.go.dev/vuln/GO-2026-5016) |
| 46 | CVE-2025-58181 | `golang.org/x/crypto` | `v0.11.0` | 0.45.0 | [advisory](https://pkg.go.dev/vuln/GO-2025-4134) |
| 48 | CVE-2025-47914 | `golang.org/x/crypto` | `v0.11.0` | 0.45.0 | [advisory](https://pkg.go.dev/vuln/GO-2025-4135) |
| 50 | CVE-2025-47913 | `golang.org/x/crypto` | `v0.11.0` | 0.43.0 | [advisory](https://pkg.go.dev/vuln/GO-2025-4116) |
| 51 | CVE-2025-22869 | `golang.org/x/crypto` | `v0.11.0` | 0.35.0 | [advisory](https://pkg.go.dev/vuln/GO-2025-3487) |
| 52 | CVE-2024-45337 | `golang.org/x/crypto` | `v0.11.0` | 0.31.0 | [advisory](https://pkg.go.dev/vuln/GO-2024-3321) |
| 53 | CVE-2023-48795 | `golang.org/x/crypto` | `v0.11.0` | 0.17.0 | [advisory](https://pkg.go.dev/vuln/GO-2023-2402) |
| 54 | CVE-2026-42506 | `golang.org/x/net` | `v0.13.0` | 0.55.0 | [advisory](https://pkg.go.dev/vuln/GO-2026-5025) |
| 56 | CVE-2026-39821 | `golang.org/x/net` | `v0.13.0` | 0.55.0 | [advisory](https://pkg.go.dev/vuln/GO-2026-5026) |
| 60 | CVE-2026-33814 | `golang.org/x/net` | `v0.13.0` | 0.53.0 | [advisory](https://pkg.go.dev/vuln/GO-2026-4918) |
| 63 | CVE-2026-27136 | `golang.org/x/net` | `v0.13.0` | 0.55.0 | [advisory](https://pkg.go.dev/vuln/GO-2026-5030) |
| 64 | CVE-2026-25681 | `golang.org/x/net` | `v0.13.0` | 0.55.0 | [advisory](https://pkg.go.dev/vuln/GO-2026-5029) |
| 65 | CVE-2026-25680 | `golang.org/x/net` | `v0.13.0` | 0.55.0 | [advisory](https://pkg.go.dev/vuln/GO-2026-5028) |
| 66 | CVE-2025-58190 | `golang.org/x/net` | `v0.13.0` | 0.45.0 | [advisory](https://pkg.go.dev/vuln/GO-2026-4441) |
| 67 | CVE-2025-47911 | `golang.org/x/net` | `v0.13.0` | 0.45.0 | [advisory](https://pkg.go.dev/vuln/GO-2026-4440) |
| 68 | CVE-2025-22872 | `golang.org/x/net` | `v0.13.0` | 0.38.0 | [advisory](https://pkg.go.dev/vuln/GO-2025-3595) |
| 69 | CVE-2025-22870 | `golang.org/x/net` | `v0.13.0` | 0.36.0 | [advisory](https://pkg.go.dev/vuln/GO-2025-3503) |
| 71 | CVE-2024-45338 | `golang.org/x/net` | `v0.13.0` | 0.33.0 | [advisory](https://pkg.go.dev/vuln/GO-2024-3333) |
| 72 | CVE-2023-45288 | `golang.org/x/net` | `v0.13.0` | 0.23.0 | [advisory](https://pkg.go.dev/vuln/GO-2024-2687) |
| 75 | CVE-2023-44487 | `golang.org/x/net` | `v0.13.0` | 0.17.0 | [advisory](https://github.com/golang/go/issues/63417) |
| 76 | CVE-2023-39325 | `golang.org/x/net` | `v0.13.0` | 0.17.0 | [advisory](https://pkg.go.dev/vuln/GO-2023-2102) |
| 81 | CVE-2025-22868 | `golang.org/x/oauth2` | `v0.6.0` | 0.27.0 | [advisory](https://pkg.go.dev/vuln/GO-2025-3488) |
| 85 | GHSA-hrxh-6v49-42gf | `google.golang.org/grpc` | `v1.55.0` | 1.82.1 | [advisory](https://pkg.go.dev/vuln/GO-2026-6061) |
| 88 | CVE-2026-84445 | `google.golang.org/grpc` | `v1.55.0` | 1.82.2 / 1.83.2 / 1.85.0-dev.0.20260825072537-93e31b48545e | [advisory](https://pkg.go.dev/vuln/GO-2026-6443) |
| 93 | CVE-2026-84304 | `google.golang.org/grpc` | `v1.55.0` | 1.83.1 | [advisory](https://pkg.go.dev/vuln/GO-2026-6348) |
| 97 | CVE-2026-84303 | `google.golang.org/grpc` | `v1.55.0` | 1.83.1 | [advisory](https://pkg.go.dev/vuln/GO-2026-6441) |
| 99 | CVE-2026-33186 | `google.golang.org/grpc` | `v1.55.0` | 1.79.3 | [advisory](https://pkg.go.dev/vuln/GO-2026-4762) |
| 100 | CVE-2023-44487 | `google.golang.org/grpc` | `v1.55.0` | 1.56.3 / 1.57.1 / 1.58.3 | [advisory](https://github.com/grpc/grpc-go/security/advisories/GHSA-m425-mq94-257g) |

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

- [ ] Сохранить Consul 1.16.1; исправления пяти CVE самого приложения переносить из upstream согласно [BACKPORTS.md](BACKPORTS.md), применяя [patches/series](patches/series) к этой базе. Затем отдельно обновить vendored-зависимости по шагу 3. UNKNOWN — отсутствующая метаинформация сканера, а не версия для go get. CoreDNS — зависимость Consul: обновлять его в исходном графе, не менять версию Consul.
- [ ] В фактически найденном spec сохранить `Version: 1.16.1` и Source базового приложения, увеличить только `Release` по правилам дистрибутива. Добавить необходимые Patch и обновлённый vendor Source-архив, сохранив патчи дистрибутива. Зафиксировать Go BuildRequires/образ сборщика и флаги сборки; проверить `rpm -qp --qf '%{VERSION}-%{RELEASE}\n'` для готового RPM.
- [ ] Изменения должны включать все затронутые `go.mod`, `go.sum`, `vendor/modules.txt`, содержимое vendor или отдельный vendor Source-архив, spec и необходимые совместимые правки исходников. Если штатная сборка использует go.work, регенерировать workspace vendor штатным для проекта способом.

## Шаг 3. Обновить зависимости и vendor

- [ ] В каждом модуле сборки применить целевые версии только к присутствующим зависимостям. Не добавлять удалённую зависимость исключительно из-за её наличия в старом отчёте. Следующий блок задаёт конкретные версии-кандидаты; он пропускает отсутствующие модули и сохраняет уже выбранные более новые версии. Проверить, что пути модулей не перенаправлены на уязвимый форк через replace.

```sh
export GOTOOLCHAIN=local
python3 - <<'PYUPGRADE'
import json, re, subprocess
targets = {'github.com/coredns/coredns': '1.11.0', 'go.opentelemetry.io/otel/sdk': '1.44.0', 'golang.org/x/crypto': '0.56.0', 'golang.org/x/net': '0.58.0', 'golang.org/x/oauth2': '0.36.0', 'google.golang.org/grpc': '1.83.2', 'golang.org/x/text': '0.41.0', 'go.opentelemetry.io/otel': '1.44.0', 'go.opentelemetry.io/otel/metric': '1.44.0', 'go.opentelemetry.io/otel/trace': '1.44.0', 'go.opentelemetry.io/otel/sdk/metric': '1.44.0'}
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

- [ ] На отдельном трёхузловом кластере проверить leader election, Raft quorum, DNS/service discovery, KV, sessions, ACL, Connect/mTLS и OTLP. Проверить отказы на некорректном Content-Length у KV/event, ограничения доступа ACL и поведение URL-редиректов. Выполнить сценарии security regression из upstream-исправлений для пяти CVE Consul. Проверить совместимость исправленной сборки 1.16.1 с неизменённой 1.16.1 при последовательной замене узлов. Сначала snapshot и тест восстановления; серверы обновлять по одному с проверкой quorum, затем агенты.
- [ ] Пересобрать соответствующий STAK-образ с новым RPM, закрепить digest и повторно просканировать весь финальный образ тем же сканером, который дал исходный список, с актуальной базой. Проверить все слои/копии бинарников, которые учитывает этот сканер; старый уязвимый бинарник не должен оставаться в поставке.
- [ ] В отчёте «до/после» отметить каждую строку таблицы: CVE/GHSA → реальная версия → бинарник/путь → результат повторного сканирования. Если модуль удалён, подтвердить отсутствие в коде, vendor, SBOM и binaries. Для зависимостей доказать исправленную версию или полное удаление. Для CVE собственного приложения связать каждую находку с upstream commit, конкретным backport, hash собранного артефакта и тестом. Сохранять исходный результат сканирования; оставшиеся версионные срабатывания оформить проверяемым VEX/заключением о backport, а не скрыть blanket-ignore.
- [ ] Выпустить canary и сравнить функциональность, доступность, latency, CPU/RSS и error rate с baseline. При деградации остановить rollout и восстановить проверенную прежнюю сборку/данные согласно тесту восстановления; такой откат возвращает уязвимости и не считается завершением устранения.

## Критерии завершения

- [ ] Каждая строка таблицы имеет доказательство: для зависимости — исправленная версия либо полное удаление; для собственного приложения — provenance upstream/backport, успешные регрессионные тесты на исходной версии и связь с поставляемым RPM/образом. Применение патча без этих проверок не закрывает CVE.
- [ ] Исходники, vendor, фактические бинарники и SBOM согласованы; приложение и RPM `Version` остаются `1.16.1`, изменён `Release`, сохранены новые checksums/digest RPM и образа.
- [ ] Unit/integration и описанные сценарии стенда проходят. Все версионные находки зависимостей устранены. Для собственного приложения сканер может сохранить находку из-за неизменённой версии или UNKNOWN: приложены исходный отчёт и VEX/техническое заключение с CVE, upstream commit, backport/hash, результатами тестов и точной идентификацией RPM/образа. Неподтверждённые исправления блокируют выпуск. Все новые находки от обновления зависимостей разобраны до выпуска.
- [ ] Сохранены отчёты, build logs, lock-файлы, SBOM, результаты canary и проверенный план отката.

## Источники для исполнения

- [Справочный upstream-релиз с исправлениями; не целевая версия приложения](https://developer.hashicorp.com/consul/docs/upgrade).
- [Официальная база Go Vulnerability Database](https://vuln.go.dev/); точные карточки приведены у каждой CVE.
- [go.mod github.com/coredns/coredns v1.11.0](https://proxy.golang.org/github.com/coredns/coredns/@v/v1.11.0.mod).
- [Справочный go.mod Consul v1.22.0; не применять как базу](https://proxy.golang.org/github.com/hashicorp/consul/@v/v1.22.0.mod).
- [go.mod go.opentelemetry.io/otel/sdk v1.44.0](https://proxy.golang.org/go.opentelemetry.io/otel/sdk/@v/v1.44.0.mod).
- [go.mod golang.org/x/crypto v0.56.0](https://proxy.golang.org/golang.org/x/crypto/@v/v0.56.0.mod).
- [go.mod golang.org/x/net v0.55.0](https://proxy.golang.org/golang.org/x/net/@v/v0.55.0.mod).
- [go.mod golang.org/x/oauth2 v0.27.0](https://proxy.golang.org/golang.org/x/oauth2/@v/v0.27.0.mod).
- [go.mod google.golang.org/grpc v1.83.2](https://proxy.golang.org/google.golang.org/grpc/@v/v1.83.2.mod).
- [Требования golang.org/x/crypto](https://proxy.golang.org/golang.org/x/crypto/@v/v0.56.0.mod).
- [Требования golang.org/x/net@v0.58.0](https://proxy.golang.org/golang.org/x/net/@v/v0.58.0.mod).
- [Требования golang.org/x/text@v0.41.0](https://proxy.golang.org/golang.org/x/text/@v/v0.41.0.mod).
