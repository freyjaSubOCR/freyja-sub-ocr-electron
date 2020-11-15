# Freyja

Nodejs + electron user interface for freyja subtitle OCR extractor.

Still in beta. All functionality are useable, but you may meet bug / crash when using the app. Please report any bugs
you meet with your ```log.log``` file on github issues.

![Config page screenshot](.img/config.jpg)

![Edit page screenshot](.img/edit.jpg)

## System requirements

16GB of RAM required. Having a recent Nvidia GPU is strongly recommended or the process will be extremely slow.

## Usage

1. If you are using Windows, please install [Visual C++ Redist 2019](https://aka.ms/vs/16/release/vc_redist.x64.exe). If
   you are using MacOS or Linux, make sure you have ```ffmpeg``` installed.

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

## Common issues

- Cannot play the video.

  Maybe the video is an vfr (variable frame rate) video, which is not supported on current video player
  implementation. You can do a fast transcoding using ffmpeg to convert the video to a constant frame rate video:
  ```ffmpeg -i video.mkv video_transcoded.mkv```. Remux won't work.

- Cannot use GPU models.

  Make sure you have a recent Nvidia GPU. If you do have a Nvidia GPU, please try to update the driver.

- The program says that "pyTorch backend crashed".

  Please check the ```log.log```.
  
  If the log says that ```CUDA out of memory```, you need to reduce the batch size. If it still not works, it means that
  your GPU memory is too small and you can only use the CPU models.

  If the log shows other errors, please try to change the crop height of the video.
