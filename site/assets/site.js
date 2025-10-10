// /assets/site.js
console.log('[site] loaded');

// ---------------- Contact form submit → API Gateway (run FIRST) ----------------
const apiUrl = 'https://0jiv1eimu2.execute-api.us-east-1.amazonaws.com/contact';
const form     = document.getElementById('contact-form');
const statusEl = document.getElementById('contact-status');
const btn      = document.getElementById('send-btn');

if (form) {
  console.log('[site] contact form handler attached');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    statusEl.textContent = 'Sending...';
    btn && (btn.disabled = true, btn.setAttribute('aria-disabled','true'));
    form.setAttribute('aria-busy','true');

    const data = Object.fromEntries(new FormData(form));
    if (data.company) { statusEl.textContent = 'Thanks!'; form.reset(); cleanup(); return; }

    if (!data.message || data.message.length > 5000) { statusEl.textContent = 'Message is too long (max 5000).'; cleanup(); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email||'')) { statusEl.textContent = 'Please enter a valid email.'; cleanup(); return; }

    try {
      const r = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type':'application/json' },
        body: JSON.stringify({ name: data.name, email: data.email, message: data.message, company: data.company })
      });
      if (r.ok) { statusEl.textContent = 'Thanks! I will reply shortly.'; form.reset(); }
      else {
        let msg = 'Could not send right now.';
        try { const j = await r.json(); if (j?.error) msg = 'Error: ' + j.error; } catch {}
        statusEl.textContent = msg + ' Please email me.';
      }
    } catch (err) {
      console.error(err);
      statusEl.textContent = 'Network error. Please email me.';
    } finally {
      cleanup();
    }
  });
} else {
  console.warn('[site] contact form NOT found');
}

function cleanup(){
  btn && (btn.disabled = false, btn.setAttribute('aria-disabled','false'));
  form?.removeAttribute('aria-busy');
}

// ---------------- Project search / filter / sort (guarded) ----------------
const $  = (s,d=document)=>d.querySelector(s);
const $$ = (s,d=document)=>Array.from(d.querySelectorAll(s));

const list = $('#project-list');
const items = $$('#project-list>.card');
const q  = $('#q');
const fc = $('#filter-cloud');
const fd = $('#filter-domain');
const sort = $('#sort');

function apply(){
  const term   = (q?.value  ||'').toLowerCase();
  const cloud  = (fc?.value ||'').toLowerCase();
  const domain = (fd?.value ||'').toLowerCase();

  let filtered = items.map(it => {
    const text = it.textContent.toLowerCase();
    const okQ = !term   || text.includes(term);
    const okC = !cloud  || (it.dataset.cloud  ||'').toLowerCase().includes(cloud);
    const okD = !domain || (it.dataset.domain ||'').toLowerCase().includes(domain);
    it.style.display = (okQ && okC && okD) ? '' : 'none';
    return { it, ok: okQ && okC && okD };
  }).filter(x => x.ok).map(x => x.it);

  filtered.sort((a,b)=>{
    if (sort?.value==='recent') return (b.dataset.date||'').localeCompare(a.dataset.date||'');
    return (parseInt(b.dataset.impact||0)) - (parseInt(a.dataset.impact||0));
  }).forEach(n => list?.appendChild(n));
}

// This was the crash point before — keep the guard
[q, fc, fd, sort].forEach(el => el && el.addEventListener('input', apply));

window.addEventListener('keydown', (e)=>{
  const tag = document.activeElement?.tagName;
  if (e.key==='/' && tag!=='INPUT' && tag!=='TEXTAREA') { e.preventDefault(); q?.focus(); }
});

apply();

// ---------------- Footer year ----------------
const y = $('#y'); if (y) y.textContent = new Date().getFullYear();
