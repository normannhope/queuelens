import Link from "next/link";
import { Nav } from "@/components/Nav";
import { AuthForm } from "@/components/AuthForm";

export default function CustomerSignup() {
  return (
    <main>
      <Nav />
      <section className="container-page pb-20">
        <h1 className="mb-2 font-display text-3xl font-semibold">Create your free account</h1>
        <p className="mb-6 text-ink/70 dark:text-paper/70">Pin the places you check often and get alerted when the line drops.</p>
        <AuthForm kind="customer" mode="signup" redirectTo="/account" />
        <p className="mt-4 text-sm text-ink/60 dark:text-paper/60">
          Already have an account? <Link href="/account/login" className="text-cyan underline">Sign in</Link>
        </p>
      </section>
    </main>
  );
}
