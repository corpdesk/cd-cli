import winston from 'winston';
// import type { ConsoleTransportOptions } from 'winston/lib/winston/transports';

// Define custom levels
const logLevels = {
  levels: {
    success: 0, // Custom success level
    debug: 1, // Custom debug level
    info: 2,
    warn: 3,
    error: 4,
  },
  colors: {
    success: 'green', // Custom color for success
    debug: 'cyan', // Custom color for debug
    info: 'blue',
    warn: 'yellow',
    error: 'red',
  },
};

// Create the logger with custom levels
export const logger = winston.createLogger({
  levels: logLevels.levels,
  format: winston.format.combine(
    winston.format.colorize(), // Colorize logs
    winston.format.printf(({ level, message }) => {
      return `${level}: ${message}`; // Format log message
    }),
  ),
  transports: [new winston.transports.Console()],
});

// Adding color support for custom levels
winston.addColors(logLevels.colors);

// Function to change the debug level dynamically
export function setLogLevel(level: string) {
  logger.transports.forEach((transport) => {
    transport.level = level; // Set the new level
  });
  console.log(`Log level set to: ${level}`); // Log the change for feedback
}

// Define custom log methods for success and other levels
export const logg = {
  success: (message: string, context?: object) => {
    logger.log('success', message, context); // Log at 'success' level
  },
  debug: (message: string, context?: object) => {
    logger.debug(message, context); // Log at 'debug' level
  },
  info: (message: string, context?: object) => {
    logger.info(message, context); // Log at 'info' level
  },
  warn: (message: string, context?: object) => {
    logger.warning(message, context); // Log at 'warn' level
  },
  error: (message: string, context?: object) => {
    logger.error(message, context); // Log at 'error' level
  },
};
