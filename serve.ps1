# TravelMate Robust Local Web Server (TcpListener-based)
$port = 8000
$root = $PSScriptRoot
if (-not $root) { $root = (Get-Location).Path }

function Get-MimeType($path) {
    $ext = [System.IO.Path]::GetExtension($path).ToLower()
    switch ($ext) {
        ".html" { return "text/html; charset=utf-8" }
        ".htm"  { return "text/html; charset=utf-8" }
        ".css"  { return "text/css; charset=utf-8" }
        ".js"   { return "application/javascript; charset=utf-8" }
        ".json" { return "application/json; charset=utf-8" }
        ".png"  { return "image/png" }
        ".jpg"  { return "image/jpeg" }
        ".jpeg" { return "image/jpeg" }
        ".gif"  { return "image/gif" }
        ".svg"  { return "image/svg+xml" }
        ".webp" { return "image/webp" }
        ".ico"  { return "image/x-icon" }
        ".woff" { return "font/woff" }
        ".woff2"{ return "font/woff2" }
        ".ttf"  { return "font/ttf" }
        default { return "application/octet-stream" }
    }
}

# Test and find open port
$listener = $null
while ($port -lt 8100) {
    try {
        $listener = New-Object System.Net.Sockets.TcpListener([System.Net.IPAddress]::Any, $port)
        $listener.Start()
        break
    } catch {
        $port++
    }
}

if (-not $listener) {
    Write-Error "Could not start server on any port between 8000 and 8100."
    exit 1
}

$url = "http://localhost:$port/index.html"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host " TravelMate Server Running:" -ForegroundColor Green
Write-Host " URL: $url" -ForegroundColor Green
Write-Host " Root: $root" -ForegroundColor Gray
Write-Host "==========================================" -ForegroundColor Cyan

try {
    Start-Process $url
} catch {
    # Ignore if headless
}

try {
    $buffer = New-Object byte[] 8192
    while ($true) {
        $client = $listener.AcceptTcpClient()
        $stream = $client.GetStream()
        $stream.ReadTimeout = 3000
        
        try {
            $bytesRead = $stream.Read($buffer, 0, $buffer.Length)
            if ($bytesRead -gt 0) {
                $reqStr = [System.Text.Encoding]::UTF8.GetString($buffer, 0, $bytesRead)
                $firstLine = ($reqStr -split "`r`n")[0]
                $parts = $firstLine.Split(" ")
                $method = $parts[0]
                $rawUrl = if ($parts.Length -gt 1) { $parts[1] } else { "/" }
                
                $pathOnly = $rawUrl.Split("?")[0].Split("#")[0]
                $relPath = [System.Uri]::UnescapeDataString($pathOnly.TrimStart('/'))
                if ([string]::IsNullOrWhiteSpace($relPath)) { $relPath = "index.html" }
                
                $filePath = Join-Path $root ($relPath -replace '/', [System.IO.Path]::DirectorySeparatorChar)
                
                if (Test-Path $filePath -PathType Leaf) {
                    $fileBytes = [System.IO.File]::ReadAllBytes($filePath)
                    $mime = Get-MimeType $filePath
                    $header = "HTTP/1.1 200 OK`r`nContent-Type: $mime`r`nContent-Length: $($fileBytes.Length)`r`nConnection: close`r`nAccess-Control-Allow-Origin: *`r`n`r`n"
                    $headerBytes = [System.Text.Encoding]::ASCII.GetBytes($header)
                    $stream.Write($headerBytes, 0, $headerBytes.Length)
                    $stream.Write($fileBytes, 0, $fileBytes.Length)
                } else {
                    $notFoundBody = [System.Text.Encoding]::UTF8.GetBytes("<!DOCTYPE html><html><body><h1>404 Not Found</h1><p>The requested file '$relPath' was not found.</p></body></html>")
                    $header = "HTTP/1.1 404 Not Found`r`nContent-Type: text/html; charset=utf-8`r`nContent-Length: $($notFoundBody.Length)`r`nConnection: close`r`n`r`n"
                    $headerBytes = [System.Text.Encoding]::ASCII.GetBytes($header)
                    $stream.Write($headerBytes, 0, $headerBytes.Length)
                    $stream.Write($notFoundBody, 0, $notFoundBody.Length)
                }
                $stream.Flush()
            }
        } catch {
            # Catch read / write timeouts
        } finally {
            $stream.Close()
            $client.Close()
        }
    }
} finally {
    if ($listener) { $listener.Stop() }
}
