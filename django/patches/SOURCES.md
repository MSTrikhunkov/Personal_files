# Источники и происхождение

Первичные источники: официальный код Django, security archive и записи CVEProject. Получены 2026-09-16.

## Применимые CVE и исходные коммиты Django 5.2

- CVE-2026-6873: [594360cbf58be7f56eb6da96d58644297c99ef85](https://github.com/django/django/commit/594360cbf58be7f56eb6da96d58644297c99ef85).
- CVE-2026-8404: [366d9ae6e8d1469c04e9ebdc1bcd098fc14a3b1e](https://github.com/django/django/commit/366d9ae6e8d1469c04e9ebdc1bcd098fc14a3b1e).
- CVE-2026-48587: [9b62b0af71a14c657d19d95371630ba839e83d9a](https://github.com/django/django/commit/9b62b0af71a14c657d19d95371630ba839e83d9a).
- CVE-2026-48588: [721685aa7799cc9327bd202cd1f70bd012ca95a7](https://github.com/django/django/commit/721685aa7799cc9327bd202cd1f70bd012ca95a7).
- CVE-2026-53877: [6c66eb8cec52b303af85c2c6e4dd00aa37654dbc](https://github.com/django/django/commit/6c66eb8cec52b303af85c2c6e4dd00aa37654dbc).
- CVE-2026-53878: [d5d60ed0323cddaa0ce0237a26a3d49ac21ee05e](https://github.com/django/django/commit/d5d60ed0323cddaa0ce0237a26a3d49ac21ee05e) — неприменимый DomainNameValidator, сохранён для анализа.
- CVE-2026-15830: [ba80833fa656dd09660b97c4429331067db1b080](https://github.com/django/django/commit/ba80833fa656dd09660b97c4429331067db1b080).

## Уже исправленные CVE: коммиты Django 4.2

- CVE-2026-3902: [4412731aa64d62a6dd7edae79e0c15b72666d7ca](https://github.com/django/django/commit/4412731aa64d62a6dd7edae79e0c15b72666d7ca).
- CVE-2026-33034: [ed4dfda62718a0bb644b80ac8b1d3099861f2295](https://github.com/django/django/commit/ed4dfda62718a0bb644b80ac8b1d3099861f2295).
- CVE-2026-25673: [b3e8ec8cc310489fe80174b14b11edb970d682ea](https://github.com/django/django/commit/b3e8ec8cc310489fe80174b14b11edb970d682ea).
- CVE-2026-1207: [a14363102d98fa29b8cced578eb3a0fadaa5bcb7](https://github.com/django/django/commit/a14363102d98fa29b8cced578eb3a0fadaa5bcb7).
- CVE-2026-1287: [f75f8f3597e1ce351d5ac08b6ba7ebd9dadd9b5d](https://github.com/django/django/commit/f75f8f3597e1ce351d5ac08b6ba7ebd9dadd9b5d).
- CVE-2025-64458: [770eea38d7a0e9ba9455140b5a9a9e33618226a7](https://github.com/django/django/commit/770eea38d7a0e9ba9455140b5a9a9e33618226a7).
- CVE-2025-64459: [59ae82e67053d281ff4562a24bbba21299f0a7d4](https://github.com/django/django/commit/59ae82e67053d281ff4562a24bbba21299f0a7d4).
- CVE-2025-59681: [38d9ef8c7b5cb6ef51b933e51a20e0e0063f33d5](https://github.com/django/django/commit/38d9ef8c7b5cb6ef51b933e51a20e0e0063f33d5).
- CVE-2025-57833: [31334e6965ad136a5e369993b01721499c5d1a92](https://github.com/django/django/commit/31334e6965ad136a5e369993b01721499c5d1a92).

## Advisory и записи

- [Архив безопасности Django](https://docs.djangoproject.com/en/5.2/releases/security/).
- [3 июня 2026: cookies и cache](https://www.djangoproject.com/weblog/2026/jun/03/security-releases/).
- [7 июля 2026: cache, GDALRaster и DomainNameValidator](https://www.djangoproject.com/weblog/2026/jul/07/security-releases/).
- [4 августа 2026: GEOS](https://www.djangoproject.com/weblog/2026/aug/04/security-releases/).
- [DomainNameValidator добавлен в Django 5.1](https://docs.djangoproject.com/en/5.1/ref/validators/#domainnamevalidator).
- [CVE-2025-5783: первичная запись о другом продукте](https://github.com/CVEProject/cvelistV5/blob/main/cves/2025/5xxx/CVE-2025-5783.json).

Оригинальные patches и записи лежат в `../upstream`; это материалы для аудита, **не серия для применения**. Применять следует только шесть файлов из `series` в текущей директории.

## Локальные коммиты

```
c881fcb0742efd39f31b547af91a4a2103348171 CVE-2026-6873: separate signed-cookie salt namespaces
53fe9768723fa09f5ba5d9f355a0a90e44ea1c2e CVE-2026-8404: recognize private cache directives case-insensitively
e1ac8dd152571174fd48985a50bfa0c07012eb3a CVE-2026-48587: strip Vary whitespace and prevent wildcard caching
e5f1d21cbadb3362a79db0f35830c5ba4db7ca08 CVE-2026-48588: do not cache Set-Cookie responses varying on Cookie
894e4ab4bcd3aa417905dd92d63dc83bfaf985c1 CVE-2026-53877: use actual byte length for GDAL raster buffers
b75400c506ff314cf001c362af5f6d5ce56ef3a8 CVE-2026-15830: bound geometry collection parsing before GEOS
```
