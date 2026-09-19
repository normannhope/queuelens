import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { Nav } from "@/components/Nav";
import { QueueBadge } from "@/components/QueueBadge";
import { PinButton } from "@/components/PinButton";
import { Reveal } from "@/components/Reveal";
import { SUBJECTS } from "@/lib/subjects";

export const revalidate = 30;

export default async function HubPage({ params }: { params: { slug: string } }) {
  const hub = await db.hub.findUnique({
    where: { slug: params.slug },
    include: { business: { select: { plan: true } } },
  });
  if (!hub || !hub.isPublic) notFound();

  const history = await db.analysis.findMany({
    where: { hubId: hub.id },
    orderBy: { createdAt: "desc" },
    take: 12,
  });

  return (
    <main>
      <Nav />
      <section className="container-page max-w-2xl pb-20">
        <Reveal>
          {hub.category && (
            <p className="font-mono text-xs uppercase tracking-wide text-ink/50 dark:text-paper/50">{hub.category}</p>
          )}
          <h1 className="mt-1 font-display text-4xl font-semibold">{hub.name}</h1>
          {hub.address && <p className="mt-1 text-ink/60 dark:text-paper/60">{hub.address}</p>}

          <div className="mt-6 flex items-center gap-3">
            <QueueBadge level={hub.latestLevel} waitMin={hub.showWaitMinutes ? hub.latestWaitMin : null} />
            <PinButton hubId={hub.id} />
          </div>
          {hub.showPeopleCount && hub.latestCount != null && (
            <p className="mt-2 text-sm text-ink/60 dark:text-paper/60">
              ~{hub.latestCount} {SUBJECTS[hub.subjectType].unit || "waiting"}
            </p>
          )}
          {hub.latestSummary && <p className="mt-3 text-ink/70 dark:text-paper/70">{hub.latestSummary}</p>}
          <p className="mt-1 text-xs text-ink/40 dark:text-paper/40">
            {hub.lastAnalyzedAt ? `Last checked ${hub.lastAnalyzedAt.toLocaleTimeString()}` : "Not yet analyzed"}
          </p>
          {hub.business.plan === "FREE" && (
            <a
              href="/"
              className="mt-4 inline-block font-mono text-xs uppercase tracking-wide text-ink/40 underline hover:text-ink/60 dark:text-paper/40 dark:hover:text-paper/60"
            >
              Powered by Queue Lens
            </a>
          )}
        </Reveal>

        {history.length > 0 && (
          <Reveal delay={0.1} className="mt-10">
            <h2 className="font-display text-lg font-medium">Recent history</h2>
            <ul className="mt-3 divide-y divide-ink/10 dark:divide-paper/10">
              {history.map((a) => (
                <li key={a.id} className="flex items-center justify-between py-2.5 text-sm">
                  <span className="text-ink/50 dark:text-paper/50">{a.createdAt.toLocaleTimeString()}</span>
                  <QueueBadge level={a.level} waitMin={hub.showWaitMinutes ? a.waitMin : null} />
                </li>
              ))}
            </ul>
          </Reveal>
        )}
      </section>
    </main>
  );
}
