import winston from "winston";
import fs from "fs";
import path from "path";
import { CronJob } from "cron";

const { combine, printf, timestamp } = winston.format;

const customLevels = {
  levels: {
    error: 0,
    warn: 1,
    info: 2,
    debug: 3,
  },
  colors: {
    error: "red",
    warn: "yellow",
    info: "green",
    debug: "blue",
  },
};

winston.addColors(customLevels.colors);

export enum LogLevel {
  ERROR = "error",
  WARN = "warn",
  INFO = "info",
  DEBUG = "debug",
}

export interface LogEntry {
  level: LogLevel;
  timestamp: string;
  message: string;
  action?: string | undefined;
  userId?: string | number | undefined;
  meta?: Record<string, any> | undefined;
  raw?: string | undefined;
}

type LogFilterOptions = {
  search?: string;
  level?: string;
  action?: string;
  userId?: string | number;
  keywords?: string[];
  fromDate?: string;
  toDate?: string;
  page?: number;
  limit?: number;
  orderBy?: { field: keyof LogEntry; direction: "asc" | "desc" };
};

const logFilePath = path.resolve(process.cwd(), "info.log");

export const logger = winston.createLogger({
  levels: customLevels.levels,
  format: combine(
    timestamp({ format: () => new Date().toISOString() }),
    printf(({ timestamp, level, message, action, userId, meta }) => {
      const structured = JSON.stringify({ action, userId, meta });
      return `${level.toUpperCase()}::${timestamp}: ${message} | ${structured}`;
    })
  ),
  transports: [
    new winston.transports.Console({
      level: "debug",
      format: winston.format.combine(
        printf(({ timestamp, level, message, action, userId, meta }) => {
          const structured = JSON.stringify({ action, userId, meta });
          const ts = new Date(timestamp as any);
          return `${level.toUpperCase()}::${ts.toDateString()} ${ts.toLocaleTimeString()} ${message} | ${structured}`;
        })
      ),
    }),
    new winston.transports.File({
      filename: logFilePath,
      level: "info",
    }),
  ],
});

function parseTimestamp(ts: string): Date | null {
  const parsed = Date.parse(ts);
  return isNaN(parsed) ? null : new Date(parsed);
}

function readLogFile(): string[] {
  try {
    if (!fs.existsSync(logFilePath)) return [];
    return fs.readFileSync(logFilePath, "utf-8").split(/\r?\n/).filter(Boolean);
  } catch (err) {
    logger.error("Failed to read log file", { error: err });
    return [];
  }
}

function parseLogLine(line: string): LogEntry | null {
  const match = line.match(
    /^(INFO|ERROR|WARN|DEBUG)::(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z): (.+?) \| (.+)$/
  );
  if (!match) return null;
  const [, level, timestamp, message, structured] = match;
  
  if (!level || !timestamp || !message || !structured) return null;
  
  let action: string | undefined;
  let userId: string | number | undefined;
  let meta: Record<string, any> | undefined;

  try {
    const parsed = JSON.parse(structured);
    action = parsed.action;
    userId = parsed.userId;
    meta = parsed.meta;
  } catch {
    meta = { raw: structured };
  }

  return { level: level.toLowerCase() as LogLevel, timestamp, message, action, userId, meta, raw: line };
}

function filterLogs(logs: LogEntry[], filters: LogFilterOptions = {}) {
  const { search, level, action, userId, keywords = [], fromDate, toDate } = filters;
  const from = fromDate ? new Date(fromDate) : null;
  const to = toDate ? new Date(toDate) : null;

  return logs.filter((log) => {
    const ts = parseTimestamp(log.timestamp);
    if (!ts) return false;
    if (from && ts < from) return false;
    if (to && ts > to) return false;
    if (level && log.level !== level.toLowerCase()) return false;
    if (action && log.action !== action) return false;
    if (userId && log.userId !== userId) return false;
    if (keywords.length > 0) {
      const matched = keywords.some((kw) => log.message.toLowerCase().includes(kw.toLowerCase()));
      if (!matched) return false;
    }
    if (search) {
      const keyword = search.toLowerCase();
      if (!log.message.toLowerCase().includes(keyword) && !(log.meta && Object.values(log.meta).join(" ").toLowerCase().includes(keyword))) {
        return false;
      }
    }
    return true;
  });
}

function paginateLogs(
  logs: LogEntry[],
  page = 1,
  limit = 10,
  orderBy: { field: keyof LogEntry; direction: "asc" | "desc" } = { field: "timestamp", direction: "desc" }
) {
  const sortedLogs = [...logs].sort((a, b) => {
    const aVal = a[orderBy.field];
    const bVal = b[orderBy.field];
    if (orderBy.field === "timestamp") {
      return orderBy.direction === "asc"
        ? new Date(aVal as string).getTime() - new Date(bVal as string).getTime()
        : new Date(bVal as string).getTime() - new Date(aVal as string).getTime();
    }
    if (typeof aVal === "string" && typeof bVal === "string") {
      return orderBy.direction === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    }
    return 0;
  });

  const total = sortedLogs.length;
  const totalPages = Math.ceil(total / limit);
  const paginatedLogs = sortedLogs.slice((page - 1) * limit, page * limit);

  return { paginatedLogs, total, totalPages };
}

export function getLogs(options: LogFilterOptions) {
  const lines = readLogFile();
  if (!lines.length) return { success: false, message: "Log file is empty or missing.", data: [] };

  const parsedLogs = lines.map(parseLogLine).filter(Boolean) as LogEntry[];
  const filteredLogs = filterLogs(parsedLogs, options);
  const { paginatedLogs, total, totalPages } = paginateLogs(filteredLogs, options.page, options.limit, options.orderBy);

  return {
    success: true,
    data: paginatedLogs,
    meta: { total, page: options.page || 1, limit: options.limit || 10, totalPages },
  };
}

export function getPaymentLogs(options: LogFilterOptions) {
  const paymentKeywords = ["payment", "transaction", "stripe", "card", "fee", "subscription", "refund", "charge", "booking", "tax", "plan"];
  return getLogs({ ...options, keywords: paymentKeywords });
}

export function getErrorLogs(options: LogFilterOptions) {
  return getLogs({ ...options, level: "error" });
}

function cleanupOldLogs() {
  const allLines = readLogFile();
  const oneMonthAgo = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000);
  const filteredLines = allLines.filter((line) => {
    const parsed = parseLogLine(line);
    if (!parsed) return false;
    const ts = parseTimestamp(parsed.timestamp);
    return ts && ts >= oneMonthAgo;
  });

  try {
    fs.writeFileSync(logFilePath, filteredLines.join("\n") + "\n", "utf-8");
    logger.debug("Old logs cleaned up (older than 1 month)", { action: "log_cleanup" });
  } catch (err) {
    logger.error("Failed to clean up old logs", { error: err });
  }
}

let cleanupJob: CronJob<string> | null = null;
export function initializeLogCleanupJob() {
  if (cleanupJob) return cleanupJob;

  cleanupJob = new CronJob(
    "0 2 * * *",
    cleanupOldLogs,
    undefined,
    false,
    "UTC"
  );
  cleanupJob.start();
  logger.debug("Logs cleanup cron job initialized and started");
  cleanupOldLogs();

  return cleanupJob;
}
