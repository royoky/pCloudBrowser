export default defineEventHandler((event) => {
  console.info(`New request: ${event.path}`)
})
