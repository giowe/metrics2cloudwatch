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

      const metricData = [
        ...getDiskUtilization(lastMetric),
        ...getDiskSpaceUsed(lastMetric),
        ...getDiskSpaceAvailble(lastMetric),
        getMemoryUtilization(lastMetric),
        getMemoryAvailable(lastMetric),
        getMemoryUsed(lastMetric),
        getSwapUsed(lastMetric),
        getSwapUtilization(lastMetric)
      ];

      const networkByteIn = getNetworkByteIn(lastMetric);
      if (networkByteIn.length) metricData.push(...networkByteIn);
      const networkByteOut = getNetworkByteOut(lastMetric);
      if (networkByteIn.length) metricData.push(...networkByteOut);
      const cpuUtilization = getCpuUtilization(lastMetric);
      if (cpuUtilization) metricData.push(cpuUtilization);

      const metricDataChunks = new Array(Math.ceil(metricData.length / 20)).fill().map(() => metricData.splice(0, 20));
      return Promise.all(metricDataChunks.map(MetricData => cloudwatch.putMetricData({
        Namespace: 'System/Linux',
        MetricData
      }).promise()));
    })
    .then(() => callback())
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

function getNetworkByteIn(lastMetric) {
  const { time, id, customerId, networkData } = lastMetric;
  return Object.keys(networkData).reduce((acc, networkName) => {
    const { bytesIn } = networkData[networkName];
    if(isNaN(bytesIn)) {
      return acc;
    }
    acc.push({
      MetricName: 'NetworkBytesIn',
      Dimensions: [{
        Name: 'InstanceId',
        Value: `${customerId}-${id}`
      }, {
        Name: 'NetworkName',
        Value: networkName
      }],
      Timestamp: new Date(time),
      Unit: 'Bytes',
      Value: bytesIn
    });
    return acc;
  }, []);
}

function getNetworkByteOut(lastMetric) {
  const { time, id, customerId, networkData } = lastMetric;
  return Object.keys(networkData).reduce((acc, networkName) => {
    const { bytesOut } = networkData[networkName];
    if(isNaN(bytesOut)) {
      return acc;
    }
    acc.push({
      MetricName: 'NetworkBytesOut',
      Dimensions: [{
        Name: 'InstanceId',
        Value: `${customerId}-${id}`
      }, {
        Name: 'NetworkName',
        Value: networkName
      }],
      Timestamp: new Date(time),
      Unit: 'Bytes',
      Value: bytesOut
    });
    return acc;
  }, []);
}

function getMemoryUtilization(lastMetric) {
  const { time, id, customerId, memoryData } = lastMetric;
  const { percentage } = memoryData;
  return {
    MetricName: 'MemoryUtilization',
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

function getCpuUtilization(lastMetric) {
  const { time, id, customerId, cpuData } = lastMetric;
  return isNaN(cpuData) ? null : {
    MetricName: 'CpuUtilization',
    Dimensions: [{
      Name: 'InstanceId',
      Value: `${customerId}-${id}`
    }],
    Timestamp: new Date(time),
    Unit: 'Percent',
    Value: cpuData
  };
}
