$ErrorActionPreference = 'Continue'
$BaseUrl = 'http://192.168.68.41:8787'

$loginResp = Invoke-WebRequest -Uri "$BaseUrl/api/auth/login" -Method POST -Body '{"code":"notif-debug"}' -ContentType 'application/json' -UseBasicParsing
$loginData = $loginResp.Content | ConvertFrom-Json
$token = $loginData.data.access_token
$headers = @{Authorization = "Bearer $token"}

Write-Host "=== GET /notifications ===" -ForegroundColor Cyan
try {
  $resp = Invoke-WebRequest -Uri "$BaseUrl/api/notifications" -Method GET -Headers $headers -UseBasicParsing
  Write-Host $resp.Content -ForegroundColor Green
} catch {
  Write-Host "Status: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
  Write-Host $_.Exception.Message -ForegroundColor Red
}

Write-Host ""
Write-Host "=== POST /notifications/read ===" -ForegroundColor Cyan
try {
  $resp = Invoke-WebRequest -Uri "$BaseUrl/api/notifications/read" -Method POST -Headers $headers -ContentType 'application/json' -Body '{}' -UseBasicParsing
  Write-Host $resp.Content -ForegroundColor Green
} catch {
  $code = $_.Exception.Response.StatusCode.value__
  Write-Host "Status: $code" -ForegroundColor Red
  $stream = $_.Exception.Response.GetResponseStream()
  $reader = New-Object System.IO.StreamReader($stream)
  $body = $reader.ReadToEnd()
  Write-Host "Body: $body" -ForegroundColor Red
}
