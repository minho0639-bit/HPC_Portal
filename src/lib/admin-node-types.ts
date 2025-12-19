export interface StoredNode {
  id: string;
  name: string;
  ipAddress: string;
  role: string;
  labels: string[];
  createdAt: string;
  sshUser?: string;
  sshPort?: number;
}

export interface NodeTelemetry {
  status: "healthy" | "warning" | "critical";
  cpuUsage: number;
  memoryUsage: number;
  gpuUsage: number | null;
  latencyMs: number;
  lastHeartbeat: string;
}

export interface NodeRecord extends StoredNode {
  telemetry: NodeTelemetry;
}
