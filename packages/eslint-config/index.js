module.exports = {
	extends: [
		"next/core-web-vitals",
		"prettier"
	],
	plugins: [],
	parserOptions: {
		ecmaVersion: 2020,
		sourceType: "module",
		ecmaFeatures: {
			jsx: true
		}
	},
	env: {
		browser: true,
		es2020: true,
		node: true
	},
	rules: {
		"prefer-const": "error",
		"no-var": "error"
	},
	overrides: [
		{
			files: ["**/*.test.ts", "**/*.test.tsx", "**/*.spec.ts", "**/*.spec.tsx"],
			env: {
				jest: true
			}
		}
	]
};
