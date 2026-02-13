const metrics = {
  requests: [],
  maxPoints: 60,
  socketCount: 0,
};

const recordRequest = (durationMs) => {
  metrics.requests.push({ ts: Date.now(), durationMs });
  if (metrics.requests.length > metrics.maxPoints) {
    metrics.requests.shift();
  }
};

const setSocketCount = (count) => {
  metrics.socketCount = count;
};

const getLatencySeries = () => {
  return metrics.requests.map((entry) => ({
    time: new Date(entry.ts).toLocaleTimeString(),
    latency: Math.round(entry.durationMs),
  }));
};

const getAvgLatency = () => {
  if (!metrics.requests.length) return 0;
  const sum = metrics.requests.reduce((acc, cur) => acc + cur.durationMs, 0);
  return Math.round(sum / metrics.requests.length);
};

const getRequestsPerMinute = () => {
  const cutoff = Date.now() - 60 * 1000;
  return metrics.requests.filter((r) => r.ts >= cutoff).length;
};

module.exports = {
  recordRequest,
  setSocketCount,
  getLatencySeries,
  getAvgLatency,
  getRequestsPerMinute,
  getSocketCount: () => metrics.socketCount,
};
