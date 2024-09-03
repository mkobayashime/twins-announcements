biome = yarn run biome
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
	$(biome) check .

lint.fix: node_modules PHONY
	$(biome) check --fix .

typecheck: node_modules PHONY
	$(typecheck)

typecheck.watch: node_modules PHONY
	$(typecheck) --watch

clear: node_modules PHONY
	yarn rimraf dist

PHONY:
