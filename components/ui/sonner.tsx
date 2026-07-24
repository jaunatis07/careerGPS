"use client";

import { Toaster as Sonner } from "sonner";

/**
 * 全局 Toast 容器（基于 sonner）。
 */
export function AppToaster() {
  return (
    <Sonner
      position="top-center"
      richColors
      closeButton
      toastOptions={{
        duration: 4000,
      }}
    />
  );
}
