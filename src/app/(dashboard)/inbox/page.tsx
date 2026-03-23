import { InboxView } from "@/frontend/components/inbox/inbox-view";
import { Inbox } from "lucide-react";

export default function InboxPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-md shadow-indigo-500/20">
          <Inbox className="w-4 h-4 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inbox</h1>
          <p className="text-gray-400 text-sm">Help requests from your team, all in one place.</p>
        </div>
      </div>
      <InboxView />
    </div>
  );
}
