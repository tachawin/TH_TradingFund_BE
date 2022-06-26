import AWS from 'aws-sdk';

import config from '../config/config';
import S3Adapter from './s3.aws.adapters';

import SNSAdapter from './sns.aws.adapter';

class AWSAdapter {
  static instance = null;

  private aws_region = config.aws.meta.region;
  private aws_access_key_id = config.aws.meta.credentials.default.aws_access_key_id;
  private aws_secret_access_key = config.aws.meta.credentials.default.aws_secret_access_key;
  private aws_options = {
    region: this.aws_region,
    accessKeyId: this.aws_access_key_id,
    secretAccessKey: this.aws_secret_access_key,
  };

  constructor() {
    this.setup();
  }

  static getInstance(): InstanceType<typeof AWSAdapter> {
    if (!AWSAdapter.instance) AWSAdapter.instance = new AWSAdapter();

    return AWSAdapter.instance;
  }

  private setup() {
    AWS.config.update(this.aws_options);

    console.log('[AWSAdapter.setup]: setup global configuration for AWS successfully 🎉');
  }

  public sns(): InstanceType<typeof SNSAdapter> {
    return SNSAdapter.getInstance();
  }

  public s3(): InstanceType<typeof S3Adapter> {
    return S3Adapter.getInstance();
  }
}

export default AWSAdapter;
