import path from 'node:path';
import {
  CfnOutput,
  Duration,
  Fn,
  RemovalPolicy,
  Stack,
} from 'aws-cdk-lib';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as s3 from 'aws-cdk-lib/aws-s3';

export class MarketingSiteStack extends Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    const siteBucket = new s3.Bucket(this, 'MarketingSiteBucket', {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      autoDeleteObjects: false,
      removalPolicy: RemovalPolicy.RETAIN,
    });

    const certificateArn = Fn.importValue(props.certificateArnExportName);
    const certificate = acm.Certificate.fromCertificateArn(this, 'ImportedCertificate', certificateArn);

    const distribution = new cloudfront.Distribution(this, 'MarketingDistribution', {
      defaultRootObject: 'index.html',
      domainNames: [props.domainName, ...props.alternateDomainNames],
      certificate,
      minimumProtocolVersion: cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(siteBucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        compress: true,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
      },
      errorResponses: [
        {
          httpStatus: 403,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
          ttl: Duration.minutes(5),
        },
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
          ttl: Duration.minutes(5),
        },
      ],
    });

    new s3deploy.BucketDeployment(this, 'DeployMarketingSite', {
      sources: [s3deploy.Source.asset(path.join(props.projectRoot, 'dist'))],
      destinationBucket: siteBucket,
      distribution,
      distributionPaths: ['/*'],
      prune: true,
    });

    const githubOidcProvider = new iam.OpenIdConnectProvider(this, 'GitHubOidcProvider', {
      url: 'https://token.actions.githubusercontent.com',
      clientIds: ['sts.amazonaws.com'],
    });

    const githubDeployRole = new iam.Role(this, 'GitHubDeployRole', {
      assumedBy: new iam.WebIdentityPrincipal(
        githubOidcProvider.openIdConnectProviderArn,
        {
          StringEquals: {
            'token.actions.githubusercontent.com:aud': 'sts.amazonaws.com',
            'token.actions.githubusercontent.com:sub': `repo:${props.githubRepository}:ref:refs/heads/${props.githubBranch}`,
          },
        },
        'sts:AssumeRoleWithWebIdentity',
      ),
      description: 'GitHub Actions deploy role for the TokiGig marketing site.',
      roleName: props.githubRoleName,
    });

    siteBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        principals: [new iam.ArnPrincipal(githubDeployRole.roleArn)],
        actions: ['s3:ListBucket', 's3:GetObject', 's3:PutObject', 's3:DeleteObject'],
        resources: [siteBucket.bucketArn, `${siteBucket.bucketArn}/*`],
      }),
    );

    siteBucket.grantReadWrite(githubDeployRole);
    githubDeployRole.addToPolicy(
      new iam.PolicyStatement({
        actions: ['cloudfront:CreateInvalidation', 'cloudfront:GetInvalidation'],
        resources: ['*'],
      }),
    );

    new CfnOutput(this, 'SiteBucketName', {
      value: siteBucket.bucketName,
      description: 'S3 bucket that stores the built Astro site.',
    });

    new CfnOutput(this, 'CloudFrontDistributionId', {
      value: distribution.distributionId,
      description: 'CloudFront distribution identifier.',
    });

    new CfnOutput(this, 'CloudFrontDistributionDomainName', {
      value: distribution.distributionDomainName,
      description: 'Target this from Cloudflare as a proxied CNAME.',
    });

    new CfnOutput(this, 'CloudflareRootDomainNote', {
      value: `For ${props.domainName}, use a Cloudflare proxied CNAME flattening record pointed at ${distribution.distributionDomainName}.`,
      description: 'Root domain DNS guidance.',
    });

    new CfnOutput(this, 'GitHubOidcProviderArn', {
      value: githubOidcProvider.openIdConnectProviderArn,
      description: 'IAM OIDC provider for GitHub Actions.',
    });

    new CfnOutput(this, 'GitHubDeployRoleArn', {
      value: githubDeployRole.roleArn,
      description: 'Set this value as the AWS_ROLE_TO_ASSUME GitHub secret.',
    });
  }
}
