biome = pnpm exec biome
typecheck = pnpm exec tsc --noEmit
ts-node = pnpm exec tsx

node_modules: package.json pnpm-*.yaml
	pnpm install
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
	pnpm exec rimraf dist

PHONY:
