ts-node = node --loader ts-node/esm --experimental-specifier-resolution=node

node_modules: package.json yarn.lock
ifeq ($(MAKE_YARN_FROZEN_LOCKFILE), 1)
	yarn install --frozen-lockfile
else
	yarn install
endif
	@touch node_modules

run: node_modules
	$(ts-node) src/index.ts

lint: node_modules
	yarn eslint .

lint.fix: node_modules
	yarn eslint --fix .

format: node_modules
	yarn prettier --write .

format.check: node_modules
	yarn prettier --check .

typecheck: node_modules
	yarn tsc --noEmit

typecheck.watch: node_modules
	yarn tsc --noEmit --watch

clear: node_modules
	yarn rimraf dist
