import { Client, ConnectConfig } from "ssh2";
import { promises as fs } from "fs";

import type { StoredNode } from "./admin-node-types";

export interface NodeResourceSnapshot {
  timestamp: string;
  cpu: {
    usagePercent: number;
    cores: number;
    loadAverage: [number, number, number];
  };
  memory: {
    totalMb: number;
    usedMb: number;
    usagePercent: number;
  };
  storage: {
    filesystem: string;
    mount: string;
    totalGb: number;
    usedGb: number;
    usagePercent: number;
  };
  network: {
    interface: string;
    inboundMbps: number;
    outboundMbps: number;
    rxBytes: number;
    txBytes: number;
  };
  gpus: Array<{
    name: string;
    index: number;
    usagePercent: number;
    memoryUsedGb: number;
    memoryTotalGb: number;
    temperatureC: number;
  }>;
  processes: Array<{
    pid: number;
    name: string;
    user: string;
    cpuPercent: number;
    memoryPercent: number;
  }>;
}

type CpuCounters = {
  idle: number;
  total: number;
};

type NetCounters = {
  interface: string;
  rxBytes: number;
  txBytes: number;
};

let cachedPrivateKey: Buffer | null | undefined;

async function resolvePrivateKey(): Promise<Buffer | undefined> {
  if (cachedPrivateKey !== undefined) {
    return cachedPrivateKey === null ? undefined : cachedPrivateKey;
  }

  const inlineKey = process.env.NODE_MONITOR_SSH_KEY;
  if (inlineKey) {
    cachedPrivateKey = Buffer.from(inlineKey.replace(/\\n/g, "\n"), "utf-8");
    return cachedPrivateKey;
  }

  const keyPath = process.env.NODE_MONITOR_SSH_KEY_PATH;
  if (!keyPath) {
    cachedPrivateKey = null;
    return undefined;
  }

  try {
    const key = await fs.readFile(keyPath);
    cachedPrivateKey = key;
    return key;
  } catch (error) {
    console.error("[node-resources] SSH private key 읽기 실패:", error);
    cachedPrivateKey = null;
    return undefined;
  }
}

function buildSshConfig(node: StoredNode, privateKey?: Buffer): ConnectConfig {
  const username =
    node.sshUser ??
    process.env.NODE_MONITOR_DEFAULT_SSH_USER ??
    process.env.USER;

  if (!username) {
    throw new Error("SSH 사용자 정보가 필요합니다. 노드 등록 시 SSH 사용자 또는 NODE_MONITOR_DEFAULT_SSH_USER 환경 변수를 설정하세요.");
  }

  const port =
    node.sshPort ??
    Number.parseInt(process.env.NODE_MONITOR_DEFAULT_SSH_PORT ?? "22", 10);

  const password = process.env.NODE_MONITOR_SSH_PASSWORD;
  const passphrase = process.env.NODE_MONITOR_SSH_KEY_PASSPHRASE;

  if (!privateKey && !password) {
    throw new Error("SSH 접속을 위한 비밀키 또는 비밀번호가 필요합니다. NODE_MONITOR_SSH_KEY_PATH / NODE_MONITOR_SSH_KEY 또는 NODE_MONITOR_SSH_PASSWORD를 설정하세요.");
  }

  const config: ConnectConfig = {
    host: node.ipAddress,
    port: Number.isFinite(port) ? port : 22,
    username,
    readyTimeout: 12_000,
  };

  if (privateKey) {
    config.privateKey = privateKey;
    if (passphrase) {
      config.passphrase = passphrase;
    }
  }

  if (password) {
    config.password = password;
  }

  const algorithms: NonNullable<ConnectConfig["algorithms"]> = {};

  const parseListEnv = (value?: string | null) =>
    value
      ?.split(",")
      .map((item) => item.trim())
      .filter(Boolean);

  const cipherList = parseListEnv(process.env.NODE_MONITOR_SSH_CIPHERS);
  if (cipherList?.length) {
    algorithms.cipher = cipherList as any;
  }

  const kexList = parseListEnv(process.env.NODE_MONITOR_SSH_KEX);
  if (kexList?.length) {
    algorithms.kex = kexList as any;
  }

  const macList = parseListEnv(process.env.NODE_MONITOR_SSH_MACS);
  if (macList?.length) {
    algorithms.mac = macList as any;
  }

  const serverHostKeyList = parseListEnv(
    process.env.NODE_MONITOR_SSH_SERVER_HOST_KEY_ALGORITHMS,
  );
  if (serverHostKeyList?.length) {
    algorithms.serverHostKey = serverHostKeyList as any;
  }

  if (Object.keys(algorithms).length > 0) {
    config.algorithms = algorithms;
  }

  return config;
}

