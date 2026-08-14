import Link from "next/link";
import { WalletButton } from "./WalletButton";

const LINKS = [
  { href: "/vote", label: "Vote" },
  { href: "/results", label: "Results" },
  { href: "/results/transparency", label: "How anonymity works" },
  { href: "/organize", label: "Organize" },
];

export function Nav() {
  return (
    <header className="border-b border-black/10 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-sm font-semibold tracking-tight">
          AnonVote
        </Link>
        <nav className="hidden gap-6 text-sm text-ink/70 sm:flex">
          {LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-ink">
              {link.label}
            </Link>
          ))}
        </nav>
        <WalletButton />
      </div>
    </header>
  );
}
