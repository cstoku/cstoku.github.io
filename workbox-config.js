module.exports = {
  "globDirectory": "public/",
  "globPatterns": [
    "**/*.{html}",
    "**/{thumbnail,header}.jpg"
  ],
  "swDest": "static/sw.js",
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
      urlPattern: '/',
      handler: 'networkFirst',
      options: {
        cacheName: 'page',
        expiration: {
          maxAgeSeconds: 60 * 60 * 24
        }
      }
    },
      {
          urlPattern: new RegExp('\.(json|woff|woff2|ttf|eot|otf)'),
          handler: 'cacheFirst',
          options: {
              cacheName: 'assets',
              expiration: {
                  maxAgeSeconds: 60 * 60 * 24 * 14
              }
          }
      },
      {
          urlPattern: new RegExp('favicon.png'),
          handler: 'cacheFirst',
          options: {
              cacheName: 'assets2',
              expiration: {
                  maxAgeSeconds: 60 * 60 * 24 * 14
              }
          }
      },
    {
      urlPattern: new RegExp('.*\/(thumbnail|header)[^\/]*\.(jpg|png)'),
      handler: 'cacheFirst',
      options: {
        cacheName: 'img-thumbnail',
        expiration: {
            maxAgeSeconds: 60 * 60 * 24 * 7
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
