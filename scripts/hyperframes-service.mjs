/**
 * Service lokal HyperFrames untuk Heaviliate (Port 7002).
 * Berjalan secara lokal di PC pengguna (ADR 0003).
 *
 * Jalankan dengan: node scripts/hyperframes-service.mjs
 */

import http from "node:http";

const PORT = 7002;
let lastRenderData = null;

function renderHtmlTemplate(data) {
  const scenesJson = JSON.stringify(data.scenes || []);
  const produkNama = data.produkNama || "Produk Pilihan";
  const fotoUrl = data.fotoUrl || "";

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>HyperFrames Video Player - ${produkNama}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #111;
      color: #fff;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 20px;
    }
    .container {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
    }
    /* Frame 9:16 (Vertikal TikTok/Reels/Shorts) */
    #videoCanvas {
      width: 360px;
      height: 640px;
      background: #000;
      border-radius: 16px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.8);
      border: 1px solid #333;
    }
    .controls {
      display: flex;
      gap: 12px;
      align-items: center;
    }
    button {
      padding: 10px 20px;
      border-radius: 8px;
      border: none;
      font-weight: 600;
      cursor: pointer;
      font-size: 14px;
      transition: opacity 0.2s;
    }
    button:hover { opacity: 0.9; }
    .btn-record { background: #22c55e; color: #000; }
    .btn-replay { background: #3b82f6; color: #fff; }
    .status-text { font-size: 13px; color: #aaa; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <canvas id="videoCanvas" width="720" height="1280"></canvas>
    <div class="controls">
      <button class="btn-replay" id="btnReplay">Putar Ulang</button>
      <button class="btn-record" id="btnDownload">Unduh Video (.webm)</button>
    </div>
    <div class="status-text" id="statusText">Video siap diputar atau diunduh</div>
  </div>

  <script>
    const scenes = ${scenesJson};
    const fotoProduk = "${fotoUrl}";
    const canvas = document.getElementById("videoCanvas");
    const ctx = canvas.getContext("2d");
    const statusText = document.getElementById("statusText");

    let img = null;
    if (fotoProduk) {
      img = new Image();
      img.crossOrigin = "anonymous";
      img.src = fotoProduk;
    }

    let currentSceneIndex = 0;
    let sceneStartTime = 0;
    let isPlaying = false;
    let mediaRecorder = null;
    let recordedChunks = [];

    function drawWrappedText(text, x, y, maxWidth, lineHeight, fontSize = 38) {
      ctx.font = 'bold ' + fontSize + 'px sans-serif';
      const words = text.split(" ");
      let line = "";
      for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + " ";
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && n > 0) {
          ctx.fillText(line, x, y);
          line = words[n] + " ";
          y += lineHeight;
        } else {
          line = testLine;
        }
      }
      ctx.fillText(line, x, y);
    }

    function renderFrame(timestamp) {
      if (!isPlaying) return;
      if (!sceneStartTime) sceneStartTime = timestamp;

      const elapsed = (timestamp - sceneStartTime) / 1000;
      const currentScene = scenes[currentSceneIndex] || scenes[0];
      const durasi = currentScene.durasiDetik || 3;

      if (elapsed >= durasi) {
        currentSceneIndex++;
        sceneStartTime = timestamp;
        if (currentSceneIndex >= scenes.length) {
          currentSceneIndex = 0;
          if (mediaRecorder && mediaRecorder.state === "recording") {
            mediaRecorder.stop();
          }
        }
      }

      // Background
      const grad = ctx.createLinearGradient(0, 0, 0, 1280);
      grad.addColorStop(0, "#0f172a");
      grad.addColorStop(1, "#020617");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 720, 1280);

      // Gambar produk (jika ada)
      if (img && img.complete && img.naturalWidth) {
        const imgSize = 420;
        const imgX = (720 - imgSize) / 2;
        const imgY = 220;
        ctx.save();
        ctx.shadowColor = "rgba(0,0,0,0.6)";
        ctx.shadowBlur = 20;
        ctx.drawImage(img, imgX, imgY, imgSize, imgSize);
        ctx.restore();
      }

      // Badge Tipe Scene
      ctx.fillStyle = "#38bdf8";
      ctx.beginPath();
      ctx.roundRect(50, 80, 140, 40, 8);
      ctx.fill();
      ctx.fillStyle = "#000";
      ctx.font = "bold 20px sans-serif";
      ctx.fillText((currentScene.tipe || "scene").toUpperCase(), 65, 108);

      // Teks Konten Scene
      ctx.fillStyle = "#ffffff";
      drawWrappedText(currentScene.teksUtama || "", 50, 740, 620, 48, 36);

      // Progress bar bawah
      const progress = Math.min(1, elapsed / durasi);
      ctx.fillStyle = "#334155";
      ctx.fillRect(50, 1220, 620, 10);
      ctx.fillStyle = "#22c55e";
      ctx.fillRect(50, 1220, 620 * progress, 10);

      requestAnimationFrame(renderFrame);
    }

    function startPlayback() {
      isPlaying = true;
      currentSceneIndex = 0;
      sceneStartTime = 0;
      requestAnimationFrame(renderFrame);
    }

    document.getElementById("btnReplay").addEventListener("click", () => {
      startPlayback();
    });

    document.getElementById("btnDownload").addEventListener("click", () => {
      recordedChunks = [];
      const stream = canvas.captureStream(30);
      mediaRecorder = new MediaRecorder(stream, { mimeType: "video/webm" });

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) recordedChunks.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunks, { type: "video/webm" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "video-affiliate-hyperframes.webm";
        a.click();
        statusText.innerText = "Video berhasil diunduh!";
      };

      mediaRecorder.start();
      startPlayback();
      statusText.innerText = "Merekam video per scene... Mohon tunggu sampai selesai.";
    });

    // Jalankan pemutaran pertama saat dimuat
    startPlayback();
  </script>
</body>
</html>`;
}

const server = http.createServer((req, res) => {
  // CORS Headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  // Health check endpoint
  if (req.url === "/health" && req.method === "GET") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok", service: "hyperframes-local", port: PORT }));
    return;
  }

  // Render endpoint
  if (req.url === "/render" && req.method === "POST") {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });

    req.on("end", () => {
      try {
        const parsed = JSON.parse(body);
        lastRenderData = parsed;
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            ok: true,
            videoUrl: `http://localhost:${PORT}/preview`,
            message: "Render template siap diputar di browser.",
          }),
        );
      } catch {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: false, error: "Body JSON tidak valid." }));
      }
    });
    return;
  }

  // Preview & Download Player
  if (req.url.startsWith("/preview") && req.method === "GET") {
    const data = lastRenderData || {
      judul: "Demo Video",
      produkNama: "Produk Affiliate",
      scenes: [
        { id: 1, durasiDetik: 3, tipe: "hook", teksUtama: "Rekomendasi Produk Viral Hari Ini!" },
        { id: 2, durasiDetik: 4, tipe: "isi", teksUtama: "Praktis, awet, dan harganya sangat bersahabat." },
        { id: 3, durasiDetik: 3, tipe: "cta", teksUtama: "Link ada di bio atau komentar #affiliate" },
      ],
    };

    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(renderHtmlTemplate(data));
    return;
  }

  res.writeHead(404, { "Content-Type": "text/plain" });
  res.end("Not Found");
});

server.listen(PORT, () => {
  console.log(`[HyperFrames Local Service] Aktif di http://localhost:${PORT}`);
  console.log(`- Health Check: http://localhost:${PORT}/health`);
  console.log(`- Preview Player: http://localhost:${PORT}/preview`);
});
