# 원본 PPT 추출: data\ppt-extracted.json·.txt, assets\ppt\(삽입 이미지)를 만든다. 로컬 전용 자료이며 저장소에는 올리지 않는다.
# 기본 대상은 프로젝트 루트의 원본 'STOCK PIA자산운용사.pptx'. 다른 파일은 -Source로 지정한다.
#   powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\extract-ppt.ps1 -Source ".\STOCK PIA자산운용사.pptx"
# 원본이 없거나 열리지 않으면 기존 추출 결과를 건드리지 않고 안내 후 종료한다(종료 코드 1).
# (이 파일은 한글 때문에 UTF-8 BOM으로 저장한다. Windows PowerShell 5.1이 BOM 없는 UTF-8을 ANSI로 읽기 때문)
param([string]$Source)
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression.FileSystem
$projectRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$defaultName = 'STOCK PIA자산운용사.pptx'
if (-not $Source) { $Source = Join-Path $projectRoot $defaultName }
$Source = $ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath($Source) # 상대 경로는 현재 폴더 기준
$outputRoot = Join-Path $projectRoot 'data'
$mediaRoot = Join-Path $projectRoot 'assets\ppt'
function Stop-Extract([string]$reason) {
  Write-Host "추출 중단: $reason" -ForegroundColor Red
  Write-Host "필요한 파일: 원본 PPT '$defaultName' (저장 위치: $projectRoot)"
  Write-Host '원본은 저장소에 없으므로 프로젝트 담당자에게 별도로 받아야 합니다. PowerPoint로 열려 있으면 닫고 다시 실행하세요.'
  Write-Host "기존 추출 결과($outputRoot\ppt-extracted.*, $mediaRoot\)는 변경하지 않았습니다."
  exit 1
}
if (-not (Test-Path -LiteralPath $Source -PathType Leaf)) { Stop-Extract "원본 PPT를 찾을 수 없습니다: $Source" }
try { $zip = [IO.Compression.ZipFile]::OpenRead($Source) } catch { Stop-Extract "원본 PPT를 열 수 없습니다(손상·잠금·PPTX 아님): $Source" }
if (-not $zip.GetEntry('ppt/presentation.xml')) { $zip.Dispose(); Stop-Extract "PPTX 형식이 아닙니다: $Source" }
Write-Output "추출 대상: $Source"
function Read-Xml($entry) {
  $reader = [IO.StreamReader]::new($entry.Open())
  try { return [xml]$reader.ReadToEnd() } finally { $reader.Dispose() }
}
function Get-Paragraphs($node) {
  @($node.SelectNodes('.//*[local-name()="p"]') | ForEach-Object {
    $parts = @($_.SelectNodes('.//*[local-name()="t" or local-name()="br"]') | ForEach-Object {
      if ($_.LocalName -eq 'br') { "`n" } else { $_.InnerText }
    })
    $parts -join ''
  })
}
try {
  # 1) 먼저 원본을 모두 읽는다(여기서 실패하면 아무 파일도 쓰지 않음)
  $slides = @($zip.Entries | Where-Object FullName -match '^ppt/slides/slide\d+\.xml$' | Sort-Object { [int]($_.Name -replace '\D','') } | ForEach-Object {
    $number = [int]($_.Name -replace '\D','')
    $xml = Read-Xml $_
    $relEntry = $zip.GetEntry("ppt/slides/_rels/slide$number.xml.rels")
    $relations = @{}
    if ($relEntry) { (Read-Xml $relEntry).DocumentElement.ChildNodes | ForEach-Object { $relations[$_.Id] = $_.Target } }
    $shapes = @($xml.SelectNodes('//*[local-name()="sp" or local-name()="pic" or local-name()="graphicFrame"]') | ForEach-Object {
      $shape = $_
      $meta = $shape.SelectSingleNode('.//*[local-name()="cNvPr"]')
      $position = $shape.SelectSingleNode('.//*[local-name()="xfrm"]')
      $image = $shape.SelectSingleNode('.//*[local-name()="blip"]')
      $imagePath = $null
      if ($image) {
        $rid = $image.GetAttribute('embed','http://schemas.openxmlformats.org/officeDocument/2006/relationships')
        if ($relations[$rid]) { $imagePath = 'assets/ppt/' + [IO.Path]::GetFileName($relations[$rid]) }
      }
      $tables = @($shape.SelectNodes('.//*[local-name()="tbl"]') | ForEach-Object {
        $rows = @($_.SelectNodes('./*[local-name()="tr"]') | ForEach-Object {
          $cells = @($_.SelectNodes('./*[local-name()="tc"]') | ForEach-Object { (Get-Paragraphs $_) -join "`n" })
          ,$cells
        })
        @{ rows = $rows }
      })
      [ordered]@{ id=$meta.id; name=$meta.name; type=$shape.LocalName; alt=$meta.descr; paragraphs=@(Get-Paragraphs $shape); tables=$tables; image=$imagePath; geometryXml=if($position){$position.OuterXml}else{$null} }
    })
    $notes = @()
    $noteTarget = @($relations.Values | Where-Object { $_ -match 'notesSlides' })
    if ($noteTarget.Count) {
      $noteEntry = $zip.GetEntry('ppt/notesSlides/' + [IO.Path]::GetFileName($noteTarget[0]))
      if($noteEntry) { $notes = @(Get-Paragraphs (Read-Xml $noteEntry)) }
    }
    [ordered]@{ number=$number; hidden=($xml.DocumentElement.show -eq '0'); shapes=$shapes; notes=$notes; relationships=$relations }
  })
  $additional = @($zip.Entries | Where-Object FullName -match '^ppt/(charts|diagrams)/.*\.xml$' | ForEach-Object { @{path=$_.FullName; xml=(Read-Xml $_).OuterXml} })
  # 2) 다 읽은 뒤에 결과를 쓴다
  [IO.Directory]::CreateDirectory($outputRoot) | Out-Null
  [IO.Directory]::CreateDirectory($mediaRoot) | Out-Null
  $media = @($zip.Entries | Where-Object FullName -match '^ppt/media/[^/]+$' | ForEach-Object {
    $destination = Join-Path $mediaRoot $_.Name
    $stream = $_.Open(); $out = [IO.File]::Create($destination)
    try { $stream.CopyTo($out) } finally { $stream.Dispose(); $out.Dispose() }
    @{name=$_.Name;bytes=$_.Length;path=('assets/ppt/' + $_.Name)}
  })
  $data = [ordered]@{ source=[IO.Path]::GetFileName($Source); sha256=(Get-FileHash -LiteralPath $Source -Algorithm SHA256).Hash; slideCount=$slides.Count; slides=$slides; media=$media; chartAndDiagramParts=$additional }
  $json = $data | ConvertTo-Json -Depth 35
  $encoding = [Text.UTF8Encoding]::new($false)
  [IO.File]::WriteAllText((Join-Path $outputRoot 'ppt-extracted.json'),$json,$encoding)
  $text = @($slides | ForEach-Object { "## SLIDE $($_.number)"; $_.shapes | ForEach-Object { $_.paragraphs }; if($_.notes.Count){'### NOTES';$_.notes} }) -join "`n"
  [IO.File]::WriteAllText((Join-Path $outputRoot 'ppt-extracted.txt'),$text,$encoding)
  Write-Output "Extracted $($slides.Count) slides, $($media.Count) media files, $($additional.Count) chart/diagram XML parts."
} finally { $zip.Dispose() }
