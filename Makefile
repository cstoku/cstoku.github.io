all: webpack static/ja/sw.js static/en/sw.js
	hugo

webpack: node_modules
	yarn run webpack

static/ja/sw.js: workbox-config.ja.js node_modules
	yarn run workbox generateSW workbox-config.ja.js

static/en/sw.js: workbox-config.en.js node_modules
	yarn run workbox generateSW workbox-config.en.js

node_modules: package.json yarn.lock
	yarn
	touch node_modules
