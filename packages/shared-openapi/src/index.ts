import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yaml';
import type { Application, Request, Response } from 'express';

export interface ServiceInfo {
  title: string;
  version: string;
  description: string;
  contact?: {
    name: string;
    email: string;
    url?: string;
  };
}

export interface SwaggerConfigOptions {
  serviceInfo: ServiceInfo;
  port: number;
  productionUrl?: string;
  routePaths: string[];
  tags?: Array<{ name: string; description: string }>;
  securitySchemes?: Record<string, any>;
  schemas?: Record<string, any>;
}

export function createSwaggerSpec(options: SwaggerConfigOptions): swaggerJsdoc.Options {
  const { serviceInfo, port, productionUrl, routePaths, tags, securitySchemes, schemas } = options;

  const spec: swaggerJsdoc.Options = {
    definition: {
      openapi: '3.0.3',
      info: {
        title: serviceInfo.title,
        version: serviceInfo.version,
        description: serviceInfo.description,
        contact: serviceInfo.contact,
      },
      servers: [
        { url: `http://localhost:${port}`, description: 'Local development' },
        ...(productionUrl ? [{ url: productionUrl, description: 'Production' }] : []),
      ],
      tags: tags || [],
      components: {
        securitySchemes: securitySchemes || {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
        schemas: schemas || {},
        responses: {
          Unauthorized: {
            description: 'Unauthorized - Invalid or missing authentication token',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: false },
                    error: { type: 'string', example: 'Unauthorized' },
                  },
                },
              },
            },
          },
          Forbidden: {
            description: 'Forbidden - Insufficient permissions',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: false },
                    error: { type: 'string', example: 'Forbidden' },
                  },
                },
              },
            },
          },
          NotFound: {
            description: 'Resource not found',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: false },
                    error: { type: 'string', example: 'Not found' },
                  },
                },
              },
            },
          },
          InternalServerError: {
            description: 'Internal server error',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: false },
                    error: { type: 'string', example: 'Internal server error' },
                  },
                },
              },
            },
          },
        },
      },
    },
    apis: routePaths,
  };

  return spec;
}

export function setupSwagger(
  app: Application,
  spec: swaggerJsdoc.Options,
  basePath = '/api-docs'
): void {
  const swaggerSpec = swaggerJsdoc(spec) as any;

  app.use(
    basePath,
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      explorer: true,
      customCss: '.swagger-ui .topbar { display: none }',
      customSiteTitle: swaggerSpec.info?.title || 'TripAlfa API Documentation',
    })
  );

  app.get(`${basePath}/json`, (_req, res) => {
    res.json(swaggerSpec);
  });

  app.get(`${basePath}/yaml`, (_req: Request, res: Response) => {
    res.set('Content-Type', 'text/yaml');
    res.send(YAML.stringify(swaggerSpec));
  });
}

export { swaggerJsdoc, swaggerUi };
