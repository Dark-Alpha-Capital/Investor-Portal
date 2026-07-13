import {
  createClient as baseCreateClient,
  type ClientConfig,
  type Route,
} from "@prismicio/client";
import sm from "./slicemachine.config.json";

/**
 * The project's Prismic repository name.
 */
export const repositoryName =
  import.meta.env.VITE_PUBLIC_PRISMIC_ENVIRONMENT || sm.repositoryName;

/**
 * A list of Route Resolver objects that define how a document's `url` field is resolved.
 *
 * {@link https://prismic.io/docs/route-resolver#route-resolver}
 */
const routes: Route[] = [
  { type: "homepage", path: "/" },
  { type: "page", path: "/:uid" },
];

/**
 * Creates a Prismic client for the project's repository. The client is used to
 * query content from the Prismic API.
 *
 * @param config - Configuration for the Prismic client.
 */
export const createClient = (config: ClientConfig = {}) => {
  const { fetchOptions, ...rest } = config;

  return baseCreateClient(repositoryName, {
    routes,
    ...rest,
    fetchOptions: {
      // Workers only support no-store / no-cache; force-cache can share Response
      // streams across requests and throws "Cannot perform I/O on behalf of a
      // different request".
      cache: "no-store",
      // @prismicio/client dedupes in-flight fetches by URL+signal in module
      // scope. A unique signal per client keeps Responses request-scoped.
      signal: AbortSignal.timeout(30_000),
      ...fetchOptions,
    },
  });
};
