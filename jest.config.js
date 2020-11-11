module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testPathIgnorePatterns: ["/node_modules/", "__tests__/parsing/AST_helpers.ts"]
};