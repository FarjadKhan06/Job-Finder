"use client";

import { useState, useEffect, useCallback } from "react";
import JobCard from "@/components/JobCard";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const LIMIT = 12;

type Job = {
  id: number; title: string; company: string | null; location: string | null;
  remote: boolean | null; link: string | null; tags: string | null;
  salary_min: string | null; salary_max: string | null; source: string | null; posted_at: string | null;
};
type ApiResponse = { total: number; page: number; limit: number; results: Job[] };
type User = { name: string; email: string };

const CATEGORIES = [
  // Page 1
  { label: "Engineering",   emoji: "⚙️",  query: "software engineer",          color: "#3b82f6", bg: "#eff6ff" },
  { label: "Design",        emoji: "🎨",  query: "UX designer",                color: "#ec4899", bg: "#fdf2f8" },
  { label: "Data",          emoji: "📊",  query: "data analyst",               color: "#8b5cf6", bg: "#f5f3ff" },
  { label: "Marketing",     emoji: "📣",  query: "marketing manager",          color: "#f97316", bg: "#fff7ed" },
  { label: "Finance",       emoji: "💼",  query: "financial analyst",          color: "#10b981", bg: "#ecfdf5" },
  { label: "Remote",        emoji: "🌍",  query: "remote developer",           color: "#06b6d4", bg: "#ecfeff" },
  { label: "DevOps",        emoji: "☁️",  query: "devops engineer",            color: "#0ea5e9", bg: "#f0f9ff" },
  { label: "Product",       emoji: "📱",  query: "product manager",            color: "#6366f1", bg: "#eef2ff" },
  { label: "Sales",         emoji: "🤝",  query: "sales manager",              color: "#f59e0b", bg: "#fffbeb" },
  { label: "Healthcare",    emoji: "🏥",  query: "healthcare nurse",           color: "#ef4444", bg: "#fef2f2" },
  { label: "Security",      emoji: "🔒",  query: "cyber security analyst",     color: "#64748b", bg: "#f8fafc" },
  { label: "HR",            emoji: "👥",  query: "human resources manager",    color: "#14b8a6", bg: "#f0fdfa" },
  // Page 2
  { label: "Writing",       emoji: "✍️",  query: "content writer",             color: "#f43f5e", bg: "#fff1f2" },
  { label: "Legal",         emoji: "⚖️",  query: "legal counsel",              color: "#78716c", bg: "#fafaf9" },
  { label: "Education",     emoji: "📚",  query: "teacher educator",           color: "#22c55e", bg: "#f0fdf4" },
  { label: "Support",       emoji: "🎧",  query: "customer support specialist",color: "#60a5fa", bg: "#eff6ff" },
  { label: "Operations",    emoji: "🔧",  query: "operations manager",         color: "#ea580c", bg: "#fff7ed" },
  { label: "Research",      emoji: "🔬",  query: "research scientist",         color: "#a855f7", bg: "#faf5ff" },
  { label: "Accounting",    emoji: "🧾",  query: "accountant",                 color: "#059669", bg: "#ecfdf5" },
  { label: "Architecture",  emoji: "🏗️",  query: "architect",                  color: "#d97706", bg: "#fffbeb" },
  { label: "Logistics",     emoji: "📦",  query: "logistics coordinator",      color: "#eab308", bg: "#fefce8" },
  { label: "Media",         emoji: "🎬",  query: "media producer",             color: "#f87171", bg: "#fff1f2" },
  { label: "Gaming",        emoji: "🎮",  query: "game developer",             color: "#7c3aed", bg: "#f5f3ff" },
  { label: "AI / ML",       emoji: "🤖",  query: "machine learning engineer",  color: "#0891b2", bg: "#ecfeff" },
];

const CATS_PER_PAGE = 12;

