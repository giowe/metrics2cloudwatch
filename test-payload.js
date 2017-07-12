module.exports = {
  Records: [{
    eventVersion: '2.0',
    eventSource: 'aws:s3',
    awsRegion: 'eu-central-1',
    eventTime: '2017-07-12T13:29:16.167Z',
    eventName: 'ObjectCreated:Put',
    userIdentity: { principalId: 'AWS:AIDAJ2CCRGODXMUQZK4FW' },
    requestParameters: { sourceIPAddress: '144.76.87.112' },
    responseElements:
      { 'x-amz-request-id': '631780A8C708991F',
        'x-amz-id-2': 'qTebm/kBTsrCLBGg+pCfO5DlMYJYCAGsqOQK+W+vpHaxE0uSCiVwmDs2T54sRZnOXWHX5VH/QIc=' },
    s3:
      { s3SchemaVersion: '1.0',
        configurationId: 'metrics2cloudwatch',
        bucket:
          { name: 'sf-system-metrics',
            ownerIdentity: [Object],
            arn: 'arn:aws:s3:::sf-system-metrics' },
        object:
          { key: 'mow/web01/mow_web01_1499866155000.json.gz',
            size: 1270,
            eTag: '080fc2275ef52604f9150a2b12448831',
            sequencer: '005966242C1139E4D3'
          }
      }
  }]
};
