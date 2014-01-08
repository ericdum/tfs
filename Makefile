TESTS = test/*.test.js
REPORTER = spec
TIMEOUT = 10000
MOCHA_OPTS =

install:
	@npm install --registry=http://registry.cnpmjs.org --cache=${HOME}/.npm/.cache/cnpm

test: install
	@NODE_ENV=test ./node_modules/mocha/bin/mocha \
		--reporter $(REPORTER) \
		--timeout $(TIMEOUT) \
		$(MOCHA_OPTS) \
		$(TESTS)

test-cov: install
	@$(MAKE) test MOCHA_OPTS='--require blanket' REPORTER=html-cov | ./node_modules/alicov/bin/alicov

toast:
	@curl http://toast.corp.taobao.com/task/run/id/3396/token/a0419afa208b1bb8cb10eddae620bfae
	@open  http://toast.corp.taobao.com/task/3396

test-all: test test-cov

contributors: install
	@./node_modules/contributors/bin/contributors -f plain -o AUTHORS

.PHONY: test
