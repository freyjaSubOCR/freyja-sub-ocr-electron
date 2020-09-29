# freyja

Nodejs + electron user interface for freyja subtitle OCR extractor.

WIP

## FAQ

- Q: Video stay still on playing.
  
  A: Your video is an vfr (variable frame rate) video, which is not supported on current video player implementation. You
  can do a fast transcoding using ffmpeg: ```ffmpeg -i video.mkv video_transcoded.mkv```. Note: remux won't work.
