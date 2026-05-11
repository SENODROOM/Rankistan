import React, { useState, useEffect, useRef } from "react";

const WORKER_BASE = "https://rankistan-summary-api.academics-ali.workers.dev";

const STYLES = [
  { id: "flat", label: "Flat" },
  { id: "for-the-badge", label: "For The Badge" },
  { id: "flat-square", label: "Flat Square" },
  { id: "plastic", label: "Plastic" },
];

const WORKER_CODE = `// ─── Add inside the fetch handler, BEFORE the /api/dev-summary check ────────
if (url.pathname.startsWith('/api/badge/')) return handleBadgeRequest(request, env);

// ─── Handler ──────────────────────────────────────────────────────────────────
async function handleBadgeRequest(request, env) {
  const username = new URL(request.url).pathname.split('/').pop()?.toLowerCase();
  if (!username) return new Response('Not found', { status: 404 });

  const corsOrigin = resolveCorsOrigin(request, env);
  const headers = {
    ...buildCorsHeaders(corsOrigin),
    'Content-Type': 'application/json',
    'Cache-Control': 'public, max-age=300',
  };

  try {
    const res = await fetch('https://rankistan.dev/data.json', {
      cf: { cacheTtl: 300 },
    });
    const data = await res.json();
    const dev = (data.leaderboard || []).find(
      (d) => d.username?.toLowerCase() === username,
    );

    if (!dev) {
      return new Response(
        JSON.stringify({ schemaVersion: 1, label: 'Rankistan', message: 'not ranked', color: 'lightgrey' }),
        { headers },
      );
    }

    return new Response(
      JSON.stringify({
        schemaVersion: 1,
        label: 'Rankistan',
        message: 'rank #' + dev.rank,
        color: '1a7f4e',
        labelColor: '0f6e56',
        namedLogo: 'github',
        logoColor: 'white',
        cacheSeconds: 300,
      }),
      { headers },
    );
  } catch {
    return new Response(
      JSON.stringify({ schemaVersion: 1, label: 'Rankistan', message: 'error', color: 'red' }),
      { status: 502, headers },
    );
  }
}`;

function getBadgeUrl(username, style) {
  const u = (username || "yourusername").trim().toLowerCase();
  const endpoint = encodeURIComponent(`https://rankistan.dev/badges/${u}.json`);
  return (
    `https://img.shields.io/badge/dynamic/json` +
    `?url=${endpoint}` +
    `&query=%24.rank` +
    `&label=Rankistan` +
    `&prefix=%23` +
    `&color=1a7f4e` +
    `&labelColor=0f6e56` +
    `&style=${style}` +
    `&logo=github` +
    `&logoColor=white` +
    `&cacheSeconds=300`
  );
}

function getSnippet(username, style, fmt) {
  const img = getBadgeUrl(username, style);
  const link = "https://rankistan.dev";
  const alt = "Rankistan rank badge";
  if (fmt === "md") return `[![${alt}](${img})](${link})`;
  if (fmt === "html")
    return `<a href="${link}">\n  <img src="${img}" alt="${alt}">\n</a>`;
  if (fmt === "rst")
    return `.. image:: ${img}\n   :target: ${link}\n   :alt: ${alt}`;
  return "";
}

function CopyButton({ text, className = "" }) {
  const [copied, setCopied] = useState(false);
  const handle = () => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };
  return (
    <button
      type="button"
      onClick={handle}
      className={`font-mono text-[10px] uppercase tracking-widest border border-outline-variant px-3 py-1 transition-colors hover:border-primary hover:text-primary ${copied ? "text-tertiary border-tertiary" : "text-outline"} ${className}`}
    >
      {copied ? (
        <span className="flex items-center gap-1.5">
          <span className="material-symbols-outlined text-xs">check</span>
          Copied
        </span>
      ) : (
        <span className="flex items-center gap-1.5">
          <span className="material-symbols-outlined text-xs">
            content_copy
          </span>
          Copy
        </span>
      )}
    </button>
  );
}

function CodeBlock({ code, language = "" }) {
  return (
    <div className="relative group bg-surface-container-lowest border border-outline-variant overflow-x-auto">
      <div className="flex items-center justify-between px-4 py-2 border-b border-outline-variant bg-surface-container-low">
        <span className="font-mono text-[10px] text-outline uppercase tracking-widest">
          {language}
        </span>
        <CopyButton text={code} />
      </div>
      <pre className="p-4 font-mono text-xs text-on-surface-variant leading-relaxed whitespace-pre-wrap break-all">
        <code>{code}</code>
      </pre>
    </div>
  );
}

