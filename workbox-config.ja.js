module.exports = {
  "globDirectory": "public/ja",
  "globPatterns": [
    "**/*.{ttf,html}",
    "**/{thumbnail,header}.jpg"
  ],
  "swDest": process.env.NODE_ENV === "production" ? "public/ja/sw.js" : "static/ja/sw.js",
  "clientsClaim": true,
  "skipWaiting": true,
  "maximumFileSizeToCacheInBytes": 5 * 1024 * 1024,
  "runtimeCaching": [
    {
      urlPattern: new RegExp('^https://cdn.ampproject.org'),
      handler: 'staleWhileRevalidate',
      options: {
        cacheName: 'amp-components',
        cacheableResponse: {
          statuses: [0, 200]
        }
      }
    },
    {
      urlPattern: new RegExp('/(.+.html)?$'),
      handler: 'networkFirst',
      options: {
        cacheName: 'page',
        expiration: {
          maxAgeSeconds: 60 * 60 * 24
        }
      }
    },
    {
      urlPattern: new RegExp('\.(json|woff2?|ttf|eot|otf)'),
      handler: 'cacheFirst',
      options: {
          cacheName: 'assets',
          expiration: {
              maxAgeSeconds: 60 * 60 * 24 * 14
          }
      }
    },
    {
      urlPattern: new RegExp('\.(jpg|png)'),
      handler: 'cacheFirst',
      options: {
        cacheName: 'img',
        expiration: {
            maxEntries: 100,
            maxAgeSeconds: 60 * 60 * 24 * 7
        }
      }
    }
  ]
};
