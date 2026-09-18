import Link from "next/link";
import { Wordmark } from "./Logo";

export function Nav() {
  return (
    <header className="container-page flex items-center justify-between py-6">
      <Link href="/">
        <Wordmark className="text-lg" />
      </Link>
      <nav className="flex items-center gap-2 text-sm">
        <Link href="/directory" className="btn-ghost">
          Find a queue
        </Link>
        <Link href="/developer" className="btn-primary">
          For businesses
        </Link>
      </nav>
    </header>
  );
}
