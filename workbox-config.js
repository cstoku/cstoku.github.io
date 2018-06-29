module.exports = {
  "globDirectory": "public/",
  "globPatterns": [
    "**/*.{ttf,html}"
  ],
  "swDest": "public/js/sw.js",
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
