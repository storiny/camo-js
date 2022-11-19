module.exports = {
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "prettier",
  ],
  parser: "@typescript-eslint/parser",
  plugins: [
    "@typescript-eslint",
    "simple-import-sort",
    "typescript-sort-keys",
    "sort-keys-fix",
    "sort-class-members",
  ],
  rules: {
    "@typescript-eslint/ban-ts-comment": "off",
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/no-non-null-assertion": "off",
    "simple-import-sort/exports": "warn",
    "simple-import-sort/imports": "warn",
    "sort-class-members/sort-class-members": [
      2,
      {
        accessorPairPositioning: "getThenSet",
        order: [
          "[static-properties]",
          "[static-methods]",
          "[properties]",
          "[conventional-private-properties]",
          "constructor",
          "[methods]",
          "[conventional-private-methods]",
        ],
      },
    ],
    "sort-keys-fix/sort-keys-fix": "warn",
    "typescript-sort-keys/interface": "warn",
    "typescript-sort-keys/string-enum": "warn",
  },
};
