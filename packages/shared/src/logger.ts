/** 日志级别 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  SILENT = 4,
}

export class Logger {
  private level: LogLevel

  constructor(level: LogLevel = LogLevel.INFO) {
    this.level = level
  }

  setLevel(level: LogLevel) {
    this.level = level
  }

  debug(...args: any[]) {
    if (this.level <= LogLevel.DEBUG) {
      console.debug('[DEBUG]', ...args)
    }
  }

  info(...args: any[]) {
    if (this.level <= LogLevel.INFO) {
      console.info('[INFO]', ...args)
    }
  }

  warn(...args: any[]) {
    if (this.level <= LogLevel.WARN) {
      console.warn('[WARN]', ...args)
    }
  }

  error(...args: any[]) {
    if (this.level <= LogLevel.ERROR) {
      console.error('[ERROR]', ...args)
    }
  }

  /** 进度输出（不换行） */
  step(message: string) {
    if (this.level <= LogLevel.INFO) {
      process.stdout.write(`  ${message}...`)
    }
  }

  stepDone(message?: string) {
    if (this.level <= LogLevel.INFO) {
      process.stdout.write(message ? ` ${message}\n` : ' done\n')
    }
  }
}

export const logger = new Logger()
