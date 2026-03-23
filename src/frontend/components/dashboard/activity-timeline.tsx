interface ActivityEvent {
  id: string;
  eventType: string;
  taskId: string;
  timestamp: Date;
}

interface ActivityTimelineProps {
  events: ActivityEvent[];
}

export function ActivityTimeline({ events }: ActivityTimelineProps) {
  return (
    <div className="space-y-3">
      {events.map((event) => (
        <div key={event.id} className="flex items-center gap-3 text-sm">
          <span className="text-gray-400 text-xs">{new Date(event.timestamp).toLocaleString()}</span>
          <span className="px-2 py-0.5 bg-gray-100 rounded text-gray-700">{event.eventType}</span>
          <span className="text-gray-500">Task {event.taskId.slice(-8)}</span>
        </div>
      ))}
    </div>
  );
}
