import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000, // 1 min cache for instant sub-millisecond page switching
        gcTime: 10 * 60_000, // 10 min garbage collection retention
        refetchOnWindowFocus: false, // Prevent unnecessary refetches on tab switch
      },
    },
  });

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreload: "intent", // Preload route code & data on hover/intent for instant transitions!
    defaultPreloadStaleTime: 30_000,
  });

  return router;
};
