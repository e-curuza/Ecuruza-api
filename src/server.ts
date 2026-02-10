import express, { type Express, type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import createError, { HttpError } from "http-errors";

import { setupSwagger } from "./config/swagger";
import { prisma } from "./config/db";
import { logger, initializeLogCleanupJob } from "./utils/logger";
import { ApiResponseBuilder, ResponseStatus } from "./utils/ApiResponse";
import { isAppError, AppError, extractErrorInfo } from "./utils/AppError";

import authRoutes from "./routes/aurh.route";

const app: Express = express();

const PORT = parseInt(process.env.PORT || "4000", 10);
const NODE_ENV = process.env.NODE_ENV || "development";

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        scriptSrc: ["'self'"],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    exposedHeaders: ["X-Total-Count", "X-Page-Count"],
  })
);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    status: ResponseStatus.ERROR,
    message: "Too many requests, please try again later.",
    error: {
      code: "RATE_LIMIT_EXCEEDED",
      details: { retryAfter: "15 minutes" },
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (request) => {
    const ip = request.ip || request.socket.remoteAddress || "";
    return ipKeyGenerator(ip);
  },
});

app.use("/api", limiter);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

if (NODE_ENV === "development") {
  app.use(morgan("dev"));
} else {
  app.use(
    morgan("combined", {
      stream: {
        write: (message: string) => {
          logger.info(message.trim(), { action: "http_request" });
        },
      },
    })
  )
}

app.set("trust proxy", 1);

app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({
    status: ResponseStatus.SUCCESS,
    message: "Server is healthy",
    data: {
      timestamp: new Date().toISOString(),
      environment: NODE_ENV,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    },
  });
});

const API_PREFIX = "/api/v1";

setupSwagger(app);

app.use(`${API_PREFIX}/auth`, authRoutes);

app.get(`${API_PREFIX}`, (req: Request, res: Response) => {
  res.json({
    name: "e-Curuza API",
    version: "1.0.0",
    documentation: "/api-docs",
    health: "/health",
  });
});

app.use((req: Request, res: Response, next: NextFunction) => {
  next(createError(404, `Route ${req.method} ${req.originalUrl} not found`));
});

app.use((err: unknown, req: Request, res: Response, next: NextFunction) => {
  const errorMessage = err instanceof Error ? err.message : "Unknown error";
  const errorStack = err instanceof Error ? err.stack : undefined;
  
  logger.error(`Error: ${errorMessage}`, {
    action: "error_handler",
    method: req.method,
    url: req.originalUrl,
    stack: NODE_ENV === "development" ? errorStack : undefined,
  });

  if (isAppError(err)) {
    const errorResponse = ApiResponseBuilder.error(
      err.code,
      err.message,
      err.details
    );
    return res.status(err.statusCode).json(errorResponse);
  }

  const httpError = err as HttpError;
  if (httpError.statusCode) {
    const errorResponse = ApiResponseBuilder.error(
      `HTTP_${httpError.statusCode}`,
      httpError.message
    );
    return res.status(httpError.statusCode).json(errorResponse);
  }

  if (err instanceof Error && err.name === "PrismaClientKnownRequestError") {
    const errorResponse = ApiResponseBuilder.error(
      "DATABASE_ERROR",
      "A database error occurred",
      { code: (err as any).code }
    );
    return res.status(500).json(errorResponse);
  }

  if (err instanceof Error && err.message.includes("validation")) {
    const errorResponse = ApiResponseBuilder.error(
      "VALIDATION_ERROR",
      err.message
    );
    return res.status(400).json(errorResponse);
  }

  const errorInfo = extractErrorInfo(err);
  const errorResponse = ApiResponseBuilder.error(
    errorInfo.code,
    NODE_ENV === "development" ? errorInfo.message : "Internal server error"
  );
  res.status(errorInfo.statusCode).json(errorResponse);
});

async function startServer(): Promise<void> {
  try {
    await prisma.$connect();
    logger.info("Database connection established successfully", {
      action: "server_startup",
    });

    initializeLogCleanupJob();
    logger.info("Log cleanup job initialized", { action: "server_startup" });

    const server = app.listen(PORT, () => {
      logger.info(`Server running in ${NODE_ENV} mode`, {
        action: "server_startup",
        meta: {
          port: PORT,
          environment: NODE_ENV,
        },
      });
      logger.info(
        `🚀 Server ready at http://localhost:${PORT}${API_PREFIX}`
      );
      logger.info(
        `📚 API Documentation available at http://localhost:${PORT}/api-docs`
      );
    });

    const gracefulShutdown = async (signal: string) => {
      logger.info(`${signal} received. Starting graceful shutdown...`, {
        action: "graceful_shutdown",
      });

      server.close(async () => {
        logger.info("HTTP server closed", { action: "graceful_shutdown" });

        try {
          await prisma.$disconnect();
          logger.info("Database connection closed", {
            action: "graceful_shutdown",
          });
          process.exit(0);
        } catch (error) {
          logger.error("Error during shutdown", { error });
          process.exit(1);
        }
      });

      setTimeout(() => {
        logger.error("Forced shutdown after timeout", {
          action: "graceful_shutdown",
        });
        process.exit(1);
      }, 30000);
    };

    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
    process.on("SIGINT", () => gracefulShutdown("SIGINT"));

    process.on("uncaughtException", (error) => {
      logger.error("Uncaught exception", { error, action: "uncaught_exception" });
      process.exit(1);
    });

    process.on("unhandledRejection", (reason, promise) => {
      logger.error("Unhandled rejection", {
        reason,
        action: "unhandled_rejection",
      });
    });
  } catch (error) {
    logger.error("Failed to start server", { error, action: "server_startup" });
    process.exit(1);
  }
}

export { app, startServer };

startServer();
