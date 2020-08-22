import winston, { format } from 'winston'

const logger = winston.createLogger({
    level: 'info',
    format: format.combine(
        format.timestamp(),
        format.prettyPrint()
    ),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ 'filename': 'log.log' })
    ]
})

export default logger
