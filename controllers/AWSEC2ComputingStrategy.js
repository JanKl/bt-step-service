'use strict';

var AWS = require('aws-sdk');
var ec2 = null;
var ec2config = null;

/**
 * Allows for initialization of the selected computing strategy
 * @param {Object} strategyConfig Specific configuration settings for this
 *                 provider
 * @returns {undefined} No return value
 */
exports.initialize = function (strategyConfig) {
  ec2config = strategyConfig;

  // Store acutal config and instantiate the s3 object
  AWS.config.update({
    accessKeyId: strategyConfig.accessKeyId,
    secretAccessKey: strategyConfig.secretAccessKey,
    region: strategyConfig.region
  });

  ec2 = new AWS.EC2();
};

/**
 * Starts a virtual machine and deploys a Docker container on it which is also started.
 * @param {String} keypairName Name of the keypair to use (has to be defined in the administration panel of the cloud provider)
 * @param {String} dockerImageName Name of the Docker image that is to be instantiated. This is the name of the package on the Docker Hub.
 * @param {String} portsToExpose Comma-separated list of network ports that shall be exposed.
 * @returns {Promise} On success: resolve({
 *                      instanceId: string,
 *                      dnsName: string
 *                    })
 *                    On error: reject(new Error())
 */
exports.startMachineAndRunImage = function (keypairName, dockerImageName, portsToExpose) {
  return new Promise(function (resolve, reject) {
    var portsArray = portsToExpose.split(',');
    var portsString = '';

    for (var i = 0; i < portsArray.length; ++i) {
      portsString += ' -p ' + portsArray[i] + ':' + portsArray[i];
    }

    var startScript = '#!/bin/bash\ndocker run -d' + portsString + ' ' + dockerImageName;
    var userDataDockerRun = new Buffer(startScript).toString('base64');

    var params = {
      ImageId: ec2config.coreOsAmi,
      MaxCount: 1,
      MinCount: 1,
      KeyName: keypairName,
      UserData: userDataDockerRun,
      InstanceType: ec2config.instanceType,
      Monitoring: {
        Enabled: true
      }
    };

    ec2.runInstances(params, function (err, data) {
      if (err) {
        console.log(err, err.stack); // an error occurred
        reject(err);
      } else {
        var instanceId = data.Instances[0].InstanceId;

        console.log('EC2 instance ' + instanceId + ' pending');

        var params = {
          InstanceIds: [instanceId]
        };

        // Run describeInstances to retrieve the public ip address
        ec2.describeInstances(params, function (err, data) {
          if (err) {
            console.log(err, err.stack); // an error occurred
            reject(err);
          } else {
            var dnsName = 'unknown';

            if (data['Reservations'][0]['Instances'][0]['PublicDnsName'] !== '') {
              dnsName = data['Reservations'][0]['Instances'][0]['PublicDnsName'];
            } else {
              dnsName = data['Reservations'][0]['Instances'][0]['PrivateDnsName'];
            }

            resolve({
              instanceId: instanceId,
              dnsName: dnsName
            });
          }
        });
      }
    });
  });
};

/**
 * Stops a virtual machine
 * @param {String} instanceId Id of the virtual machine
 * @returns {Promise} On success: resolve()
 *                    On error: reject(new Error())
 */
exports.terminateMachine = function (instanceId) {
  return new Promise(function (resolve, reject) {
    var params = {
      InstanceIds: [instanceId]
    };
    ec2.terminateInstances(params, function (err, data) {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
};