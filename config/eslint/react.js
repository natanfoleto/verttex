/** @type {import('eslint').Linter.Config} */
module.exports = {
  extends: ['@rocketseat/eslint-config/react'],
  plugins: ['simple-import-sort'],
  rules: {
    'simple-import-sort/imports': 'error',
    'simple-import-sort/exports': 'error',
    camelcase: [
      'error',
      {
        allow: [''],
        properties: 'never',
      },
    ],
    'react/forbid-elements': [
      'error',
      {
        forbid: [
          {
            element: 'button',
            message:
              'Proibido o uso de <button> nativo em telas de funcionalidade. Use o componente <Button> do Shadcn UI (@/components/ui/button). Consulte .ai/frontend/FRONTEND_UI.md#1013.',
          },
          {
            element: 'input',
            message:
              'Proibido o uso de <input> nativo em telas de funcionalidade. Use o componente <Input> do Shadcn UI (@/components/ui/input). Consulte .ai/frontend/FRONTEND_UI.md#1013.',
          },
          {
            element: 'select',
            message:
              'Proibido o uso de <select> nativo em telas de funcionalidade. Use o componente <NativeSelect> ou <Select> do Shadcn UI (@/components/ui/native-select). Consulte .ai/frontend/FRONTEND_UI.md#1013.',
          },
          {
            element: 'textarea',
            message:
              'Proibido o uso de <textarea> nativo em telas de funcionalidade. Use o componente <Textarea> do Shadcn UI (@/components/ui/textarea). Consulte .ai/frontend/FRONTEND_UI.md#1013.',
          },
          {
            element: 'dialog',
            message:
              'Proibido o uso de <dialog> nativo. Use os componentes <Dialog> ou <AlertDialog> do Shadcn UI. Consulte .ai/frontend/FRONTEND_UI.md#1013.',
          },
        ],
      },
    ],
  },
  overrides: [
    {
      files: ['**/components/ui/**/*', '**/ui/**/*'],
      rules: {
        'react/forbid-elements': 'off',
      },
    },
  ],
}
