/**
 * Structured Logger for Lambda Functions
 * 
 * Features:
 * - JSON output for CloudWatch Logs Insights queries
 * - Log levels: DEBUG, INFO, WARN, ERROR
 * - Request ID tracking
 * - No PII logging (scrub sensitive data)
 */

export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  function: string;
  message: string;
  data?: Record<string, unknown>;
  requestId?: string;
}

// PII fields to scrub
const PII_FIELDS = [
  'email', 'phone', 'address', 'password', 'token', 
  'apiKey', 'secret', 'creditCard', 'ssn'
];

export class Logger {
  private functionName: string;
  private requestId?: string;
  private minLevel: LogLevel;

  constructor(functionName: string, requestId?: string) {
    this.functionName = functionName;
    this.requestId = requestId;
    this.minLevel = (process.env.LOG_LEVEL as LogLevel) || 'INFO';
  }

  setRequestId(requestId: string): void {
    this.requestId = requestId;
  }

  debug(message: string, data?: Record<string, unknown>): void {
    this.log('DEBUG', message, data);
  }

  info(message: string, data?: Record<string, unknown>): void {
    this.log('INFO', message, data);
  }

  warn(message: string, data?: Record<string, unknown>): void {
    this.log('WARN', message, data);
  }

  error(message: string, data?: Record<string, unknown>): void {
    this.log('ERROR', message, data);
  }

  private log(level: LogLevel, message: string, data?: Record<string, unknown>): void {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      function: this.functionName,
      message,
      requestId: this.requestId,
    };

    if (data) {
      entry.data = this.scrubPII(data);
    }

    // Output as JSON for CloudWatch Logs Insights
    const output = JSON.stringify(entry);

    switch (level) {
      case 'ERROR':
        console.error(output);
        break;
      case 'WARN':
        console.warn(output);
        break;
      default:
        console.log(output);
    }
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['DEBUG', 'INFO', 'WARN', 'ERROR'];
    return levels.indexOf(level) >= levels.indexOf(this.minLevel);
  }

  private scrubPII(data: Record<string, unknown>): Record<string, unknown> {
    const scrubbed: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(data)) {
      const lowerKey = key.toLowerCase();
      
      if (PII_FIELDS.some(pii => lowerKey.includes(pii.toLowerCase()))) {
        scrubbed[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null) {
        scrubbed[key] = this.scrubPII(value as Record<string, unknown>);
      } else {
        scrubbed[key] = value;
      }
    }

    return scrubbed;
  }
}

/**
 * Create a logger with request ID from Lambda context
 */
export function createLogger(
  functionName: string, 
  context?: { awsRequestId?: string }
): Logger {
  return new Logger(functionName, context?.awsRequestId);
}
