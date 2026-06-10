export interface GraphQLQuery {
  key: string;
  document: string;
  variables?: Record<string, unknown>;
}
export function defineQuery(key: string, document: string) {
  return (variables?: Record<string, unknown>): GraphQLQuery => ({
    key,
    document,
    variables,
  });
}
