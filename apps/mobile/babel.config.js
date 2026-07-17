module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
    // babel-preset-expo only auto-adds this when it can resolve "expo-router"
    // from its own install location (monorepo root). Our expo-router lives under
    // apps/mobile, so we force the inline transform here.
    plugins: [
      require("babel-preset-expo/build/expo-router-plugin").expoRouterBabelPlugin,
    ],
  };
};
