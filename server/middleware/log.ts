export default defineEventHandler((event) => {
  const start = Date.now()
  event.node.res.on('finish', () => {
    const ms = Date.now() - start
    const status = event.node.res.statusCode
    console.info(`${event.method} ${event.path} ${status} ${ms}ms`)
  })
})
