/* global Promise */

'use strict';

var url = require('url');
var crypto = require('crypto');
var config = require('../config');

// TODO: Implement document store here
var tempDocumentStore = {};

// choose implementation for selected computing strategy
var SelectedComputingStrategy = require('./' + config.computingStrategyToUse + 'ComputingStrategy');
var selectedComputingStrategyConfig = config['computingStrategySettings'][config.computingStrategyToUse];

// Initialize Computing
SelectedComputingStrategy.initialize(selectedComputingStrategyConfig);

module.exports.stepContainersGET = function stepContainersGET(req, res, next) {
  // this will be the array that is returned to the client
  var arrayForClient = [];

  // retrieve all step containers from database
  var allStepContainerNames = Object.keys(tempDocumentStore);

  // concatenate the step container objects to an array
  for (var i = 0; i < allStepContainerNames.length; ++i) {
    var currentStepContainerObject = tempDocumentStore[allStepContainerNames[i]];

    arrayForClient.push({
      stepContainerName: currentStepContainerObject['stepContainerName'],
      containerImage: currentStepContainerObject['stepContainerImage'],
      ports: currentStepContainerObject['stepContainerPorts'],
      remarks: currentStepContainerObject['stepContainerRemarks'],
      created: currentStepContainerObject['stepContainerCreated'],
      dnsUrl: currentStepContainerObject['stepContainerDnsUrl']
    });
  }

  // response to client
  res.statusCode = 200;
  res.end(JSON.stringify(arrayForClient));
};

module.exports.stepContainersPOST = function stepContainersPOST(req, res, next) {
  // store the keypair name
  var keypairName = '';

  if (req.swagger.params.body.value.keypairName) {
    keypairName = String(req.swagger.params.body.value.keypairName);
  } else {
    res.statusCode = 400;
    res.end('Field "keypairName" is mandatory.');
    return;
  }

  // store the docker image name
  var dockerImageName = '';

  if (req.swagger.params.body.value.dockerImageName) {
    dockerImageName = String(req.swagger.params.body.value.dockerImageName);

    // Prevent code injection
    if (dockerImageName.match(/'";\\/g) !== null) {
      res.statusCode = 400;
      res.end('Field "dockerImageName" may not include one of the following characters: \'";\.');
      return;
    }
  } else {
    res.statusCode = 400;
    res.end('Field "dockerImageName" is mandatory.');
    return;
  }

  // store the ports to expose if given
  var portsToExpose = '';

  if (req.swagger.params.body.value.portsToExpose) {
    portsToExpose = String(req.swagger.params.body.value.portsToExpose);

    // Prevent code injection
    if (portsToExpose.match(/^([0-9]|\,)*$/g) === null) {
      res.statusCode = 400;
      res.end('Field "dockerImageName" may only include numbers and commas.');
      return;
    }
  }

  // store the remark if it was given
  var remarks = '';

  if (req.swagger.params.body.value.remarks) {
    if (String(req.swagger.params.body.value.remarks).length > 50) {
      res.statusCode = 400;
      res.end('Field "remarks" may not exceed 50 characters.');
      return;
    }

    remarks = String(req.swagger.params.body.value.remarks);
  }

  var databaseEntryObject = {
    stepContainerName: 'none',
    stepContainerImage: dockerImageName,
    stepContainerPorts: portsToExpose,
    stepContainerRemarks: remarks,
    stepContainerCreated: new Date(),
    stepContainerDnsUrl: 'none'
  };

  // Start the machine, deploy the Docker image and start it as well
  SelectedComputingStrategy.startMachineAndRunImage(keypairName, dockerImageName, portsToExpose).then(function success(data) {
    databaseEntryObject['stepContainerName'] = data.instanceId;
    databaseEntryObject['stepContainerDnsUrl'] = data.dnsName;

    // create database entry for this
    tempDocumentStore[data.instanceId] = databaseEntryObject;

    // response to client
    res.statusCode = 201;
    res.end(JSON.stringify(databaseEntryObject));
  }, function error(err) {
    res.statusCode = 500;
    res.end();
  });
};

module.exports.stepContainerNameDELETE = function stepContainerNameDELETE(req, res, next) {
  // Ensure step container exists
  if (!req.swagger.params.stepContainerName.value || !tempDocumentStore[req.swagger.params.stepContainerName.value]) {
    res.statusCode = 404;
    res.end('Step container doesn\'t exist.');
    return;
  }

  var stepContainerName = req.swagger.params.stepContainerName.value;

  SelectedComputingStrategy.terminateMachine(stepContainerName).then(function success() {
    delete tempDocumentStore[stepContainerName];
    
    res.statusCode = 204;
    res.end();
  }, function error(err) {
    res.statusCode = 500;
    res.end(err);
  });
};

module.exports.stepContainerNameGET = function stepContainerNameGET(req, res, next) {
  // Ensure step container exists
  if (!req.swagger.params.stepContainerName.value || !tempDocumentStore[req.swagger.params.stepContainerName.value]) {
    res.statusCode = 404;
    res.end('Step container doesn\'t exist.');
    return;
  }

  res.statusCode = 200;
  res.end(JSON.stringify(tempDocumentStore[req.swagger.params.stepContainerName.value]));
};