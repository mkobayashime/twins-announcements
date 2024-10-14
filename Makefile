biome = bunx biome
typecheck = bunx tsc --noEmit
ts-node = bunx tsx

node_modules: PHONY
	bun install

run: node_modules PHONY
	bun run src/index.ts

lint: node_modules PHONY
	$(biome) check .

lint.fix: node_modules PHONY
	$(biome) check --fix .

typecheck: node_modules PHONY
	$(typecheck)

typecheck.watch: node_modules PHONY
	$(typecheck) --watch

clear: node_modules PHONY
	bunx rimraf dist

PHONY:
