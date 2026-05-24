import { createMiddleware } from "@tanstack/react-start";
import { prisma } from "../lib/prisma";

export const dbMiddleware = createMiddleware({ type: "function" }).server(
  ({ next }) => {
    return next({
      context: {
        db: prisma
      }
    })
  }
)
