"use client";

import * as React from "react";
import { SignIn } from "@clerk/nextjs";
import { useSearchParams } from "next/navigation";

import { cn } from "@saasfly/ui";

type Dictionary = Record<string, string>;

interface UserAuthFormProps extends React.HTMLAttributes<HTMLDivElement> {
  lang: string;
  dict: Dictionary;
  disabled?: boolean;
}

export function UserAuthForm({
  className,
  lang,
  dict,
  disabled,
  ...props
}: UserAuthFormProps) {
  const searchParams = useSearchParams();
  const redirectUrl = searchParams?.get("from") ?? `/${lang}/dashboard`;

  return (
    <div className={cn("flex justify-center", className)} {...props}>
      <SignIn
        path="/sign-in"
        routing="path"
        signUpUrl="/sign-up"
        redirectUrl={redirectUrl}
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "shadow-none border-0 bg-transparent",
          }
        }}
      />
    </div>
  );
}
