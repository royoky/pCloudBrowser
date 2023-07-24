export default defineEventHandler((event) => {
  const cookies = parseCookies(event);

  if (!(event.node.req.url?.includes("oauth") || cookies.token))
    throw createError({
      statusCode: 403,
      statusMessage: "User Not Authorized",
    });

  event.context["authorization"] = cookies.token;
  event.context["baseUrl"] = "https://" + cookies.hostname;
});
