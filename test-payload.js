module.exports = {
  Records: [{
    s3SchemaVersion: '1.0',
    configurationId: 'metrics2cloudwatch',
    bucket:
      { name: 'sf-system-metrics',
        ownerIdentity: { principalId: 'A1DVTYDKYT6EEE' },
        arn: 'arn:aws:s3:::sf-system-metrics' },
    object:
      { key: 'matteo/matteo-pc-3/matteo_matteo-pc-3_1499855915255.json.gz',
        size: 738,
        eTag: 'b546ebeff480ccb52b9d003f8984aa1d',
        sequencer: '005965FC2B78BD2E98'
      }
  }]
};