function withSshConnection<T>(config: ConnectConfig, handler: (conn: Client) => Promise<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    const conn = new Client();
    let settled = false;

    conn
      .on("ready", async () => {
        try {
          const result = await handler(conn);
          if (!settled) {
            settled = true;
            resolve(result);
          }
        } catch (error) {
          if (!settled) {
            settled = true;
            reject(error);
          }
        } finally {
          conn.end();
        }
      })
      .on("error", (error) => {
        if (!settled) {
          settled = true;
          reject(error);
        }
      })
      .on("end", () => {
        if (!settled) {
          settled = true;
          reject(new Error("SSH 연결이 예기치 않게 종료되었습니다."));
        }
      })
      .connect(config);
  });
}

function execCommand(conn: Client, command: string): Promise<string> {
  return new Promise((resolve, reject) => {
    conn.exec(command, (err, stream) => {
      if (err) {
        reject(err);
        return;
      }

      let stdout = "";
      let stderr = "";

      stream
        .on("close", (code) => {
          if (code !== 0 && stderr) {
            reject(new Error(stderr.trim() || `명령 실행 실패: ${command}`));
            return;
          }
          resolve(stdout.trim());
        })
        .on("data", (data: Buffer) => {
          stdout += data.toString();
        })
        .stderr.on("data", (data: Buffer) => {
          stderr += data.toString();
        });
    });
  });
}

async function readCpuCounters(conn: Client): Promise<CpuCounters> {
  const output = await execCommand(conn, "cat /proc/stat | head -n 1");
  const parts = output.trim().split(/\s+/);
  parts.shift(); // remove "cpu"
  const values = parts.map((value) => Number.parseInt(value, 10));
  const idle = (values[3] ?? 0) + (values[4] ?? 0); // idle + iowait
  const total = values.reduce((sum, value) => sum + value, 0);
  return { idle, total };
}

async function readNetworkCounters(conn: Client): Promise<NetCounters | null> {
  const output = await execCommand(conn, "cat /proc/net/dev");
  const lines = output.split("\n").slice(2);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed.includes(":")) continue;
    const [ifaceRaw, rest] = trimmed.split(":");
    const iface = ifaceRaw.trim();
    if (iface === "lo") continue;
    const numbers = rest.trim().split(/\s+/).map((value) => Number.parseInt(value, 10));
    const rxBytes = numbers[0] ?? 0;
    const txBytes = numbers[8] ?? 0;
    return { interface: iface, rxBytes, txBytes };
  }
  return null;
}

async function collectGpuMetrics(conn: Client) {
  try {
    const output = await execCommand(
      conn,
      "nvidia-smi --query-gpu=name,index,utilization.gpu,memory.used,memory.total,temperature.gpu --format=csv,noheader",
    );
    if (!output) {
      return [];
    }
    return output.split("\n").map((line) => {
      const [name, index, usage, memUsed, memTotal, temp] = line.split(",").map((value) => value.trim());
      return {
        name,
        index: Number.parseInt(index, 10),
        usagePercent: Number.parseFloat(usage.replace(/%$/, "")) || 0,
        memoryUsedGb: Number.parseFloat(memUsed) / 1024 || 0,
        memoryTotalGb: Number.parseFloat(memTotal) / 1024 || 0,
        temperatureC: Number.parseFloat(temp.replace(/[^\d.]/g, "")) || 0,
      };
    });
  } catch (error) {
    // GPU가 없거나 nvidia-smi 미설치
    return [];
  }
}

async function collectProcessList(conn: Client) {
  try {
    const output = await execCommand(
      conn,
      "ps -eo pid,comm,user,%cpu,%mem --sort=-%cpu | head -n 6",
    );
    const lines = output.split("\n").slice(1).filter(Boolean);
    return lines.map((line) => {
      const parts = line.trim().split(/\s+/);
      const [pidRaw, command, user, cpuRaw, memRaw] = parts;
      return {
        pid: Number.parseInt(pidRaw, 10),
        name: command ?? "",
        user: user ?? "",
        cpuPercent: Number.parseFloat(cpuRaw ?? "0"),
        memoryPercent: Number.parseFloat(memRaw ?? "0"),
      };
    });
  } catch (error) {
    return [];
  }
}

