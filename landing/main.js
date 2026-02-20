/* ============================================================
   WAYPOINT LANDING — main.js
   Single IIFE, 8 modules:
   Starfield | ScrollAnim | HeroDemoPlayer | InteractiveDemo
   CodeTabs  | CopyButtons | WaitlistForm  | Navbar
   ============================================================ */
(function () {
  'use strict';

  /* ─────────────────────────────────────────────
     1. STARFIELD — Canvas particle system
  ───────────────────────────────────────────── */
  const Starfield = (function () {
    const canvas = document.getElementById('starfield');
    if (!canvas) return { init: () => {} };
    const ctx = canvas.getContext('2d');
    let particles = [];
    let W, H, raf;

    function resize() {
      W = canvas.width  = window.innerWidth;
      H = canvas.height = window.innerHeight;
    }

    function createParticles(count) {
      particles = [];
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * W,
          y: Math.random() * H,
          r: Math.random() * 1.2 + 0.2,
          vx: (Math.random() - 0.5) * 0.12,
          vy: (Math.random() - 0.5) * 0.12,
          alpha: Math.random() * 0.6 + 0.1,
          pulse: false,
          pulsePhase: 0,
        });
      }
    }

    function pulseRandom() {
      const count = 3;
      const chosen = [];
      while (chosen.length < count) {
        const idx = Math.floor(Math.random() * particles.length);
        if (!chosen.includes(idx)) chosen.push(idx);
      }
      chosen.forEach(idx => {
        particles[idx].pulse = true;
        particles[idx].pulsePhase = 0;
      });
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);

      // Nebula overlays
      const gCyan = ctx.createRadialGradient(W * 0.2, H * 0.15, 0, W * 0.2, H * 0.15, W * 0.4);
      gCyan.addColorStop(0, 'rgba(0,229,255,0.04)');
      gCyan.addColorStop(1, 'transparent');
      ctx.fillStyle = gCyan;
      ctx.fillRect(0, 0, W, H);

      const gPurple = ctx.createRadialGradient(W * 0.8, H * 0.85, 0, W * 0.8, H * 0.85, W * 0.4);
      gPurple.addColorStop(0, 'rgba(124,58,237,0.06)');
      gPurple.addColorStop(1, 'transparent');
      ctx.fillStyle = gPurple;
      ctx.fillRect(0, 0, W, H);

      // Particles
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = W;
        if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H;
        if (p.y > H) p.y = 0;

        let r = p.r;
        let alpha = p.alpha;

        if (p.pulse) {
          p.pulsePhase += 0.05;
          const s = 1 + Math.sin(p.pulsePhase) * 2;
          r = p.r * s;
          alpha = p.alpha * (0.4 + 0.6 * Math.abs(Math.sin(p.pulsePhase)));
          if (p.pulsePhase > Math.PI * 2) {
            p.pulse = false;
            p.pulsePhase = 0;
          }
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(240,246,255,${alpha})`;
        ctx.fill();
      });

      raf = requestAnimationFrame(draw);
    }

    function init() {
      resize();
      createParticles(180);
      draw();
      window.addEventListener('resize', () => {
        resize();
        createParticles(180);
      });
      setInterval(pulseRandom, 4000);
    }

    return { init };
  })();

  /* ─────────────────────────────────────────────
     2. SCROLL ANIM — IntersectionObserver + CountUp
  ───────────────────────────────────────────── */
  const ScrollAnim = (function () {
    function initReveal() {
      const els = document.querySelectorAll('.will-animate');
      if (!els.length) return;

      const obs = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const el = entry.target;
            const delay = parseInt(el.dataset.delay || '0', 10);
            setTimeout(() => el.classList.add('animated'), delay);
            obs.unobserve(el);
          }
        });
      }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

      els.forEach(el => obs.observe(el));
    }

    function countUp(el, target, suffix, duration) {
      const start = performance.now();
      function step(now) {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        // ease out cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = Math.floor(eased * target);
        el.textContent = current.toLocaleString() + (suffix || '');
        if (progress < 1) requestAnimationFrame(step);
        else el.textContent = target.toLocaleString() + (suffix || '');
      }
      requestAnimationFrame(step);
    }

    function initCountUp() {
      const els = document.querySelectorAll('[data-count]');
      if (!els.length) return;

      const obs = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const el = entry.target;
            const target = parseInt(el.dataset.count, 10);
            const suffix = el.dataset.suffix || '';
            countUp(el, target, suffix, 1800);
            obs.unobserve(el);
          }
        });
      }, { threshold: 0.5 });

      els.forEach(el => obs.observe(el));
    }

    function init() {
      initReveal();
      initCountUp();
    }

    return { init };
  })();

  /* ─────────────────────────────────────────────
     3. HERO DEMO PLAYER — Auto-looping timeline
  ───────────────────────────────────────────── */
  const HeroDemoPlayer = (function () {
    // Helper: type text character by character
    function typeText(displayEl, text, msPerChar) {
      return new Promise(resolve => {
        let i = 0;
        displayEl.textContent = '';
        function next() {
          if (i < text.length) {
            displayEl.textContent += text[i++];
            setTimeout(next, msPerChar);
          } else {
            resolve();
          }
        }
        next();
      });
    }

    function addMessage(container, type, html) {
      const msg = document.createElement('div');
      msg.className = `wp-msg wp-msg--${type}`;
      msg.innerHTML = `<span class="wp-msg__text">${html}</span>`;
      container.appendChild(msg);
      container.scrollTop = container.scrollHeight;
      return msg;
    }

    function setActive(navItem) {
      document.querySelectorAll('#hero-panel ~ * .acme-nav__item, .hero__mockup .acme-nav__item').forEach(el => {
        el.classList.remove('acme-nav__item--active');
      });
      // More targeted:
      const sidebar = document.querySelector('.hero__mockup .acme-nav');
      if (sidebar) {
        sidebar.querySelectorAll('.acme-nav__item').forEach(el => el.classList.remove('acme-nav__item--active'));
        const target = sidebar.querySelector(`#${navItem}`);
        if (target) target.classList.add('acme-nav__item--active');
      }
    }

    const demos = [
      {
        query: 'upgrade my plan',
        navId: 'acme-nav-billing',
        url: 'acme.app/settings/billing',
        title: 'Billing & Plan',
        reply: '⚡ Navigated to <strong>Billing & Plan</strong>. Click <em>Upgrade</em> to continue.',
      },
      {
        query: 'show my profile',
        navId: 'acme-nav-profile',
        url: 'acme.app/settings/profile',
        title: 'Profile Settings',
        reply: '✓ Opened your <strong>Profile Settings</strong>.',
      },
      {
        query: 'where do I find my team?',
        navId: 'acme-nav-team',
        url: 'acme.app/team',
        title: 'Team',
        reply: '✓ Navigated to your <strong>Team</strong> page.',
      },
    ];

    let running = false;

    async function runDemo(demo) {
      const bubble = document.getElementById('hero-bubble');
      const panel  = document.getElementById('hero-panel');
      const msgs   = document.getElementById('hero-messages');
      const input  = document.getElementById('hero-input-display');
      const urlBar = document.getElementById('hero-url-bar');
      const title  = document.getElementById('acme-content-title');

      if (!bubble || !panel) return;

      // Open panel
      panel.classList.add('open');
      bubble.setAttribute('aria-expanded', 'true');
      await sleep(400);

      // Type query
      await typeText(input, demo.query, 48);
      await sleep(300);

      // Add user message
      addMessage(msgs, 'user', demo.query);
      input.textContent = '';
      await sleep(400);

      // Thinking
      const thinkMsg = addMessage(msgs, 'thinking',
        '<span class="thinking-dots"><span></span><span></span><span></span></span> Searching index…');
      await sleep(1400);
      thinkMsg.remove();

      // Navigate
      if (urlBar) urlBar.textContent = demo.url;
      if (title)  title.textContent  = demo.title;
      setActive(demo.navId);

      // Agent reply
      addMessage(msgs, 'agent wp-msg--success', demo.reply);
      await sleep(2800);

      // Close & reset
      panel.classList.remove('open');
      bubble.setAttribute('aria-expanded', 'false');
      await sleep(700);

      // Reset nav to dashboard
      setActive('acme-nav-dashboard');
      if (urlBar) urlBar.textContent = 'acme.app/dashboard';
      if (title)  title.textContent  = 'Dashboard';

      // Clear messages
      while (msgs.children.length > 1) msgs.removeChild(msgs.lastChild);
      input.textContent = '';
      await sleep(1200);
    }

    async function loop() {
      if (running) return;
      running = true;
      let i = 0;
      while (true) {
        await sleep(2000);
        await runDemo(demos[i % demos.length]);
        i++;
      }
    }

    function init() {
      // Only run if hero mockup exists and reduced-motion not set
      const mockup = document.getElementById('hero-mockup');
      if (!mockup) return;
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

      // Slight delay to let page render
      setTimeout(loop, 1800);
    }

    return { init };
  })();

  /* ─────────────────────────────────────────────
     4. INTERACTIVE DEMO — Mock-index navigation
  ───────────────────────────────────────────── */
  const InteractiveDemo = (function () {
    // Runs in browser. Real agent uses Claude claude-sonnet-4-6 + your site's pre-built index.
    const MOCK_INDEX = {
      '/dashboard': {
        label: 'Dashboard',
        navId: 'demo-nav-dashboard',
        keywords: ['dashboard', 'home', 'overview', 'main', 'start'],
      },
      '/settings/billing': {
        label: 'Billing & Plan',
        navId: 'demo-nav-billing',
        keywords: ['billing', 'upgrade', 'plan', 'invoice', 'invoices', 'payment', 'subscribe', 'subscription', 'cost', 'price', 'pay'],
      },
      '/settings/profile': {
        label: 'Profile Settings',
        navId: 'demo-nav-profile',
        keywords: ['profile', 'account', 'email', 'password', 'name', 'avatar', 'personal'],
      },
      '/settings': {
        label: 'Settings',
        navId: 'demo-nav-settings',
        keywords: ['settings', 'preferences', 'config', 'configure', 'options'],
      },
      '/team': {
        label: 'Team',
        navId: 'demo-nav-team',
        keywords: ['team', 'members', 'invite', 'collaborate', 'users', 'people', 'manage team'],
      },
      '/api-keys': {
        label: 'API Keys',
        navId: 'demo-nav-api',
        keywords: ['api', 'key', 'keys', 'token', 'secret', 'credentials', 'access'],
      },
    };

    function score(query, entry) {
      const q = query.toLowerCase();
      let s = 0;
      entry.keywords.forEach(kw => {
        if (q.includes(kw)) s += kw.length; // longer keyword = higher score
      });
      return s;
    }

    function findBestMatch(query) {
      let best = null, bestScore = 0;
      Object.entries(MOCK_INDEX).forEach(([route, entry]) => {
        const s = score(query, entry);
        if (s > bestScore) { bestScore = s; best = { route, entry }; }
      });
      return bestScore > 0 ? best : null;
    }

    function addMsg(container, type, html) {
      const div = document.createElement('div');
      div.className = `wp-msg wp-msg--${type}`;
      div.innerHTML = `<span class="wp-msg__text">${html}</span>`;
      container.appendChild(div);
      container.scrollTop = container.scrollHeight;
      return div;
    }

    function setActive(navId) {
      document.querySelectorAll('#demo-widget .acme-nav__item, .demo-browser .acme-nav__item').forEach(el => {
        el.classList.remove('acme-nav__item--active');
      });
      const target = document.getElementById(navId);
      if (target) target.classList.add('acme-nav__item--active');
    }

    async function handleQuery(query) {
      const msgs    = document.getElementById('demo-messages');
      const urlBar  = document.getElementById('demo-url-bar');
      const title   = document.getElementById('demo-content-title');
      const hint    = document.getElementById('demo-content-hint');
      if (!msgs) return;

      // User message
      addMsg(msgs, 'user', escapeHtml(query));
      await sleep(350);

      // Thinking
      const think = addMsg(msgs, 'thinking',
        '<span class="thinking-dots"><span></span><span></span><span></span></span> Querying index…');
      await sleep(900 + Math.random() * 400);
      think.remove();

      const match = findBestMatch(query);
      if (match) {
        const { route, entry } = match;
        // Navigate
        if (urlBar) urlBar.textContent = `acme.app${route}`;
        if (title)  title.textContent  = entry.label;
        if (hint)   hint.style.display = 'none';
        setActive(entry.navId);
        addMsg(msgs, 'agent wp-msg--success',
          `⚡ Navigated to <strong>${entry.label}</strong>.`);
      } else {
        addMsg(msgs, 'agent',
          `Hmm, I couldn't find a match for that. Try: billing, profile, team, or API keys.`);
      }
    }

    function initBubble() {
      const bubble = document.getElementById('demo-bubble');
      const panel  = document.getElementById('demo-panel');
      const input  = document.getElementById('demo-input');
      if (!bubble || !panel) return;

      bubble.addEventListener('click', () => {
        const isOpen = panel.classList.contains('open');
        panel.classList.toggle('open', !isOpen);
        bubble.setAttribute('aria-expanded', String(!isOpen));
        panel.setAttribute('aria-hidden', String(isOpen));
        if (!isOpen && input) setTimeout(() => input.focus(), 200);
      });
    }

    function initForm() {
      const form  = document.getElementById('demo-form');
      const input = document.getElementById('demo-input');
      if (!form) return;
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const q = input.value.trim();
        if (!q) return;
        input.value = '';
        input.disabled = true;
        await handleQuery(q);
        input.disabled = false;
        input.focus();
      });
    }

    function initHints() {
      document.querySelectorAll('.demo-hint').forEach(btn => {
        btn.addEventListener('click', async () => {
          const hint = btn.dataset.hint;
          // Open panel if not open
          const panel = document.getElementById('demo-panel');
          const bubble = document.getElementById('demo-bubble');
          if (panel && !panel.classList.contains('open')) {
            panel.classList.add('open');
            bubble && bubble.setAttribute('aria-expanded', 'true');
            panel.setAttribute('aria-hidden', 'false');
          }
          const input = document.getElementById('demo-input');
          if (input) input.value = '';
          await sleep(200);
          await handleQuery(hint);
        });
      });
    }

    function init() {
      initBubble();
      initForm();
      initHints();
    }

    return { init };
  })();

  /* ─────────────────────────────────────────────
     5. CODE TABS — Tab switching
  ───────────────────────────────────────────── */
  const CodeTabs = (function () {
    function init() {
      const tabBtns = document.querySelectorAll('.code-tab');
      if (!tabBtns.length) return;

      tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          const tabName = btn.dataset.tab;

          // Update button states
          tabBtns.forEach(b => {
            b.classList.toggle('code-tab--active', b === btn);
            b.setAttribute('aria-selected', String(b === btn));
          });

          // Show/hide panels
          document.querySelectorAll('.code-block').forEach(panel => {
            const isTarget = panel.id === `tab-${tabName}`;
            panel.classList.toggle('code-block--hidden', !isTarget);
          });
        });
      });
    }

    return { init };
  })();

  /* ─────────────────────────────────────────────
     6. COPY BUTTONS — Clipboard + feedback
  ───────────────────────────────────────────── */
  const CopyButtons = (function () {
    function copyText(text, btn) {
      if (!navigator.clipboard) {
        // Fallback
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.cssText = 'position:fixed;top:-9999px;left:-9999px;';
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand('copy'); } catch (_) {}
        document.body.removeChild(ta);
        showCopied(btn);
        return;
      }
      navigator.clipboard.writeText(text).then(() => showCopied(btn)).catch(() => {});
    }

    function showCopied(btn) {
      const orig = btn.textContent;
      btn.textContent = '✓ Copied';
      btn.classList.add('copied');
      setTimeout(() => {
        btn.textContent = orig;
        btn.classList.remove('copied');
      }, 2000);
    }

    // Copy snippet in How It Works
    function initSnippetCopy() {
      document.querySelectorAll('[data-copy]').forEach(btn => {
        btn.addEventListener('click', () => {
          const targetId = btn.dataset.copy;
          const target = document.getElementById(targetId);
          if (target) {
            copyText(target.textContent || target.innerText, btn);
          }
        });
      });
    }

    // Copy code tabs
    const TAB_CONTENT = {
      html: `<script\n  src="https://cdn.waypoint.ai/v1.js"\n  data-key="wpt_your_api_key"\n  defer\n><\/script>`,
      nextjs: `// app/layout.tsx\nimport Script from 'next/script'\n\nexport default function RootLayout({ children }) {\n  return (\n    <html>\n      <body>\n        {children}\n        <Script\n          src="https://cdn.waypoint.ai/v1.js"\n          data-key="wpt_your_api_key"\n          strategy="afterInteractive"\n        />\n      </body>\n    </html>\n  )\n}`,
      webhook: `# Add to your deploy pipeline\ncurl -X POST https://api.waypoint.ai/reindex \\\n  -H "x-api-key: wpt_your_api_key"`,
    };

    function initTabCopy() {
      document.querySelectorAll('[data-tab-copy]').forEach(btn => {
        btn.addEventListener('click', () => {
          const tabName = btn.dataset.tabCopy;
          const text = TAB_CONTENT[tabName] || '';
          copyText(text, btn);
        });
      });
    }

    function init() {
      initSnippetCopy();
      initTabCopy();
    }

    return { init };
  })();

  /* ─────────────────────────────────────────────
     7. WAITLIST FORM — Submit + localStorage
  ───────────────────────────────────────────── */
  const WaitlistForm = (function () {
    const LS_KEY = 'waypoint_waitlist_email';

    function isValidEmail(email) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    function showSuccess() {
      const form    = document.getElementById('waitlist-form');
      const success = document.getElementById('waitlist-success');
      if (form)    form.style.display    = 'none';
      if (success) {
        success.removeAttribute('hidden');
        success.style.animation = 'fadeInUp 0.4s ease forwards';
      }
    }

    function init() {
      const form  = document.getElementById('waitlist-form');
      const email = document.getElementById('waitlist-email');
      const error = document.getElementById('waitlist-error');

      if (!form) return;

      // Restore state if already joined
      const saved = localStorage.getItem(LS_KEY);
      if (saved) {
        showSuccess();
        return;
      }

      form.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!email) return;

        const val = email.value.trim();
        if (!val) {
          error.textContent = 'Please enter your email address.';
          email.focus();
          return;
        }
        if (!isValidEmail(val)) {
          error.textContent = 'Please enter a valid email address.';
          email.focus();
          return;
        }

        error.textContent = '';

        // Simulate submission
        const btn = form.querySelector('.waitlist__submit');
        if (btn) {
          btn.textContent = 'Joining…';
          btn.disabled = true;
        }

        setTimeout(() => {
          localStorage.setItem(LS_KEY, val);
          showSuccess();
        }, 600);
      });

      // Clear error on input
      if (email) {
        email.addEventListener('input', () => {
          if (error) error.textContent = '';
        });
      }
    }

    return { init };
  })();

  /* ─────────────────────────────────────────────
     8. NAVBAR — Scroll state + mobile hamburger
  ───────────────────────────────────────────── */
  const Navbar = (function () {
    function initScroll() {
      const nav = document.getElementById('navbar');
      if (!nav) return;

      let lastY = 0;
      let ticking = false;

      window.addEventListener('scroll', () => {
        if (!ticking) {
          requestAnimationFrame(() => {
            const y = window.scrollY;
            nav.classList.toggle('scrolled', y > 40);
            lastY = y;
            ticking = false;
          });
          ticking = true;
        }
      }, { passive: true });
    }

    function initHamburger() {
      const hamburger = document.getElementById('hamburger');
      const drawer    = document.getElementById('mobile-drawer');
      const overlay   = document.getElementById('mobile-overlay');
      const closeBtn  = document.getElementById('drawer-close');
      if (!hamburger || !drawer) return;

      function openDrawer() {
        drawer.classList.add('open');
        overlay.classList.add('open');
        hamburger.setAttribute('aria-expanded', 'true');
        drawer.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
      }

      function closeDrawer() {
        drawer.classList.remove('open');
        overlay.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false');
        drawer.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
      }

      hamburger.addEventListener('click', openDrawer);
      closeBtn  && closeBtn.addEventListener('click', closeDrawer);
      overlay   && overlay.addEventListener('click', closeDrawer);

      // Close on link click
      drawer.querySelectorAll('a').forEach(a => {
        a.addEventListener('click', closeDrawer);
      });

      // Close on Escape
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && drawer.classList.contains('open')) closeDrawer();
      });
    }

    function initGSAP() {
      // GSAP progressive enhancement — only if loaded
      if (typeof gsap === 'undefined') return;

      // Register ScrollTrigger
      if (typeof ScrollTrigger !== 'undefined') {
        gsap.registerPlugin(ScrollTrigger);
      }

      // Hero mockup parallax
      const mockup = document.querySelector('.hero__mockup');
      if (mockup && typeof ScrollTrigger !== 'undefined') {
        gsap.to(mockup, {
          yPercent: 8,
          ease: 'none',
          scrollTrigger: {
            trigger: '.hero',
            start: 'top top',
            end: 'bottom top',
            scrub: 1,
          },
        });
      }

      // Steps stagger animation
      const stepCards = document.querySelectorAll('.step-card');
      if (stepCards.length && typeof ScrollTrigger !== 'undefined') {
        gsap.fromTo(stepCards,
          { opacity: 0, y: 32 },
          {
            opacity: 1,
            y: 0,
            stagger: 0.15,
            duration: 0.7,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: '.steps__grid',
              start: 'top 80%',
              once: true,
            },
          }
        );
      }

      // Features panel slide-in
      const featMain = document.querySelector('.features__main');
      if (featMain && typeof ScrollTrigger !== 'undefined') {
        gsap.fromTo(featMain,
          { opacity: 0, x: -32 },
          {
            opacity: 1,
            x: 0,
            duration: 0.8,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: featMain,
              start: 'top 80%',
              once: true,
            },
          }
        );
      }
    }

    function init() {
      initScroll();
      initHamburger();
      // GSAP init after scripts load
      if (document.readyState === 'complete') {
        initGSAP();
      } else {
        window.addEventListener('load', initGSAP);
      }
    }

    return { init };
  })();

  /* ─────────────────────────────────────────────
     UTILS
  ───────────────────────────────────────────── */
  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  function escapeHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /* ─────────────────────────────────────────────
     INIT — Run all modules
  ───────────────────────────────────────────── */
  function init() {
    // Prevent fake acme sidebar links from scrolling the page
    document.querySelectorAll('.acme-nav__item').forEach(a => {
      a.addEventListener('click', e => e.preventDefault());
    });

    Starfield.init();
    ScrollAnim.init();
    HeroDemoPlayer.init();
    InteractiveDemo.init();
    CodeTabs.init();
    CopyButtons.init();
    WaitlistForm.init();
    Navbar.init();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
