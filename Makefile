ts-node = node --loader ts-node/esm --experimental-specifier-resolution=node

install:
	yarn

run: install
	$(ts-node) src/index.ts

lint: install
	yarn eslint .

lint.fix: install
	yarn eslint --fix .

format: install
	yarn prettier --write .

format.check: install
	yarn prettier --check .

typecheck: install
	yarn tsc --noEmit

typecheck.watch: install
	yarn tsc --noEmit --watch

clear: install
	yarn rimraf dist
