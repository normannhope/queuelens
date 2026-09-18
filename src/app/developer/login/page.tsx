import Link from "next/link";
import { Nav } from "@/components/Nav";
import { AuthForm } from "@/components/AuthForm";
import { Reveal } from "@/components/Reveal";

export default function BusinessLogin() {
  return (
    <main>
      <Nav />
      <section className="container-page pb-20">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_380px]">
          <Reveal>
            <p className="mb-3 font-mono text-xs uppercase tracking-[0.2em] text-cyan">For businesses</p>
            <h1 className="mb-2 font-display text-3xl font-semibold sm:text-4xl">Welcome back</h1>
            <p className="mb-6 max-w-md text-ink/70 dark:text-paper/70">
              Sign in to manage your hubs, check the latest analyses, or change your plan.
            </p>
            <AuthForm kind="business" mode="login" redirectTo="/developer" />
            <p className="mt-4 text-sm text-ink/60 dark:text-paper/60">
              New here? <Link href="/developer/signup" className="text-cyan underline">Create a business account</Link>
            </p>
          </Reveal>

          <Reveal delay={0.1} className="card h-fit">
            <h2 className="font-display text-lg font-medium">From your dashboard you can</h2>
            <ul className="mt-3 space-y-2 text-sm text-ink/70 dark:text-paper/70">
              <li>Add or edit a hub's webcam feed</li>
              <li>See every past analysis for each hub</li>
              <li>Flip a hub public to join the directory</li>
              <li>Grab the embed snippet for your own site</li>
              <li>Change or cancel your plan anytime</li>
            </ul>
          </Reveal>
        </div>
      </section>
    </main>
  );
}
