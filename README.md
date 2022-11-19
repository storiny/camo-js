# camo-js

## About
Original implementation: [atmos/camo](https://github.com/atmos/camo).

A camo server is a special type of image proxy that proxies non-secure images over SSL/TLS, in order to prevent mixed content warnings on secure pages. The server works in conjunction with back-end code that rewrites image URLs and signs them with an HMAC.

```
                                                                      
        +------------+       Request       +------------+             
        |            |  ---------------->  |            |             
        |            |                     |   Primary  |             
        |            |  <----------------  |   Server   |             
        |            |                     |            |             
        |   Client   |  https://camo/img   +------------+             
        |            |                     +------------+ http://image
        |            |  ---------------->  |            | ----------->
        |            |                     |   Camo     |             
        |            |     Image Data      |   Server   | Image Data  
        |            |  <----------------  |            | <-----------
        +------------+                     +------------+             
```

## URL format
The URL format follows the syntax below:

```
http://server.com/<digest>/<encoded-image-url>
```

The <digest> is a 40 character hex encoded HMAC digest generated with a shared secret key and the unescaped <encoded-image-url> value. The <encoded-image-url> is the absolute URL locating an image. Each byte of the <encoded-image-url> should be hex encoded such that the resulting value includes only characters `[0-9a-f]`.

## Environment

`CAMO_PORT`: The port that the Camo server will listen to. (Default: `8081`)
`CAMO_KEY`: A shared key consisting of a random string, used to generate the HMAC digest.
`CAMO_URI`: The public URI of the Camo server. (Default: `http://localhost:8081`)

## Development
```
yarn dev
```

## Building
[pm2](https://pm2.keymetrics.io/) is used for daemonizing as a process supervisor.

```
yarn build
```

## Testing
```
yarn test
```

## Other implementations
- [go-camo](https://github.com/cactus/go-camo)
- [camo-ruby](https://github.com/ankane/camo-ruby)
- [phpamo](https://github.com/willwashburn/Phpamo)
