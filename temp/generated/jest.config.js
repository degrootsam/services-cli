module.exports = {
  transformIgnorePatterns: ["node_modules/(?!(chalk)/)"],
  transform: {
    "^.+\\.(js|jsx|ts|tsx|mjs)$": "babel-jest",
  },
  // ...the rest of your config
};
