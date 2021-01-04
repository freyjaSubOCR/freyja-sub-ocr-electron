import path from 'path'
import fs from 'fs'

interface IConfig {
    cachedFrames: number
    rcnnModulePath: string
    ocrModulePath: string
    ocrCharsPath: string
    enableCuda: boolean
    batchSize: number
    cropTop: number
    cropBottom: number
}

class Config {
    static export(): IConfig {
        return {
            cachedFrames: Config.cachedFrames,
            rcnnModulePath: Config.rcnnModulePath,
            ocrModulePath: Config.ocrModulePath,
            ocrCharsPath: Config.ocrCharsPath,
            enableCuda: Config.enableCuda,
            batchSize: Config.batchSize,
            cropTop: Config.cropTop,
            cropBottom: Config.cropBottom
        }
    }

    static import(config: IConfig): void {
        Config.cachedFrames = config.cachedFrames
        Config.rcnnModulePath = config.rcnnModulePath
        Config.ocrModulePath = config.ocrModulePath
        Config.ocrCharsPath = config.ocrCharsPath
        Config.enableCuda = config.enableCuda
        Config.batchSize = config.batchSize
        Config.cropTop = config.cropTop
        Config.cropBottom = config.cropBottom
    }

    static checkPath(): boolean {
        if (/\.asar[/\\]/.exec(Config.rcnnModulePath)) {
            Config.rcnnModulePath = Config.rcnnModulePath.replace(/\.asar([/\\])/, '.asar.unpacked$1')
        }
        if (/\.asar[/\\]/.exec(Config.ocrModulePath)) {
            Config.ocrModulePath = Config.ocrModulePath.replace(/\.asar([/\\])/, '.asar.unpacked$1')
        }
        if (/\.asar[/\\]/.exec(Config.ocrCharsPath)) {
            Config.ocrCharsPath = Config.ocrCharsPath.replace(/\.asar([/\\])/, '.asar.unpacked$1')
        }
        // const rcnnModuleExists = fs.existsSync(Config.rcnnModulePath)
        const ocrModuleExists = fs.existsSync(Config.ocrModulePath)
        const ocrCharsExists = fs.existsSync(Config.ocrCharsPath)
        return ocrModuleExists && ocrCharsExists
    }

    private static _language = 'SC5000Chars'
    private static _font = 'yuan'
    static get language(): string {
        return Config._language
    }
    static set language(value: string) {
        Config._language = value
        Config.ocrModulePath = path.resolve('./', 'models', `ocrV3_${Config.language}_${Config.font}.torchscript`)
        Config.ocrCharsPath = path.resolve('./', 'models', `ocr_${Config.language}.txt`)
    }
    static get font(): string {
        return Config._font
    }
    static set font(value: string) {
        Config._font = value
        Config.ocrModulePath = path.resolve('./', 'models', `ocrV3_${Config.language}_${Config.font}.torchscript`)
    }

    static cachedFrames = 200
    static rcnnModulePath = path.resolve('./', 'models', 'object_detection.torchscript')
    static ocrModulePath = path.resolve('./', 'models', `ocrV3_${Config.language}_${Config.font}.torchscript`)
    static ocrCharsPath = path.resolve('./', 'models', `ocr_${Config.language}.txt`)
    static enableCuda = true
    static batchSize = 8
    static cropTop = 0
    static cropBottom = 0
    // eslint-disable-next-line @typescript-eslint/naming-convention
    static languages: Record<string, string> = { 'Simplified Chinese': 'SC5000Chars', 'Traditional Chinese': 'TC5000Chars' }
    // eslint-disable-next-line @typescript-eslint/naming-convention
    static fonts: Record<string, string> = { '圆体': 'yuan', '黑体': 'hei' }
}

export { Config as default, IConfig, Config }
