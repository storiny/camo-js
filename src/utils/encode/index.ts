import crypto from 'crypto';

const encodeHex = (
  url: string | null,
  key?: string
): { digest: string; url: string } | null => {
  if (!url || url.startsWith('https:')) {
    return null;
  }

  const hmac = crypto.createHmac(
    'sha1',
    key || (process.env.CAMO_KEY as string)
  );

  try {
    hmac.update(url, 'utf8');
  } catch (e) {
    return null;
  }

  return { digest: hmac.digest('hex'), url: Buffer.from(url).toString('hex') };
};

export default encodeHex;
