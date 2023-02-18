module.exports = {
  "globDirectory": 'public',
  "globPatterns": [
    "**/*.{html,woff2}",
    "**/{thumbnail,header}.jpg"
  ],
  "swDest": `public/sw/sw.js`,
  "clientsClaim": true,
  "skipWaiting": true,
  "maximumFileSizeToCacheInBytes": 5 * 1024 * 1024,
  "runtimeCaching": [
    {
      urlPattern: new RegExp('^https://cdn.ampproject.org'),
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'amp-components',
        cacheableResponse: {
          statuses: [0, 200]
        }
      }
    },
    {
      urlPattern: new RegExp('/(.+.html)?$'),
      handler: 'NetworkFirst',
      options: {
        cacheName: 'page',
        expiration: {
          maxAgeSeconds: 60 * 60 * 24
        }
      }
    },
    {
      urlPattern: new RegExp('\.(json|woff2?|ttf|eot|otf)'),
      handler: 'CacheFirst',
      options: {
        cacheName: 'assets',
        expiration: {
          maxAgeSeconds: 60 * 60 * 24 * 14
        }
      }
    },
    {
      urlPattern: new RegExp('\.(jpg|png)'),
      handler: 'CacheFirst',
      options: {
        cacheName: 'img',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 60 * 60 * 24 * 7
        }
      }
    },
    {
      urlPattern: new RegExp('^https://[a-z0-9]+\.cloudfront\.net'),
      handler: 'CacheFirst',
      options: {
        cacheName: 'cdn-contents',
        expiration: {
          maxAgeSeconds: 60 * 60 * 24 * 7
        }
      }
    }
  ]
}
