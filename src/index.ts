import type { redirect, RequestEvent, Handle } from "@sveltejs/kit";

export type Route = {
  pathname: string,
  redirect?: string,
  meta?: {
    [key: string]: unknown
  },
  children?: Route[]
};

type RouteGuardOptions = {
  redirect: typeof redirect,
  next?: Handle,
  routes?: Route[],
  beforeEach?: (
    to: Route,
    event: RequestEvent,
    next: (path?: string) => void
  ) => void | Promise<void>
};

const matchRoute = (routes: Route[], pathname: string): Route | null => {
  const matchingRoutes = routes.filter((route) => {
    // Replace all dynamic segments with a regex that matches any string.
    const matchDynamicRoutes = route.pathname.replace(/\[[^\]]*]/g, "(.+)");

    // Test the pathname against the regex, return whether or not it matches.
    return new RegExp(matchDynamicRoutes).test(pathname);
  });

  // Return the most specific route.
  return matchingRoutes.sort((a, b) => b.pathname.length - a.pathname.length)[0] || null;
};

export const createRouteGuard = ({
  redirect,
  routes = [],
  beforeEach = (_to, _event, next) => next(),
  next = ({ event, resolve }) => resolve(event),
}: RouteGuardOptions): Handle => {
  return (input) => {
    return new Promise((resolve) => {
      // Find the first route rule that matches the current pathname.
      const route = matchRoute(routes, input.event.url.pathname);

      // If no matching route rule is found, simply call the next handle
      // and send the user to the requested page.
      if (!route) return resolve(next(input));

      // If a matching route has children, check if any of them match the
      // current pathname. If so, merge the meta objects of the parent and
      // child and recursively call the function until the most specific
      // route is found.
      if (route.children) {
        const children = route.children.map((child) => {
          // Ensure that the child pathname has the correct format.
          if (!child.pathname.startsWith("/") && !route.pathname.endsWith("/")) {
            child.pathname = "/" + child.pathname;
          }

          // Add the parent pathname to the child pathname if applicable.
          if (!child.pathname.startsWith(route.pathname)) {
            child.pathname = route.pathname + child.pathname;
          }

          return child;
        });

        const childRoute = matchRoute(children, input.event.url.pathname);
        if (childRoute) {
          // Merge the parent and child meta objects.
          childRoute.meta = { ...route.meta, ...childRoute.meta };

          // Recursively call the function with the child route.
          return resolve(createRouteGuard({
            redirect,
            routes: [childRoute],
            beforeEach,
            next,
          })(input));
        }
      }

      // If the route has a redirect property, redirect the user to the
      // specified path.
      if (route.redirect) throw redirect(303, route.redirect);

      beforeEach(route, input.event, (path) => {
        if (path) throw redirect(303, path);
        else return resolve(next(input));
      })
    })
  }
}
