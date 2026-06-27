import Link from "next/link";

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

const avatarColors = [
  "bg-violet-500", "bg-blue-500", "bg-emerald-500",
  "bg-orange-500", "bg-rose-500", "bg-cyan-500", "bg-amber-500",
];

export default function JobCard({ job }: { job: Job }) {
  let tags: string[] = [];
  try { tags = job.tags ? JSON.parse(job.tags) : []; } catch { tags = []; }

  const salary =
    job.salary_min && job.salary_max && job.salary_min !== job.salary_max
      ? `£${Math.round(Number(job.salary_min)).toLocaleString()} – £${Math.round(Number(job.salary_max)).toLocaleString()}`
      : job.salary_min ? `£${Math.round(Number(job.salary_min)).toLocaleString()}` : null;

  const postedDate = job.posted_at
    ? isNaN(Number(job.posted_at))
      ? new Date(job.posted_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })
      : new Date(Number(job.posted_at) * 1000).toLocaleDateString("en-GB", { day: "numeric", month: "short" })
    : null;

  const avatarColor = avatarColors[job.id % avatarColors.length];
  const initials = (job.company ?? "?").slice(0, 2).toUpperCase();

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col gap-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0 ${avatarColor}`}>
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <Link href={`/jobs/${job.id}`}>
            <h3 className="font-semibold text-slate-900 text-sm leading-snug group-hover:text-violet-600 transition-colors line-clamp-2">
              {job.title}
            </h3>
          </Link>
          <p className="text-slate-500 text-xs mt-0.5 truncate">{job.company ?? "Unknown"}</p>
        </div>
        {job.remote && (
          <span className="shrink-0 text-xs font-semibold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
            Remote
          </span>
        )}
      </div>

      {/* Info chips */}
      <div className="flex flex-wrap gap-2">
        {job.location && (
          <span className="flex items-center gap-1 text-xs text-slate-500 bg-slate-100 rounded-full px-2.5 py-1">
            📍 {job.location}
          </span>
        )}
        {salary && (
          <span className="flex items-center gap-1 text-xs font-medium text-violet-700 bg-violet-50 rounded-full px-2.5 py-1">
            💰 {salary}
          </span>
        )}
      </div>

      {/* Tags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.slice(0, 3).map((tag, i) => {
            const tagColors = ["bg-blue-50 text-blue-700", "bg-orange-50 text-orange-700", "bg-pink-50 text-pink-700"];
            return (
              <span key={tag} className={`text-xs px-2 py-0.5 rounded-lg font-medium ${tagColors[i % tagColors.length]}`}>
                {tag}
              </span>
            );
          })}
          {tags.length > 3 && <span className="text-xs text-slate-400 py-0.5">+{tags.length - 3}</span>}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-100 mt-auto">
        <div className="text-xs text-slate-400">
          {job.source?.split(".")[0]} {postedDate && `· ${postedDate}`}
        </div>
        <div className="flex gap-2">
          <Link href={`/jobs/${job.id}`}
            className="text-xs text-slate-500 hover:text-slate-700 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors">
            Details
          </Link>
          {job.link && (
            <a href={job.link} target="_blank" rel="noopener noreferrer"
              className="text-xs bg-violet-600 hover:bg-violet-700 text-white px-3 py-1.5 rounded-lg font-medium transition-colors">
              Apply →
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
