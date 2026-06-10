import { createYoga } from "graphql-yoga";
import { buildSchema } from "graphql";
import { typeDefs } from "./schema";
import { resolvers } from "./resolvers";

const schema = buildSchema(typeDefs);

function resolveField(obj: any, fieldName: string) {
  if (obj && typeof obj === "object" && fieldName in obj) {
    return obj[fieldName];
  }
  if (obj && typeof obj.__serialize === "function") {
    return obj.__serialize();
  }
  return null;
}

const yoga = createYoga({
  schema,
  rootValue: resolvers.Query,
  context: async ({ request }) => {
    const authHeader = request.headers.get("authorization");
    let user = null;

    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.slice(7);
      try {
        const { verifyToken } = await import("../lib/auth");
        user = verifyToken(token);
      } catch {}
    }

    return { user, pubsub: null };
  },
  graphqlEndpoint: "/api/graphql",
  graphiql: {
    title: "FlowCraft GraphQL",
  },
  maskedErrors: false,
});

export default yoga;
