import antfu from '@antfu/eslint-config'

export default antfu({
  vue: {
    overrides: {
      'style/max-len': ['warn', 100],
      'style/quotes': ['error', 'single', { avoidEscape: true }],
      'vue/component-name-in-template-casing': ['error', 'PascalCase', { registeredComponentsOnly: false }],
    },
  },
})
