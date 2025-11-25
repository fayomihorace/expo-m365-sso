type LogLevel = 'debug' | 'info' | 'warn' | 'error';

type LogMessage = {
  level: LogLevel;
  text: string;
  timestamp: string;
};

const subscribers: Array<(m: LogMessage) => void> = [];
const history: LogMessage[] = [];
const MAX_HISTORY = 200;

export function subscribeLogger(cb: (m: LogMessage) => void) {
  subscribers.push(cb);
  // deliver existing history immediately
  history.forEach(h => cb(h));
  return () => {
    const idx = subscribers.indexOf(cb);
    if (idx >= 0) subscribers.splice(idx, 1);
  };
}

export function log(level: LogLevel, text: string) {
  const message: LogMessage = {
    level,
    text,
    timestamp: new Date().toLocaleTimeString(),
  };
  history.push(message);
  if (history.length > MAX_HISTORY) history.shift();
  subscribers.forEach(s => {
    try { s(message); } catch (e) { /* ignore subscriber errors */ }
  });
  // Also print to console for developer convenience
  if (level === 'error') console.error(text);
  else if (level === 'warn') console.warn(text);
  else console.log(text);
}

export function debug(text: string) { log('debug', text); }
export function info(text: string) { log('info', text); }
export function warn(text: string) { log('warn', text); }
export function error(text: string) { log('error', text); }

export function getHistory() { return history.slice(); }
