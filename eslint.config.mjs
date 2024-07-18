import antfu from '@antfu/eslint-config'
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt(
  antfu({
    rules: {
      'style/max-len': ['warn', 100],
      'style/quotes': ['error', 'single', { avoidEscape: true }],
      'vue/component-definition-name-casing': ['error', 'PascalCase'],
    },
  }),
)
