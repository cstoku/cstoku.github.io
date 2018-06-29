module.exports = {
  "globDirectory": "public/",
  "globPatterns": [
    "**/*.{ttf,html}",
    "**/{thumbnail,header}.jpg"
  ],
  "swDest": "public/js/sw.js",
  "modifyUrlPrefix": {
    '/js': ''
  },
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
      urlPattern: /\.(woff|ttf|eot|otf)/,
      handler: 'cacheFirst',
      options: {
        cacheName: 'assets',
        expiration: {
            maxAgeSeconds: 60 * 60 * 24 * 14
        }
      }
    },
    {
      urlPattern: /.*\/(thumbnail|header)[^\/]*\.(jpg|png)/,
      handler: 'cacheFirst',
      options: {
        cacheName: 'img-thumbnail',
        expiration: {
            maxAgeSeconds: 60 * 60 * 24 * 7
        }
      }
    },
    {
      urlPattern: /\.(jpg|png)/,
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
