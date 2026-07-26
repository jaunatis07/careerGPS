"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

export function ProfileSignOutButton() {
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function handleSignOut() {
    setIsSigningOut(true);

    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/login");
      router.refresh();
    } finally {
      setIsSigningOut(false);
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      className="w-full"
      disabled={isSigningOut}
      onClick={handleSignOut}
    >
      <LogOut className="size-4" />
      {isSigningOut ? "退出中..." : "退出登录"}
    </Button>
  );
}
