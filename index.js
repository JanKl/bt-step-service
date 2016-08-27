/* global process */

'use strict';

var config = require('./config.js');
var app = require('connect')();
var https = require('https');
var swaggerTools = require('swagger-tools');
var jsyaml = require('js-yaml');
var fs = require('fs');
var serverPort = 8443;

// swaggerRouter configuration
var options = {
  swaggerUi: '/swagger.json',
  controllers: './controllers',
  useStubs: process.env.NODE_ENV === 'development' ? true : false // Conditionally turn on stubs (mock mode)
};

// The Swagger document (require it, build it programmatically, fetch it from a URL, ...)
var spec = fs.readFileSync('./api/swagger.yaml', 'utf8');
var swaggerDoc = jsyaml.safeLoad(spec);

// Initialize the Swagger middleware
swaggerTools.initializeMiddleware(swaggerDoc, function (middleware) {
  // Interpret Swagger resources and attach metadata to request - must be first in swagger-tools middleware chain
  app.use(middleware.swaggerMetadata());

  // Validate Swagger requests
  app.use(middleware.swaggerValidator());

  // Route validated requests to appropriate controller
  app.use(middleware.swaggerRouter(options));

  // Serve the Swagger documents and Swagger UI
  app.use(middleware.swaggerUi());

  // Start the server
  https.createServer({
    key: fs.readFileSync(config.encryption.pathPrivateKey),
    cert: fs.readFileSync(config.encryption.pathPublicKeyCert),
    ca: fs.readFileSync(config.encryption.pathIntermediateCert)
  }, app).listen(serverPort, function () {
    console.log('Your server is listening on port %d (https://localhost:%d)', serverPort, serverPort);
    console.log('Swagger-ui is available on https://localhost:%d/docs', serverPort);
  });
});
