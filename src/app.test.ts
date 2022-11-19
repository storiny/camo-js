// noinspection yrHttpUrlsUsage

import server from '../jest/server';
import encodeHex from './utils/encode';

describe('proxy test', () => {
  it('should not crash for unencoded url', (done) => {
    server
      .get('/sample_digest/unencoded_url')
      .expect(404)
      .end((err) => {
        if (err) {
          return done(err);
        }
        done();
      });
  });

  it('should reject images greater than 5 megabytes', (done) => {
    const { digest, url } =
      encodeHex(
        'http://apod.nasa.gov/apod/image/0505/larryslookout_spirit_big.jpg'
      ) || {};

    server
      .get(`/${digest}/${url}`)
      .expect(404)
      .end((err) => {
        if (err) {
          return done(err);
        }
        done();
      });
  });

  it('should reject for content other than an image', (done) => {
    const { digest, url } =
      encodeHex('https://api.github.com/users/zignis') || {};

    server
      .get(`/${digest}/${url}`)
      .expect(404)
      .end((err) => {
        if (err) {
          return done(err);
        }
        done();
      });
  });

  it('should set security headers', (done) => {
    server
      .get('/status')
      .expect(200)
      .end((err, { headers }) => {
        if (err) {
          return done(err);
        }

        [
          ['x-frame-options', 'deny'],
          [
            'content-security-policy',
            "default-src 'none'; img-src data:; style-src 'unsafe-inline'",
          ],
          ['x-content-type-options', 'nosniff'],
          ['strict-transport-security', 'max-age=31536000; includeSubDomains'],
        ].forEach(([header, value]) => expect(headers[header]).toBe(value));

        done();
      });
  });
});
