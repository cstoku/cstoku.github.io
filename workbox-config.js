module.exports = {
  "globDirectory": "public/",
  "globPatterns": [
    "**/*.{ttf,html,jpg,png}"
  ],
  "swDest": "public/sw.js",
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
