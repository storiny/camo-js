/* eslint-disable no-case-declarations */
import crypto from 'crypto';
import http, {
  IncomingHttpHeaders,
  IncomingMessage,
  OutgoingHttpHeaders,
  RequestOptions,
  ServerResponse,
} from 'http';
import https from 'https';
import decodeHex from './utils/decode';
import { parse, UrlWithStringQuery } from 'url';
import { config } from 'dotenv';

import MIME_TYPES from './mimes';
import moment from 'moment';

config({ path: '.env.example' });

const CAMO_KEY = process.env.CAMO_KEY;
const SOCKET_TIMEOUT = 10e3;
const CONTENT_LENGTH_LIMIT = 5242880;
const MAX_REDIRECTS = 3;
const USER_AGENT = 'Storiny Camo / 1.0';

let totalConnections = 0;
let activeConnections = 0;
const uptime = new Date();

const defaultHeaders: OutgoingHttpHeaders = {
  'Content-Security-Policy':
    "default-src 'none'; img-src data:; style-src 'unsafe-inline'",
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'deny',
  'X-XSS-Protection': '1; mode=block',
};

const httpError = (res: ServerResponse, msg?: string) => {
  res.writeHead(404, {
    'Cache-Control': 'no-cache, no-store, private, must-revalidate',
    'Content-Security-Policy': defaultHeaders['Content-Security-Policy'],
    'Strict-Transport-Security': defaultHeaders['Strict-Transport-Security'],
    'X-Content-Type-Options': defaultHeaders['X-Content-Type-Options'],
    'X-Frame-Options': defaultHeaders['X-Frame-Options'],
    'X-XSS-Protection': defaultHeaders['X-XSS-Protection'],
    expires: '0',
  });

  return endRes(res, msg || 'Not Found');
};

const endRes = function (res: ServerResponse, str?: string) {
  if (activeConnections > 0) {
    activeConnections -= 1;
  }

  return res.socket && res.end(str);
};

const processUrl = (
  url: UrlWithStringQuery,
  transferredHeaders: IncomingHttpHeaders | OutgoingHttpHeaders,
  res: ServerResponse,
  remainingRedirects: number
): ServerResponse<IncomingMessage> | null => {
  let queryPath: string;
  let protocol: typeof http | typeof https;

  if (url.host) {
    if (url.protocol === 'https:') {
      protocol = https;
    } else if (url.protocol === 'http:') {
      protocol = http;
    } else {
      return httpError(res, 'Unknown protocol');
    }

    queryPath = url.pathname as string;

    if (url.query) {
      queryPath += '?' + url.query;
    }

    transferredHeaders.host = url.host;

    const requestOptions: RequestOptions = {
      headers: transferredHeaders,
      hostname: url.hostname,
      path: queryPath,
      port: url.port,
    };

    const request = protocol.get(requestOptions, (response) => {
      let hasFinished = true;

      const contentLength = Number.parseInt(
        response.headers['content-length'] || '0',
        10
      );

      if (contentLength > CONTENT_LENGTH_LIMIT) {
        response.destroy();
        return httpError(res, 'Content-Length exceeded');
      }

      const newHeaders: OutgoingHttpHeaders = {
        'Camo-Host': 'Storiny',
        'Content-Security-Policy': defaultHeaders['Content-Security-Policy'],
        'Strict-Transport-Security':
          defaultHeaders['Strict-Transport-Security'],
        'X-Content-Type-Options': defaultHeaders['X-Content-Type-Options'],
        'X-Frame-Options': defaultHeaders['X-Frame-Options'],
        'X-XSS-Protection': defaultHeaders['X-XSS-Protection'],
        'cache-control':
          response.headers['cache-control'] || 'public, max-age=31536000',
        'content-type': response.headers['content-type'],
      };

      [
        'etag',
        'expires',
        'last-modified',
        'transfer-encoding',
        'content-encoding',
      ].forEach((header) => {
        if (response.headers[header]) {
          newHeaders[header] = response.headers[header];
        }
      });

      if (contentLength) {
        newHeaders['content-length'] = contentLength;
      }

      response.on('end', function () {
        if (hasFinished) {
          return endRes(res);
        }
      });

      response.on('error', function () {
        if (hasFinished) {
          return endRes(res);
        }
      });

      switch (response.statusCode) {
        case 301:
        case 302:
        case 303:
        case 307:
          response.destroy();

          if (remainingRedirects <= 0) {
            return httpError(res, 'Exceeded max depth');
          }

          if (!response.headers['location']) {
            return httpError(res, 'Redirect with no location');
          }

          hasFinished = false;

          const newUrl = parse(response.headers['location']);

          if (!(newUrl.host != null && newUrl.hostname != null)) {
            newUrl.host = newUrl.hostname = url.hostname;
            newUrl.protocol = url.protocol;
          }

          return processUrl(
            newUrl,
            transferredHeaders,
            res,
            remainingRedirects - 1
          );
        case 304:
          response.destroy();
          return res.writeHead(response.statusCode, newHeaders);
        default:
          const contentType: string = newHeaders['content-type'] as string;

          if (!contentType) {
            response.destroy();
            return httpError(res, 'No content-type returned');
          }

          const contentTypePrefix = contentType.split(';')[0].toLowerCase();

          if (MIME_TYPES.indexOf(contentTypePrefix) < 0) {
            response.destroy();
            return httpError(
              res,
              "Non-Image content-type returned: '" + contentTypePrefix + "'"
            );
          }

          res.writeHead(response.statusCode!, newHeaders);
          return response.pipe(res);
      }
    });

    request.setTimeout(SOCKET_TIMEOUT * 1000, () => {
      request.abort();
      return httpError(res, 'Socket timeout');
    });

    request.on('error', () => {
      return httpError(res, 'Client request error');
    });

    res.on('close', () => {
      return request.abort();
    });

    return res.on('error', () => {
      return request.abort();
    });
  }

  return httpError(res, `Unresolved host ${url.host}`);
};