export default function Home() {
  const [query, setQuery]           = useState("");
  const [inputVal, setInputVal]     = useState("");
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [jobs, setJobs]             = useState<Job[]>([]);
  const [total, setTotal]           = useState(0);
  const [page, setPage]             = useState(1);
  const [loading, setLoading]       = useState(false);
  const [searched, setSearched]     = useState(false);
  const [catPage, setCatPage]       = useState(0);

  // Auth
  const [user, setUser]           = useState<User | null>(null);
  const [authModal, setAuthModal] = useState<"login" | "signup" | null>(null);
  const [authName, setAuthName]   = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authPass, setAuthPass]   = useState("");
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    const s = localStorage.getItem("jf_user");
    if (s) setUser(JSON.parse(s));
  }, []);

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!authName || !authEmail || !authPass) { setAuthError("All fields required."); return; }
    if (authPass.length < 6) { setAuthError("Password must be at least 6 characters."); return; }
    const u: User = { name: authName, email: authEmail };
    localStorage.setItem("jf_user", JSON.stringify(u));
    setUser(u); setAuthModal(null); setAuthError("");
  };
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!authEmail || !authPass) { setAuthError("All fields required."); return; }
    const s = localStorage.getItem("jf_user");
    if (s) { const u: User = JSON.parse(s); if (u.email === authEmail) { setUser(u); setAuthModal(null); setAuthError(""); return; } }
    setAuthError("No account found. Please sign up.");
  };
  const handleLogout = () => { localStorage.removeItem("jf_user"); setUser(null); };
  const openAuth = (mode: "login" | "signup") => { setAuthModal(mode); setAuthError(""); setAuthName(""); setAuthEmail(""); setAuthPass(""); };

  const fetchJobs = useCallback(async (q: string, remote: boolean, pg: number) => {
    if (!q) return;
    setLoading(true);
    const params = new URLSearchParams();
    params.set("query", q); params.set("country", "gb");
    if (remote) params.set("remote", "true");
    params.set("page", String(pg)); params.set("limit", String(LIMIT));
    try {
      const res = await fetch(`${API_BASE}/live-search?${params}`);
      const data: ApiResponse = await res.json();
      setJobs(data.results); setTotal(data.total);
    } catch { setJobs([]); setTotal(0); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { if (searched && query) fetchJobs(query, remoteOnly, page); }, [query, remoteOnly, page, fetchJobs, searched]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim()) return;
    setPage(1); setQuery(inputVal); setSearched(true);
    setTimeout(() => document.getElementById("results")?.scrollIntoView({ behavior: "smooth" }), 100);
  };
  const handleCategory = (q: string) => {
    setInputVal(q); setQuery(q); setPage(1); setSearched(true);
    setTimeout(() => document.getElementById("results")?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  const totalPages = Math.ceil(total / LIMIT);
  const catTotalPages = Math.ceil(CATEGORIES.length / CATS_PER_PAGE);
  const visibleCats = CATEGORIES.slice(catPage * CATS_PER_PAGE, (catPage + 1) * CATS_PER_PAGE);

  return (
    <div className="min-h-screen" style={{ background: "#f1f5f9" }}>

      {/* ── Auth Modal ─────────────────────────────────────── */}
      {authModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8 relative">
            <button onClick={() => setAuthModal(null)} className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 text-sm">✕</button>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5 text-2xl" style={{ background: "linear-gradient(135deg,#6d28d9,#a855f7)" }}>
              {authModal === "login" ? "🔑" : "✨"}
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-1">{authModal === "login" ? "Welcome back" : "Create account"}</h2>
            <p className="text-slate-400 text-sm mb-6">{authModal === "login" ? "Sign in to continue" : "Join Job Finder today"}</p>
            <form onSubmit={authModal === "login" ? handleLogin : handleSignup} className="space-y-3">
              {authModal === "signup" && (
                <input value={authName} onChange={e => setAuthName(e.target.value)} placeholder="Full name" type="text"
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 bg-slate-50" />
              )}
              <input value={authEmail} onChange={e => setAuthEmail(e.target.value)} placeholder="Email address" type="email"
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 bg-slate-50" />
              <input value={authPass} onChange={e => setAuthPass(e.target.value)} placeholder="Password" type="password"
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 bg-slate-50" />
              {authError && <p className="text-red-500 text-xs bg-red-50 px-3 py-2 rounded-lg">{authError}</p>}
              <button type="submit" className="w-full py-3 rounded-xl text-white font-semibold text-sm hover:opacity-90 transition-opacity"
                style={{ background: "linear-gradient(135deg,#6d28d9,#a855f7)" }}>
                {authModal === "login" ? "Sign In" : "Create Account"}
              </button>
            </form>
            <p className="text-center text-sm text-slate-400 mt-5">
              {authModal === "login" ? "Don't have an account? " : "Already have an account? "}
              <button onClick={() => openAuth(authModal === "login" ? "signup" : "login")} className="text-violet-600 font-semibold hover:underline">
                {authModal === "login" ? "Sign up" : "Sign in"}
              </button>
            </p>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          SECTION 1 — HERO  (deep navy)
      ══════════════════════════════════════════════════════ */}
      <div style={{ background: "linear-gradient(160deg, #0a0e1f 0%, #111827 60%, #1a0533 100%)" }}>

        {/* Navbar */}
        <nav className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
          <span className="text-xl font-extrabold tracking-tight text-white">
            Job<span style={{ color: "#a78bfa" }}>Finder</span>
          </span>
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <span className="hidden sm:flex items-center gap-2 text-sm text-slate-300">
                  <span className="w-7 h-7 rounded-full bg-violet-600 flex items-center justify-center text-white text-xs font-bold">
                    {user.name[0].toUpperCase()}
                  </span>
                  {user.name.split(" ")[0]}
                </span>
                <button onClick={handleLogout} className="text-sm border border-white/20 text-white/70 hover:text-white hover:border-white/50 px-4 py-1.5 rounded-lg transition-colors">
                  Logout
                </button>
              </>
            ) : (
              <>
                <button onClick={() => openAuth("login")} className="text-sm text-white/70 hover:text-white font-medium transition-colors">Log in</button>
                <button onClick={() => openAuth("signup")} className="text-sm text-white font-semibold px-5 py-2 rounded-xl hover:opacity-90 transition-opacity"
                  style={{ background: "linear-gradient(135deg,#7c3aed,#a855f7)" }}>
                  Sign up
                </button>
              </>
            )}
          </div>
        </nav>

        {/* Hero content */}
        <div className="max-w-6xl mx-auto px-6 pt-12 pb-24 flex flex-col lg:flex-row items-center gap-12">
          <div className="flex-1">
            <div className="inline-flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-full mb-8" style={{ background: "rgba(167,139,250,0.15)", color: "#c4b5fd" }}>
              ⚡ Live search — results fetched in real time
            </div>
            <h1 className="text-5xl sm:text-6xl font-extrabold text-white leading-[1.1] mb-5">
              Find the perfect<br />
              <span style={{ background: "linear-gradient(90deg,#a78bfa,#60a5fa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                job for you
              </span>
            </h1>
            <p className="text-slate-400 text-lg mb-10 max-w-lg">
              Search any role live across Arbeitnow, Adzuna and more — thousands of real openings, updated every search.
            </p>
            <form onSubmit={handleSearch} className="flex gap-3 max-w-xl">
              <div className="flex-1 relative">
                <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input type="text" value={inputVal} onChange={e => setInputVal(e.target.value)}
                  placeholder="e.g. Python developer, UI designer, nurse..."
                  className="w-full pl-12 pr-4 py-4 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm"
                  style={{ background: "rgba(255,255,255,0.96)" }} />
              </div>
              <button type="submit" className="px-8 py-4 rounded-2xl font-bold text-sm text-white hover:opacity-90 transition-opacity whitespace-nowrap"
                style={{ background: "linear-gradient(135deg,#7c3aed,#a855f7)" }}>
                {loading ? "..." : "Search"}
              </button>
            </form>
          </div>

          {/* Stats cards */}
          <div className="flex-shrink-0 hidden lg:flex flex-col gap-3">
            {[
              { n: "50K+", label: "Live jobs", icon: "💼" },
              { n: "120+", label: "Countries",  icon: "🌍" },
              { n: "24",   label: "Categories", icon: "📂" },
            ].map(s => (
              <div key={s.label} className="flex items-center gap-4 px-6 py-4 rounded-2xl" style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}>
                <span className="text-2xl">{s.icon}</span>
                <div>
                  <p className="text-2xl font-extrabold text-white">{s.n}</p>
                  <p className="text-xs text-slate-400">{s.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          SECTION 2 — CATEGORIES  (bold violet/purple)
      ══════════════════════════════════════════════════════ */}
      <div style={{ background: "linear-gradient(135deg, #4c1d95 0%, #5b21b6 50%, #6d28d9 100%)" }}>
        <div className="max-w-6xl mx-auto px-6 py-16">

          {/* Header row */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-extrabold text-white">Browse by Category</h2>
              <p className="text-violet-300 text-sm mt-1">Find your career path — {CATEGORIES.length} categories available</p>
            </div>
            {/* Page indicator + arrows */}
            <div className="flex items-center gap-3">
              <span className="text-violet-300 text-sm font-medium">
                {catPage + 1} / {catTotalPages}
              </span>
              <button
                onClick={() => setCatPage(p => Math.max(0, p - 1))}
                disabled={catPage === 0}
                className="w-9 h-9 rounded-xl flex items-center justify-center transition-all disabled:opacity-30"
                style={{ background: "rgba(255,255,255,0.15)" }}>
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={() => setCatPage(p => Math.min(catTotalPages - 1, p + 1))}
                disabled={catPage === catTotalPages - 1}
                className="w-9 h-9 rounded-xl flex items-center justify-center transition-all disabled:opacity-30"
                style={{ background: "rgba(255,255,255,0.15)" }}>
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

          {/* 6 × 2 grid */}
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {visibleCats.map(cat => (
              <button key={cat.label} onClick={() => handleCategory(cat.query)}
                className="group flex flex-col items-center gap-3 p-4 rounded-2xl transition-all hover:-translate-y-1 hover:shadow-xl"
                style={{
                  background: query === cat.query ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.1)",
                  border: query === cat.query ? "2px solid rgba(255,255,255,0.8)" : "2px solid rgba(255,255,255,0.15)",
                }}>
                <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl"
                  style={{ background: cat.bg }}>
                  {cat.emoji}
                </div>
                <span className="text-xs font-bold text-white text-center leading-tight group-hover:text-violet-200 transition-colors">
                  {cat.label}
                </span>
              </button>
            ))}
          </div>

          {/* Dot indicators */}
          <div className="flex justify-center gap-2 mt-6">
            {Array.from({ length: catTotalPages }).map((_, i) => (
              <button key={i} onClick={() => setCatPage(i)}
                className="rounded-full transition-all"
                style={{
                  width: i === catPage ? 24 : 8, height: 8,
                  background: i === catPage ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.3)",
                }} />
            ))}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          SECTION 3 — JOB RESULTS  (clean white)
      ══════════════════════════════════════════════════════ */}
      <div id="results" style={{ background: "#ffffff" }}>
        <div className="max-w-6xl mx-auto px-6 py-14">

          {searched && (
            <div className="flex flex-wrap items-center gap-3 mb-8 bg-slate-50 rounded-2xl border border-slate-200 p-4">
              <button onClick={() => { setRemoteOnly(!remoteOnly); setPage(1); }}
                className="text-sm px-4 py-2 rounded-xl border font-semibold transition-all"
                style={remoteOnly
                  ? { background: "#7c3aed", color: "white", borderColor: "#7c3aed" }
                  : { background: "white", color: "#475569", borderColor: "#e2e8f0" }}>
                🌍 Remote only
              </button>
              <button onClick={() => { setQuery(""); setInputVal(""); setRemoteOnly(false); setPage(1); setSearched(false); setJobs([]); }}
                className="text-sm text-slate-400 hover:text-slate-600 underline">
                Clear
              </button>
              <span className="ml-auto text-sm font-semibold text-slate-700">
                {loading
                  ? <span className="flex items-center gap-2 text-violet-600">
                      <span className="w-4 h-4 border-2 border-violet-500 border-t-transparent rounded-full animate-spin inline-block" />
                      Searching live…
                    </span>
                  : `${total.toLocaleString()} result${total !== 1 ? "s" : ""} for "${query}"`}
              </span>
            </div>
          )}

          {!searched ? (
            <div className="text-center py-24">
              <div className="w-20 h-20 rounded-3xl mx-auto mb-5 flex items-center justify-center text-4xl"
                style={{ background: "linear-gradient(135deg,#ede9fe,#ddd6fe)" }}>🚀</div>
              <h3 className="text-2xl font-bold text-slate-800 mb-2">Start your job search</h3>
              <p className="text-slate-400">Type any job title above or pick a category — results are fetched live</p>
            </div>
          ) : loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {Array.from({ length: LIMIT }).map((_, i) => (
                <div key={i} className="bg-slate-50 rounded-2xl border border-slate-100 p-5 h-56 animate-pulse" />
              ))}
            </div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-24">
              <div className="text-5xl mb-4">😕</div>
              <h3 className="text-xl font-semibold text-slate-700 mb-2">No jobs found</h3>
              <p className="text-slate-400 text-sm">Try different keywords or remove filters</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {jobs.map(job => <JobCard key={job.id} job={job} />)}
              </div>
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-12">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                    className="px-5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:border-violet-400 hover:text-violet-600 disabled:opacity-30 text-sm font-semibold transition-colors shadow-sm">
                    ← Prev
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const p = page <= 3 ? i + 1 : page - 2 + i;
                    if (p < 1 || p > totalPages) return null;
                    return (
                      <button key={p} onClick={() => setPage(p)}
                        className="w-10 h-10 rounded-xl text-sm font-bold transition-all shadow-sm"
                        style={p === page
                          ? { background: "#7c3aed", color: "white" }
                          : { background: "white", border: "1px solid #e2e8f0", color: "#475569" }}>
                        {p}
                      </button>
                    );
                  })}
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                    className="px-5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:border-violet-400 hover:text-violet-600 disabled:opacity-30 text-sm font-semibold transition-colors shadow-sm">
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

    </div>
  );
}
