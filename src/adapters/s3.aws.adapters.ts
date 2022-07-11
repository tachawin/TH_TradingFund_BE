import stream from 'stream';
import AWS from 'aws-sdk';

import config from '../config/config';

interface S3Uploader {
  Bucket: string
  Key: string
}

class S3Adapter {
  static instance = null;

  private s3: AWS.S3 = null;

  private aws_s3_payslip_options = config.aws.s3.bucket.payslip;
  private aws_s3_payslip_base_object_url = config.aws.s3.bucket.payslip.base_object_url;

  private aws_s3_product_preview_options = config.aws.s3.bucket.product_preview;
  private aws_s3_product_preview_base_object_url = config.aws.s3.bucket.product_preview.base_object_url;

  private aws_s3_level_image_options = config.aws.s3.bucket.level_image;
  private aws_s3_level_image_base_object_url = config.aws.s3.bucket.level_image.base_object_url;

  constructor() {
    this.setup();
  }

  static getInstance(): InstanceType<typeof S3Adapter> {
    if (!S3Adapter.instance) S3Adapter.instance = new S3Adapter();

    return S3Adapter.instance;
  }

  private setup() {
    this.s3 = new AWS.S3();

    console.info('[S3Adapter.setup]: create AWS S3 client successfully 🎉');
  }

  public uploadSteam(uploader: S3Uploader) {
    const pass = new stream.PassThrough();

    return {
      writeStream: pass,
      promise: this.s3.upload({
        Bucket: uploader.Bucket,
        Key: uploader.Key,
        Body: pass,
      }).promise(),
    };
  }

  public payslipUploader(adminId?: string): [S3Uploader, string] {
    const now = new Date();

    const timeTH = now.toISOString().split('T')[0];
    const timestamp = now.getTime();

    const identifier = adminId || 'unknown';

    const key = `${this.aws_s3_payslip_options.prefix_key}-${identifier}-${timeTH}-${timestamp}${this.aws_s3_payslip_options.extension}`;
    const objectURL = `${this.aws_s3_payslip_base_object_url}/${key}`;

    const uploader = {
      Bucket: this.aws_s3_payslip_options.name,
      Key: key,
    };

    return [uploader, objectURL];
  }

  public productPreviewUploader(): [S3Uploader, string] {
    const identifier = new Date().getTime();

    const key = `${this.aws_s3_product_preview_options.prefix_key}-${identifier}${this.aws_s3_product_preview_options.extension}`;
    const objectURL = `${this.aws_s3_product_preview_base_object_url}/${key}`;

    const uploader = {
      Bucket: this.aws_s3_product_preview_options.name,
      Key: key,
    };

    return [uploader, objectURL];
  }

  public levelImageUploader(): [S3Uploader, string] {
    const identifier = new Date().getTime();

    const key = `${this.aws_s3_level_image_options.prefix_key}-${identifier}${this.aws_s3_level_image_options.extension}`;
    const objectURL = `${this.aws_s3_level_image_base_object_url}/${key}`;

    const uploader = {
      Bucket: this.aws_s3_level_image_options.name,
      Key: key,
    };

    return [uploader, objectURL];
  }
}

export default S3Adapter;
