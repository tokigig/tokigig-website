export const APP_SCAN_ENTRY = 'https://apps.tokigig.com/scan';

export function buildScanHref(source: string, domain?: string) {
  const url = new URL(APP_SCAN_ENTRY);
  url.searchParams.set('source', source);

  if (domain) {
    url.searchParams.set('domain', domain);
    url.searchParams.set('url', domain);
  }

  return url.toString();
}
