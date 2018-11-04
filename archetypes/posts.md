---
{{- if eq .TranslationBaseName "index" }}
title: {{ replace (index (split .Path "/" | last 2) 0) "-" " " | title }}
{{- else }}
title: {{ replace .TranslationBaseName "-" " " | title }}
{{- end }}

date: {{ .Date }}
draft: true

tags: []

---

