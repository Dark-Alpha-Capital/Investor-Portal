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
  return baseCreateClient(repositoryName, {
    routes,
    fetchOptions:
      process.env.NODE_ENV === "production"
        ? { cache: "force-cache" as RequestCache }
        : { cache: "no-store" as RequestCache },
    ...config,
  });
};
