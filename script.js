/* ==========================================================================
   20/10 Rực Rỡ • 11A2 K48 - Dynamic Composed Bouquet & Live Writing Script
   1. Chữ tự động bay vào ghép -> 2. Hoa to đa sắc bay ra rồi hợp thành 1 bó hoa -> 3. Mở thư viết tay
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  // --- Sound Synthesizer (Web Audio API) ---
  class SweetSynth {
    constructor() {
      this.ctx = null;
    }
    init() {
      if (!this.ctx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
          this.ctx = new AudioContext();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    }
    playNote(freq = 523.25, type = 'sine', duration = 0.25, gainVal = 0.1) {
      if (!this.ctx) return;
      try {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(freq * 1.25, this.ctx.currentTime + duration);

        gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + duration);
      } catch (e) {}
    }
    playHarpChord() {
      if (!this.ctx) return;
      const freqs = [523.25, 659.25, 783.99, 1046.50];
      freqs.forEach((f, idx) => {
        setTimeout(() => this.playNote(f, 'triangle', 0.5, 0.08), idx * 80);
      });
    }
    playPaperRustle() {
      if (!this.ctx) return;
      try {
        const bufferSize = this.ctx.sampleRate * 0.25;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = (Math.random() * 2 - 1) * 0.04 * (1 - i / bufferSize);
        }
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(700, this.ctx.currentTime);
        noise.connect(filter);
        filter.connect(this.ctx.destination);
        noise.start();
      } catch (e) {}
    }
  }

  const soundSynth = new SweetSynth();

  // --- Background Audio Manager ---
  const audioEl = document.getElementById('bg-audio');

  function toggleMusic(forcePlay = false) {
    soundSynth.init();
    if (!audioEl) return;
    if (forcePlay || audioEl.paused) {
      audioEl.play().catch(err => {
        console.warn('Audio play restricted:', err);
      });
    } else {
      audioEl.pause();
    }
  }

  // --- Ambient Canvas (Soft Falling Petals & Fairy Dust) ---
  const ambientCanvas = document.getElementById('ambient-canvas');
  const ambientCtx = ambientCanvas.getContext('2d');
  let ambientWidth, ambientHeight;
  const particles = [];
  const particleCount = 35;

  function resizeAmbientCanvas() {
    ambientWidth = ambientCanvas.width = window.innerWidth;
    ambientHeight = ambientCanvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resizeAmbientCanvas);
  resizeAmbientCanvas();

  class AmbientPetal {
    constructor() {
      this.reset(true);
    }
    reset(initial = false) {
      this.x = Math.random() * ambientWidth;
      this.y = initial ? Math.random() * ambientHeight : -20;
      this.size = Math.random() * 5 + 3;
      this.speedY = Math.random() * 0.6 + 0.35;
      this.speedX = (Math.random() - 0.5) * 0.5;
      this.rotation = Math.random() * 360;
      this.rotSpeed = (Math.random() - 0.5) * 1.2;
      this.opacity = Math.random() * 0.45 + 0.2;
      this.type = Math.random() > 0.35 ? 'petal' : 'fairy';
      this.color = Math.random() > 0.5 ? '240, 98, 146' : '255, 171, 145';
    }
    update() {
      this.y += this.speedY;
      this.x += this.speedX + Math.sin(this.y * 0.012) * 0.4;
      this.rotation += this.rotSpeed;
      if (this.y > ambientHeight + 20) this.reset();
    }
    draw(ctx) {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate((this.rotation * Math.PI) / 180);
      ctx.fillStyle = `rgba(${this.color}, ${this.opacity})`;

      if (this.type === 'petal') {
        ctx.beginPath();
        ctx.ellipse(0, 0, this.size * 1.5, this.size * 0.9, 0, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, this.size * 0.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  for (let i = 0; i < particleCount; i++) {
    particles.push(new AmbientPetal());
  }

  function animateAmbient() {
    ambientCtx.clearRect(0, 0, ambientWidth, ambientHeight);
    for (let i = 0; i < particles.length; i++) {
      particles[i].update();
      particles[i].draw(ambientCtx);
    }
    requestAnimationFrame(animateAmbient);
  }
  animateAmbient();

  // --- Phase Navigation Controller ---
  const phaseStart = document.getElementById('phase-start');
  const phaseAssembleText = document.getElementById('phase-assemble-text');
  const phaseGatherBouquet = document.getElementById('phase-gather-bouquet');
  const phaseLetter = document.getElementById('phase-letter');

  function showPhase(targetPhase) {
    [phaseStart, phaseAssembleText, phaseGatherBouquet, phaseLetter].forEach(p => {
      p.classList.remove('active');
    });
    targetPhase.classList.add('active');
  }

  // ==========================================================================
  // PHASE 0 -> PHASE 1: BẮT ĐẦU VÀ CHỮ TỰ ĐỘNG BAY VÀO GHÉP
  // ==========================================================================
  const btnStartMagic = document.getElementById('btn-start-magic');
  const lineClass = document.getElementById('line-class');
  const lineMain = document.getElementById('line-main');
  const lineSub = document.getElementById('line-sub');

  if (btnStartMagic) {
    btnStartMagic.addEventListener('click', () => {
      toggleMusic(true);
      soundSynth.playHarpChord();
      showPhase(phaseAssembleText);
      startAutoTextAssembly();
    });
  }

  function createCharSpans(text, container) {
    container.innerHTML = '';
    const spans = [];
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      const span = document.createElement('span');
      span.className = 'letter-char';
      span.textContent = ch === ' ' ? '\u00A0' : ch;

      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * 250 + 200;
      const startX = Math.cos(angle) * distance;
      const startY = Math.sin(angle) * distance;
      const startRot = (Math.random() - 0.5) * 90;

      span.style.setProperty('--start-x', `${startX}px`);
      span.style.setProperty('--start-y', `${startY}px`);
      span.style.setProperty('--start-rot', `${startRot}deg`);

      container.appendChild(span);
      spans.push(span);
    }
    return spans;
  }

  function startAutoTextAssembly() {
    const spans1 = createCharSpans('11A2 K48 • THPT LẠNG GIANG 3', lineClass);
    const spans2 = createCharSpans('CHÚC MỪNG 20/10', lineMain);
    const spans3 = createCharSpans('Gửi Những Đóa Hoa Rạng Rỡ & Tỏa Sáng Nhất ♡', lineSub);

    let delay = 300;

    spans1.forEach((span, i) => {
      setTimeout(() => {
        span.classList.add('locked');
        soundSynth.playNote(520 + i * 25, 'sine', 0.12, 0.05);
      }, delay);
      delay += 80;
    });

    delay += 250;

    spans2.forEach((span, i) => {
      setTimeout(() => {
        span.classList.add('locked');
        soundSynth.playNote(580 + (i % 7) * 40, 'sine', 0.12, 0.06);
      }, delay);
      delay += 70;
    });

    delay += 300;

    spans3.forEach((span, i) => {
      setTimeout(() => {
        span.classList.add('locked');
        soundSynth.playNote(650 + (i % 8) * 30, 'triangle', 0.1, 0.04);
      }, delay);
      delay += 45;
    });

    setTimeout(() => {
      soundSynth.playHarpChord();

      setTimeout(() => {
        showPhase(phaseGatherBouquet);
        startFlowerGathering();
      }, 3200);

    }, delay + 200);
  }

  // ==========================================================================
  // PHASE 2: CÁC BÔNG HOA TO ĐẸP ĐA SẮC BAY RA RỒI HỢP THÀNH BÓ HOA
  // ==========================================================================
  const flyingFlowersLayer = document.getElementById('flying-flowers-layer');
  const composedBouquetStage = document.getElementById('composed-bouquet-stage');
  const bouquetFoliageBase = document.getElementById('bouquet-foliage-base');
  const bouquetFlowersCluster = document.getElementById('bouquet-flowers-cluster');
  const bouquetSatinRibbon = document.getElementById('bouquet-satin-ribbon');
  const btnProceedLetter = document.getElementById('btn-proceed-letter');
  const bouquetConfettiCanvas = document.getElementById('bouquet-confetti-canvas');

  // Real Photographic Flowers with Transparent Backgrounds (Đa sắc, to đẹp, chân thực)
  const VIBRANT_FLOWERS = [
    {
      id: 'rose-red',
      name: 'Hoa Hồng Đỏ Nhung',
      src: 'flower_red_rose.png',
      slotX: 165,
      slotY: 92,
      scale: 1.15,
      rot: -2,
      zIndex: 5
    },
    {
      id: 'sunflower-gold',
      name: 'Hoa Hướng Dương Rực Rỡ',
      src: 'flower_sunflower.png',
      slotX: 165,
      slotY: 38,
      scale: 0.95,
      rot: 5,
      zIndex: 2
    },
    {
      id: 'rose-pink-1',
      name: 'Hoa Hồng Phấn Dịu Ngọt',
      src: 'flower_pink_rose.png',
      slotX: 112,
      slotY: 76,
      scale: 1.05,
      rot: -18,
      zIndex: 3
    },
    {
      id: 'peony-purple',
      name: 'Hoa Mẫu Đơn Tím Quý Phái',
      src: 'flower_purple_peony.png',
      slotX: 218,
      slotY: 76,
      scale: 1.05,
      rot: 18,
      zIndex: 3
    },
    {
      id: 'daisy-white-1',
      name: 'Hoa Cúc Họa Mi Trắng',
      src: 'flower_white_daisy.png',
      slotX: 114,
      slotY: 140,
      scale: 0.95,
      rot: -12,
      zIndex: 4
    },
    {
      id: 'rose-pink-2',
      name: 'Hoa Hồng Dịu Dàng',
      src: 'flower_pink_rose.png',
      slotX: 216,
      slotY: 140,
      scale: 1.0,
      rot: 15,
      zIndex: 4
    },
    {
      id: 'daisy-white-2',
      name: 'Hoa Cúc Họa Mi Nhỏ',
      src: 'flower_white_daisy.png',
      slotX: 165,
      slotY: 155,
      scale: 0.9,
      rot: 8,
      zIndex: 6
    }
  ];

  // Pink Satin Ribbon Bow SVG
  const RIBBON_SVG = `
    <svg viewBox="0 0 140 70" width="100%" height="100%">
      <defs>
        <linearGradient id="grad-ribbon" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#ff80ab"/>
          <stop offset="50%" stop-color="#f06292"/>
          <stop offset="100%" stop-color="#e91e63"/>
        </linearGradient>
      </defs>
      <!-- Left bow loop -->
      <path d="M70 25 C50 5 25 10 25 25 C25 40 55 35 70 25 Z" fill="url(#grad-ribbon)"/>
      <!-- Right bow loop -->
      <path d="M70 25 C90 5 115 10 115 25 C115 40 85 35 70 25 Z" fill="url(#grad-ribbon)"/>
      <!-- Center knot -->
      <ellipse cx="70" cy="25" rx="10" ry="12" fill="#d81b60"/>
      <!-- Flowing tails -->
      <path d="M66 32 C60 48 45 62 40 68 C45 65 60 55 68 35 Z" fill="#e91e63"/>
      <path d="M74 32 C80 48 95 62 100 68 C95 65 80 55 72 35 Z" fill="#e91e63"/>
    </svg>
  `;

  function startFlowerGathering() {
    flyingFlowersLayer.innerHTML = '';
    bouquetFlowersCluster.innerHTML = '';
    bouquetFoliageBase.innerHTML = '<img src="bouquet_foliage.png" alt="Bouquet Foliage">';
    bouquetSatinRibbon.innerHTML = RIBBON_SVG;
    composedBouquetStage.classList.remove('revealed');

    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;

    const floatingItems = [];

    // Step 1: Spawn the big vibrant flowers flying out across screen
    VIBRANT_FLOWERS.forEach((flower, i) => {
      const el = document.createElement('div');
      el.className = 'flying-flower-item';
      el.innerHTML = `<img src="${flower.src}" alt="${flower.name}">`;

      // Outer perimeter coordinates
      const angle = (i / VIBRANT_FLOWERS.length) * Math.PI * 2;
      const dist = Math.max(window.innerWidth, window.innerHeight) * 0.52 + 50;
      const startX = centerX + Math.cos(angle) * dist;
      const startY = centerY + Math.sin(angle) * dist;

      el.style.left = `${startX}px`;
      el.style.top = `${startY}px`;
      el.style.transform = `translate(-50%, -50%) scale(0.6) rotate(${Math.random() * 360}deg)`;

      flyingFlowersLayer.appendChild(el);
      floatingItems.push({ el, flower, angle, startX, startY });
    });

    // Step 2: Swoop into swirling motion across screen
    setTimeout(() => {
      floatingItems.forEach((item, idx) => {
        setTimeout(() => {
          const swirlX = centerX + Math.cos(item.angle + 0.7) * 165;
          const swirlY = centerY + Math.sin(item.angle + 0.7) * 165;
          item.el.style.left = `${swirlX}px`;
          item.el.style.top = `${swirlY}px`;
          item.el.style.transform = `translate(-50%, -50%) scale(1.2) rotate(${item.angle * 60}deg)`;
          soundSynth.playNote(520 + idx * 45, 'sine', 0.12, 0.04);
        }, idx * 90);
      });
    }, 200);

    // Step 3: All big flowers gather into the center to ASSEMBLE the bouquet!
    setTimeout(() => {
      floatingItems.forEach((item, idx) => {
        setTimeout(() => {
          item.el.style.transition = 'all 1.1s cubic-bezier(0.5, 0, 0.2, 1)';
          item.el.style.left = `${centerX}px`;
          item.el.style.top = `${centerY}px`;
          item.el.style.transform = `translate(-50%, -50%) scale(0.2) rotate(720deg)`;
          item.el.style.opacity = '0';
        }, idx * 70);
      });

      // Construct the assembled bouquet flower slots exactly as they converge!
      setTimeout(() => {
        // Place each flower inside the assembled bouquet stage
        VIBRANT_FLOWERS.forEach((flower, idx) => {
          const slot = document.createElement('div');
          slot.className = 'bouquet-flower-slot';
          slot.style.left = `${flower.slotX}px`;
          slot.style.top = `${flower.slotY}px`;
          slot.style.zIndex = flower.zIndex;
          slot.style.setProperty('--base-rot', `${flower.rot}deg`);
          slot.style.setProperty('--base-scale', `${flower.scale}`);
          slot.style.animationDelay = `${idx * 0.4}s`;
          slot.style.transform = `translate(-50%, -50%) scale(${flower.scale}) rotate(${flower.rot}deg)`;
          slot.innerHTML = `<img src="${flower.src}" alt="${flower.name}">`;
          bouquetFlowersCluster.appendChild(slot);
        });

        soundSynth.playHarpChord();
        composedBouquetStage.classList.add('revealed');
        triggerBouquetConfetti();

      }, VIBRANT_FLOWERS.length * 70 + 750);

    }, 2200);
  }

  function triggerBouquetConfetti() {
    if (!bouquetConfettiCanvas) return;
    const ctx = bouquetConfettiCanvas.getContext('2d');
    bouquetConfettiCanvas.width = window.innerWidth;
    bouquetConfettiCanvas.height = window.innerHeight;

    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    const confetti = [];

    for (let i = 0; i < 75; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 6 + 2;
      confetti.push({
        x: centerX,
        y: centerY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 5 + 3,
        color: ['#ff1744', '#fbc02d', '#ab47bc', '#ff7043', '#ffffff', '#f06292'][Math.floor(Math.random() * 6)],
        alpha: 1
      });
    }

    function renderConfetti() {
      ctx.clearRect(0, 0, bouquetConfettiCanvas.width, bouquetConfettiCanvas.height);
      let alive = false;
      confetti.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.05;
        p.alpha -= 0.015;
        if (p.alpha > 0) {
          alive = true;
          ctx.save();
          ctx.globalAlpha = p.alpha;
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      });
      if (alive) requestAnimationFrame(renderConfetti);
    }
    renderConfetti();
  }

  if (btnProceedLetter) {
    btnProceedLetter.addEventListener('click', () => {
      soundSynth.playHarpChord();
      showPhase(phaseLetter);
      resetEnvelopeState();
    });
  }

  // ==========================================================================
  // PHASE 3: BỨC THƯ MỞ RA & HIỆU ỨNG CHỮ VIẾT TAY TỰ ĐỘNG (LIVE HANDWRITING)
  // ==========================================================================
  const envelopeWrapper = document.getElementById('envelope-wrapper');
  const envTopFlap = document.getElementById('env-top-flap');
  const goldWaxSeal = document.getElementById('gold-wax-seal');
  const unfoldedLetterCard = document.getElementById('unfolded-letter-card');
  const parchmentPaper = document.getElementById('parchment-paper');

  const typewriterHeading = document.getElementById('typewriter-heading');
  const typewriterBody = document.getElementById('typewriter-body');
  const letterSignatureRow = document.getElementById('letter-signature-row');

  let isTypingActive = false;
  let skipTypingTriggered = false;

  const LETTER_CONTENT = {
    heading: "Gửi những đóa hoa tuyệt vời của 11A2 K48,",
    paragraphs: [
      "Hôm nay là 20/10, ngày tôn vinh phái đẹp, và với tập thể nam sinh 11A2 Khóa 48 trường THPT Lạng Giang Số 3, các bạn chính là những đóa hoa rạng ngời và dịu dàng nhất!",
      "Cảm ơn các bạn vì luôn mang đến sự tươi vui, ấm áp và những tiếng cười rộn rã cho lớp mình. Dù là những giờ học căng thẳng trước kỳ thi hay những buổi sinh hoạt dưới mái trường THPT Lạng Giang 3 thân yêu, 11A2 chỉ thực sự trọn vẹn khi có nụ cười của các bạn.",
      "Chúc các bạn luôn rạng rỡ, tự tin theo đuổi ước mơ của chính mình, đạt thật nhiều điểm 9 điểm 10 trong mọi kỳ thi và luôn mỉm cười hạnh phúc mỗi ngày.",
      "“Thanh xuân của chúng ta đẹp nhất chính là vì có nhau dưới mái trường THPT Lạng Giang Số 3 thân thương này!”"
    ]
  };

  const letterBurstFlowersLayer = document.getElementById('letter-burst-flowers-layer');

  const BURST_FLOWER_SRCS = [
    'flower_red_rose.png',
    'flower_pink_rose.png',
    'flower_sunflower.png',
    'flower_purple_peony.png',
    'flower_white_daisy.png'
  ];

  function resetEnvelopeState() {
    envelopeWrapper.classList.remove('fade-out');
    envTopFlap.classList.remove('opened');
    goldWaxSeal.classList.remove('broken');
    unfoldedLetterCard.classList.add('hidden');
    unfoldedLetterCard.classList.remove('revealed');
    letterSignatureRow.classList.add('hidden');
    typewriterHeading.innerHTML = '';
    typewriterBody.innerHTML = '';
    if (letterBurstFlowersLayer) letterBurstFlowersLayer.innerHTML = '';
    isTypingActive = false;
    skipTypingTriggered = false;
  }

  function triggerLetterFlowersBurst() {
    if (!letterBurstFlowersLayer) return;
    letterBurstFlowersLayer.innerHTML = '';

    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;

    const flowerCount = 22; // 22 bông hoa thật bắn bung tỏa mọi hướng
    const burstItems = [];

    for (let i = 0; i < flowerCount; i++) {
      const el = document.createElement('div');
      el.className = 'burst-flower-item';

      const src = BURST_FLOWER_SRCS[i % BURST_FLOWER_SRCS.length];
      const size = Math.floor(Math.random() * 26 + 36); // 36px đến 62px
      el.style.width = `${size}px`;
      el.style.height = `${size}px`;
      el.innerHTML = `<img src="${src}" alt="Flower">`;

      // Xuất phát từ tâm phong thư
      el.style.left = `${centerX}px`;
      el.style.top = `${centerY}px`;
      el.style.opacity = '1';
      el.style.transform = `translate(-50%, -50%) scale(0.2) rotate(0deg)`;

      letterBurstFlowersLayer.appendChild(el);

      // Quỹ đạo bắn tỏa tròn 360 độ
      const angle = (i / flowerCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.35;
      const dist = Math.min(window.innerWidth, window.innerHeight) * (0.32 + Math.random() * 0.26);
      const targetX = centerX + Math.cos(angle) * dist;
      const targetY = centerY + Math.sin(angle) * dist;
      const targetRot = (Math.random() - 0.5) * 540;
      const targetScale = 0.9 + Math.random() * 0.35;

      burstItems.push({
        el,
        targetX,
        targetY,
        targetRot,
        targetScale,
        delay: Math.random() * 70
      });
    }

    // Giai đoạn 1: Bắn bung tỏa ra ngoài như pháo hoa
    requestAnimationFrame(() => {
      burstItems.forEach((item, idx) => {
        setTimeout(() => {
          item.el.style.transition = 'left 0.85s cubic-bezier(0.12, 0.88, 0.32, 1.25), top 0.85s cubic-bezier(0.12, 0.88, 0.32, 1.25), transform 0.85s cubic-bezier(0.12, 0.88, 0.32, 1.25), opacity 0.4s ease';
          item.el.style.left = `${item.targetX}px`;
          item.el.style.top = `${item.targetY}px`;
          item.el.style.transform = `translate(-50%, -50%) scale(${item.targetScale}) rotate(${item.targetRot}deg)`;

          if (idx % 3 === 0) {
            soundSynth.playNote(650 + Math.random() * 220, 'triangle', 0.12, 0.035);
          }
        }, item.delay);
      });
    });

    // Giai đoạn 2: Lơ lửng nhẹ nhàng bay xuống và mờ dần
    setTimeout(() => {
      burstItems.forEach((item, idx) => {
        setTimeout(() => {
          item.el.style.transition = 'top 2.2s cubic-bezier(0.25, 0.46, 0.45, 0.94), left 2.2s ease-out, transform 2.2s ease, opacity 2s ease';
          const driftY = item.targetY + Math.random() * 75 + 40;
          const driftX = item.targetX + (Math.random() - 0.5) * 50;
          item.el.style.left = `${driftX}px`;
          item.el.style.top = `${driftY}px`;
          item.el.style.transform = `translate(-50%, -50%) scale(${item.targetScale * 0.8}) rotate(${item.targetRot + 45}deg)`;
          item.el.style.opacity = '0';
        }, idx * 35);
      });
    }, 1100);

    // Dọn dẹp DOM sau khi hoa bay hết
    setTimeout(() => {
      if (letterBurstFlowersLayer) letterBurstFlowersLayer.innerHTML = '';
    }, 3600);
  }

  function handleOpenLetter() {
    if (goldWaxSeal.classList.contains('broken')) return;

    soundSynth.playPaperRustle();
    soundSynth.playNote(783.99, 'triangle', 0.35, 0.1);

    goldWaxSeal.classList.add('broken');

    setTimeout(() => {
      envTopFlap.classList.add('opened');
    }, 200);

    setTimeout(() => {
      soundSynth.playHarpChord();
      envelopeWrapper.classList.add('fade-out');
      unfoldedLetterCard.classList.remove('hidden');

      setTimeout(() => {
        unfoldedLetterCard.classList.add('revealed');
        triggerLetterFlowersBurst();
        startLiveHandwriting();
      }, 50);

    }, 850);
  }

  if (goldWaxSeal) goldWaxSeal.addEventListener('click', handleOpenLetter);
  if (envTopFlap) envTopFlap.addEventListener('click', handleOpenLetter);

  if (parchmentPaper) {
    parchmentPaper.addEventListener('click', () => {
      if (isTypingActive && !skipTypingTriggered) {
        skipTypingTriggered = true;
      }
    });
  }

  // --- LIVE HANDWRITING / TYPEWRITING ENGINE ---
  async function startLiveHandwriting() {
    isTypingActive = true;
    skipTypingTriggered = false;

    typewriterHeading.innerHTML = '<span class="typing-cursor"></span>';
    typewriterBody.innerHTML = '';

    await typeTextInto(LETTER_CONTENT.heading, typewriterHeading, 32);
    if (skipTypingTriggered) return finishTypingInstantly();

    for (let i = 0; i < LETTER_CONTENT.paragraphs.length; i++) {
      if (skipTypingTriggered) return finishTypingInstantly();
      const pText = LETTER_CONTENT.paragraphs[i];
      const pEl = document.createElement('p');
      if (i === LETTER_CONTENT.paragraphs.length - 1) {
        pEl.className = 'letter-quote-callout';
      }
      pEl.innerHTML = '<span class="typing-cursor"></span>';
      typewriterBody.appendChild(pEl);

      await typeTextInto(pText, pEl, 24);
      await sleep(150);
    }

    finishTypingGracefully();
  }

  function typeTextInto(text, container, baseSpeed = 26) {
    return new Promise(resolve => {
      let charIdx = 0;
      const cursor = container.querySelector('.typing-cursor');

      function nextChar() {
        if (skipTypingTriggered) {
          resolve();
          return;
        }
        if (charIdx < text.length) {
          const char = text[charIdx];
          const textNode = document.createTextNode(char);
          container.insertBefore(textNode, cursor);
          charIdx++;

          let delay = baseSpeed;
          if (char === ',' || char === ';') delay = 130;
          if (char === '.' || char === '!' || char === '?') delay = 200;

          if (charIdx % 12 === 0) {
            soundSynth.playNote(400 + Math.random() * 80, 'sine', 0.05, 0.02);
          }

          setTimeout(nextChar, delay);
        } else {
          cursor.remove();
          resolve();
        }
      }
      nextChar();
    });
  }

  function finishTypingInstantly() {
    typewriterHeading.textContent = LETTER_CONTENT.heading;
    typewriterBody.innerHTML = '';
    LETTER_CONTENT.paragraphs.forEach((pText, idx) => {
      const p = document.createElement('p');
      if (idx === LETTER_CONTENT.paragraphs.length - 1) {
        p.className = 'letter-quote-callout';
      }
      p.textContent = pText;
      typewriterBody.appendChild(p);
    });
    finishTypingGracefully();
  }

  function finishTypingGracefully() {
    isTypingActive = false;
    document.querySelectorAll('.typing-cursor').forEach(c => c.remove());
    letterSignatureRow.classList.remove('hidden');
    soundSynth.playHarpChord();
  }

  function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
  }
});
