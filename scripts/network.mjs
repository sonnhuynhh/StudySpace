import os from 'node:os';

function score(name) {
  const value = name.toLowerCase();
  if (/wi-?fi|wireless|wlan/.test(value)) return 30;
  if (/ethernet|^eth/.test(value)) return 20;
  if (/vethernet|wsl|virtual|vmware|virtualbox|tailscale|loopback/.test(value)) return -10;
  return 10;
}

export function resolveLanHost(explicit = process.env.STUDYSPACE_LAN_HOST) {
  if (explicit?.trim()) return explicit.trim();
  const candidates = Object.entries(os.networkInterfaces())
    .flatMap(([name, addresses]) =>
      (addresses ?? []).map((address) => ({ name, ...address, score: score(name) })),
    )
    .filter(
      ({ address, family, internal }) =>
        family === 'IPv4' && !internal && !address.startsWith('169.254.'),
    )
    .sort((a, b) => b.score - a.score);
  if (!candidates[0]) {
    throw new Error('Không tìm thấy IPv4 LAN. Hãy kết nối Wi-Fi hoặc đặt STUDYSPACE_LAN_HOST.');
  }
  return candidates[0].address;
}
