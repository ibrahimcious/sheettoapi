import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server"
import { LoginUserSchema, RegisterUserSchema } from "./auth.schema";
import { auth } from "./auth.utils";
import { redirect } from "@tanstack/react-router";

export const registerServerFn = createServerFn()
  .inputValidator(RegisterUserSchema)
  .handler(async ({ data }) => {
    await auth.api.signUpEmail({
      body: {
        name: data.name,
        email: data.email,
        password: data.password
      }
    })
    throw redirect({
      to: "/"
    })
  })

export const loginServerFn = createServerFn()
  .inputValidator(LoginUserSchema)
  .handler(async ({ data }) => {
    await auth.api.signInEmail({
      body: {
        email: data.email,
        password: data.password
      }
    })
    throw redirect({
      to: "/dashboard"
    })
  })

export const loginWithGoogleServerFn = createServerFn().handler(async () => {
  const response = await auth.api.signInSocial({
    body: {
      provider: "google",
      callbackURL: "/dashboard"
    }
  })
  throw redirect({
    href: response.url
  })
})

export const logoutServerFn = createServerFn().handler(async () => {
  const headers = getRequestHeaders()
  await auth.api.signOut({ headers })
  throw redirect(({
    to: "/"
  }))
})
export const getSessionServerFn = createServerFn().handler(async () => {
  const headers = getRequestHeaders()
  const session = await auth.api.getSession({ headers })
  return session
})
