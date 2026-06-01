module.exports = {
  babel: {
    plugins: [],
    loaderOptions: (babelLoaderOptions) => {
      if (process.env.NODE_ENV === 'production') {
        // Remove react-refresh dos plugins do Babel para evitar erro em build de produção
        if (babelLoaderOptions.plugins) {
          babelLoaderOptions.plugins = babelLoaderOptions.plugins.filter(
            (plugin) => {
              // plugin pode ser string, array, ou objeto com várias formas
              const raw = Array.isArray(plugin) ? plugin[0] : plugin;
              const name = typeof raw === 'string' ? raw
                         : typeof raw === 'function' ? (raw.name || '')
                         : (raw && raw.key) ? raw.key
                         : '';
              const str = String(name);
              if (str.includes('react-refresh')) return false;
              if (str.includes('ReactRefreshBabel')) return false;
              return true;
            }
          );
        }
      }
      return babelLoaderOptions;
    },
  },
  webpack: {
    configure: (webpackConfig) => {
      // Remove ReactRefreshPlugin em produção
      if (process.env.NODE_ENV === 'production') {
        webpackConfig.plugins = (webpackConfig.plugins || []).filter(
          p => p.constructor?.name !== 'ReactRefreshPlugin'
        );
      }
      webpackConfig.plugins = (webpackConfig.plugins || []).filter(p => p.constructor?.name !== "ESLintWebpackPlugin");
      webpackConfig.resolve = webpackConfig.resolve || {};
      webpackConfig.resolve.plugins = (webpackConfig.resolve.plugins || []).filter(p => p.constructor?.name !== "ModuleScopePlugin");
      webpackConfig.resolve.fallback = {
        ...(webpackConfig.resolve.fallback || {}),
        crypto: require.resolve("crypto-browserify"),
        stream: require.resolve("stream-browserify"),
        buffer: require.resolve("buffer/"),
        util: require.resolve("util/"),
        assert: require.resolve("assert/"),
        http: require.resolve("stream-http"),
        https: require.resolve("https-browserify"),
        os: require.resolve("os-browserify/browser"),
        url: require.resolve("url/"),
        path: require.resolve("path-browserify")
      };
      webpackConfig.module = webpackConfig.module || {};
      webpackConfig.module.rules = webpackConfig.module.rules || [];
      webpackConfig.module.rules.push({ test: /\.m?js$/, resolve: { fullySpecified: false }});

      // Limita paralelismo do Terser para não estourar memória em VPS pequenas
      if (process.env.NODE_ENV === 'production' && webpackConfig.optimization) {
        webpackConfig.optimization.minimizer = (webpackConfig.optimization.minimizer || []).map(plugin => {
          if (plugin.constructor?.name === 'TerserPlugin') {
            plugin.options = plugin.options || {};
            plugin.options.parallel = 1;
          }
          return plugin;
        });
      }

      // Oculta warnings de source map faltante vindos de dependências específicas.
      webpackConfig.ignoreWarnings = [
        ...(webpackConfig.ignoreWarnings || []),
        /Failed to parse source map/i
      ];

      // Remove html2pdf.js do alcance do source-map-loader para evitar warnings.
      webpackConfig.module.rules
        .filter(rule => rule && rule.enforce === "pre" && Array.isArray(rule.use))
        .forEach(rule => {
          if (rule.use.some(loader => typeof loader === "string" ? loader.includes("source-map-loader") : loader?.loader?.includes("source-map-loader"))) {
            const existingExclude = rule.exclude;
            const html2pdfPattern = /html2pdf\.js/;
            if (Array.isArray(existingExclude)) {
              if (!existingExclude.some(pattern => pattern?.toString() === html2pdfPattern.toString())) {
                rule.exclude = [...existingExclude, html2pdfPattern];
              }
            } else if (existingExclude) {
              rule.exclude = [existingExclude, html2pdfPattern];
            } else {
              rule.exclude = [html2pdfPattern];
            }
          }
        });
      return webpackConfig;
    }
  },
  devServer: {
    client: {
      webSocketURL: 'auto://0.0.0.0:0/ws',
      overlay: {
        errors: true,
        warnings: false,
      },
    },
    allowedHosts: 'all',
  },
  typescript: { enableTypeChecking: false }
};
