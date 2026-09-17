# Устранение уязвимостей с сохранением версий приложений

Дата подготовки планов: 17.09.2026. Сохранены все **100 строк**, **60 уникальных CVE/GHSA**, **11 пакетов** исходного отчёта. В каждом README указаны исходные номера строк, модули, версии из отчёта, справочные upstream-пороги исправлений и ссылки на advisory.

**Все версии приложений фиксированы.** RPM `Version` и исходная база каждого приложения сохраняются; при пересборке увеличивается только `Release`. Повышение версии собственного main-модуля и переход на новый релиз приложения запрещены, включая обход несовместимости новых библиотек.

| Исходный пакет (последний столбец TSV) | Фиксированный Version | Находок | Инструкция | Патчи собственного кода |
|---|---|---:|---|---|
| `blackbox_exporter-0.26.0-2.sl9^2^1` | `0.26.0` | 2 | [blackbox_exporter/README.md](blackbox_exporter/README.md) | Не требуются по этому списку |
| `consul-1.16.1-1.sl9^1` | `1.16.1` | 48 | [consul/README.md](consul/README.md) | [BACKPORTS.md](consul/BACKPORTS.md), [series](consul/patches/series) |
| `etcd-3.5.33-1.sl9^1^1` | `3.5.33` | 4 | [etcd/README.md](etcd/README.md) | Не требуются по этому списку |
| `golang-github-prometheus-alertmanager-0.23.0-6.sl9^1` | `0.23.0` | 5 | [golang-github-prometheus-alertmanager/README.md](golang-github-prometheus-alertmanager/README.md) | Не требуются по этому списку |
| `influxdb-1.8.10-1.sl9^1` | `1.8.10` | 3 | [influxdb/README.md](influxdb/README.md) | Не требуются по этому списку |
| `prometheus-memcached-exporter-0.15.5-1.sl9^1` | `0.15.5` | 3 | [prometheus-memcached-exporter/README.md](prometheus-memcached-exporter/README.md) | Не требуются по этому списку |
| `prometheus-mtail-3.0.8-1.sl9^1` | `3.0.8` | 1 | [prometheus-mtail/README.md](prometheus-mtail/README.md) | Не требуются по этому списку |
| `prometheus-mysqld-exporter-0.17.2-1.sl9^1` | `0.17.2` | 3 | [prometheus-mysqld-exporter/README.md](prometheus-mysqld-exporter/README.md) | Не требуются по этому списку |
| `prometheus-openstack-exporter-1.7.0-1.sl9^1` | `1.7.0` | 5 | [prometheus-openstack-exporter/README.md](prometheus-openstack-exporter/README.md) | Не требуются по этому списку |
| `prometheus-server-3.2.1-1.sl9^1` | `3.2.1` | 9 | [prometheus-server/README.md](prometheus-server/README.md) | [BACKPORTS.md](prometheus-server/BACKPORTS.md), [series](prometheus-server/patches/series) |
| `prometheus_libvirt_exporter-2.2.0-1.sl9^1` | `2.2.0` | 17 | [prometheus_libvirt_exporter/README.md](prometheus_libvirt_exporter/README.md) | Не требуются по этому списку |

Для пяти CVE собственного кода Consul **1.16.1** и трёх CVE Prometheus **3.2.1** подготовлены **7 патчей** на основе upstream: 4 для Consul и 3 для Prometheus. Каждый патч получен из настоящего git-коммита через `git format-patch`; состав патчей, происхождение и фактические результаты проверок приведены в соответствующих BACKPORTS.md. Более новые upstream-релизы в таблицах CVE — **только справка о том, где появилось исправление**, не цель обновления приложения. У остальных девяти пакетов в исходном списке только CVE зависимостей.

Обновления vendored-зависимостей остаются планами: в том числе кандидаты gRPC 1.83.2, x/crypto 0.56.0, согласованные x/net 0.58.0 и x/text 0.41.0, OpenTelemetry 1.44.0 там, где присутствует, и Go toolchain 1.26.8. Совместимость с каждой исходной базой ещё требует проверки. При несовместимости выполнить адаптацию/backport на зафиксированной версии; до успешной сборки и тестов выпуск остановлен.

Наличие инструкции или патча не означает устранения всех 100 находок в поставке. Обновление vendor, интеграция в исходный SRPM/spec, сборка RPM/образов, тесты и итоговый отчёт сканера должны быть выполнены и документированы. Для backport основного приложения версионное срабатывание может сохраниться: требуются upstream provenance, регрессионные тесты, привязка к hash артефакта и VEX/техническое заключение. Нельзя подменять неизменённую версию фиктивной исправленной версией или объявлять нулевой отчёт сканера без проверки.

Финальная проверка: обе серии применены через `git am` к чистым исходным тегам; итоговые деревья совпадают с проверенными репозиториями. Версии приложений и manifests/lock-файлы зависимостей в security-патчах не менялись. Все 100 строк исходного списка сохранены в 11 README. Результаты регрессионных проверок и ограничения тестирования приведены в BACKPORTS.md каждого из двух приложений.

Состав комплекта: инструкции по 11 пакетам, 7 патчей, порядок применения `series`, контрольные суммы `SHA256SUMS` и [исходный список находок](findings.tsv). Исходники, git-репозитории, зависимости, временные инструменты и подробные логи удалены.
