module.exports = {
  plugins: ['node'],
  extends: ['eslint:recommended', 'plugin:prettier/recommended'],

  parserOptions: {
    ecmaVersion: 8,
    sourceOptions: 'module',
    ecmaFeatures: {
      impliedStrict: true
    }
  },

  env: {
    node: true,
    es6: true
  },

  rules: {
    /**
     * アノテーションコメントを指摘する
     * https://eslint.org/docs/2.0.0/rules/no-warning-comments
     */
    'no-warning-comments': [
      'warn',
      {
        terms: ['TODO', 'FIXME'],
        location: 'anywhere'
      }
    ],

    /* ###### node ###### */

    /**
     * エクスポートには module.exports を利用する
     * https://github.com/mysticatea/eslint-plugin-node/blob/master/docs/rules/exports-style.md
     */
    'node/exports-style': ['error', 'module.exports'],

    /**
     * Node.js の非推奨な API の利用を禁止する
     * https://github.com/mysticatea/eslint-plugin-node/blob/master/docs/rules/no-deprecated-api.md
     */
    'node/no-deprecated-api': ['error'],

    /**
     * 存在しないファイル/モジュールの require を禁止する
     * https://github.com/mysticatea/eslint-plugin-node/blob/master/docs/rules/no-missing-require.md
     */
    'node/no-missing-require': ['error']
  }
}
