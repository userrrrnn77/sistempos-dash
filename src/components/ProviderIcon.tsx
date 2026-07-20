// src/components/ProviderIcon.tsx
// Icon brand OAuth (GitHub/GitLab/Bitbucket/Google) — lucide-react tidak
// menyediakan logo brand, jadi kita render SVG-nya sendiri di sini.
import type { ReactElement } from "react";
import type { OAuthProvider } from "../services/supabaseClient";

interface ProviderIconProps {
  provider: OAuthProvider;
  size?: number;
  className?: string;
}

function GithubIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true">
      <path d="M12 0C5.37 0 0 5.5 0 12.3c0 5.43 3.44 10.03 8.2 11.66.6.11.82-.27.82-.6 0-.29-.01-1.06-.02-2.08-3.34.75-4.04-1.66-4.04-1.66-.55-1.42-1.33-1.81-1.33-1.81-1.09-.77.08-.75.08-.75 1.2.09 1.84 1.26 1.84 1.26 1.07 1.87 2.8 1.33 3.48 1.02.11-.79.42-1.33.76-1.64-2.67-.31-5.47-1.37-5.47-6.1 0-1.35.47-2.45 1.24-3.31-.12-.31-.54-1.57.12-3.27 0 0 1.01-.33 3.3 1.27a11.2 11.2 0 0 1 6 0c2.29-1.6 3.3-1.27 3.3-1.27.66 1.7.24 2.96.12 3.27.77.86 1.24 1.96 1.24 3.31 0 4.74-2.81 5.79-5.49 6.09.43.38.81 1.13.81 2.28 0 1.65-.02 2.98-.02 3.38 0 .33.22.72.83.6C20.57 22.32 24 17.72 24 12.3 24 5.5 18.63 0 12 0Z" />
    </svg>
  );
}

function GitlabIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true">
      <path d="M12 21.94 8.6 11.51H15.4L12 21.94Z" opacity="0.7" />
      <path d="M12 21.94 15.4 11.51H21.4L18.87 19.24 12 21.94Z" />
      <path d="M12 21.94 8.6 11.51H2.6L5.13 19.24 12 21.94Z" />
      <path d="M21.4 11.51 20.06 7.37h-3.5L15.4 11.51H21.4Z" opacity="0.85" />
      <path d="M2.6 11.51 3.94 7.37h3.5L8.6 11.51H2.6Z" opacity="0.85" />
      <path d="m20.06 7.37-.94-2.88a.46.46 0 0 0-.87 0l-1.35 4.14L20.06 7.37Z" />
      <path d="m3.94 7.37.94-2.88a.46.46 0 0 1 .87 0l1.35 4.14L3.94 7.37Z" />
    </svg>
  );
}

function BitbucketIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true">
      <path d="M1.85 3a.73.73 0 0 0-.72.84l3.26 19.78a.94.94 0 0 0 .92.78h13.38a.7.7 0 0 0 .7-.59L22.87 3.85a.73.73 0 0 0-.72-.85H1.85Zm12.94 14.2H9.21L7.87 9.8h8.24l-1.32 7.4Z" />
    </svg>
  );
}

function GoogleIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.52 12.27c0-.85-.08-1.66-.22-2.45H12v4.63h6.47a5.53 5.53 0 0 1-2.4 3.63v3h3.88c2.27-2.09 3.57-5.17 3.57-8.81Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.07 7.95-2.92l-3.88-3c-1.08.72-2.46 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.26v3.1A11.99 11.99 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.27a7.2 7.2 0 0 1 0-4.54v-3.1H1.26a12 12 0 0 0 0 10.74l4.01-3.1Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.77c1.76 0 3.34.6 4.59 1.79l3.44-3.44C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.69 1.26 6.63l4.01 3.1C6.22 6.88 8.87 4.77 12 4.77Z"
      />
    </svg>
  );
}

const ICONS: Record<OAuthProvider, (props: { size?: number }) => ReactElement> =
  {
    github: GithubIcon,
    gitlab: GitlabIcon,
    bitbucket: BitbucketIcon,
    google: GoogleIcon,
  };

export function ProviderIcon({
  provider,
  size = 16,
  className,
}: ProviderIconProps) {
  const Icon = ICONS[provider];
  return (
    <span className={className}>
      <Icon size={size} />
    </span>
  );
}
