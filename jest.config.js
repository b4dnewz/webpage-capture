module.exports = {
  "roots": [
    "<rootDir>/__tests__"
  ],
  "transform": {
    "^.+\\.tsx?$": "ts-jest"
  },
  "testPathIgnorePatterns": [
    "node_modules",
    "__tests__/fixtures",
  ]
}
