"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

const API_BASE = "http://localhost:8000";

type Job = {
  id: number;
  title: string;
  company: string | null;
  location: string | null;
  remote: boolean | null;
  link: string | null;
  tags: string | null;
  salary_min: string | null;
  salary_max: string | null;
  source: string | null;
  posted_at: string | null;
};

export default function JobDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE}/jobs/${id}`)
      .then(r => { if (r.status === 404) { setNotFound(true); return null; } return r.json(); })
      .then(d => { if (d) setJob(d); })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  let tags: string[] = [];
  try { tags = job?.tags ? JSON.parse(job.tags) : []; } catch { tags = []; }

  const salary =
    job?.salary_min && job?.salary_max && job.salary_min !== job.salary_max
      ? `£${Math.round(Number(job.salary_min)).toLocaleString()} – £${Math.round(Number(job.salary_max)).toLocaleString()}`
      : job?.salary_min ? `£${Math.round(Number(job.salary_min)).toLocaleString()}` : null;

  const postedDate = job?.posted_at
    ? isNaN(Number(job.posted_at))
      ? new Date(job.posted_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
      : new Date(Number(job.posted_at) * 1000).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
    : null;

  const colors = ["bg-violet-100 text-violet-700", "bg-blue-100 text-blue-700", "bg-emerald-100 text-emerald-700", "bg-orange-100 text-orange-700", "bg-rose-100 text-rose-700"];
  const color = job ? colors[job.id % colors.length] : colors[0];
  const initials = (job?.company ?? "?").slice(0, 2).toUpperCase();

  if (loading) return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="h-6 bg-slate-200 rounded w-20 animate-pulse mb-8" />
        <div className="bg-white rounded-2xl border border-slate-200 p-8 space-y-4">
          <div className="h-8 bg-slate-200 rounded w-2/3 animate-pulse" />
          <div className="h-5 bg-slate-200 rounded w-1/3 animate-pulse" />
        </div>
      </div>
    </div>
  );

  if (notFound || !job) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center">
        <p className="text-6xl mb-4">😕</p>
        <p className="text-xl font-semibold text-slate-700 mb-2">Job not found</p>
        <Link href="/" className="text-indigo-600 hover:underline text-sm">← Back to Job Finder</Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen">
      {/* Top nav */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <Link href="/" className="text-sm font-semibold text-indigo-600">Job Finder</Link>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-4">
        {/* Main card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-8">
          <div className="flex items-start gap-4 mb-6">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-base font-bold shrink-0 ${color}`}>
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-slate-900 leading-tight">{job.title}</h1>
              <p className="text-slate-500 mt-1">{job.company ?? "Unknown Company"}</p>
            </div>
            {job.remote && (
              <span className="shrink-0 text-sm font-medium bg-emerald-50 text-emerald-600 border border-emerald-200 px-3 py-1 rounded-full">
                Remote
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            {job.location && (
              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-xs text-slate-400 mb-1">Location</p>
                <p className="text-sm font-medium text-slate-700">{job.location}</p>
              </div>
            )}
            {salary && (
              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-xs text-slate-400 mb-1">Salary</p>
                <p className="text-sm font-medium text-slate-700">{salary}</p>
              </div>
            )}
            {postedDate && (
              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-xs text-slate-400 mb-1">Posted</p>
                <p className="text-sm font-medium text-slate-700">{postedDate}</p>
              </div>
            )}
            {job.source && (
              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-xs text-slate-400 mb-1">Source</p>
                <p className="text-sm font-medium text-slate-700">{job.source}</p>
              </div>
            )}
          </div>
        </div>

        {/* Tags */}
        {tags.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Skills & Tags</h2>
            <div className="flex flex-wrap gap-2">
              {tags.map(tag => (
                <span key={tag} className="text-sm text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg font-medium">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Apply CTA */}
        {job.link && (
          <a
            href={job.link}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-4 rounded-2xl transition-colors text-base"
          >
            Apply for this position
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        )}
      </div>
    </div>
  );
}
