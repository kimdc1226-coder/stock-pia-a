param([string]$Source = ((Get-ChildItem -LiteralPath (Join-Path $PSScriptRoot '..') -Filter '*.pptx' | Select-Object -First 1).FullName))
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression.FileSystem
$projectRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$outputRoot = Join-Path $projectRoot 'data'
$mediaRoot = Join-Path $projectRoot 'assets\ppt'
[IO.Directory]::CreateDirectory($outputRoot) | Out-Null
[IO.Directory]::CreateDirectory($mediaRoot) | Out-Null
$zip = [IO.Compression.ZipFile]::OpenRead($Source)
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
  $media = @($zip.Entries | Where-Object FullName -match '^ppt/media/[^/]+$' | ForEach-Object {
    $destination = Join-Path $mediaRoot $_.Name
    $stream = $_.Open(); $out = [IO.File]::Create($destination)
    try { $stream.CopyTo($out) } finally { $stream.Dispose(); $out.Dispose() }
    @{name=$_.Name;bytes=$_.Length;path=('assets/ppt/' + $_.Name)}
  })
  $additional = @($zip.Entries | Where-Object FullName -match '^ppt/(charts|diagrams)/.*\.xml$' | ForEach-Object { @{path=$_.FullName; xml=(Read-Xml $_).OuterXml} })
  $data = [ordered]@{ source=[IO.Path]::GetFileName($Source); sha256=(Get-FileHash -LiteralPath $Source -Algorithm SHA256).Hash; slideCount=$slides.Count; slides=$slides; media=$media; chartAndDiagramParts=$additional }
  $json = $data | ConvertTo-Json -Depth 35
  $encoding = [Text.UTF8Encoding]::new($false)
  [IO.File]::WriteAllText((Join-Path $outputRoot 'ppt-extracted.json'),$json,$encoding)
  $text = @($slides | ForEach-Object { "## SLIDE $($_.number)"; $_.shapes | ForEach-Object { $_.paragraphs }; if($_.notes.Count){'### NOTES';$_.notes} }) -join "`n"
  [IO.File]::WriteAllText((Join-Path $outputRoot 'ppt-extracted.txt'),$text,$encoding)
  Write-Output "Extracted $($slides.Count) slides, $($media.Count) media files, $($additional.Count) chart/diagram XML parts."
} finally { $zip.Dispose() }
