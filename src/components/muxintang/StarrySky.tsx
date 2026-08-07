'use client';

import { useEffect, useRef } from 'react';

// ============ 类型定义 ============
interface Star {
  x: number;
  y: number;
  size: number;
  baseOpacity: number;
  twinkleSpeed: number;
  twinkleOffset: number;
  color: string;
  layer: 0 | 1 | 2 | 3; // 0=远星 1=中星 2=近星 3=巨星
}

interface Nebula {
  x: number;
  y: number;
  radius: number;
  colorRgb: string;
  driftSpeed: number;
  phase: number;
  baseOpacity: number;
}

interface Particle {
  x: number;
  y: number;
  size: number;
  speed: number;
  opacity: number;
  drift: number;
  driftRange: number;
}

interface ShootingStar {
  x: number;
  y: number;
  length: number;
  speed: number;
  angle: number;
  life: number;
  maxLife: number;
}

// ============ 辅助函数 ============
function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// ============ 主组件 ============
export default function StarrySky() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // —— DPR 适配，确保高清屏清晰 ——
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = window.innerWidth + 'px';
      canvas.style.height = window.innerHeight + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    const W = () => window.innerWidth;
    const H = () => window.innerHeight;

    // ============ Layer 1: 星云（6 团，深邃玄幻） ============
    const nebulae: Nebula[] = [
      { x: W() * 0.15, y: H() * 0.20, radius: 420, colorRgb: '106, 58, 162',  driftSpeed: 0.12, phase: 0,             baseOpacity: 0.22 },
      { x: W() * 0.85, y: H() * 0.80, radius: 450, colorRgb: '30, 58, 138',   driftSpeed: 0.10, phase: Math.PI,        baseOpacity: 0.20 },
      { x: W() * 0.50, y: H() * 0.50, radius: 320, colorRgb: '212, 175, 55',  driftSpeed: 0.04, phase: Math.PI * 0.5,  baseOpacity: 0.14 },
      { x: W() * 0.30, y: H() * 0.90, radius: 380, colorRgb: '80, 30, 120',   driftSpeed: 0.08, phase: Math.PI * 1.5,  baseOpacity: 0.18 },
      { x: W() * 0.75, y: H() * 0.15, radius: 350, colorRgb: '20, 40, 100',   driftSpeed: 0.09, phase: Math.PI * 0.3,  baseOpacity: 0.16 },
      { x: W() * 0.90, y: H() * 0.50, radius: 300, colorRgb: '139, 69, 19',   driftSpeed: 0.06, phase: Math.PI * 0.7,  baseOpacity: 0.12 },
    ];

    // ============ Layer 2: 星星（420 颗，4 层深度） ============
    const stars: Star[] = [];
    const starCount = 420;
    for (let i = 0; i < starCount; i++) {
      const r = Math.random();
      const layer: 0 | 1 | 2 | 3 = r < 0.45 ? 0 : r < 0.75 ? 1 : r < 0.93 ? 2 : 3;
      const isGold = layer === 3 || Math.random() < 0.12;
      const color = isGold
        ? '#D4AF37'
        : Math.random() > 0.85
          ? '#b0c4ff'
          : Math.random() > 0.70
            ? '#ffe4b5'
            : '#ffffff';

      stars.push({
        x: Math.random() * W(),
        y: Math.random() * H(),
        size:
          layer === 0 ? Math.random() * 0.7 + 0.2
          : layer === 1 ? Math.random() * 1.1 + 0.4
          : layer === 2 ? Math.random() * 1.5 + 0.6
          :               Math.random() * 2.0 + 1.0,
        baseOpacity:
          layer === 0 ? Math.random() * 0.35 + 0.15
          : layer === 1 ? Math.random() * 0.40 + 0.25
          : layer === 2 ? Math.random() * 0.45 + 0.35
          :               Math.random() * 0.30 + 0.60,
        twinkleSpeed: Math.random() * 0.018 + 0.004,
        twinkleOffset: Math.random() * Math.PI * 2,
        color,
        layer,
      });
    }

    // ============ Layer 3: 星尘粒子（70 个，缓慢上升） ============
    const particles: Particle[] = [];
    for (let i = 0; i < 70; i++) {
      particles.push({
        x: Math.random() * W(),
        y: Math.random() * H(),
        size: Math.random() * 1.2 + 0.3,
        speed: Math.random() * 0.15 + 0.03,
        opacity: Math.random() * 0.4 + 0.08,
        drift: Math.random() * Math.PI * 2,
        driftRange: Math.random() * 0.4 + 0.1,
      });
    }

    // ============ Layer 4: 流星 ============
    const shootingStars: ShootingStar[] = [];
    let nextShootingStar = Date.now() + Math.random() * 5000 + 3000;

    const spawnShootingStar = () => {
      shootingStars.push({
        x: Math.random() * W() * 0.5,
        y: Math.random() * H() * 0.3,
        length: Math.random() * 80 + 50,
        speed: Math.random() * 5 + 3,
        angle: Math.PI / 4 + (Math.random() - 0.5) * 0.3,
        life: 0,
        maxLife: Math.random() * 50 + 50,
      });
    };

    // ============ 动画循环 ============
    let time = 0;

    const animate = () => {
      ctx.clearRect(0, 0, W(), H());

      // —— 1. 绘制星云（最底层） ——
      for (const n of nebulae) {
        n.phase += n.driftSpeed * 0.006;
        const breath = n.baseOpacity + Math.sin(n.phase) * 0.06;
        const dx = Math.sin(time * 0.00012 * n.driftSpeed) * 50;
        const dy = Math.cos(time * 0.00012 * n.driftSpeed) * 35;
        const cx = n.x + dx;
        const cy = n.y + dy;

        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, n.radius);
        grad.addColorStop(0,   `rgba(${n.colorRgb}, ${breath})`);
        grad.addColorStop(0.3, `rgba(${n.colorRgb}, ${breath * 0.5})`);
        grad.addColorStop(0.6, `rgba(${n.colorRgb}, ${breath * 0.15})`);
        grad.addColorStop(1,   `rgba(${n.colorRgb}, 0)`);

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cx, cy, n.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      // —— 2. 绘制星尘粒子（上升 + 漂浮） ——
      for (const p of particles) {
        p.drift += 0.008;
        p.y -= p.speed;
        p.x += Math.sin(p.drift) * p.driftRange;
        if (p.y < -10) {
          p.y = H() + 10;
          p.x = Math.random() * W();
        }

        const glowR = p.size * 4;
        const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, glowR);
        glow.addColorStop(0,   `rgba(212, 175, 55, ${p.opacity * 0.7})`);
        glow.addColorStop(0.4, `rgba(255, 200, 100, ${p.opacity * 0.25})`);
        glow.addColorStop(1,   `rgba(212, 175, 55, 0)`);
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(p.x, p.y, glowR, 0, Math.PI * 2);
        ctx.fill();
      }

      // —— 3. 绘制星星（4 层深度） ——
      for (const s of stars) {
        s.twinkleOffset += s.twinkleSpeed;
        const tw = Math.sin(s.twinkleOffset);
        const op = Math.max(0.05, Math.min(1, s.baseOpacity + tw * 0.35));

        // 外层光晕
        const glowR = s.size * (s.layer === 3 ? 8 : s.layer === 2 ? 6 : s.layer === 1 ? 4 : 2.5);
        const glow = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, glowR);
        glow.addColorStop(0,   hexToRgba(s.color, op * 0.85));
        glow.addColorStop(0.2, hexToRgba(s.color, op * 0.35));
        glow.addColorStop(0.5, hexToRgba(s.color, op * 0.08));
        glow.addColorStop(1,   hexToRgba(s.color, 0));
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(s.x, s.y, glowR, 0, Math.PI * 2);
        ctx.fill();

        // 核心星点
        ctx.fillStyle = hexToRgba(s.color, Math.min(1, op + 0.25));
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fill();

        // 近星 / 巨星：十字光芒
        if ((s.layer === 2 || s.layer === 3) && op > 0.55) {
          const ray = s.size * (s.layer === 3 ? 10 : 7);
          ctx.strokeStyle = hexToRgba(s.color, op * 0.30);
          ctx.lineWidth = s.layer === 3 ? 0.5 : 0.3;
          ctx.lineCap = 'round';

          ctx.beginPath();
          ctx.moveTo(s.x - ray, s.y);
          ctx.lineTo(s.x + ray, s.y);
          ctx.moveTo(s.x, s.y - ray);
          ctx.lineTo(s.x, s.y + ray);
          ctx.stroke();

          // 对角光芒（仅巨星）
          if (s.layer === 3) {
            const d = ray * 0.55;
            ctx.beginPath();
            ctx.moveTo(s.x - d, s.y - d);
            ctx.lineTo(s.x + d, s.y + d);
            ctx.moveTo(s.x + d, s.y - d);
            ctx.lineTo(s.x - d, s.y + d);
            ctx.stroke();
          }
        }
      }

      // —— 4. 绘制流星 ——
      for (let i = shootingStars.length - 1; i >= 0; i--) {
        const ss = shootingStars[i];
        ss.life++;
        if (ss.life >= ss.maxLife) {
          shootingStars.splice(i, 1);
          continue;
        }

        const fadeIn = Math.min(1, ss.life / 8);
        const fadeOut = Math.min(1, (ss.maxLife - ss.life) / 18);
        const alpha = fadeIn * fadeOut;

        ss.x += Math.cos(ss.angle) * ss.speed;
        ss.y += Math.sin(ss.angle) * ss.speed;

        const tailX = ss.x - Math.cos(ss.angle) * ss.length;
        const tailY = ss.y - Math.sin(ss.angle) * ss.length;

        const trail = ctx.createLinearGradient(tailX, tailY, ss.x, ss.y);
        trail.addColorStop(0,   'rgba(255, 255, 255, 0)');
        trail.addColorStop(0.3, `rgba(212, 175, 55, ${alpha * 0.3})`);
        trail.addColorStop(0.7, `rgba(255, 255, 255, ${alpha * 0.7})`);
        trail.addColorStop(1,   `rgba(255, 255, 255, ${alpha})`);

        ctx.strokeStyle = trail;
        ctx.lineWidth = 1.8;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(ss.x, ss.y);
        ctx.stroke();

        // 流星头部光晕
        const head = ctx.createRadialGradient(ss.x, ss.y, 0, ss.x, ss.y, 10);
        head.addColorStop(0,   `rgba(255, 255, 255, ${alpha})`);
        head.addColorStop(0.3, `rgba(212, 175, 55, ${alpha * 0.5})`);
        head.addColorStop(1,   'rgba(212, 175, 55, 0)');
        ctx.fillStyle = head;
        ctx.beginPath();
        ctx.arc(ss.x, ss.y, 10, 0, Math.PI * 2);
        ctx.fill();
      }

      // 生成新流星
      const now = Date.now();
      if (now > nextShootingStar && shootingStars.length < 2) {
        spawnShootingStar();
        nextShootingStar = now + Math.random() * 7000 + 4000;
      }

      time++;
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: -2 }}
    />
  );
}
