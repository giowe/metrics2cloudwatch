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

      const cloudwatch = new AWS.CloudWatch();

      cloudwatch.putMetricData({
        Namespace: 'System/Linux',
        MetricData: [
          ...getDiskUtilization(lastMetric),
          ...getDiskSpaceUsed(lastMetric),
          ...getDiskSpaceAvailble(lastMetric),
          getMemoryUtilization(lastMetric),
          getMemoryAvailable(lastMetric),
          getMemoryUsed(lastMetric),
          getSwapUsed(lastMetric),
          getSwapUtilization(lastMetric)
        ]
      }, (err, data) => {
        if (err) return callback(err);
        console.log(data);
        callback(data);
      });
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
      Timestamp: new Date(time),
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
      Timestamp: new Date(time),
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
      Timestamp: new Date(time),
      Unit: 'Kilobytes',
      Value: available
    };
  });
}

function getMemoryUtilization(lastMetric) {
  const { time, id, customerId, memoryData } = lastMetric;
  const { percentage } = memoryData;
  return {
    MetricName: 'DiskSpaceAvailable',
    Dimensions: [{
      Name: 'InstanceId',
      Value: `${customerId}-${id}`
    }],
    Timestamp: new Date(time),
    Unit: 'Percent',
    Value: percentage
  };
}

function getMemoryAvailable(lastMetric) {
  const { time, id, customerId, memoryData } = lastMetric;
  const { memoryAvailable } = memoryData;
  return {
    MetricName: 'MemoryAvailable',
    Dimensions: [{
      Name: 'InstanceId',
      Value: `${customerId}-${id}`
    }],
    Timestamp: new Date(time),
    Unit: 'Kilobytes',
    Value: memoryAvailable
  };
}

function getMemoryUsed(lastMetric) {
  const { time, id, customerId, memoryData } = lastMetric;
  const { memoryUsed } = memoryData;
  return {
    MetricName: 'MemoryUsed',
    Dimensions: [{
      Name: 'InstanceId',
      Value: `${customerId}-${id}`
    }],
    Timestamp: new Date(time),
    Unit: 'Kilobytes',
    Value: memoryUsed
  };
}

function getSwapUtilization(lastMetric) {
  const { time, id, customerId, memoryData } = lastMetric;
  const { swapUtilization } = memoryData;
  return {
    MetricName: 'SwapUtilization',
    Dimensions: [{
      Name: 'InstanceId',
      Value: `${customerId}-${id}`
    }],
    Timestamp: new Date(time),
    Unit: 'Percent',
    Value: swapUtilization
  };
}

function getSwapUsed(lastMetric) {
  const { time, id, customerId, memoryData } = lastMetric;
  const { swapUsed } = memoryData;
  return {
    MetricName: 'SwapUsed',
    Dimensions: [{
      Name: 'InstanceId',
      Value: `${customerId}-${id}`
    }],
    Timestamp: new Date(time),
    Unit: 'Kilobytes',
    Value: swapUsed
  };
}
