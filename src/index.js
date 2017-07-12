'use strict';

const AWS = require('aws-sdk');
const formatter = require('system-metrics-formatter');
const zlib = require('zlib');

exports.handler = (event, context, callback) => {
  const { s3 } = event.Records[0];
  console.log(s3);
  callback(null, event);
};
