import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      // 禁止在代码中使用中文字符
      'no-chinese': 'error',
      // 或者使用自定义规则检测中文字符
      'no-restricted-syntax': [
        'error',
        {
          selector: 'Literal[value=/[\u4e00-\u9fff]/]',
          message: 'Chinese characters are not allowed in code'
        },
        {
          selector: 'TemplateLiteral[quasis.0.value.raw=/[\u4e00-\u9fff]/]',
          message: 'Chinese characters are not allowed in template literals'
        }
      ],
      // Custom rule to detect Chinese characters
      'no-chinese': {
        create(context) {
          return {
            Literal(node) {
              if (typeof node.value === 'string' && /[\u4e00-\u9fff]/.test(node.value)) {
                context.report({
                  node,
                  message: 'Chinese characters are not allowed in code. Use English instead.'
                });
              }
            },
            Identifier(node) {
              if (/[\u4e00-\u9fff]/.test(node.name)) {
                context.report({
                  node,
                  message: 'Chinese characters are not allowed in identifiers. Use English instead.'
                });
              }
            }
          };
        }
      }
    }
  }
); 