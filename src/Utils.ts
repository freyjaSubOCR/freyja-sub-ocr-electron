function frameToTime(frame: number, fps: number): string {
    const timeInt = Math.floor(frame * 1000 / fps)
    const timeStruct = new Date(timeInt)
    return `${timeStruct.getUTCHours().toString().padStart(2, '0')}:${timeStruct.getUTCMinutes().toString().padStart(2, '0')}:${timeStruct.getUTCSeconds().toString().padStart(2, '0')}.${Math.floor(timeStruct.getUTCMilliseconds() / 10).toString().padStart(2, '0')}`
}

export { frameToTime }
