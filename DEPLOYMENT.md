# Marketing Site Infrastructure

This repo now includes an AWS CDK app for the static `tokigig.com` marketing site.

## What it creates

- An ACM certificate in `us-east-1`
- A private S3 bucket for the built Astro output
- A CloudFront distribution in front of that bucket
- A deployment step that uploads `dist/` and invalidates CloudFront

## Defaults

- Apex domain: `tokigig.com`
- Additional domain alias: `www.tokigig.com`
- AWS region for the site stack: your current `CDK_DEFAULT_REGION`, falling back to `us-east-1`
- AWS region for ACM: always `us-east-1`

Optional environment variables:

- `SITE_DOMAIN`
- `SITE_SUBDOMAIN`
- `AWS_ACCOUNT_ID`
- `AWS_REGION`
- `CERTIFICATE_ARN_EXPORT_NAME`
- `GITHUB_REPOSITORY_NAME`
- `GITHUB_DEPLOY_BRANCH`
- `GITHUB_DEPLOY_ROLE_NAME`

## Deploy

1. Install dependencies: `pnpm install`
2. Bootstrap CDK if needed: `pnpm cdk:bootstrap`
3. Build and deploy the AWS infrastructure: `pnpm deploy:infra`
4. Copy these `TokiGigMarketingSiteStack` outputs into GitHub repository secrets:
   `GitHubDeployRoleArn` -> `AWS_ROLE_TO_ASSUME`
   `SiteBucketName` -> `AWS_S3_BUCKET`
   `CloudFrontDistributionId` -> `AWS_CLOUDFRONT_DISTRIBUTION_ID`
5. After the secrets are set, pushes to `main` can use GitHub Actions for routine site deploys.

## Cloudflare steps

1. After `TokiGigCertificateStack` starts, open ACM in `us-east-1`.
2. Copy the DNS validation CNAME records ACM gives you.
3. Add those CNAME records in Cloudflare and wait for the certificate to issue.
4. Point `tokigig.com` and `www.tokigig.com` at the CloudFront domain output by `TokiGigMarketingSiteStack`.

Use Cloudflare proxied DNS records. For the apex/root domain, Cloudflare CNAME flattening can point `tokigig.com` directly at the CloudFront distribution hostname.

## GitHub Actions deploy

The repo now includes `.github/workflows/deploy-marketing.yml`.

Use the CDK deploy above first. The GitHub Actions workflow only uploads the built site and invalidates CloudFront; it does not create or update the S3 bucket policy, IAM role, or distribution.

On every push to `main`, it will:

1. Install dependencies
2. Run `pnpm build`
3. Sync `dist/` to S3
4. Invalidate CloudFront

Set these GitHub repository secrets before enabling it:

- `AWS_ROLE_TO_ASSUME`
- `AWS_S3_BUCKET`
- `AWS_CLOUDFRONT_DISTRIBUTION_ID`

Optional GitHub repository variable:

- `AWS_REGION` with a default of `us-east-1`

The CDK stack also creates:

- An IAM OIDC provider for `https://token.actions.githubusercontent.com`
- A GitHub Actions deploy role scoped to the `TokiGig/tokigig-website` repo on the `main` branch

After the one-time infrastructure deploy, copy these outputs into GitHub:

- `GitHubDeployRoleArn` -> `AWS_ROLE_TO_ASSUME`
- `SiteBucketName` -> `AWS_S3_BUCKET`
- `CloudFrontDistributionId` -> `AWS_CLOUDFRONT_DISTRIBUTION_ID`
