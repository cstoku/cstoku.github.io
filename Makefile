ENV = production

SW := public/sw
CSS := layouts/partials/head/amp/css

ifeq ($(ENV),development)
	MODE := development
else
	MODE := production
endif
export NODE_ENV := $(MODE)

all: $(SW)

.PHONY: hugo
hugo: public

.PHONY: webpack
webpack: $(CSS)

.PHONY: clean
clean:
	rm -rf public resources/_gen $(CSS)

.PHONY: cleanall
cleanall: clean
	rm -rf node_modules

$(SW): public workbox-config.js
	@yarn run workbox generateSW workbox-config.js
	@touch $@

public: $(CSS)
	@hugo -e $(ENV)
	@touch $@

$(CSS): node_modules
	@yarn run webpack --mode=$(MODE)
	@touch $@

node_modules: package.json
	@yarn
	@touch $@
