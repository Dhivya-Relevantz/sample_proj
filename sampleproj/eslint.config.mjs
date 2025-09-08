import path from 'path';
import powerbiVisualsConfigs from "eslint-plugin-powerbi-visuals";

export default [
  {
    ...powerbiVisualsConfigs.configs.recommended,
    parserOptions: {
      ...powerbiVisualsConfigs.configs.recommended.parserOptions,
      tsconfigRootDir: path.resolve(__dirname),
      project: './tsconfig.json'
    }
  },
  {
    ignores: ["node_modules/**", "dist/**", ".vscode/**", ".tmp/**"]
  }
];
