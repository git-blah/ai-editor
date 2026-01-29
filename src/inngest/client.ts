import { Inngest } from "inngest";
import { sentryMiddleware } from "@inngest/middleware-sentry";
//create a client to send and recieve events
export const inngest = new Inngest({ id: "polaris", middleware: [sentryMiddleware()] });
