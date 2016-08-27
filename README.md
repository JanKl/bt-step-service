# Storage Adapter

## Overview
This service is used to instantiate Docker containers from the Docker Hub. The containers will be deployed onto Amazon EC2 instances. The default VPC and Security Groups are used to create the instance.

## Installation

1. Copy the file config.js.sample to config.js
1. Edit the file config.js according to your needs

## Running the server
To run the server, run:

```
npm start
```

To view the Swagger UI interface:

```
open https://{serverAddress}:8443/docs
```

## Test the installation

To test the installation you may want to start an nginx container. To do so, you specify the following parameters when making a POST request to /stepContainers:

```
{
  "dockerImageName": "nginx",
  "portsToExpose": "80"
}
```

You can access the nginx hello world page on port 80 as soon as the instance is ready.