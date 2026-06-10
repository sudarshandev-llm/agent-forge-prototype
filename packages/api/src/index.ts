import { router } from "./trpc.js";
import { agentRouter } from "./routers/agents.js";
import { teamRouter } from "./routers/teams.js";
import { workflowRouter } from "./routers/workflows.js";
import { marketplaceRouter } from "./routers/marketplace.js";

export { createTRPCContext } from "./trpc.js";
export { type TRPCContext } from "./trpc.js";

export const appRouter = router({
  agent: agentRouter,
  team: teamRouter,
  workflow: workflowRouter,
  marketplace: marketplaceRouter,
});

export type AppRouter = typeof appRouter;

export { agentRouter } from "./routers/agents.js";
export { teamRouter } from "./routers/teams.js";
export { workflowRouter } from "./routers/workflows.js";
export { marketplaceRouter } from "./routers/marketplace.js";
