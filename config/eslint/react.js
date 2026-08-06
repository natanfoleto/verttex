/** @type {import('eslint').Linter.Config} */
module.exports = {
  extends: ["@rocketseat/eslint-config/react", "plugin:@next/next/recommended"],
  plugins: ["simple-import-sort"],
  rules: {
    "simple-import-sort/imports": "error",
    "simple-import-sort/exports": "error",
    camelcase: [
      "error",
      {
        allow: [""],
        properties: "never",
      },
    ],
    "@typescript-eslint/no-explicit-any": "error",
    "@next/next/no-img-element": "warn",
    "react/forbid-elements": [
      "warn",
      {
        forbid: [
          {
            element: "button",
            message:
              "Preferencial uso do componente <Button> do Shadcn UI (@/components/ui/button). Consulte .ai/frontend/FRONTEND_UI.md#1013.",
          },
          {
            element: "input",
            message:
              "Preferencial uso do componente <Input> do Shadcn UI (@/components/ui/input). Consulte .ai/frontend/FRONTEND_UI.md#1013.",
          },
          {
            element: "select",
            message:
              "Preferencial uso do componente <NativeSelect> ou <Select> do Shadcn UI (@/components/ui/native-select). Consulte .ai/frontend/FRONTEND_UI.md#1013.",
          },
          {
            element: "textarea",
            message:
              "Preferencial uso do componente <Textarea> do Shadcn UI (@/components/ui/textarea). Consulte .ai/frontend/FRONTEND_UI.md#1013.",
          },
          {
            element: "dialog",
            message:
              "Preferencial uso dos componentes <Dialog> ou <AlertDialog> do Shadcn UI. Consulte .ai/frontend/FRONTEND_UI.md#1013.",
          },
        ],
      },
    ],
  },
  overrides: [
    {
      files: ["**/components/ui/**/*", "**/ui/**/*"],
      rules: {
        "react/forbid-elements": "off",
      },
    },
  ],
};
