// Redirect legacy pages.dev domain (printed in books) to mcword.com,
// preserving path and query string. Serves mcword.com itself normally.
export async function onRequest(context) {
  const url = new URL(context.request.url);
  const isLegacyHost = url.hostname === 'mc-words.pages.dev';
  // Keep the WeChat verification file reachable on the old host during appeal review.
  const isVerificationFile = url.pathname === '/6b15c26cfe41587a65324fca456c2944.txt';

  if (isLegacyHost && !isVerificationFile) {
    return Response.redirect(`https://mcword.com${url.pathname}${url.search}`, 301);
  }
  return context.next();
}
