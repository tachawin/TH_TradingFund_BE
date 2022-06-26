import AWS from 'aws-sdk';

import config from '../config/config';

class SNSAdapter {
  static instance = null;

  private sns: AWS.SNS = null;

  private message_template = 'refCode: {{REFCODE}}, OTP: {{OTP}}\n\nplease verify the code in {{EXPIRED_OTP_CODE}}';
  private subject_template = 'TradingFund Verify OTP [{{OTP}}]';

  private aws_sns_options: AWS.SNS.ClientConfiguration = {
    apiVersion: config.aws.sns.api_version,
    region: config.aws.region,
  };

  public expired_otp_code = '15m';

  constructor() {
    this.setup();
  }

  static getInstance(): InstanceType<typeof SNSAdapter> {
    if (!SNSAdapter.instance) SNSAdapter.instance = new SNSAdapter();

    return SNSAdapter.instance;
  }

  private setup() {
    this.sns = new AWS.SNS();

    console.log('[SNSAdapter.setup]: create AWS SNS client successfully 🎉');
  }

  private generateOneTimePasswordCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private generateReferenceCode(): string {
    return (Math.random() + 1).toString(36).substring(7);
  }

  private generateSubjectSMS(otp: string): string {
    return this.subject_template.replace('{{OTP}}', otp);
  }

  private generateMessage(otp: string, refCode: string): string {
    return this.message_template
      .replace('{{OTP}}', otp)
      .replace('{{REFCODE}}', refCode)
      .replace('{{EXPIRED_OTP_CODE}}', this.expired_otp_code);
  }

  private getSNSParamsAndOTP(phoneNumber: string): [AWS.SNS.PublishInput, string, string] {
    const otp = this.generateOneTimePasswordCode();
    const refCode = this.generateReferenceCode();

    const params = {
      Subject: this.generateSubjectSMS(otp),
      Message: this.generateMessage(otp, refCode),

      PhoneNumber: `+66${phoneNumber}`,

      MessageAttributes: {
        'AWS.SNS.SMS.SMSType': {
          DataType: 'String',
          StringValue: 'Transactional',
        },
      },
    };

    return [params, otp, refCode];
  }

  public async sendOneTimePassword(phoneNumber: string, done: Function): Promise<string> {
    const [params, otp, refCode] = this.getSNSParamsAndOTP(phoneNumber);

    const publishSMSPromise = this.sns.publish(params).promise();

    await publishSMSPromise.then(
      async (data) => {
        console.log(`MessageID is ${data.MessageId}`);

        await done(otp, refCode);
      },
    ).catch(
      (err: Error) => {
        console.error(err, err.stack);

        throw new Error(`[SNSAdapter.sendOneTimePassword]: unable to publish sms to phone number ${phoneNumber}`);
      },
    );

    return refCode;
  }
}

export default SNSAdapter;
