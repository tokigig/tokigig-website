import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { App } from 'aws-cdk-lib';
import { CertificateStack } from '../infra/certificate-stack.mjs';
import { MarketingSiteStack } from '../infra/marketing-site-stack.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const account = process.env.CDK_DEFAULT_ACCOUNT ?? process.env.AWS_ACCOUNT_ID;
const siteRegion = process.env.CDK_DEFAULT_REGION ?? process.env.AWS_REGION ?? 'us-east-1';
const certificateRegion = 'us-east-1';
const domainName = process.env.SITE_DOMAIN ?? 'tokigig.com';
const siteSubdomain = process.env.SITE_SUBDOMAIN ?? '';
const fullDomainName = siteSubdomain ? `${siteSubdomain}.${domainName}` : domainName;
const certificateArnExportName = process.env.CERTIFICATE_ARN_EXPORT_NAME ?? 'TokiGigCertificateArn';
const githubRepository = process.env.GITHUB_REPOSITORY_NAME ?? 'TokiGig/tokigig-website';
const githubBranch = process.env.GITHUB_DEPLOY_BRANCH ?? 'main';
const githubRoleName = process.env.GITHUB_DEPLOY_ROLE_NAME ?? 'tokigig-marketing-github-deploy';
const subjectAlternativeNames = [
  ...new Set(
    [domainName, fullDomainName, `www.${domainName}`].filter(Boolean),
  ),
];

const app = new App();
const env = account ? { account, region: siteRegion } : { region: siteRegion };
const certificateEnv = account
  ? { account, region: certificateRegion }
  : { region: certificateRegion };

const certificateStack = new CertificateStack(app, 'TokiGigCertificateStack', {
  env: certificateEnv,
  domainName: fullDomainName,
  subjectAlternativeNames,
  certificateArnExportName,
});

const marketingSiteStack = new MarketingSiteStack(app, 'TokiGigMarketingSiteStack', {
  env,
  projectRoot,
  domainName: fullDomainName,
  alternateDomainNames: subjectAlternativeNames.filter((name) => name !== fullDomainName),
  certificateArnExportName,
  githubRepository,
  githubBranch,
  githubRoleName,
});

marketingSiteStack.addDependency(certificateStack);
