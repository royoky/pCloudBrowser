import antfu from '@antfu/eslint-config'
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt(
  antfu({
    vue: {
      overrides: {
        'vue/component-name-in-template-casing': ['error', 'PascalCase'],
      },
    },
    typescript: true,
    rules: {
      'style/max-len': ['warn', 100],
      'style/quotes': ['error', 'single', { avoidEscape: true }],
      'no-console': ['error', { allow: ['info', 'warn', 'error'] }],
      'vue/component-name-in-template-casing': [
        'error',
        'PascalCase',
        { registeredComponentsOnly: false },
      ],
    },
    ignores: ['**/*.md'],
  }),
)
