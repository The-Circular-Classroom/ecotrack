const swaggerAutogen = require('swagger-autogen')({ openapi: '3.0.0' });

const doc = {
    info: {
        version: '1.0.0',
        title: 'Inventory Management System APIs',
        description: 'API documentation for the Inventory Management System backend. Handles inventory, donations, transactions, and various item properties.',
        contact: {
            name: 'Team UrbanSync'
        }
    },
    servers: [
        {
            url: 'http://localhost:3001',
            description: 'Local development server'
        }
    ],
    tags: [
        { name: 'Inventory', description: 'Endpoints related to inventory management' },
        { name: 'Transaction', description: 'Endpoints related to transactions' },
        { name: 'Donation Drive', description: 'Endpoints handling donation drives' },
        { name: 'Item Type', description: 'Endpoints for managing item types' },
        { name: 'Properties', description: 'Endpoints for managing item properties (Brand, Category, Colour, Size, Material, Tag)' },
        { name: 'School', description: 'Endpoints related to schools' }
    ],
    components: {
        securitySchemes: {
            bearerAuth: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
                description: 'Provide your JWT token provided by Cognito to access protected routes'
            }
        },
        responses: {
            BadRequest: {
                description: 'Bad Request - Invalid parameters or body'
            },
            Unauthorized: {
                description: 'Unauthorized - Missing or invalid JWT token'
            },
            Forbidden: {
                description: 'Forbidden - Insufficient permissions'
            },
            NotFound: {
                description: 'Not Found - The requested resource does not exist'
            },
            InternalServerError: {
                description: 'Internal Server Error'
            }
        }
    },
    security: [{ bearerAuth: [] }]
};

const outputFile = './swagger-output.json';
const routes = ['./app.js'];

swaggerAutogen(outputFile, routes, doc).then(() => {
    console.log('Swagger documentation generated successfully in swagger-output.json');
});