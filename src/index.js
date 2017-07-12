'use strict';

const AWS = require('aws-sdk');
const formatter = require('system-metrics-formatter');
const zlib = require('zlib');

exports.handler = (event, context, callback) => {
  const { bucket, object } = event.Records[0].s3;
  //Todo check if s3.key and s3.bucket exists
  const s3Client = new AWS.S3();

  const params = {
    Key: object.key,
    Bucket: bucket.name
  };
  s3Client.headObject(params).promise()
    .then(data => {
      const { previouskey } = data.Metadata;
      const promises = [s3Client.getObject(params).promise()];
      if(previouskey) {
        promises.unshift(s3Client.getObject({
          Key: previouskey,
          Bucket: bucket.name
        }).promise());
      }
      return Promise.all(promises);
    })
    .then(s3objects => {
      const formatted = formatter(...s3objects.map(s3object => JSON.parse(zlib.unzipSync(s3object.Body).toString())));
      const lastMetric = formatted[formatted.length - 1];
      console.log(lastMetric);
      callback(null, lastMetric);
    })
    .catch(err => callback(err));
};
