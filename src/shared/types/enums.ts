export enum TaskType {
  ACTION = "ACTION",
  DOCUMENT = "DOCUMENT",
  LINK = "LINK",
}

export enum Priority {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
}

export enum AssignmentStatus {
  ACTIVE = "ACTIVE",
  REVOKED = "REVOKED",
  COMPLETED = "COMPLETED",
}

export enum ProgressStatus {
  NOT_STARTED = "NOT_STARTED",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
}

export enum EventType {
  OPEN = "OPEN",
  HEARTBEAT = "HEARTBEAT",
  SCROLL = "SCROLL",
  CLOSE = "CLOSE",
  LINK_CLICK = "LINK_CLICK",
  LINK_RETURN = "LINK_RETURN",
}

export enum RiskLevel {
  GREEN = "GREEN",
  YELLOW = "YELLOW",
  RED = "RED",
}
