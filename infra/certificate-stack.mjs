import { CfnOutput, Stack } from 'aws-cdk-lib';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';

export class CertificateStack extends Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    const certificate = new acm.CfnCertificate(this, 'SiteCertificate', {
      domainName: props.domainName,
      subjectAlternativeNames: props.subjectAlternativeNames,
      validationMethod: 'DNS',
    });

    // For AWS::CertificateManager::Certificate, Ref resolves to the certificate ARN.
    this.certificateArn = certificate.ref;

    new CfnOutput(this, 'CertificateArn', {
      value: this.certificateArn,
      exportName: props.certificateArnExportName,
      description: 'ACM certificate ARN for the CloudFront distribution.',
    });

    new CfnOutput(this, 'CertificateRegion', {
      value: Stack.of(this).region,
      description: 'CloudFront certificates must live in us-east-1.',
    });

    new CfnOutput(this, 'CertificateDnsValidationReminder', {
      value: 'Add the ACM DNS validation CNAME records in Cloudflare before the distribution can finish deploying.',
      description: 'Manual Cloudflare step.',
    });
  }
}
