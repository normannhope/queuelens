import Link from "next/link";
import { Nav } from "@/components/Nav";
import { AuthForm } from "@/components/AuthForm";

export default function BusinessLogin() {
  return (
    <main>
      <Nav />
      <section className="container-page pb-20">
        <h1 className="mb-6 font-display text-3xl font-semibold">Business sign in</h1>
        <AuthForm kind="business" mode="login" redirectTo="/developer" />
        <p className="mt-4 text-sm text-ink/60 dark:text-paper/60">
          New here? <Link href="/developer/signup" className="text-cyan underline">Create a business account</Link>
        </p>
      </section>
    </main>
  );
}
