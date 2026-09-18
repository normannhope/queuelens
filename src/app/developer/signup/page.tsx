import Link from "next/link";
import { Nav } from "@/components/Nav";
import { AuthForm } from "@/components/AuthForm";

export default function BusinessSignup() {
  return (
    <main>
      <Nav />
      <section className="container-page pb-20">
        <h1 className="mb-2 font-display text-3xl font-semibold">Add your business</h1>
        <p className="mb-6 text-ink/70 dark:text-paper/70">You'll pick a plan and add your first hub right after.</p>
        <AuthForm kind="business" mode="signup" redirectTo="/developer/billing" />
        <p className="mt-4 text-sm text-ink/60 dark:text-paper/60">
          Already have an account? <Link href="/developer/login" className="text-cyan underline">Sign in</Link>
        </p>
      </section>
    </main>
  );
}
