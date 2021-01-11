# Change Log

## V0.4.0

This version is updated to use OCRV3 models. OCRV3 models are faster than the old OCR models with little accuracy loss.
The new models use less GPU memory, so the default batch size has been updated from 8 to 32. On a Surface book 2 laptop
(i7-8650U, GTX 1060 Max-Q), it only takes 10 minutes to process a 24 minutes video.

This version does not need an object detection model, and it unifies CPU and GPU models.

To archive a higher accuracy, this version requires you to select a tighter subtitle boundary.

这个版本使用了更新后的OCRV3模型。新的OCRV3模型相比旧的OCR模型来说运行速度更快，也更加准确。新模型使用的GPU内存较少，所以
默认的批次大小从8个变更为32个。在Surface book 2笔记本上（i7-8650U，GTX 1060 Max-Q），处理一段24分钟的视频只需要10分钟。

这个版本不需要以前的对象检测模型，也统一了CPU和GPU模型。

新的模型需要你框选更准确的字幕边界，否则准确度会很差。
