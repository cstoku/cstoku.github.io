module.exports = {
  "globDirectory": "public/",
  "globPatterns": [
    "**/*.{ttf,html,jpg,png}"
  ],
  "swDest": "public/sw.js",
  "maximumFileSizeToCacheInBytes": 5 * 1024 * 1024,
  "runtimeCaching": [{
    urlPattern: new RegExp('^https://cdn.ampproject.org'),
    handler: 'staleWhileRevalidate',
    options: {
      cacheableResponse: {
        statuses: [0, 200]
      }
    }
  }]
};
