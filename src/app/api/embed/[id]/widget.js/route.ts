import { NextRequest, NextResponse } from "next/server";

// Drop-in embed: <script src="https://quelens.com/api/embed/HUB_SLUG/widget.js" async></script>
// Renders a small live badge wherever that <script> tag sits on the page.
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const site = process.env.NEXT_PUBLIC_SITE_URL || "https://quelens.com";
  const js = `
(function () {
  var slug = ${JSON.stringify(params.id)};
  var scriptEl = document.currentScript;
  var el = document.createElement("div");
  el.style.cssText = "display:inline-flex;align-items:center;gap:8px;font:14px system-ui,sans-serif;padding:6px 12px;border-radius:999px;background:#F1EDE3;color:#0E1716;";
  el.textContent = "Loading queue status…";
  scriptEl.parentNode.insertBefore(el, scriptEl.nextSibling);

  var colors = { EMPTY: "#5FCFC4", SHORT: "#8FBF6B", MEDIUM: "#F2A93B", LONG: "#E2604F", UNKNOWN: "#999" };
  var labels = { EMPTY: "No line", SHORT: "Short line", MEDIUM: "Moderate line", LONG: "Long line", UNKNOWN: "Status unknown" };

  fetch(${JSON.stringify(site)} + "/api/embed/" + slug)
    .then(function (r) { return r.json(); })
    .then(function (d) {
      if (d.error) { el.textContent = "Queue Lens: unavailable"; return; }
      var dot = "<span style='width:8px;height:8px;border-radius:50%;background:" + (colors[d.level] || "#999") + ";display:inline-block'></span>";
      el.innerHTML = dot + " " + (labels[d.level] || d.level) +
        (d.waitMin != null ? " · ~" + d.waitMin + " min wait" : "");
    })
    .catch(function () { el.textContent = "Queue Lens: unavailable"; });
})();
`.trim();

  return new NextResponse(js, {
    headers: { "Content-Type": "application/javascript", "Cache-Control": "s-maxage=60" },
  });
}
