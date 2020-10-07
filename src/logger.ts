import winston, { format } from 'winston'
import fs from 'fs'

const debugging = fs.existsSync('debug.log')

const logger = winston.createLogger({
    level: debugging ? 'debug' : 'info',
    format: format.combine(
        format.timestamp(),
        format.prettyPrint()
    ),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ 'filename': debugging ? 'debug.log' : 'log.log' })
    ]
})

export default logger
