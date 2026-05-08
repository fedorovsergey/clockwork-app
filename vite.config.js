import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import svgLoader from 'vite-svg-loader'
import devTools from 'vite-plugin-vue-devtools'
import URI from 'urijs'

/** Browser stays same-origin; dev server forwards to VITE_STANDALONE_REMOTE_* (avoids CORS). Keep in sync with standalone.js path. */
const STANDALONE_DEV_PROXY_PREFIX = '/__clockwork-remote'

function buildDirectRemoteBaseUrl(env) {
  const host = (env.VITE_STANDALONE_REMOTE_HOST || 'http://localhost:8000').replace(/\/+$/, '')
  const pathOpt = env.VITE_STANDALONE_REMOTE_PATH || '/__clockwork/'
  const url = new URI(host)
  const [pathname, query] = pathOpt.split('?')
  url.pathname(pathname || '')
  url.query(query || '')
  return url.toString()
}

/**
 * @param {string} pathWithQuery path from dev server, e.g. /__clockwork-remote/latest?only=id
 */
function rewriteStandaloneProxy(pathWithQuery, env) {
  const [pathPart, clientQuery = ''] = pathWithQuery.split('?', 2)
  if (!pathPart.startsWith(STANDALONE_DEV_PROXY_PREFIX)) return pathWithQuery

  let tail = pathPart.slice(STANDALONE_DEV_PROXY_PREFIX.length)
  if (!tail) tail = '/'
  const clockworkUri = tail.startsWith('/') ? tail.slice(1) : tail

  const base = buildDirectRemoteBaseUrl(env)
  const mergedStr = `${base}${clockworkUri}`

  let pathnameSearch
  try {
    const u = new URL(mergedStr)
    pathnameSearch = u.pathname + u.search
  } catch {
    return pathWithQuery
  }

  if (clientQuery) {
    pathnameSearch += (pathnameSearch.includes('?') ? '&' : '?') + clientQuery
  }
  return pathnameSearch
}

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const useProxy = command === 'serve' && mode === 'development'

  const server = useProxy
    ? {
        proxy: {
          [STANDALONE_DEV_PROXY_PREFIX]: {
            target: (env.VITE_STANDALONE_REMOTE_HOST || 'http://localhost:8000').replace(/\/+$/, ''),
            changeOrigin: true,
            // Dev upstream often uses corporate/self-signed TLS; Node would reject without this.
            secure: env.VITE_STANDALONE_PROXY_TLS_VERIFY === '1',
            rewrite: path => rewriteStandaloneProxy(path, env)
          }
        }
      }
    : undefined

  return {
    base: '',
    build: {
      outDir: 'build',
      sourcemap: mode == 'development' ? 'inline' : false
    },
    plugins: [vue(), svgLoader(), devTools()],
    ...(server ? { server } : {}),
    resolve: {
      extensions: ['.mjs', '.js', '.vue']
    },
    experimental: {
      renderBuiltUrl: filename => filename
    },
    css: {
      preprocessorOptions: {
        scss: {
          api: 'modern-compiler'
        }
      }
    }
  }
})
