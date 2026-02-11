import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1Z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23Z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84Z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53Z"
        fill="#EA4335"
      />
    </svg>
  );
}

export default function SignInPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center p-6">
      <div className="flex w-full max-w-sm flex-col items-center gap-8">
        {/* Logo */}
        <Link href="/" className="overflow-hidden rounded-2xl">
          <Image
            src="/echo-logo.png"
            alt="Echo"
            width={2816}
            height={1536}
            className="w-48 object-cover"
            priority
          />
        </Link>

        {/* Heading */}
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold tracking-tight">
            Sign in to Echo
          </h1>
          <p className="text-muted-foreground text-sm">
            Continue with your Google account to get started.
          </p>
        </div>

        {/* Google SSO button */}
        <Button
          variant="outline"
          size="lg"
          className="w-full gap-3 py-5 text-sm font-medium"
        >
          <GoogleIcon className="h-5 w-5" />
          Continue with Google
        </Button>

        {/* Divider */}
        <div className="flex w-full items-center gap-4">
          <div className="bg-border h-px flex-1" />
          <span className="text-muted-foreground text-xs">or</span>
          <div className="bg-border h-px flex-1" />
        </div>

        {/* Guest option */}
        <Button variant="ghost" size="lg" className="w-full" asChild>
          <Link href="/">Continue as guest</Link>
        </Button>

        {/* Footer text */}
        <p className="text-muted-foreground max-w-xs text-center text-xs leading-relaxed">
          By signing in, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
