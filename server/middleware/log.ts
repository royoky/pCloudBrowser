export default defineEventHandler((event) => {
  console.info(`New request: ${event.method} ${event.path}`)
})
