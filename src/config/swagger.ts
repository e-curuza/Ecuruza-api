import swaggerUi from "swagger-ui-express";
import swaggerJsdoc from "swagger-jsdoc";
import type { Express } from "express";
import "dotenv/config"

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "e-Curuza API Documentation",
      version: "1.0.0",
      description:
        "Comprehensive API documentation for e-Curuza Backend.\n\n" +
        "e-Curuza is a marketplace platform. This documentation covers authentication, onboarding, shop and product management, orders, subscriptions, advertising, and more.",
    },
    tags: [
      { name: "Public", description: "Accessible by any user" },
      { name: "Authentication", description: "User login/signup endpoints" },
      { name: "Users", description: "User management endpoints" },
      { name: "Sellers", description: "Seller management endpoints" },
      { name: "Shops", description: "Shop management endpoints" },
      { name: "Products", description: "Product management endpoints" },
      { name: "Orders", description: "Order processing endpoints" },
      { name: "Payments", description: "Afripay payment integration" },
      { name: "Subscriptions", description: "Advertising and subscription plans" },
      { name: "Ads", description: "Product and shop promotion management" },
      { name: "Admin", description: "Admin management and moderation" },
    ],
    servers: [
      {
        url: (process.env.BACKEND_URL || "https://e-curuza-backend.onrender.com"),
        description: "Staging server",
      },
      {
        url: `http://localhost:${process.env.PORT || 4000}`,
        description: "Development server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
  },
  apis: ["./src/docs/**/*.ts", "./src/routes/**/*.ts"],
};

export const swaggerSpec = swaggerJsdoc(options);


export const setupSwagger = (app: Express) => {

  app.get("/api-docs/swagger.json", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.send(swaggerSpec);
  });

  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  app.use("/api-docs/auth", swaggerUi.serve, swaggerUi.setup(swaggerSpec, { explorer: true }));
  app.use("/api-docs/users", swaggerUi.serve, swaggerUi.setup(swaggerSpec, { explorer: true }));
  app.use("/api-docs/shops", swaggerUi.serve, swaggerUi.setup(swaggerSpec, { explorer: true }));
  app.use("/api-docs/products", swaggerUi.serve, swaggerUi.setup(swaggerSpec, { explorer: true }));
  app.use("/api-docs/orders", swaggerUi.serve, swaggerUi.setup(swaggerSpec, { explorer: true }));
  app.use("/api-docs/subscriptions", swaggerUi.serve, swaggerUi.setup(swaggerSpec, { explorer: true }));
  app.use("/api-docs/ads", swaggerUi.serve, swaggerUi.setup(swaggerSpec, { explorer: true }));

  console.log("Swagger docs available at /api-docs and /api-docs/<module>");
};
