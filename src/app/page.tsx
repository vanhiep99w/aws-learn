export default function HomePage() {
  return (
    <>
      <style>{`
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html{font-size:16px;scroll-behavior:smooth}
body{
  font-family:'DM Sans',system-ui,sans-serif;
  background:#06060a;color:#f0eef6;
  min-height:100vh;overflow-x:hidden;
  -webkit-font-smoothing:antialiased;
}

/* ══ FONTS ══ */
@import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&family=JetBrains+Mono:wght@400;500&display=swap');

/* ══ BACKGROUND CANVAS ══ */
.canvas{position:fixed;inset:0;z-index:0;pointer-events:none;overflow:hidden}
.wave{position:absolute;border-radius:40%;animation:morph 20s ease-in-out infinite alternate}
.wave-1{
  width:140vw;height:140vw;top:-60vw;left:-30vw;
  background:conic-gradient(from 180deg at 50% 50%,#7c3aed,#ec4899,#f97316,#eab308,#22d3ee,#7c3aed);
  opacity:.18;filter:blur(60px);animation-delay:0s;
}
.wave-2{
  width:100vw;height:100vw;bottom:-50vw;right:-30vw;
  background:conic-gradient(from 0deg,#3b82f6,#8b5cf6,#ec4899,#3b82f6);
  opacity:.12;filter:blur(80px);animation-delay:-10s;
}
@keyframes morph{
  0%{border-radius:40% 60% 70% 30% / 40% 50% 60% 50%;transform:rotate(0deg) scale(1)}
  100%{border-radius:60% 40% 30% 70% / 60% 30% 70% 40%;transform:rotate(60deg) scale(1.05)}
}

.aurora{
  position:absolute;width:200%;height:60vh;
  filter:blur(80px);opacity:.7;
  mix-blend-mode:screen;
  animation:aurora-drift 12s ease-in-out infinite alternate;
}
.aurora-1{
  top:10%;left:-40%;
  background:linear-gradient(90deg,transparent 0%,rgba(124,58,237,.18) 20%,rgba(236,72,153,.14) 50%,rgba(34,211,238,.1) 80%,transparent 100%);
  transform:rotate(-8deg) scaleY(.6);
}
.aurora-2{
  bottom:15%;right:-40%;
  background:linear-gradient(90deg,transparent 0%,rgba(34,211,238,.12) 30%,rgba(139,92,246,.16) 60%,transparent 100%);
  transform:rotate(5deg) scaleY(.5);
  animation-delay:-6s;animation-duration:15s;
}
@keyframes aurora-drift{
  0%{transform:translateX(-5%) rotate(-8deg) scaleY(.6);opacity:.6}
  50%{opacity:1}
  100%{transform:translateX(5%) rotate(-4deg) scaleY(.7);opacity:.7}
}

.grid-bg{
  position:absolute;inset:0;
  background-image:
    linear-gradient(rgba(167,139,250,.1) 1px,transparent 1px),
    linear-gradient(90deg,rgba(167,139,250,.1) 1px,transparent 1px);
  background-size:60px 60px;
  opacity:.5;
  -webkit-mask-image:radial-gradient(ellipse 80% 70% at 50% 35%,rgba(0,0,0,.6) 0%,transparent 70%);
  mask-image:radial-gradient(ellipse 80% 70% at 50% 35%,rgba(0,0,0,.6) 0%,transparent 70%);
}

.glow-orb{position:absolute;border-radius:50%;pointer-events:none}
.glow-orb-1{
  width:500px;height:500px;top:5%;left:5%;
  background:radial-gradient(circle,rgba(124,58,237,.18) 0%,rgba(124,58,237,.06) 40%,transparent 70%);
}
.glow-orb-2{
  width:450px;height:450px;top:40%;right:0%;
  background:radial-gradient(circle,rgba(236,72,153,.15) 0%,rgba(236,72,153,.05) 40%,transparent 70%);
}
.glow-orb-3{
  width:400px;height:400px;bottom:10%;left:25%;
  background:radial-gradient(circle,rgba(34,211,238,.12) 0%,rgba(34,211,238,.04) 40%,transparent 70%);
}

.grain{
  position:fixed;inset:0;z-index:1;pointer-events:none;
  opacity:.03;
  background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
  background-size:128px 128px;
}

/* ══ FADE-IN ANIMATION ══ */
@keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:none}}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}

/* ══ NAV ══ */
.nav{
  position:relative;z-index:10;
  display:flex;align-items:center;justify-content:space-between;
  padding:20px 48px;max-width:1400px;margin:0 auto;
  animation:fadeIn .5s ease both;
}
.brand{
  font-family:'Bricolage Grotesque',sans-serif;font-weight:800;font-size:1.1rem;
  color:#f0eef6;display:flex;align-items:center;gap:10px;text-decoration:none;
}
.brand i{
  width:10px;height:10px;border-radius:50%;display:block;
  background:linear-gradient(135deg,#a78bfa,#ec4899);
  box-shadow:0 0 14px rgba(167,139,250,.6);
}
.nav-r{display:flex;gap:6px}
.nav-r a{
  font-size:.82rem;font-weight:500;color:rgba(240,238,246,.6);
  text-decoration:none;padding:9px 22px;border-radius:99px;transition:all .2s;
}
.nav-r a:hover{color:#f0eef6;background:rgba(255,255,255,.06)}
.nav-r .pill{
  background:linear-gradient(135deg,#7c3aed,#ec4899);
  color:#fff;font-weight:600;
  box-shadow:0 4px 20px rgba(124,58,237,.3);
}
.nav-r .pill:hover{box-shadow:0 6px 28px rgba(124,58,237,.45);transform:translateY(-1px)}

/* ══ HERO ══ */
.hero{
  position:relative;z-index:2;
  max-width:860px;margin:0 auto;
  display:flex;flex-direction:column;align-items:center;text-align:center;
  padding:80px 48px 0;
}
.hero .overline{
  font-family:'JetBrains Mono',monospace;font-size:.7rem;font-weight:500;
  color:#a78bfa;letter-spacing:.12em;text-transform:uppercase;
  margin-bottom:28px;display:flex;align-items:center;gap:8px;
  animation:fadeUp .5s .1s ease both;
}
.hero .overline::before{
  content:'';width:24px;height:2px;background:linear-gradient(90deg,#a78bfa,#ec4899);border-radius:2px;
}
.hero h1{
  font-family:'Bricolage Grotesque',sans-serif;
  font-size:clamp(3.2rem,7vw,6.5rem);font-weight:800;
  line-height:.92;margin-bottom:28px;letter-spacing:-.04em;
  animation:fadeUp .5s .2s ease both;
}
.hero h1 .color{
  display:block;
  background:linear-gradient(135deg,#c084fc 0%,#f472b6 25%,#fb923c 50%,#fbbf24 70%,#22d3ee 100%);
  -webkit-background-clip:text;-webkit-text-fill-color:transparent;
  background-clip:text;background-size:200% 100%;
  animation:hue 6s ease-in-out infinite alternate, fadeUp .5s .2s ease both;
}
@keyframes hue{0%{background-position:0% 50%}100%{background-position:100% 50%}}

.hero p{
  font-size:1.15rem;line-height:1.8;color:rgba(240,238,246,.5);
  max-width:520px;margin-bottom:40px;font-weight:300;
  animation:fadeUp .5s .3s ease both;
}

.btns{
  display:flex;gap:14px;flex-wrap:wrap;justify-content:center;
  animation:fadeUp .5s .4s ease both;
}
.b{
  display:inline-flex;align-items:center;gap:8px;
  font-family:'JetBrains Mono',monospace;font-size:.8rem;font-weight:500;
  padding:15px 32px;border-radius:99px;text-decoration:none;
  transition:all .25s cubic-bezier(.4,0,.2,1);
}
.b-glow{
  background:linear-gradient(135deg,#7c3aed,#ec4899);color:#fff;
  box-shadow:0 8px 30px rgba(124,58,237,.25),0 0 0 1px rgba(255,255,255,.1) inset;
}
.b-glow:hover{box-shadow:0 12px 44px rgba(124,58,237,.4);transform:translateY(-3px) scale(1.02)}
.b-glass{
  color:#f0eef6;background:rgba(255,255,255,.04);
  border:1px solid rgba(255,255,255,.08);backdrop-filter:blur(10px);
}
.b-glass:hover{background:rgba(255,255,255,.08);border-color:rgba(255,255,255,.14);transform:translateY(-3px)}
.b .arr{transition:transform .2s}.b:hover .arr{transform:translateX(4px)}

/* ══ STATS ══ */
.stats{
  position:relative;z-index:2;
  max-width:1000px;margin:40px auto 0;padding:0 48px;
  display:grid;grid-template-columns:repeat(3,1fr);gap:16px;
  animation:fadeUp .6s .5s ease both;
}
.stat-card{
  text-align:center;padding:32px 20px;border-radius:20px;
  background:rgba(255,255,255,.03);
  border:1px solid rgba(255,255,255,.05);
  backdrop-filter:blur(8px);
  position:relative;overflow:hidden;
}
.stat-card::before{content:'';position:absolute;inset:0;opacity:.06;border-radius:20px}
.stat-card:nth-child(1)::before{background:linear-gradient(135deg,#ec4899,#f97316)}
.stat-card:nth-child(2)::before{background:linear-gradient(135deg,#7c3aed,#22d3ee)}
.stat-card:nth-child(3)::before{background:linear-gradient(135deg,#22d3ee,#6ee7b7)}
.stat-n{
  font-family:'Bricolage Grotesque',sans-serif;font-size:3rem;font-weight:800;line-height:1;
}
.stat-card:nth-child(1) .stat-n{background:linear-gradient(135deg,#f472b6,#fb923c);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.stat-card:nth-child(2) .stat-n{background:linear-gradient(135deg,#a78bfa,#22d3ee);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.stat-card:nth-child(3) .stat-n{background:linear-gradient(135deg,#22d3ee,#6ee7b7);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.stat-l{
  font-size:.72rem;color:rgba(240,238,246,.35);margin-top:8px;
  letter-spacing:.1em;text-transform:uppercase;font-weight:500;
  font-family:'JetBrains Mono',monospace;
}

/* ══ TOPICS ══ */
.topics{
  position:relative;z-index:2;
  max-width:1200px;margin:56px auto 0;padding:0 48px 80px;
  animation:fadeUp .6s .6s ease both;
}
.section-label{text-align:center;margin-bottom:40px}
.section-label span{
  font-family:'Bricolage Grotesque',sans-serif;font-size:1.8rem;font-weight:800;
  color:#f0eef6;display:inline-block;
}
.section-label p{font-size:.9rem;color:rgba(240,238,246,.35);margin-top:8px;font-weight:300}

.tg{
  display:grid;gap:12px;
  grid-template-columns:repeat(4,1fr);
  grid-auto-rows:minmax(120px,auto);
}
.tc.featured{grid-column:span 2;padding:32px}
.tc{
  text-decoration:none;color:#f0eef6;
  padding:24px;border-radius:20px;
  background:rgba(255,255,255,.025);
  border:1px solid rgba(255,255,255,.05);
  display:flex;flex-direction:column;justify-content:space-between;gap:16px;
  transition:all .4s cubic-bezier(.16,1,.3,1);
  cursor:pointer;position:relative;overflow:hidden;
}
.tc::before{
  content:'';position:absolute;inset:-1px;border-radius:21px;padding:1px;
  background:var(--card-grad);
  -webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);
  mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);
  -webkit-mask-composite:xor;mask-composite:exclude;
  opacity:0;transition:opacity .4s;
}
.tc::after{
  content:'';position:absolute;inset:0;border-radius:20px;
  background:radial-gradient(ellipse at 30% 0%,var(--card-glow) 0%,transparent 60%);
  opacity:0;transition:opacity .4s;z-index:0;
}
.tc:hover{transform:translateY(-6px);border-color:transparent;box-shadow:0 24px 60px rgba(0,0,0,.5)}
.tc:hover::before{opacity:1}
.tc:hover::after{opacity:1}
.tc:active{transform:translateY(-2px) scale(.98)}

.tc-top{display:flex;align-items:center;gap:14px;position:relative;z-index:1}
.tc-bottom{display:flex;align-items:center;justify-content:space-between;position:relative;z-index:1}
.tc-count{
  font-family:'JetBrains Mono',monospace;font-size:.65rem;font-weight:500;
  padding:4px 10px;border-radius:99px;
  background:rgba(255,255,255,.06);color:rgba(240,238,246,.4);
}
.tc-arrow{
  width:28px;height:28px;border-radius:50%;
  background:rgba(255,255,255,.04);
  display:flex;align-items:center;justify-content:center;transition:all .3s;
}
.tc-arrow svg{width:14px;height:14px;color:rgba(240,238,246,.3);transition:color .3s}
.tc:hover .tc-arrow{background:rgba(255,255,255,.1)}
.tc:hover .tc-arrow svg{color:#f0eef6}

.tc[data-c="1"]{--card-grad:linear-gradient(135deg,#fbbf24,#f97316);--card-glow:rgba(249,115,22,.08)}
.tc[data-c="2"]{--card-grad:linear-gradient(135deg,#60a5fa,#22d3ee);--card-glow:rgba(96,165,250,.08)}
.tc[data-c="3"]{--card-grad:linear-gradient(135deg,#6ee7b7,#22d3ee);--card-glow:rgba(110,231,183,.08)}
.tc[data-c="4"]{--card-grad:linear-gradient(135deg,#a78bfa,#818cf8);--card-glow:rgba(167,139,250,.08)}
.tc[data-c="5"]{--card-grad:linear-gradient(135deg,#22d3ee,#3b82f6);--card-glow:rgba(34,211,238,.08)}
.tc[data-c="6"]{--card-grad:linear-gradient(135deg,#fb7185,#f472b6);--card-glow:rgba(251,113,133,.08)}
.tc[data-c="7"]{--card-grad:linear-gradient(135deg,#f472b6,#a78bfa);--card-glow:rgba(244,114,182,.08)}

.ti{
  width:44px;height:44px;border-radius:14px;flex-shrink:0;
  display:flex;align-items:center;justify-content:center;position:relative;
}
.ti svg{width:20px;height:20px;position:relative;z-index:1}
.ti::after{content:'';position:absolute;inset:0;border-radius:14px;background:var(--card-grad);opacity:.12}
.ti.t1{color:#fbbf24}.ti.t2{color:#60a5fa}.ti.t3{color:#6ee7b7}
.ti.t4{color:#a78bfa}.ti.t5{color:#22d3ee}.ti.t6{color:#fb7185}.ti.t7{color:#f472b6}

.tc.featured .feat-num{
  position:absolute;right:20px;top:50%;transform:translateY(-50%);
  font-family:'Bricolage Grotesque',sans-serif;font-size:5rem;font-weight:800;line-height:1;
  background:var(--card-grad);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;
  opacity:.07;pointer-events:none;
}
.tn{font-size:.95rem;font-weight:600;font-family:'Bricolage Grotesque',sans-serif}
.td-sub{font-size:.72rem;color:rgba(240,238,246,.3);margin-top:2px;font-weight:300}

/* ══ FOOTER ══ */
footer{
  position:relative;z-index:2;text-align:center;padding:28px 48px;
  border-top:1px solid rgba(255,255,255,.04);
}
footer a{
  font-family:'JetBrains Mono',monospace;font-size:.7rem;
  color:rgba(240,238,246,.2);text-decoration:none;transition:color .2s;
}
footer a:hover{color:#a78bfa}

/* ══ RESPONSIVE ══ */
@media(max-width:1024px){.tg{grid-template-columns:repeat(3,1fr)}.tc.featured{grid-column:span 1;padding:24px}}
@media(max-width:768px){
  .nav{padding:16px 24px}
  .hero{padding:60px 24px 0}
  .hero h1{font-size:2.8rem}
  .stats{grid-template-columns:repeat(3,1fr);gap:10px;padding:0 24px;margin-top:32px}
  .stat-card{padding:24px 12px}
  .stat-n{font-size:2rem}
  .topics{padding:0 24px 60px;margin-top:40px}
  .tg{grid-template-columns:1fr 1fr}
}
@media(max-width:480px){
  .hero h1{font-size:2.2rem}
  .stats{grid-template-columns:1fr;gap:8px}
  .tg{grid-template-columns:1fr}
}

@media(prefers-reduced-motion:reduce){
  *,*::before,*::after{animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important}
}
      `}</style>

      {/* Background */}
      <div className="canvas">
        <div className="wave wave-1" />
        <div className="wave wave-2" />
        <div className="aurora aurora-1" />
        <div className="aurora aurora-2" />
        <div className="grid-bg" />
        <div className="glow-orb glow-orb-1" />
        <div className="glow-orb glow-orb-2" />
        <div className="glow-orb glow-orb-3" />
      </div>
      <div className="grain" />

      {/* Nav */}
      <nav className="nav">
        <a href="/" className="brand"><i />AWS Learning</a>
        <div className="nav-r">
          <a href="/fundamentals/aws-overview/">Docs</a>
          <a href="/beads/" className="pill">Practice</a>
        </div>
      </nav>

      {/* Hero */}
      <section className="hero">
        <div className="overline"><span>Open-source & miễn phí</span></div>
        <h1>
          Học AWS{' '}
          <span className="color">có hệ thống</span>
        </h1>
        <p>Tài liệu chi tiết về 116 dịch vụ AWS, tổ chức theo 21 chủ đề, từ cơ bản đến nâng cao. Hoàn toàn bằng tiếng Việt.</p>
        <div className="btns">
          <a href="/fundamentals/aws-overview/" className="b b-glow">Bắt đầu học <span className="arr">→</span></a>
          <a href="/beads/" className="b b-glass">Practice Q&A <span className="arr">→</span></a>
        </div>
      </section>

      {/* Stats */}
      <div className="stats">
        <div className="stat-card"><div className="stat-n">116</div><div className="stat-l">Tài liệu</div></div>
        <div className="stat-card"><div className="stat-n">21</div><div className="stat-l">Chủ đề</div></div>
        <div className="stat-card"><div className="stat-n">VI</div><div className="stat-l">Tiếng Việt</div></div>
      </div>

      {/* Topics */}
      <section className="topics">
        <div className="section-label">
          <span>Khám phá chủ đề</span>
          <p>21 chủ đề, 116 tài liệu chi tiết bằng tiếng Việt</p>
        </div>
        <div className="tg">
          <a href="/compute/ec2/" className="tc featured" data-c="2">
            <div className="tc-top">
              <div className="ti t2"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M9 9h6v6H9z"/></svg></div>
              <div><div className="tn">Compute</div><div className="td-sub">EC2, Lambda, ECS, Fargate...</div></div>
            </div>
            <div className="tc-bottom">
              <span className="tc-count">18 docs</span>
              <div className="tc-arrow"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg></div>
            </div>
            <div className="feat-num">18</div>
          </a>
          <a href="/security/iam/" className="tc featured" data-c="6">
            <div className="tc-top">
              <div className="ti t6"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg></div>
              <div><div className="tn">Security</div><div className="td-sub">IAM, KMS, Shield, WAF...</div></div>
            </div>
            <div className="tc-bottom">
              <span className="tc-count">20 docs</span>
              <div className="tc-arrow"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg></div>
            </div>
            <div className="feat-num">20</div>
          </a>
          <a href="/fundamentals/aws-overview/" className="tc" data-c="1">
            <div className="tc-top">
              <div className="ti t1"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"/></svg></div>
              <div><div className="tn">Fundamentals</div></div>
            </div>
            <div className="tc-bottom">
              <span className="tc-count">6 docs</span>
              <div className="tc-arrow"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg></div>
            </div>
          </a>
          <a href="/storage/s3/" className="tc" data-c="3">
            <div className="tc-top">
              <div className="ti t3"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"/></svg></div>
              <div><div className="tn">Storage</div></div>
            </div>
            <div className="tc-bottom">
              <span className="tc-count">12 docs</span>
              <div className="tc-arrow"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg></div>
            </div>
          </a>
          <a href="/database/rds/" className="tc" data-c="4">
            <div className="tc-top">
              <div className="ti t4"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg></div>
              <div><div className="tn">Database</div></div>
            </div>
            <div className="tc-bottom">
              <span className="tc-count">11 docs</span>
              <div className="tc-arrow"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg></div>
            </div>
          </a>
          <a href="/networking/vpc/" className="tc" data-c="5">
            <div className="tc-top">
              <div className="ti t5"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg></div>
              <div><div className="tn">Networking</div></div>
            </div>
            <div className="tc-bottom">
              <span className="tc-count">9 docs</span>
              <div className="tc-arrow"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg></div>
            </div>
          </a>
          <a href="/monitoring-management/cloudwatch/" className="tc featured" data-c="2">
            <div className="tc-top">
              <div className="ti t2"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg></div>
              <div><div className="tn">Monitoring</div><div className="td-sub">CloudWatch, CloudTrail, X-Ray...</div></div>
            </div>
            <div className="tc-bottom">
              <span className="tc-count">12 docs</span>
              <div className="tc-arrow"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg></div>
            </div>
            <div className="feat-num">12</div>
          </a>
          <a href="/messaging-streaming/sqs/" className="tc" data-c="4">
            <div className="tc-top">
              <div className="ti t4"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg></div>
              <div><div className="tn">Messaging</div></div>
            </div>
            <div className="tc-bottom">
              <span className="tc-count">7 docs</span>
              <div className="tc-arrow"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg></div>
            </div>
          </a>
          <a href="/migration/aws-disaster-recovery-migration-overview/" className="tc" data-c="5">
            <div className="tc-top">
              <div className="ti t5"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 014-4h14M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 01-4 4H3"/></svg></div>
              <div><div className="tn">Migration</div></div>
            </div>
            <div className="tc-bottom">
              <span className="tc-count">2 docs</span>
              <div className="tc-arrow"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg></div>
            </div>
          </a>
          <a href="/iac/cloudformation/" className="tc" data-c="1">
            <div className="tc-top">
              <div className="ti t1"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg></div>
              <div><div className="tn">IaC</div></div>
            </div>
            <div className="tc-bottom">
              <span className="tc-count">2 docs</span>
              <div className="tc-arrow"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg></div>
            </div>
          </a>
          <a href="/cost-management/aws-cost-explorer/" className="tc" data-c="3">
            <div className="tc-top">
              <div className="ti t3"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg></div>
              <div><div className="tn">Cost</div></div>
            </div>
            <div className="tc-bottom">
              <span className="tc-count">2 docs</span>
              <div className="tc-arrow"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg></div>
            </div>
          </a>
          <a href="/ai-ml/aws-ai-ml-services/" className="tc" data-c="7">
            <div className="tc-top">
              <div className="ti t7"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a2 2 0 012 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 017 7h1a1 1 0 011 1v3a1 1 0 01-1 1h-1.27A7 7 0 015.27 19H4a1 1 0 01-1-1v-3a1 1 0 011-1h1a7 7 0 017-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 012-2z"/><circle cx="9" cy="13" r="1"/><circle cx="15" cy="13" r="1"/><path d="M9 17h6"/></svg></div>
              <div><div className="tn">AI/ML</div></div>
            </div>
            <div className="tc-bottom">
              <span className="tc-count">1 doc</span>
              <div className="tc-arrow"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg></div>
            </div>
          </a>
        </div>
      </section>

      <footer>
        <a href="https://github.com/vanhiep99w/aws-learn">github.com/vanhiep99w/aws-learn</a>
      </footer>
    </>
  );
}
