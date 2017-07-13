# metrics2cloudwatch

[![Dependency Status][dependencies-image]][dependencies-url] [![Gandalf  Status][gandalf-image]][gandalf-url]

[dependencies-image]: https://david-dm.org/giowe/metrics2cloudwatch.svg
[dependencies-url]: href="https://david-dm.org/giowe/metrics2cloudwatch
[gandalf-url]: https://www.youtube.com/watch?v=Sagg08DrO5U
[gandalf-image]: http://img.shields.io/badge/gandalf-approved-61C6FF.svg

## What is metrics2cloudwatch?

metrics2cloudwatch is a dev-Solution that can be used to deploy an AWS Lamba function that will take metrics file from an S3 Bucket, format them trough [system-metrics-formatter](https://www.npmjs.com/package/system-metrics-formatter) and then upload them on AWS CloudWatch.

To collect those data we recommend using the npm module [system-metrics-collector](https://www.npmjs.com/package/system-metrics-collector) available even in GO language at this [link](https://github.com/giowe/system-metrics-collector/tree/go) (if you want a compiled version)

## How to use it

metrics2cloudwatch was scaffolded with [slush-aws-lambda](https://www.npmjs.com/package/slush-aws-lambda), a tool very useful to create dev-Solutions for Lambdas 

### Configuration
In order to properly work, metrics2cloudwatch Lambda needs a AWS IAM role that grants AWS CloudWatch permissions and
access to AWS S3 metrics bucket; you can copy from this policy, replacing `YOUR_BUCKET_NAME` with your S3 bucket name:
```
  {
      "Version": "2012-10-17",
      "Statement": [
          {
              "Sid": "0",
              "Effect": "Allow",
              "Action": [
                  "logs:CreateLogGroup",
                  "logs:CreateLogStream",
                  "logs:PutLogEvents"
              ],
              "Resource": "arn:aws:logs:::*"
          },
          {
              "Sid": "10",
              "Effect": "Allow",
              "Action": [
                  "s3:GetObject"
              ],
              "Resource": [
                  "arn:aws:s3:::YOUR_BUCKET_NAME/*"
              ]
          },
          {
              "Sid": "20",
              "Effect": "Allow",
              "Action": [
                  "cloudwatch:PutMetricData"
              ],
              "Resource": [
                  "*"
              ]
          }
      ]
  }
```

After cloning the repo, the first thing to do is to execute the following commands:

``$ npm install``

``$ gulp configure``

That will generate a config file similar to this one:
```
  {
    "Region": "YOUR_S3_METRICS_BUCKET_REGION",
    "ConfigOptions": {
      "FunctionName": "metrics2cloudwatch",
      "Description": "get metrics from s3 bucket, parses and uploades them to cloud watch",
      "Role": "PREVIOUSLY_GENERATE_ROLE_ARN",
      "Handler": "index.handler",
      "MemorySize": "128",
      "Timeout": "3",
      "Runtime": "nodejs6.10"
    }
  }
```

To run this Lambda needs to be attached to an event of the metric bucket triggered every time a file is uploaded

### Running

To deploy Lambda run :

`$ gulp create`

To modify the config, simply modify the config file previously created and then run:

`$ gulp update-config`

#### Data
  I recommend the npm module [system-metrics-collector](https://www.npmjs.com/package/system-metrics-collector) available even in GO language at this [link](https://github.com/giowe/system-metrics-collector/tree/go) (if you want a compiled version) to collect such metrics and put them on an S3 bucket;
  On the S3 bucket you have to put a Gzipped file named: ``<CustomerId>/<Id>/<CustomerId>_<Id>_<UnixTime>``
  S3 objects should have a metadata structured like this:
  ```
  {
    "previousKey": "previous s3 object",
    "cloudWatchEnabledMetrics": ['DiskUtilization', 'DiskSpaceUsed', 'DiskSpaceAvailable', 'MemoryUtilization', 'MemoryAvailable', 'MemoryUsed', 'SwapUsed', 'SwapUtilization', 'NetworkUtilization', 'CPUUtilization']
  }
  ```
  S3 objects should be structured like this:
  ```
  {
    "Time": 1499680866,
    "Cpu": {
      "TotalCpuUsage": {
        "CpuName": "cpu",
        "User": 41969,
        "Nice": 270,
        "System": 7609,
        "Idle": 704945,
        "Iowait": 31409,
        "Irq": 0,
        "Softirq": 1135,
        "Steal": 0,
        "Guest": 0,
        "GuestNice": 0
      }
    },
    "Memory": {
      "MemTotal": 3473712,
      "MemFree": 110332,
      "MemAvailable": 942664
    },
    "Disks": [
      {
        "Name": "/dev/disk0s2",
        "MountPoint": "/",
        "Capacity": 15,
        "Used": 36566132,
        "Available": 212397356
      },
      {
        "Name": "/dev/disk1s2",
        "MountPoint": "/Volumes/+è",
        "Capacity": 19,
        "Used": 112448544,
        "Available": 511843712
      }
    ],
    "Network": [
      {
        "Name": "enp5s0",
        "BytesIn": 0,
        "PacketsIn": 0,
        "BytesOut": 0,
        "PacketsOut": 0
      },
      {
        "Name": "lo",
        "BytesIn": 45933,
        "PacketsIn": 565,
        "BytesOut": 45933,
        "PacketsOut": 565
      },
      {
        "Name": "wlp4s0",
        "BytesIn": 197285671,
        "PacketsIn": 136480,
        "BytesOut": 7569366,
        "PacketsOut": 70109
      }
    ]
  }
  ```
  
## People

- [Giovanni Bruno](https://github.com/giowe) - [Soluzioni Futura](https://www.soluzionifutura.it/)
- [Emanuele Zanni](https://github.com/zanni99)
- [Matteo Carrara](https://github.com/MatteCarra)

## License
MIT
