import React, { useEffect, useRef } from 'react';
import { useTheme } from '../context/ThemeContext';

/**
 * Animated Cryptographic Background Component
 * Features:
 * - Multi-layered parallax cryptographic field
 * - Geometric cipher lattice network with traveling packet pulses
 * - Floating cryptographic hash signatures (SHA-256, RSA-4096, HMAC, RFC-5322)
 * - Subtle binary / hex matrix stream columns
 * - Radiant ambient chromatic aurora orbs
 * - Retina/4K High-DPI canvas scaling
 * - Respects prefers-reduced-motion and pauses on inactive tab
 */
export default function CryptoBackground() {
  const canvasRef = useRef(null);
  const { isDark } = useTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let animationFrameId;
    let dpr = window.devicePixelRatio || 1;
    let width = window.innerWidth;
    let height = window.innerHeight;

    const setupCanvasSize = () => {
      dpr = window.devicePixelRatio || 1;
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform before scaling
      ctx.scale(dpr, dpr);
    };
    setupCanvasSize();

    const handleResize = () => {
      setupCanvasSize();
    };
    window.addEventListener('resize', handleResize);

    // Cryptographic hashes, protocol tokens, and cipher signatures
    const CRYPTO_TOKENS = [
      '0x7F4A', 'SHA-256', 'RSA-4096', 'RFC-5322', '01101001', 'HMAC-SHA512',
      'ECDSA-P256', 'AES-256-GCM', '0x9E3779B9', 'DKIM::VERIFIED', 'TLS_1.3',
      'MERKLE_ROOT', 'ED25519', 'HASH_CHAIN', '0xCAFEBABE', 'NONCE::4B',
      'CERT_OK', 'DKIM_SIG', '01011100', 'CIPHER::STREAM', 'PUBKEY_FP',
      'RFC_822', 'SPF::PASS', 'DMARC_PASS', '01000101', '0x84C7', '0x5A9C',
      'ZK_PROOF', 'BLAKE2B', 'CHACHA20', 'CIPHER_BLOCK', 'KEY_EXCHANGE'
    ];

    // 1. Floating text token particles
    const tokenCount = Math.min(Math.floor(width / 55), 32);
    const tokens = Array.from({ length: tokenCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vy: -(0.3 + Math.random() * 0.45),
      text: CRYPTO_TOKENS[Math.floor(Math.random() * CRYPTO_TOKENS.length)],
      opacity: 0.12 + Math.random() * 0.16,
      size: 10 + Math.floor(Math.random() * 3),
      isCyan: Math.random() > 0.65,
    }));

    // 2. Cryptographic lattice constellation nodes
    const nodeCount = Math.min(Math.floor(width / 42), 42);
    const nodes = Array.from({ length: nodeCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      radius: 1.5 + Math.random() * 1.5,
      pulse: Math.random() * Math.PI * 2,
    }));

    // 3. Subtle background binary / hex columns
    const streamColumns = Math.min(Math.floor(width / 140), 10);
    const streams = Array.from({ length: streamColumns }, (_, i) => ({
      x: (i + 0.5) * (width / streamColumns) + (Math.random() - 0.5) * 30,
      y: Math.random() * height,
      speed: 0.35 + Math.random() * 0.35,
      chars: Array.from({ length: 6 }, () => (Math.random() > 0.5 ? '1' : '0')),
    }));

    // Data pulses traveling along lattice lines
    const pulses = [];
    const MAX_DIST = 115;
    let lastPulseTime = 0;

    const render = (timestamp) => {
      ctx.clearRect(0, 0, width, height);

      // Light Mode: refined deep royal amethyst & ocean cyan
      // Dark Mode: luminous neon violet & sky cyan
      const primaryRgb = isDark ? '192, 132, 252' : '109, 40, 217';
      const accentRgb = isDark ? '56, 189, 248' : '2, 132, 199';

      // Layer A: Subtle Cryptographic Binary Streams (Deep Background)
      ctx.font = '10px "JetBrains Mono", Consolas, monospace';
      for (let s = 0; s < streams.length; s++) {
        const stream = streams[s];
        if (!prefersReducedMotion) {
          stream.y += stream.speed;
          if (stream.y > height + 90) {
            stream.y = -90;
            stream.x = (s + 0.5) * (width / streams.length) + (Math.random() - 0.5) * 30;
          }
        }
        for (let c = 0; c < stream.chars.length; c++) {
          const cy = stream.y + c * 15;
          if (cy >= -10 && cy <= height + 10) {
            const charAlpha = (1 - c / stream.chars.length) * (isDark ? 0.08 : 0.09);
            ctx.fillStyle = `rgba(${accentRgb}, ${charAlpha})`;
            ctx.fillText(stream.chars[c], stream.x, cy);
          }
        }
      }

      // Layer B: Cryptographic Lattice Constellation Mesh
      for (let i = 0; i < nodes.length; i++) {
        const n1 = nodes[i];

        if (!prefersReducedMotion) {
          n1.x += n1.vx;
          n1.y += n1.vy;
          n1.pulse += 0.02;

          if (n1.x < 0) n1.x = width;
          if (n1.x > width) n1.x = 0;
          if (n1.y < 0) n1.y = height;
          if (n1.y > height) n1.y = 0;
        }

        // Draw node with pulsing core
        const glow = 0.5 + Math.sin(n1.pulse) * 0.3;
        ctx.beginPath();
        ctx.arc(n1.x, n1.y, n1.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${primaryRgb}, ${isDark ? 0.35 * glow : 0.28 * glow})`;
        ctx.fill();

        // Connect nearby nodes with lattice threads
        for (let j = i + 1; j < nodes.length; j++) {
          const n2 = nodes[j];
          const dx = n1.x - n2.x;
          const dy = n1.y - n2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < MAX_DIST) {
            const alpha = (1 - dist / MAX_DIST) * (isDark ? 0.16 : 0.14);
            ctx.beginPath();
            ctx.moveTo(n1.x, n1.y);
            ctx.lineTo(n2.x, n2.y);
            ctx.strokeStyle = `rgba(${primaryRgb}, ${alpha})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();

            // Spawn traveling packet pulses
            if (!prefersReducedMotion && timestamp - lastPulseTime > 1600 && pulses.length < 5 && Math.random() < 0.008) {
              pulses.push({
                x1: n1.x,
                y1: n1.y,
                x2: n2.x,
                y2: n2.y,
                progress: 0,
                speed: 0.014 + Math.random() * 0.014,
              });
              lastPulseTime = timestamp;
            }
          }
        }
      }

      // Layer C: Traveling Cryptographic Data Packet Pulses
      for (let p = pulses.length - 1; p >= 0; p--) {
        const pulse = pulses[p];
        pulse.progress += pulse.speed;

        if (pulse.progress >= 1) {
          pulses.splice(p, 1);
          continue;
        }

        const px = pulse.x1 + (pulse.x2 - pulse.x1) * pulse.progress;
        const py = pulse.y1 + (pulse.y2 - pulse.y1) * pulse.progress;

        ctx.beginPath();
        ctx.arc(px, py, 2.2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${accentRgb}, ${isDark ? 0.8 : 0.65})`;
        ctx.shadowColor = `rgba(${accentRgb}, 0.75)`;
        ctx.shadowBlur = 5;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // Layer D: Floating Cryptographic Hash Signatures & Tokens
      ctx.textBaseline = 'middle';
      for (let k = 0; k < tokens.length; k++) {
        const t = tokens[k];

        if (!prefersReducedMotion) {
          t.y += t.vy;
          if (t.y < -20) {
            t.y = height + 20;
            t.x = Math.random() * width;
            t.text = CRYPTO_TOKENS[Math.floor(Math.random() * CRYPTO_TOKENS.length)];
          }
        }

        ctx.font = `${t.size}px "JetBrains Mono", "SF Mono", Menlo, Consolas, monospace`;
        const rgb = t.isCyan ? accentRgb : primaryRgb;
        ctx.fillStyle = `rgba(${rgb}, ${isDark ? t.opacity * 0.9 : t.opacity * 1.15})`;
        ctx.fillText(t.text, t.x, t.y);
      }

      if (!prefersReducedMotion) {
        animationFrameId = requestAnimationFrame(render);
      }
    };

    if (!prefersReducedMotion) {
      animationFrameId = requestAnimationFrame(render);
    } else {
      render(0);
    }

    const handleVisibilityChange = () => {
      if (document.hidden) {
        cancelAnimationFrame(animationFrameId);
      } else if (!prefersReducedMotion) {
        animationFrameId = requestAnimationFrame(render);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isDark]);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none transition-colors duration-300">
      {/* Luminous Cryptographic Ambient Aurora Orbs */}
      <div
        className="absolute -top-32 -left-32 w-[32rem] h-[32rem] rounded-full bg-gradient-to-br from-violet-400/20 via-purple-300/15 to-transparent dark:from-violet-900/20 dark:via-purple-950/15 blur-3xl animate-pulse pointer-events-none"
        style={{ animationDuration: '8s' }}
      />
      <div
        className="absolute top-1/4 -right-32 w-[30rem] h-[30rem] rounded-full bg-gradient-to-bl from-cyan-400/15 via-sky-300/10 to-transparent dark:from-cyan-900/15 dark:via-sky-950/10 blur-3xl animate-pulse pointer-events-none"
        style={{ animationDuration: '10s', animationDelay: '2s' }}
      />
      <div
        className="absolute -bottom-32 left-1/4 w-[34rem] h-[34rem] rounded-full bg-gradient-to-tr from-fuchsia-400/10 via-purple-200/15 to-transparent dark:from-fuchsia-950/10 dark:via-purple-900/15 blur-3xl animate-pulse pointer-events-none"
        style={{ animationDuration: '12s', animationDelay: '4s' }}
      />

      {/* Cyber Grid Texture Overlay */}
      <div className="absolute inset-0 cyber-grid-pattern opacity-40 dark:opacity-25 pointer-events-none" />

      {/* Interactive High-DPI Cryptographic Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full block"
      />
    </div>
  );
}