const server = http.createServer(
  (
    req: IncomingMessage,
    res: ServerResponse<IncomingMessage> & {
      req: IncomingMessage;
    }
  ) => {
    res.setHeader('X-Powered-By', 'Storiny Camo');

    if (req.method !== 'GET') {
      return res.writeHead(200, defaultHeaders).end('Method not allowed');
    }

    if (req.url === '/') {
      return res.writeHead(200, defaultHeaders).end('Not found');
    }

    if (req.url === '/favicon.ico') {
      return res.writeHead(200, defaultHeaders).end();
    }

    if (req.url === '/status') {
      res
        .writeHead(200, {
          ...defaultHeaders,
          'Content-Type': 'application/json',
        })
        .write(
          JSON.stringify({
            active: activeConnections,
            total: totalConnections,
            uptime: moment(new Date()).diff(moment(uptime), 'seconds'),
            uptime_human: moment(uptime).fromNow(),
          })
        );

      return res.end();
    }

    totalConnections += 1;
    activeConnections += 1;

    const url = parse(req.url as string);

    delete req.headers.cookie;

    const transferredHeaders: OutgoingHttpHeaders = {
      Accept: req.headers.accept || 'image/*',
      'Accept-Encoding': req.headers['accept-encoding'] || '',
      'Content-Security-Policy': defaultHeaders['Content-Security-Policy'],
      'User-Agent': USER_AGENT,
      Via: USER_AGENT,
      'X-Content-Type-Options': defaultHeaders['X-Content-Type-Options'],
      'X-Frame-Options': defaultHeaders['X-Frame-Options'],
      'X-XSS-Protection': defaultHeaders['X-XSS-Protection'],
    };

    const [queryDigest, encodedUrl] = (url.pathname || '')
      .replace(/^\//, '')
      .split('/', 2);

    const destUrl = decodeHex(encodedUrl);

    if (req.headers['via'] && req.headers['via'].indexOf(USER_AGENT) !== -1) {
      return httpError(res, 'Self request prohibited');
    }

    if (url.pathname && destUrl) {
      const HMAC = crypto.createHmac('sha1', CAMO_KEY as string);

      try {
        HMAC.update(destUrl, 'utf8');
      } catch (e) {
        return httpError(res, 'Could not create checksum');
      }

      const hmacDigest = HMAC.digest('hex');

      if (hmacDigest === queryDigest) {
        return processUrl(
          parse(destUrl),
          transferredHeaders,
          res,
          MAX_REDIRECTS
        );
      } else {
        return httpError(res, `Checksum mismatch ${hmacDigest}:${queryDigest}`);
      }
    }

    return httpError(res);
  }
);

export default server;
