try {
  [Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager,Windows.Media,ContentType=WindowsRuntime] | Out-Null
  $asyncOp = [Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager]::RequestAsync()
  $manager = $asyncOp.GetAwaiter().GetResult()
  $session = $manager.GetCurrentSession()
  if ($session) {
    $prop = $session.TryGetMediaPropertiesAsync().GetAwaiter().GetResult()
    $playback = $session.GetPlaybackInfo()
    $timeline = $session.GetTimelineProperties()
    [PSCustomObject]@{
      title = $prop.Title
      artist = $prop.Artist
      album = $prop.AlbumTitle
      isPlaying = ($playback.PlaybackStatus -eq 4) # 4 = Playing, 5 = Paused
      source = $session.SourceAppId
      duration = [math]::Round($timeline.EndTime.TotalSeconds)
      position = [math]::Round($timeline.Position.TotalSeconds)
    } | ConvertTo-Json -Compress
  } else {
    Write-Output 'null'
  }
} catch {
  Write-Output 'null'
}
