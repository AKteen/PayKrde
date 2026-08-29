import type { IncomingMessage, ServerResponse } from 'node:http';

type App = (req: IncomingMessage, res: ServerResponse) => void;

let loaded: Promise<App> | undefined;

function loadApp() {
  loaded ??= import('../apps/api/src/app.js').then((mod) => mod.app as App);
  return loaded;
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const app = await loadApp();
  await new Promise<void>((resolve, reject) => {
    res.once('finish', resolve);
    res.once('close', resolve);
    try {
      app(req, res);
    } catch (err) {
      reject(err);
    }
  });
}
