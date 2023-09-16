eslint = yarn run eslint --ignore-path .gitignore
prettier = yarn run prettier --ignore-path .gitignore
typecheck = yarn run tsc --noEmit
ts-node = node --loader ts-node/esm

node_modules: package.json yarn.lock
ifeq ($(MAKE_YARN_FROZEN_LOCKFILE), 1)
	yarn install --frozen-lockfile
else
	yarn install
endif
	@touch node_modules

.PHONY: run
run: node_modules
	$(ts-node) src/index.ts

.PHONY: lint
lint: node_modules
	$(eslint) .

.PHONY: lint.fix
lint.fix: node_modules
	$(eslint) --fix .

.PHONY: format
format: node_modules
	$(prettier) --write .

.PHONY: format.check
format.check: node_modules
	$(prettier) --check .

.PHONY: typecheck
typecheck: node_modules
	$(typecheck)

.PHONY: typecheck.watch
typecheck.watch: node_modules
	$(typecheck) --watch

.PHONY: clear
clear: node_modules
	yarn rimraf dist
