export default defineEventHandler((event) => {
  const start = Date.now()
  event.node.res.on('finish', () => {
    const ms = Date.now() - start
    const status = event.node.res.statusCode
    // Pathname only: `event.path` includes the query string, which carries
    // file paths (`?path=…`) that must never be logged.
    console.info(`${event.method} ${getRequestURL(event).pathname} ${status} ${ms}ms`)
  })
})
