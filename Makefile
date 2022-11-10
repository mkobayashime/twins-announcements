eslint = yarn run eslint --ignore-path .gitignore
prettier = yarn run prettier --ignore-path .gitignore
typecheck = yarn run tsc --noEmit
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
	$(eslint) .

lint.fix: node_modules
	$(eslint) --fix .

format: node_modules
	$(prettier) --write .

format.check: node_modules
	$(prettier) --check .

typecheck: node_modules
	$(typecheck)

typecheck.watch: node_modules
	$(typecheck) --watch

clear: node_modules
	yarn rimraf dist
