export default defineEventHandler((event) => {
  event.context["authorization"] = event.node.req.headers["authorization"];
  event.context["baseUrl"] = "https://" + event.node.req.headers["base-url"];
});
