"use client";
import { useRef, useState } from "react";
import { Paperclip, Trash2, Loader2, Upload, FileText, Image, Film, Archive } from "lucide-react";

export interface Attachment {
  id: string;
  filename: string;
  blobUrl: string;
  fileType: string;
  fileSize: number;
}

interface TaskAttachmentsProps {
  taskId: string;
  initial: Attachment[];
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function FileIcon({ type }: { type: string }) {
  if (type.startsWith("image/")) return <Image className="w-3.5 h-3.5 text-violet-500" />;
  if (type.startsWith("video/")) return <Film className="w-3.5 h-3.5 text-rose-500" />;
  if (type.includes("zip") || type.includes("rar") || type.includes("tar")) return <Archive className="w-3.5 h-3.5 text-amber-500" />;
  return <FileText className="w-3.5 h-3.5 text-indigo-500" />;
}

export function TaskAttachments({ taskId, initial }: TaskAttachmentsProps) {
  const [attachments, setAttachments] = useState<Attachment[]>(initial);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const file = files[0];

    if (file.size > 20 * 1024 * 1024) {
      setError("File must be under 20 MB.");
      return;
    }

    setUploading(true);
    setError("");
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("taskId", taskId);

      const res = await fetch("/api/upload", { method: "POST", body: form });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "Upload failed");
      }
      const att: Attachment = await res.json();
      setAttachments((prev) => [...prev, att]);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/attachments/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      setAttachments((prev) => prev.filter((a) => a.id !== id));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-2">
      {/* File list */}
      {attachments.length > 0 && (
        <ul className="space-y-1.5">
          {attachments.map((att) => (
            <li key={att.id} className="flex items-center gap-2.5 px-3 py-2 bg-slate-50 rounded-lg border border-slate-200/80 group">
              <FileIcon type={att.fileType} />
              <a
                href={att.blobUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 text-xs font-medium text-gray-700 hover:text-indigo-600 truncate transition-colors"
              >
                {att.filename}
              </a>
              <span className="text-[10px] text-slate-400 shrink-0">{formatSize(att.fileSize)}</span>
              <button
                onClick={() => handleDelete(att.id)}
                disabled={deletingId === att.id}
                className="text-slate-300 hover:text-red-500 transition-colors shrink-0 opacity-0 group-hover:opacity-100"
              >
                {deletingId === att.id
                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  : <Trash2 className="w-3.5 h-3.5" />
                }
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Error */}
      {error && <p className="text-xs text-red-600">{error}</p>}

      {/* Upload button */}
      <div>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-indigo-600 font-medium transition-colors disabled:opacity-50"
        >
          {uploading
            ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Uploading…</>
            : <><Paperclip className="w-3.5 h-3.5" /> Attach file</>
          }
        </button>
      </div>
    </div>
  );
}
