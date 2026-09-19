import Link from "next/link";
import { Nav } from "@/components/Nav";
import { Reveal } from "@/components/Reveal";

// Plain, public info page — no account needed, since the point is to unblock
// someone *before* they've decided whether to sign up. Linked from the
// new-hub form and the business landing page.
export default function SetupGuidePage() {
  return (
    <main>
      <Nav />
      <section className="container-page max-w-2xl pb-20 pt-10">
        <Reveal>
          <p className="mb-3 font-mono text-xs uppercase tracking-[0.2em] text-cyan">Setup guide</p>
          <h1 className="font-display text-3xl font-semibold sm:text-4xl">Getting a webcam URL working</h1>
          <p className="mt-4 text-ink/70 dark:text-paper/70">
            Queue Lens needs one thing from your camera: a URL that returns a fresh JPG or PNG image every time
            it's requested — not a page you'd open in a browser to watch a live video. Most public webcams
            already expose one, it's just a matter of finding it.
          </p>
        </Reveal>

        <Reveal delay={0.06} className="mt-10">
          <h2 className="font-display text-xl font-medium">If you already have a webcam</h2>
          <ol className="mt-4 space-y-3 text-sm text-ink/70 dark:text-paper/70">
            <li>
              <strong className="text-ink dark:text-paper">1. Check for a snapshot endpoint.</strong> Many IP
              cameras and webcam platforms expose a direct image URL alongside the viewer page — look for a link
              ending in something like <code>/snapshot.jpg</code>, <code>/image.jpg</code>, or{" "}
              <code>/cam.cgi?action=snapshot</code>. If you manage the camera yourself, its admin panel almost
              always lists this under "API" or "integration" settings.
            </li>
            <li>
              <strong className="text-ink dark:text-paper">2. Paste it into the "Add a hub" form.</strong> As
              soon as you paste a URL there, we try to load it right in the browser and show you a preview — if
              it works, you'll see the actual image; if not, you'll know immediately instead of finding out
              later.
            </li>
            <li>
              <strong className="text-ink dark:text-paper">3. If it doesn't load,</strong> the URL is probably
              pointing at a viewer page (HTML) rather than an image file. Try opening it directly in a new browser
              tab — if you see a whole webpage instead of just a photo, that's the problem.
            </li>
          </ol>
        </Reveal>

        <Reveal delay={0.1} className="mt-10">
          <h2 className="font-display text-xl font-medium">Don't have a webcam yet?</h2>
          <p className="mt-3 text-sm text-ink/70 dark:text-paper/70">
            You don't need anything fancy — any cheap IP camera marketed for home or shop security that exposes a
            snapshot/JPEG API will work, and there are free apps that turn an old spare phone into exactly this
            kind of camera. The only real requirement is that it can post or serve a single fresh image on
            request; it doesn't need to be high resolution, since the image gets shrunk before analysis anyway.
          </p>
        </Reveal>

        <Reveal delay={0.14} className="mt-10">
          <div className="card">
            <h2 className="font-display text-lg font-medium">Want help setting it up?</h2>
            <p className="mt-2 text-sm text-ink/70 dark:text-paper/70">
              If you'd rather not figure out the camera side yourself, email us and we'll help you pick a camera
              and get the URL working — free, whether or not you end up on a paid plan.
            </p>
            <a href="mailto:hello@quelens.com?subject=Setup%20help" className="btn-primary mt-4 inline-block">
              Email hello@quelens.com
            </a>
          </div>
        </Reveal>

        <Reveal delay={0.18} className="mt-10">
          <Link href="/developer/hubs/new" className="text-cyan underline">
            Back to adding a hub
          </Link>
        </Reveal>
      </section>
    </main>
  );
}
