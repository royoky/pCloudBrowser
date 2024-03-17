import antfu from '@antfu/eslint-config'

export default antfu({
  vue: {
    overrides: {
      'vue/component-name-in-template-casing': ['error', 'PascalCase', { registeredComponentsOnly: false }],
    },
  },
})
