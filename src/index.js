'use strict';

const AWS = require('aws-sdk');
const formatter = require('system-metrics-formatter');
const zlib = require('zlib');

exports.handler = (event, context, callback) => {
  const { s3 } = event.Records[0];
  console.log(s3);
  //Todo check if s3.key and s3.bucket exists
  const s3Client = new AWS.S3();
  return s3Client.headObject({ key: s3.key, bucket: s3.bucket }).promise()
    .then(data => {
      const promises = [s3Client.getObject({ key: s3.key, bucket: s3.bucket }).promise()];
      //Todo change lastKey
      if(data.Metadata.lastKey) {
        promises.push(s3Client.getObject({ key: data.lastKey, bucket: s3.bucket }).promise());
      }
      return Promise.all(promises);
    }).then(s3objects => {
      const formatted = formatter(... s3objects.map(s3object => {
        return zlib.unzipSync(s3object.Body);
      }));
      const lastMetric = formatted[formatted.length - 1];
      callback(null, event);
    });
};
