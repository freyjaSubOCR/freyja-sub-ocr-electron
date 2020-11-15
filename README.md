# Freyja

Nodejs + electron user interface for freyja subtitle OCR extractor.

Still in beta. All functionality are useable, but you may meet bug / crash when using the app. Please report any bugs
you meet with your ```log.log``` file on github issues.

![Config page screenshot](.img/config.jpg)

![Edit page screenshot](.img/edit.jpg)

## System requirements

16GB of RAM required. Having a Nvidia GPU is strongly recommended or the process will be extremely slow.

## Usage

1. If you are using MacOS or Linux, make sure you have ```ffmpeg``` installed.

2. Download latest version of Freyja from [Releases](https://github.com/freyjaSubOCR/freyja-sub-ocr-electron/releases)
   page and extract it.

3. Download models from <https://github.com/freyjaSubOCR/freyja-sub-ocr-model-zoo/releases>. Choose GPU models if you
   have a Nvidia GPU, otherwise choose CPU models. Download all txt and torchscript files, and place these files into
   ```<app_path>/models/``` folder.

4. Run ```freyja.exe```. Enable ```Enable CUDA``` option if you have a Nvidia GPU and downloaded GPU models,
   otherwise disable the option.

## Known issues

- Video player is laggy.

  Current video player implementation does not work well on real time video playback, a new implementation will be
  available when the app is out of beta.

- MacOS and Linux versions do not work.

  Currently there are some issues related with the underlying ```torch-js``` package. It should be fixed in the next
  beta version.

## FAQ

- Q: Cannot play the video.

  A: Maybe the video is an vfr (variable frame rate) video, which is not supported on current video player
  implementation. You can do a fast transcoding using ffmpeg to convert the video to a constant frame rate video:
  ```ffmpeg -i video.mkv video_transcoded.mkv```. Remux won't work.

- Q: Cannot use GPU models.

  A: Make sure you have a recent Nvidia GPU. If you do have a Nvidia GPU, please try to update the driver.
