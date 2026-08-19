import { Logo } from '@/components/layout/Logo';

export function Footer() {
  return (
    <footer className="border-t border-base-border/60">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-10 sm:flex-row">
        <Logo />
        <p className="text-sm text-ink-faint">
          © {new Date().getFullYear()} Obliq-io. Built for CA firms.
        </p>
      </div>
    </footer>
  );
}
