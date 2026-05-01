#!/usr/bin/env node
/**
 * Serves the debug APK on your LAN so you can install it on Android without USB.
 * Open http://<your-mac-ip>:8888/app-debug.apk on your phone (same Wi‑Fi).
 */
import { createServer } from 'node:http';
import { createReadStream, existsSync } from 'node:fs';
import { networkInterfaces } from 'node:os';
import { basename, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const PORT = Number(process.env.APK_SERVE_PORT ?? 8888);
const root = fileURLToPath(new URL('..', import.meta.url));
const apkPath = join(root, 'android/app/build/outputs/apk/debug/app-debug.apk');
const apkName = basename(apkPath);

if (!existsSync(apkPath)) {
  console.error(
    `APK not found at:\n  ${apkPath}\n\nBuild it first:\n  npx expo run:android\n`,
  );
  process.exit(1);
}

function localIps() {
  try {
    const ips = [];
    for (const iface of Object.values(networkInterfaces())) {
      if (!iface) continue;
      for (const addr of iface) {
        if (addr.family === 'IPv4' && !addr.internal) ips.push(addr.address);
      }
    }
    return ips;
  } catch {
    return [];
  }
}

const server = createServer((req, res) => {
  if (req.url !== '/' && req.url !== `/${apkName}`) {
    res.writeHead(404);
    res.end('Not found. Use /app-debug.apk');
    return;
  }

  res.writeHead(200, {
    'Content-Type': 'application/vnd.android.package-archive',
    'Content-Disposition': `attachment; filename="${apkName}"`,
  });
  createReadStream(apkPath).pipe(res);
});

server.listen(PORT, '0.0.0.0', () => {
  const ips = localIps();
  console.log(`\nServing ${apkName} on port ${PORT}\n`);
  if (ips.length === 0) {
    console.log(`  http://localhost:${PORT}/${apkName}\n`);
  } else {
    for (const ip of ips) {
      console.log(`  http://${ip}:${PORT}/${apkName}`);
    }
    console.log('');
  }
  console.log('On your phone: same Wi‑Fi → open a link above → install APK.');
  console.log('Allow “Install unknown apps” for your browser if prompted.\n');
});
