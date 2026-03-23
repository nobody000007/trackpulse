"use client";
import { useState } from "react";
import { ChevronDown, ChevronRight, ExternalLink, FileText, Image, Film, Archive, Download, Paperclip } from "lucide-react";

interface SubmissionFile {
  id: string;
  filename: string;
  blobUrl: string;
  fileType: string;
  fileSize: number;
}

interface SubmissionExpanderProps {
  taskTitle: string;
  submissionUrl?: string | null;
  submissionName?: string | null;
  submittedAt?: Date | null;
  files: SubmissionFile[];
}

function FileIcon({ type }: { type: string }) {
  if (type.startsWith("image/")) return <Image className="w-3.5 h-3.5 text-violet-500" />;
  if (type.startsWith("video/")) return <Film className="w-3.5 h-3.5 text-rose-500" />;
  if (type.includes("zip") || type.includes("rar")) return <Archive className="w-3.5 h-3.5 text-amber-500" />;
  return <FileText className="w-3.5 h-3.5 text-indigo-500" />;
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function SubmissionExpander({ taskTitle, submissionUrl, submissionName, submittedAt, files }: SubmissionExpanderProps) {
  const [open, setOpen] = useState(false);
  const hasContent = submissionUrl || submissionName || files.length > 0;
  if (!hasContent) return null;

  return (
    <div className="mt-1.5">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 text-xs text-emerald-600 hover:text-emerald-700 font-medium transition-colors"
      >
        <Paperclip className="w-3.5 h-3.5" />
        View submission
        {files.length > 0 && <span className="text-emerald-400">({files.length} file{files.length > 1 ? "s" : ""})</span>}
        {open ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
      </button>

      {open && (
        <div className="mt-2 bg-emerald-50 border border-emerald-200 rounded-xl p-3 space-y-2.5">
          {submittedAt && (
            <p className="text-[10px] text-emerald-600 font-medium">
              Submitted {new Date(submittedAt).toLocaleString("en-US", {
                month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
              })}
            </p>
          )}

          {submissionUrl && (
            <div>
              <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Link</p>
              <a
                href={submissionUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 font-medium break-all"
              >
                <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                {submissionUrl}
              </a>
            </div>
          )}

          {submissionName && (
            <div>
              <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Note</p>
              <p className="text-xs text-gray-700 leading-relaxed">{submissionName}</p>
            </div>
          )}

          {files.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Files</p>
              <div className="space-y-1.5">
                {files.map((f) => (
                  <a
                    key={f.id}
                    href={f.blobUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-2.5 py-1.5 bg-white border border-emerald-100 rounded-lg hover:border-emerald-300 hover:bg-emerald-50/50 transition-colors group"
                  >
                    <FileIcon type={f.fileType} />
                    <span className="flex-1 text-xs text-gray-700 font-medium truncate">{f.filename}</span>
                    <span className="text-[10px] text-gray-400 shrink-0">{formatSize(f.fileSize)}</span>
                    <Download className="w-3 h-3 text-gray-300 group-hover:text-emerald-500 transition-colors shrink-0" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
