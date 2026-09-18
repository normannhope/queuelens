import Link from "next/link";
import { db } from "@/lib/db";
import { Nav } from "@/components/Nav";
import { QueueBadge } from "@/components/QueueBadge";
import { PinButton } from "@/components/PinButton";
import { Reveal } from "@/components/Reveal";

export const revalidate = 30; // directory can be briefly stale — analysis itself is on a slower cadence

export default async function DirectoryPage() {
  const hubs = await db.hub.findMany({
    where: { isPublic: true },
    orderBy: [{ latestLevel: "asc" }, { name: "asc" }],
  });

  return (
    <main>
      <Nav />
      <section className="container-page pb-20">
        <Reveal>
          <h1 className="font-display text-4xl font-semibold">Live queues</h1>
          <p className="mt-2 text-ink/70 dark:text-paper/70">
            {hubs.length} {hubs.length === 1 ? "place" : "places"} sharing their status right now.
          </p>
        </Reveal>

        {hubs.length === 0 ? (
          <p className="mt-10 text-ink/60 dark:text-paper/60">
            No businesses are public yet. Once one flips a hub public from their dashboard, it shows up here.
          </p>
        ) : (
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {hubs.map((hub, i) => (
              <Reveal key={hub.id} delay={Math.min(i * 0.04, 0.3)} className="card flex flex-col gap-3">
                <div>
                  {hub.category && (
                    <p className="font-mono text-xs uppercase tracking-wide text-ink/50 dark:text-paper/50">{hub.category}</p>
                  )}
                  <Link href={`/hub/${hub.slug}`} className="font-display text-lg font-medium hover:underline">
                    {hub.name}
                  </Link>
                  {hub.address && <p className="text-sm text-ink/50 dark:text-paper/50">{hub.address}</p>}
                </div>
                <QueueBadge level={hub.latestLevel} waitMin={hub.latestWaitMin} />
                <div className="mt-1 flex items-center justify-between">
                  <span className="text-xs text-ink/40 dark:text-paper/40">
                    {hub.lastAnalyzedAt ? `Updated ${timeAgo(hub.lastAnalyzedAt)}` : "Not yet analyzed"}
                  </span>
                  <PinButton hubId={hub.id} />
                </div>
              </Reveal>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function timeAgo(date: Date) {
  const s = Math.floor((Date.now() - date.getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return `${Math.floor(s / 3600)}h ago`;
}
