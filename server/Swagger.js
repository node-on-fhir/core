// /Volumes/SonicMagic/Code/honeycomb-public-release/server/Swagger.js

import { Meteor } from 'meteor/meteor';
import { WebApp } from 'meteor/webapp';
import { get } from 'lodash';

// Generate OpenAPI 3.0 specification for FHIR server
const generateSwaggerSpec = function() {
  const baseUrl = Meteor.absoluteUrl();
  const fhirBase = baseUrl + 'baseR4';
  
  // Dynamically get list of supported resources from the same settings that control FhirEndpoints.js
  const fhirRestConfig = get(Meteor, 'settings.private.fhir.rest', {});
  
  // Extract resource names that are enabled (have interactions defined)
  const supportedResources = Object.keys(fhirRestConfig)
    .filter(key => {
      // Check if this resource has any interactions enabled
      const resourceConfig = fhirRestConfig[key];
      return resourceConfig && resourceConfig.interactions && 
             Array.isArray(resourceConfig.interactions) && 
             resourceConfig.interactions.length > 0;
    })
    .sort(); // Sort alphabetically for consistent display
  
  console.log('Swagger: Detected enabled FHIR resources:', supportedResources);

  // Base OpenAPI spec
  const spec = {
    openapi: '3.0.0',
    info: {
      title: 'FHIR R4 Server API',
      version: '1.0.0',
      description: 'Fast Healthcare Interoperability Resources (FHIR) R4 Server',
      contact: {
        name: 'API Support',
        email: get(Meteor, 'settings.public.contact.email', 'support@example.com')
      },
      license: {
        name: 'Apache 2.0',
        url: 'https://www.apache.org/licenses/LICENSE-2.0.html'
      }
    },
    servers: [
      {
        url: fhirBase,
        description: 'FHIR R4 Base URL'
      }
    ],
    tags: [
      {
        name: 'System',
        description: 'System level operations'
      },
      ...supportedResources.map(resource => ({
        name: resource,
        description: `${resource} resource operations`
      }))
    ],
    paths: {
      '/metadata': {
        get: {
          tags: ['System'],
          summary: 'Get server capability statement',
          description: 'Returns the server\'s CapabilityStatement resource that describes its capabilities',
          responses: {
            '200': {
              description: 'Server capability statement',
              content: {
                'application/fhir+json': {
                  schema: {
                    type: 'object',
                    properties: {
                      resourceType: {
                        type: 'string',
                        example: 'CapabilityStatement'
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    components: {
      securitySchemes: {
        OAuth2: {
          type: 'oauth2',
          flows: {
            authorizationCode: {
              authorizationUrl: `${baseUrl}oauth/authorize`,
              tokenUrl: `${baseUrl}oauth/token`,
              scopes: {
                'patient/*.read': 'Read access to all patient resources',
                'patient/*.write': 'Write access to all patient resources',
                'user/*.read': 'Read access to all user resources',
                'user/*.write': 'Write access to all user resources'
              }
            }
          }
        },
        BearerAuth: {
          type: 'http',
          scheme: 'bearer'
        }
      },
      schemas: {
        OperationOutcome: {
          type: 'object',
          properties: {
            resourceType: {
              type: 'string',
              example: 'OperationOutcome'
            },
            issue: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  severity: {
                    type: 'string',
                    enum: ['fatal', 'error', 'warning', 'information']
                  },
                  code: {
                    type: 'string'
                  },
                  details: {
                    type: 'object',
                    properties: {
                      text: {
                        type: 'string'
                      }
                    }
                  }
                }
              }
            }
          }
        },
        Bundle: {
          type: 'object',
          properties: {
            resourceType: {
              type: 'string',
              example: 'Bundle'
            },
            type: {
              type: 'string',
              enum: ['searchset', 'transaction', 'batch', 'history']
            },
            total: {
              type: 'integer'
            },
            entry: {
              type: 'array',
              items: {
                type: 'object'
              }
            }
          }
        }
      },
      parameters: {
        ResourceId: {
          name: 'id',
          in: 'path',
          required: true,
          description: 'Resource ID',
          schema: {
            type: 'string'
          }
        },
        Count: {
          name: '_count',
          in: 'query',
          description: 'Number of results per page',
          schema: {
            type: 'integer',
            default: 10,
            maximum: 100
          }
        },
        Page: {
          name: 'page',
          in: 'query',
          description: 'Page number',
          schema: {
            type: 'integer',
            default: 1
          }
        }
      },
      responses: {
        NotFound: {
          description: 'Resource not found',
          content: {
            'application/fhir+json': {
              schema: {
                $ref: '#/components/schemas/OperationOutcome'
              }
            }
          }
        },
        Unauthorized: {
          description: 'Unauthorized',
          content: {
            'application/fhir+json': {
              schema: {
                $ref: '#/components/schemas/OperationOutcome'
              }
            }
          }
        }
      }
    }
  };

  // Add resource-specific paths based on enabled interactions
  supportedResources.forEach(resourceType => {
    const resourceConfig = fhirRestConfig[resourceType];
    const enabledInteractions = resourceConfig.interactions || [];
    
    // Collection-level endpoints
    spec.paths[`/${resourceType}`] = {};
    
    // Search operation (search-type)
    if (enabledInteractions.includes('search-type')) {
      spec.paths[`/${resourceType}`].get = {
        tags: [resourceType],
        summary: `Search ${resourceType} resources`,
        description: `Search for ${resourceType} resources using various parameters`,
        parameters: [
          { $ref: '#/components/parameters/Count' },
          { $ref: '#/components/parameters/Page' }
        ],
        responses: {
          '200': {
            description: 'Search results',
            content: {
              'application/fhir+json': {
                schema: {
                  $ref: '#/components/schemas/Bundle'
                }
              }
            }
          },
          '401': { $ref: '#/components/responses/Unauthorized' }
        }
      };
    }
    
    // Create operation
    if (enabledInteractions.includes('create')) {
      spec.paths[`/${resourceType}`].post = {
        tags: [resourceType],
        summary: `Create ${resourceType}`,
        description: `Create a new ${resourceType} resource`,
        requestBody: {
          required: true,
          content: {
            'application/fhir+json': {
              schema: {
                type: 'object',
                properties: {
                  resourceType: {
                    type: 'string',
                    example: resourceType
                  }
                }
              }
            }
          }
        },
        responses: {
          '201': {
            description: 'Resource created',
            headers: {
              Location: {
                description: 'URL of created resource',
                schema: {
                  type: 'string'
                }
              }
            }
          },
          '401': { $ref: '#/components/responses/Unauthorized' }
        }
      };
    }

    // Instance operations
    spec.paths[`/${resourceType}/{id}`] = {};
    
    // Read operation
    if (enabledInteractions.includes('read')) {
      spec.paths[`/${resourceType}/{id}`].get = {
        tags: [resourceType],
        summary: `Read ${resourceType} by ID`,
        description: `Retrieve a specific ${resourceType} resource by its ID`,
        parameters: [
          { $ref: '#/components/parameters/ResourceId' }
        ],
        responses: {
          '200': {
            description: 'Resource found',
            content: {
              'application/fhir+json': {
                schema: {
                  type: 'object',
                  properties: {
                    resourceType: {
                      type: 'string',
                      example: resourceType
                    },
                    id: {
                      type: 'string'
                    }
                  }
                }
              }
            }
          },
          '404': { $ref: '#/components/responses/NotFound' },
          '401': { $ref: '#/components/responses/Unauthorized' }
        }
      };
    }
    
    // Update operation
    if (enabledInteractions.includes('update')) {
      spec.paths[`/${resourceType}/{id}`].put = {
        tags: [resourceType],
        summary: `Update ${resourceType}`,
        description: `Update an existing ${resourceType} resource`,
        parameters: [
          { $ref: '#/components/parameters/ResourceId' }
        ],
        requestBody: {
          required: true,
          content: {
            'application/fhir+json': {
              schema: {
                type: 'object',
                properties: {
                  resourceType: {
                    type: 'string',
                    example: resourceType
                  },
                  id: {
                    type: 'string'
                  }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Resource updated'
          },
          '404': { $ref: '#/components/responses/NotFound' },
          '401': { $ref: '#/components/responses/Unauthorized' }
        }
      };
    }
    
    // Delete operation
    if (enabledInteractions.includes('delete')) {
      spec.paths[`/${resourceType}/{id}`].delete = {
        tags: [resourceType],
        summary: `Delete ${resourceType}`,
        description: `Delete a ${resourceType} resource`,
        parameters: [
          { $ref: '#/components/parameters/ResourceId' }
        ],
        responses: {
          '204': {
            description: 'Resource deleted'
          },
          '404': { $ref: '#/components/responses/NotFound' },
          '401': { $ref: '#/components/responses/Unauthorized' }
        }
      };
    }

    // History operation
    if (enabledInteractions.includes('history-type')) {
      spec.paths[`/${resourceType}/_history`] = {
        get: {
        tags: [resourceType],
        summary: `${resourceType} history`,
        description: `Retrieve the history of all ${resourceType} resources`,
        parameters: [
          { $ref: '#/components/parameters/Count' },
          { $ref: '#/components/parameters/Page' }
        ],
        responses: {
          '200': {
            description: 'History bundle',
            content: {
              'application/fhir+json': {
                schema: {
                  $ref: '#/components/schemas/Bundle'
                }
              }
            }
          },
          '401': { $ref: '#/components/responses/Unauthorized' }
        }
      }
      };
    }
    
    // Clean up empty path objects
    if (Object.keys(spec.paths[`/${resourceType}`]).length === 0) {
      delete spec.paths[`/${resourceType}`];
    }
    if (Object.keys(spec.paths[`/${resourceType}/{id}`]).length === 0) {
      delete spec.paths[`/${resourceType}/{id}`];
    }
  });

  return spec;
};

// Initialize Swagger UI
Meteor.startup(function() {
  console.log('Initializing Swagger UI...');

  const swaggerSpec = generateSwaggerSpec();

  // Serve Swagger UI at /api-docs using CDN-hosted assets
  // (swagger-ui-express doesn't work well with Meteor's WebApp.connectHandlers)
  WebApp.connectHandlers.use('/api-docs', function(req, res) {
    const swaggerHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>FHIR Server API Documentation</title>
  <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css">
  <style>
    .swagger-ui .topbar { display: none }
    html { box-sizing: border-box; overflow-y: scroll; }
    *, *:before, *:after { box-sizing: inherit; }
    body { margin: 0; background: #fafafa; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-standalone-preset.js"></script>
  <script>
    window.onload = function() {
      SwaggerUIBundle({
        spec: ${JSON.stringify(swaggerSpec)},
        dom_id: '#swagger-ui',
        deepLinking: true,
        docExpansion: 'none',
        defaultModelsExpandDepth: 0,
        persistAuthorization: true,
        tryItOutEnabled: true,
        supportedSubmitMethods: ['get', 'post', 'put', 'delete'],
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        layout: "StandaloneLayout"
      });
    };
  </script>
</body>
</html>`;
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(swaggerHtml);
  });

  // Also serve the raw swagger.json
  WebApp.connectHandlers.use('/api/swagger.json', function(req, res) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(swaggerSpec, null, 2));
  });

  console.log('Swagger UI available at: /api-docs');
  console.log('Swagger JSON available at: /api/swagger.json');
});