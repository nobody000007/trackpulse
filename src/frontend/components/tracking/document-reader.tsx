"use client";
import { TrackingScript } from "./tracking-script";

interface DocumentReaderProps {
  token: string;
  taskId: string;
}

export function DocumentReader({ token, taskId }: DocumentReaderProps) {
  return (
    <div>
      <TrackingScript token={token} taskId={taskId} />
      <div className="max-w-4xl mx-auto py-8 px-4">
        {/* TODO: load and render document/attachment content */}
        <p className="text-gray-500">Document content will render here.</p>
      </div>
    </div>
  );
}
