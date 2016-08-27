'use strict';

/**
 * Allows for initialization of the selected computing strategy
 * @param {Object} strategyConfig Specific configuration settings for this
 *                 provider
 * @returns {undefined} No return value
 */
exports.initialize = function (strategyConfig) {
  // Implemetation goes here
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
    reject(new Error('Dummy method stub'));
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
    reject(new Error('Dummy method stub'));
  });
};