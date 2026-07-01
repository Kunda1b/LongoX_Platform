{{- define "chart.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{- define "chart.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{- define "chart.labels" -}}
helm.sh/chart: {{ include "chart.name" . }}-{{ .Chart.Version | replace "+" "_" }}
{{ include "chart.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
app.kubernetes.io/part-of: longox
{{- end }}

{{- define "chart.selectorLabels" -}}
app.kubernetes.io/name: {{ include "chart.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{- define "chart.image" -}}
{{- $registry := .Values.global.imageRegistry | default .Values.image.registry | default "ghcr.io/longox" -}}
{{- $tag := .Values.global.imageTag | default .Values.image.tag | default "latest" -}}
{{- printf "%s/%s:%s" $registry .Values.image.repository $tag -}}
{{- end }}

{{- define "chart.probes" -}}
livenessProbe:
  httpGet:
    path: /health
    port: http
  initialDelaySeconds: 10
  periodSeconds: 15
  timeoutSeconds: 5
  failureThreshold: 3
readinessProbe:
  httpGet:
    path: /api/health
    port: http
  initialDelaySeconds: 5
  periodSeconds: 10
  timeoutSeconds: 3
  failureThreshold: 2
{{- end }}

{{- define "chart.ingressFromApiGateway" -}}
- from:
    - namespaceSelector:
        matchLabels:
          name: api-gateway
    - namespaceSelector:
        matchLabels:
          name: monitoring
  ports:
    - port: http
{{- end }}