function toMbps(bytes: number, seconds: number) {
  if (seconds <= 0) return 0;
  return (bytes * 8) / (seconds * 1_000_000);
}

function toGb(bytes: number) {
  return bytes / (1024 ** 3);
}

export async function createNodeResourceSnapshot(node: StoredNode): Promise<NodeResourceSnapshot> {
  const privateKey = await resolvePrivateKey();
  const config = buildSshConfig(node, privateKey);

  return withSshConnection(config, async (conn) => {
    const timestamp = new Date();

    const coresOutput = await execCommand(conn, "nproc");
    const cores = Number.parseInt(coresOutput, 10) || 1;

    const loadOutput = await execCommand(conn, "cat /proc/loadavg");
    const [load1, load5, load15] = loadOutput
      .split(" ")
      .slice(0, 3)
      .map((value) => Number.parseFloat(value));

    const cpuCounters1 = await readCpuCounters(conn);
    const netCounters1 = await readNetworkCounters(conn);

    await new Promise((resolve) => setTimeout(resolve, 1100));

    const cpuCounters2 = await readCpuCounters(conn);
    const netCounters2 = netCounters1 ? await readNetworkCounters(conn) : null;

    let cpuUsagePercent = 0;
    const cpuTotalDiff = cpuCounters2.total - cpuCounters1.total;
    const cpuIdleDiff = cpuCounters2.idle - cpuCounters1.idle;
    if (cpuTotalDiff > 0) {
      cpuUsagePercent = ((cpuTotalDiff - cpuIdleDiff) / cpuTotalDiff) * 100;
    }

    let inboundMbps = 0;
    let outboundMbps = 0;
    let interfaceName = netCounters1?.interface ?? "n/a";
    let rxBytes = netCounters1?.rxBytes ?? 0;
    let txBytes = netCounters1?.txBytes ?? 0;
    if (netCounters1 && netCounters2) {
      interfaceName = netCounters1.interface;
      rxBytes = netCounters2.rxBytes;
      txBytes = netCounters2.txBytes;
      inboundMbps = toMbps(netCounters2.rxBytes - netCounters1.rxBytes, 1.1);
      outboundMbps = toMbps(netCounters2.txBytes - netCounters1.txBytes, 1.1);
    }

    const freeOutput = await execCommand(conn, "free --mega");
    const memLine = freeOutput
      .split("\n")
      .map((line) => line.trim())
      .find((line) => line.startsWith("Mem:"));
    const memParts = memLine?.split(/\s+/) ?? [];
    const totalMb = Number.parseInt(memParts[1] ?? "0", 10);
    const usedMb = Number.parseInt(memParts[2] ?? "0", 10);
    const memoryUsagePercent = totalMb > 0 ? (usedMb / totalMb) * 100 : 0;

    const dfOutput = await execCommand(conn, "df -B1 / | tail -n 1");
    const dfParts = dfOutput.trim().split(/\s+/);
    const filesystem = dfParts[0] ?? "/";
    const totalBytes = Number.parseInt(dfParts[1] ?? "0", 10);
    const usedBytes = Number.parseInt(dfParts[2] ?? "0", 10);
    const mountPoint = dfParts[5] ?? "/";
    const storageUsagePercent =
      totalBytes > 0 ? (usedBytes / totalBytes) * 100 : 0;

    const gpus = await collectGpuMetrics(conn);
    const processes = await collectProcessList(conn);

    return {
      timestamp: timestamp.toISOString(),
      cpu: {
        usagePercent: Number.isFinite(cpuUsagePercent) ? Number(cpuUsagePercent.toFixed(1)) : 0,
        cores,
        loadAverage: [
          Number.isFinite(load1) ? Number(load1.toFixed(2)) : 0,
          Number.isFinite(load5) ? Number(load5.toFixed(2)) : 0,
          Number.isFinite(load15) ? Number(load15.toFixed(2)) : 0,
        ],
      },
      memory: {
        totalMb,
        usedMb,
        usagePercent: Number(memoryUsagePercent.toFixed(1)),
      },
      storage: {
        filesystem,
        mount: mountPoint,
        totalGb: Number(toGb(totalBytes).toFixed(2)),
        usedGb: Number(toGb(usedBytes).toFixed(2)),
        usagePercent: Number(storageUsagePercent.toFixed(1)),
      },
      network: {
        interface: interfaceName,
        inboundMbps: Number(inboundMbps.toFixed(2)),
        outboundMbps: Number(outboundMbps.toFixed(2)),
        rxBytes,
        txBytes,
      },
      gpus,
      processes,
    };
  });
}
