install:
	yarn

run: install
	yarn ts-node src/index.ts

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
