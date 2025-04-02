const swaggerJsDoc = require("swagger-jsdoc");

const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Event Mosaic API",
      version: "1.0.0",
      description: "API documentation for Event Mosaic application",
    },
    servers: [
      {
        url: "eventmosaic.net",
      },
    ],
  },
  apis: ["../routes/*.js", "../models/*.js"],
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);

module.exports = swaggerDocs;

