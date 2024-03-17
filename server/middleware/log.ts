export default defineEventHandler((event) => {
  // eslint-disable-next-line no-console
  console.info(`New request: ${event.path}`)
})
