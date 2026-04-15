import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";

const ROOT = path.join(process.cwd(), "frontend");
const PORT = Number(process.env.FRONTEND_PORT ?? 5173);

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

function filePathFromUrl(urlPath) {
  const clean = urlPath.split("?")[0];
  const normalized = clean === "/" ? "/index.html" : clean;
  return path.normalize(path.join(ROOT, normalized));
}

const server = http.createServer(async (req, res) => {
  try {
    const target = filePathFromUrl(req.url ?? "/");
    if (!target.startsWith(ROOT)) {
      res.writeHead(403);
      res.end("Forbidden");
      return;
    }

    const data = await fs.readFile(target);
    const ext = path.extname(target).toLowerCase();
    const contentType = MIME[ext] ?? "application/octet-stream";

    res.writeHead(200, { "Content-Type": contentType });
    res.end(data);
  } catch {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Not found");
  }
});

server.listen(PORT, () => {
  console.log(`Frontend running at http://127.0.0.1:${PORT}`);
});
