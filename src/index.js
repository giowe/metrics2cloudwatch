'use strict';

const AWS = require('aws-sdk');
const formatter = require('system-metrics-formatter');
const zlib = require('zlib');

exports.handler = (event, context, callback) => {
  const { bucket, object } = event.Records[0].s3;
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

      const cloudwatch = new AWS.CloudWatch();

      cloudwatch.putMetricData({
        Namespace: 'System/Linux',
        MetricData: [
          ...getDiskUtilization(lastMetric),
          ...getDiskSpaceUsed(lastMetric),
          ...getDiskSpaceAvailble(lastMetric)
        ]
      }, (err, data) => {
        if (err) return callback(err);
        callback(data);
      });
      callback(null, lastMetric);
    })
    .catch(err => callback(err));
};

function getDiskUtilization(lastMetric) {
  const { time, id, customerId, diskData } = lastMetric;
  return Object.keys(diskData).map((filesystem) => {
    const { available, used, mountPath } = diskData[filesystem];
    return {
      MetricName: 'DiskSpaceUtilization',
      Dimensions: [{
        Name: 'InstanceId',
        Value: `${customerId}-${id}`
      }, {
        Name: 'MountPath',
        Value: mountPath
      }, {
        Name: 'Filesystem',
        Value: filesystem
      }],
      /*StatisticValues: {
        Maximum: 0.0,
        Minimum: 0.0,
        SampleCount: 0.0,
        Sum: 0.0
      },*/
      Timestamp: time,
      Unit: 'Percent',
      Value: 100*(available / (available + used))
    };

  });
}

function getDiskSpaceUsed(lastMetric) {
  const { time, id, customerId, diskData } = lastMetric;
  return Object.keys(diskData).map((filesystem) => {
    const { used, mountPath } = diskData[filesystem];
    return {
      MetricName: 'DiskSpaceUsed',
      Dimensions: [{
        Name: 'InstanceId',
        Value: `${customerId}-${id}`
      }, {
        Name: 'MountPath',
        Value: mountPath
      }, {
        Name: 'Filesystem',
        Value: filesystem
      }],
      /*StatisticValues: {
        Maximum: 0.0,
        Minimum: 0.0,
        SampleCount: 0.0,
        Sum: 0.0
      },*/
      Timestamp: time,
      Unit: 'Kilobytes',
      Value: used
    };
  });
}

function getDiskSpaceAvailble(lastMetric) {
  const { time, id, customerId, diskData } = lastMetric;
  return Object.keys(diskData).map((filesystem) => {
    const { available, mountPath } = diskData[filesystem];
    return {
      MetricName: 'DiskSpaceAvailable',
      Dimensions: [{
        Name: 'InstanceId',
        Value: `${customerId}-${id}`
      }, {
        Name: 'MountPath',
        Value: mountPath
      }, {
        Name: 'Filesystem',
        Value: filesystem
      }],
      /*StatisticValues: {
        Maximum: 0.0,
        Minimum: 0.0,
        SampleCount: 0.0,
        Sum: 0.0
      },*/
      Timestamp: time,
      Unit: 'Kilobytes',
      Value: available
    };
  });
}
