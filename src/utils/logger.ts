import fs from 'fs';
import path from 'path';

const logDir = 'logs'; // Directory to store log files
let logFilePath: string | null = null;

export function ensureLogDirectoryExists(): void {
    if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir);
    }
}

function getJakartaTime(): Date {
    const currentUtcTime = new Date();
    const jakartaUtcOffset = 7 * 60; // UTC offset for Jakarta (WIB) is +07:00
    const jakartaTime = new Date(currentUtcTime.getTime() + jakartaUtcOffset * 60 * 1000);
    return jakartaTime;
}

function formatTimeForFileName(date: Date): string {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    const hours = String(date.getUTCHours()).padStart(2, '0');
    const minutes = String(date.getUTCMinutes()).padStart(2, '0');
    const seconds = String(date.getUTCSeconds()).padStart(2, '0');
    const milliseconds = String(date.getUTCMilliseconds()).padStart(3, '0');

    return `${year}-${month}-${day}-${hours}-${minutes}-${seconds}-${milliseconds}`;
}

export function getLogFilePath(): string {
    if (!logFilePath) {
        ensureLogDirectoryExists();

        const jakartaTime = getJakartaTime();
        const formattedDate = formatTimeForFileName(jakartaTime);

        const logFileName = `log-${formattedDate}.txt`;
        logFilePath = path.join(logDir, logFileName);
    }

    return logFilePath;
}

export function writeToLogFile(logMessage: string): void {
    const jakartaTime = getJakartaTime();
    const formattedTimestamp = jakartaTime.toISOString();

    const logEntry = `${formattedTimestamp} - ${logMessage}\n`;

    fs.appendFile(getLogFilePath(), logEntry, (err) => {
        if (err) {
            console.error('Error writing to log file:', err);
        }
    });
}
