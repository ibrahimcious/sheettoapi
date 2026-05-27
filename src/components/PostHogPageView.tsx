import { useEffect } from 'react'
import { useRouterState } from '@tanstack/react-router'
import posthog from 'posthog-js'

const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY as string | undefined
const POSTHOG_HOST = (import.meta.env.VITE_POSTHOG_HOST as string | undefined) ?? 'https://us.i.posthog.com'

let initialized = false

export function PostHogPageView() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })

  useEffect(() => {
    if (!POSTHOG_KEY) return
    if (!initialized) {
      posthog.init(POSTHOG_KEY, {
        api_host: POSTHOG_HOST,
        capture_pageview: false,
        capture_pageleave: true,
      })
      initialized = true
    }
    posthog.capture('$pageview')
  }, [pathname])

  return null
}