export default function BadgeGenerator() {
  const [username, setUsername] = useState("");
  const [style, setStyle] = useState("flat");
  const [fmt, setFmt] = useState("md");
  const [badgeLoaded, setBadgeLoaded] = useState(false);
  const [badgeError, setBadgeError] = useState(false);
  const inputRef = useRef(null);

  const displayUser = username.trim() || "yourusername";
  const badgeUrl = getBadgeUrl(displayUser, style);
  const snippet = getSnippet(displayUser, style, fmt);

  useEffect(() => {
    setBadgeLoaded(false);
    setBadgeError(false);
  }, [username, style]);

  return (
    <main className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 grid-lines pointer-events-none" />

      <div className="max-w-6xl mx-auto px-6 py-12 relative z-10">
        {/* ── Page Header ── */}
        <div className="mb-12 border-l-4 border-primary pl-6">
          <h1 className="font-headline text-5xl font-extrabold tracking-tighter uppercase text-on-surface mb-2">
            Badge <span className="text-primary">Generator</span>
          </h1>
          <p className="font-mono text-sm text-outline max-w-xl uppercase tracking-widest">
            Display your live Rankistan rank directly in your GitHub README.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 border border-outline-variant">
          {/* ── Left Panel: controls ── */}
          <div className="lg:col-span-5 p-8 bg-surface-container-lowest border-b lg:border-b-0 lg:border-r border-outline-variant flex flex-col gap-8">
            {/* Username input */}
            <div>
              <label className="font-mono text-xs text-tertiary uppercase tracking-tighter mb-4 block">
                GitHub Username
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="font-mono text-primary">@</span>
                </div>
                <input
                  ref={inputRef}
                  className="w-full bg-surface-container-low border-b-2 border-outline-variant focus:border-tertiary text-on-surface font-mono py-4 pl-10 pr-4 outline-none transition-all duration-75 placeholder:text-outline/30 uppercase tracking-widest"
                  placeholder="GITHUB_USERNAME"
                  type="text"
                  value={username}
                  onChange={(e) =>
                    setUsername(e.target.value.replace(/\s/g, ""))
                  }
                  autoComplete="off"
                  spellCheck={false}
                />
              </div>
            </div>

            {/* Style selector */}
            <div>
              <label className="font-mono text-xs text-tertiary uppercase tracking-tighter mb-4 block">
                Badge Style
              </label>
              <div className="grid grid-cols-2 gap-2">
                {STYLES.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setStyle(s.id)}
                    className={`py-3 px-4 font-mono text-[10px] uppercase tracking-widest border transition-colors text-left ${
                      style === s.id
                        ? "border-primary text-primary bg-primary/10"
                        : "border-outline-variant text-outline hover:border-outline hover:text-on-surface-variant"
                    }`}
                  >
                    {style === s.id && (
                      <span className="material-symbols-outlined text-xs mr-1 align-middle">
                        radio_button_checked
                      </span>
                    )}
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Format selector */}
            <div>
              <label className="font-mono text-xs text-tertiary uppercase tracking-tighter mb-4 block">
                Snippet Format
              </label>
              <div className="flex gap-2">
                {["md", "html", "rst"].map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFmt(f)}
                    className={`flex-1 py-2 font-mono text-[10px] uppercase tracking-widest border transition-colors ${
                      fmt === f
                        ? "border-secondary text-secondary bg-secondary/10"
                        : "border-outline-variant text-outline hover:border-outline hover:text-on-surface-variant"
                    }`}
                  >
                    {f === "md" ? "Markdown" : f === "html" ? "HTML" : "reST"}
                  </button>
                ))}
              </div>
            </div>

            {/* Info box */}
            <div className="border border-outline-variant/50 bg-surface p-4 space-y-2">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-1.5 h-1.5 bg-tertiary animate-pulse" />
                <span className="font-mono text-[10px] text-tertiary uppercase tracking-widest">
                  How It Works
                </span>
              </div>
              {[
                ["1", "Your README loads the badge URL from shields.io"],
                ["2", "Shields.io calls the Rankistan Worker endpoint"],
                ["3", "Worker reads your rank from data.json (cached 5 min)"],
                ["4", "Badge updates automatically every leaderboard cycle"],
              ].map(([n, text]) => (
                <div key={n} className="flex items-start gap-3">
                  <span className="font-mono text-[10px] text-on-primary bg-primary px-1.5 py-0.5 shrink-0">
                    {n}
                  </span>
                  <span className="font-body text-xs text-outline leading-relaxed">
                    {text}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Right Panel: preview + snippet ── */}
          <div className="lg:col-span-7 p-8 bg-surface flex flex-col gap-8">
            {/* Badge preview */}
            <div>
              <h3 className="font-mono text-[10px] text-outline uppercase tracking-widest mb-4">
                Live Preview
              </h3>
              <div className="border border-outline-variant bg-surface-container-lowest p-6 flex items-center justify-center min-h-[80px]">
                {!badgeError ? (
                  <img
                    key={badgeUrl}
                    src={badgeUrl}
                    alt="Rankistan rank badge preview"
                    className={`transition-opacity duration-300 ${badgeLoaded ? "opacity-100" : "opacity-0"}`}
                    onLoad={() => setBadgeLoaded(true)}
                    onError={() => setBadgeError(true)}
                    style={{
                      height: style === "for-the-badge" ? "28px" : "20px",
                    }}
                  />
                ) : (
                  <span className="font-mono text-xs text-outline">
                    Badge preview unavailable — shields.io may be slow to load
                  </span>
                )}
                {!badgeLoaded && !badgeError && (
                  <span className="font-mono text-[10px] text-outline uppercase tracking-widest animate-pulse absolute">
                    Loading...
                  </span>
                )}
              </div>

              {/* GitHub README mock */}
              <div className="mt-3 border border-outline-variant bg-[#0d1117] p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
                  <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
                  <div className="w-3 h-3 rounded-full bg-[#27c840]" />
                  <span className="font-mono text-[10px] text-[#484f58] ml-2">
                    README.md — github.com/{displayUser}
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-[#21262d] border border-[#30363d] flex items-center justify-center shrink-0">
                    <span className="font-mono text-[10px] text-[#8b949e]">
                      {displayUser.slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-mono text-sm text-[#e6edf3] mb-2">
                      {displayUser}
                    </p>
                    <img
                      src={badgeUrl}
                      alt="rank badge"
                      style={{
                        height: style === "for-the-badge" ? "28px" : "20px",
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Snippet */}
            <div>
              <h3 className="font-mono text-[10px] text-outline uppercase tracking-widest mb-4">
                Copy Snippet
              </h3>
              <CodeBlock
                code={snippet}
                language={fmt === "md" ? "markdown" : fmt}
              />
            </div>

            {/* Divider */}
            <div className="border-t border-outline-variant" />

            {/* Worker setup section */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <span className="material-symbols-outlined text-primary text-sm">
                  construction
                </span>
                <h2 className="font-headline text-base font-bold tracking-tighter uppercase">
                  One-Time Worker Setup
                </h2>
                <span className="font-mono text-[10px] text-outline uppercase tracking-widest">
                  // Required
                </span>
              </div>

              <p className="font-body text-xs text-outline leading-relaxed mb-6">
                The badge endpoint is a small addition to{" "}
                <code className="text-primary font-mono">
                  cloudflare/worker.js
                </code>
                . Add it once, deploy, and every ranked developer on Rankistan
                can use their badge immediately — no changes needed per user.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border border-outline-variant mb-6">
                {[
                  {
                    step: "01",
                    icon: "edit_note",
                    title: "Add handler",
                    desc: "Copy the code below into cloudflare/worker.js",
                  },
                  {
                    step: "02",
                    icon: "rocket_launch",
                    title: "Deploy",
                    desc: "Run wrangler deploy from the cloudflare/ folder",
                  },
                  {
                    step: "03",
                    icon: "shield",
                    title: "Use badge",
                    desc: "Paste your snippet into any README and you're live",
                  },
                ].map(({ step, icon, title, desc }, i) => (
                  <div
                    key={step}
                    className={`p-5 bg-surface-container-lowest hover:bg-surface-container-low transition-colors ${i < 2 ? "border-b md:border-b-0 md:border-r border-outline-variant" : ""}`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-mono text-[10px] text-on-primary bg-primary px-2 py-0.5">
                        {step}
                      </span>
                      <span className="material-symbols-outlined text-primary text-sm">
                        {icon}
                      </span>
                    </div>
                    <div className="font-headline text-sm font-bold uppercase tracking-tight mb-1">
                      {title}
                    </div>
                    <p className="font-body text-xs text-outline leading-relaxed">
                      {desc}
                    </p>
                  </div>
                ))}
              </div>

              <CodeBlock
                code={WORKER_CODE}
                language="worker.js — cloudflare/"
              />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
