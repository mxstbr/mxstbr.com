"use client"

import type { PropsWithChildren } from 'react'
import Link from 'next/link'
import { AppsSDKUIProvider } from '@openai/apps-sdk-ui/components/AppsSDKUIProvider'

export function ChatGPTAppsSDKUIProvider({ children }: PropsWithChildren) {
  return <AppsSDKUIProvider linkComponent={Link}>{children}</AppsSDKUIProvider>
}
