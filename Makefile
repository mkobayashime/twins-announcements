eslint = yarn run eslint --ignore-path .gitignore
prettier = yarn run prettier --ignore-path .gitignore
typecheck = yarn run tsc --noEmit
ts-node = yarn run tsx

node_modules: package.json yarn.lock
ifeq ($(MAKE_YARN_FROZEN_LOCKFILE), 1)
	yarn install --frozen-lockfile
else
	yarn install
endif
	@touch node_modules

run: node_modules PHONY
	$(ts-node) src/index.ts

lint: node_modules PHONY
	$(eslint) .

lint.fix: node_modules PHONY
	$(eslint) --fix .

format: node_modules PHONY
	$(prettier) --write .

format.check: node_modules PHONY
	$(prettier) --check .

typecheck: node_modules PHONY
	$(typecheck)

typecheck.watch: node_modules PHONY
	$(typecheck) --watch

clear: node_modules PHONY
	yarn rimraf dist

PHONY:
