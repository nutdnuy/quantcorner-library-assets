(() => {
"use strict";
function mountSourceShell(root, sourceDocument, sourceBody, searchIndex, lifecycle) {
 if (!root.getElementById('theme-button')) return;
 const document = {getElementById:id=>root.getElementById(id),querySelector:s=>root.querySelector(s),querySelectorAll:s=>root.querySelectorAll(s),createElement:tag=>globalThis.document.createElement(tag),documentElement:sourceDocument,body:sourceBody,addEventListener:(type,fn,options)=>lifecycle.listen(globalThis.document,type,fn,options)};
 const themeButton=document.getElementById('theme-button');
themeButton.addEventListener('click',()=>{const light=document.documentElement.dataset.theme!=='light';document.documentElement.dataset.theme=light?'light':'dark';themeButton.textContent=light?'พื้นหลังมืด':'พื้นหลังสว่าง';});
document.getElementById('print-button').addEventListener('click',()=>window.print());
const menu=document.getElementById('menu-button');
menu.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')!=='true';menu.setAttribute('aria-expanded',String(open));document.body.classList.toggle('menu-open',open);});
const dialog=document.getElementById('search-dialog'),input=document.getElementById('search-input'),results=document.getElementById('search-results'),status=document.getElementById('search-status');
const index=searchIndex||[];
function search(){
 const query=input.value.trim().toLocaleLowerCase(),words=query.split(/\s+/).filter(Boolean);
 const matches=index.filter(item=>!query||words.every(w=>(item.title+' '+item.text).toLocaleLowerCase().includes(w))).sort((a,b)=>Number(b.title.toLocaleLowerCase().includes(query))-Number(a.title.toLocaleLowerCase().includes(query))).slice(0,12);
 results.replaceChildren();status.textContent=query?(matches.length?`พบ ${matches.length} หัวข้อ`:'ไม่พบหัวข้อ ลองใช้คำค้นอื่น'):'เลือกหัวข้อ หรือพิมพ์คำที่ต้องการค้นหา';
 for(const item of matches){const a=document.createElement('a');a.href=item.url;const label=document.createElement('small');label.textContent=item.section;const title=document.createElement('strong');title.textContent=item.title;const snippet=document.createElement('span');const at=query?Math.max(0,item.text.toLocaleLowerCase().indexOf(words[0])-40):0;snippet.textContent=(at?'…':'')+item.text.slice(at,at+150)+'…';a.append(label,title,snippet);results.append(a);}
}
function openSearch(){dialog.showModal();search();input.focus();}
document.getElementById('search-button').addEventListener('click',openSearch);
document.getElementById('close-search').addEventListener('click',()=>dialog.close());
input.addEventListener('input',search);
results.addEventListener('click',event=>{
 if(event.target.closest('a')){
  dialog.close();
  const field=document.getElementById('glossary-query');
  if(field){field.value='';field.dispatchEvent(new Event('input'));}
 }
});
dialog.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();dialog.close();}});
document.addEventListener('keydown',event=>{if((event.metaKey||event.ctrlKey)&&event.key.toLowerCase()==='k'){event.preventDefault();if(!dialog.open)openSearch();}});
// The glossary remains fully readable when JavaScript is unavailable.
const glossaryInput=document.getElementById('glossary-query');
if(glossaryInput){
 const glossaryStatus=document.getElementById('glossary-status');
 const groups=[...document.querySelectorAll('.glossary-group')];
 const fold=s=>s.normalize('NFC').toLocaleLowerCase().replace(/[\u2010-\u2015-]/g,' ').replace(/\s+/g,' ').trim();
 const terms=[...document.querySelectorAll('.glossary-term')].map(element=>({element,text:fold(element.textContent)}));
 function filterGlossary(){
  const words=fold(glossaryInput.value).split(' ').filter(Boolean);let count=0;
  for(const term of terms){const match=words.every(word=>term.text.includes(word));term.element.hidden=!match;if(match)count++;}
  for(const group of groups)group.hidden=![...group.querySelectorAll('.glossary-term')].some(term=>!term.hidden);
  glossaryStatus.textContent=words.length?(count?`พบ ${count} คำ จากทั้งหมด ${terms.length} คำ`:'ไม่พบคำนี้ ลองใช้คำไทย ภาษาอังกฤษ หรือคำย่อ'):`มี ${terms.length} คำ ในอภิธานศัพท์`;
 }
 document.querySelector('.glossary-search').hidden=false;
 glossaryInput.addEventListener('input',filterGlossary);
 lifecycle.listen(window,'hashchange',()=>{
  const target=document.getElementById(decodeURIComponent(location.hash.slice(1)));
  if(target){glossaryInput.value='';filterGlossary();target.scrollIntoView();}
 });
 filterGlossary();
}

}
function run_vg(root,lifecycle){
(() => {
  // outputs/quantcorner-library-seo-20261015/site-assets/adapters/build/the-magnificent-jump/vg-math.mjs
  function rng(seed) {
    let state = seed >>> 0;
    return () => {
      state = state + 1831565813 >>> 0;
      let t = state;
      t = Math.imul(t ^ t >>> 15, t | 1);
      t ^= t + Math.imul(t ^ t >>> 7, t | 61);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function normal(random) {
    return Math.sqrt(-2 * Math.log(Math.max(random(), 1e-15))) * Math.cos(2 * Math.PI * random());
  }
  function gamma(shape, scale, random) {
    if (!(shape > 0 && scale > 0)) throw new RangeError("Positive gamma shape and scale required");
    if (shape < 1) return gamma(shape + 1, scale, random) * Math.pow(Math.max(random(), 1e-15), 1 / shape);
    const d = shape - 1 / 3, c = 1 / Math.sqrt(9 * d);
    for (; ; ) {
      const z = normal(random), v = 1 + c * z;
      if (v <= 0) continue;
      const w = v * v * v, u = Math.max(random(), 1e-15);
      if (u < 1 - 0.0331 * z ** 4 || Math.log(u) < 0.5 * z * z + d * (1 - w + Math.log(w))) return scale * d * w;
    }
  }
  function moments(theta, sigma, nu, T = 1) {
    const variance = (sigma * sigma + theta * theta * nu) * T;
    return { mean: theta * T, variance, sd: Math.sqrt(variance), skew: (3 * theta * sigma * sigma * nu + 2 * theta ** 3 * nu ** 2) * T / variance ** 1.5, excess: (3 * sigma ** 4 * nu + 12 * theta * theta * sigma * sigma * nu ** 2 + 6 * theta ** 4 * nu ** 3) * T / variance ** 2 };
  }
  function sampleVG({ theta = 0, sigma = 0.2, nu = 0.4, T = 1, n = 24e3, seed = 20260920 } = {}) {
    const random = rng(seed), values = [];
    for (let i = 0; i < n; i++) {
      const g = nu === 0 ? T : gamma(T / nu, nu, random);
      values.push(theta * g + sigma * Math.sqrt(g) * normal(random));
    }
    return values;
  }
  function clockPath(nu, seed, steps = 120) {
    const random = rng(seed), zRandom = rng(seed + 991), dt = 1 / steps;
    const rows = [{ t: 0, g: 0, x: 0, b: 0, dg: 0, dx: 0 }];
    for (let i = 1; i <= steps; i++) {
      const last = rows[i - 1], dg = nu === 0 ? dt : gamma(dt / nu, nu, random), z = normal(zRandom), dx = 0.2 * Math.sqrt(dg) * z;
      rows.push({ t: i * dt, g: last.g + dg, x: last.x + dx, b: last.b + 0.2 * Math.sqrt(dt) * z, dg, dx });
    }
    return rows;
  }
  function histogram(values, min, max, bins = 60) {
    const counts = Array(bins).fill(0), width = (max - min) / bins;
    let outside = 0;
    for (const value of values) {
      if (value < min || value >= max) {
        outside++;
        continue;
      }
      counts[Math.floor((value - min) / width)]++;
    }
    return { points: counts.map((c, i) => [min + (i + 0.5) * width, c / (values.length * width)]), outside, width };
  }
  function normalDensity(x, mean, sd) {
    return Math.exp(-0.5 * ((x - mean) / sd) ** 2) / (sd * Math.sqrt(2 * Math.PI));
  }

  // outputs/quantcorner-library-seo-20261015/site-assets/adapters/build/the-magnificent-jump/vg-interactive.mjs
  var definitions = [
    { title: "Heavy tails \xB7 \u0E2B\u0E32\u0E07\u0E2B\u0E19\u0E32\u0E15\u0E48\u0E32\u0E07\u0E08\u0E32\u0E01\u0E04\u0E27\u0E32\u0E21\u0E1C\u0E31\u0E19\u0E1C\u0E27\u0E19\u0E2D\u0E22\u0E48\u0E32\u0E07\u0E44\u0E23?", task: "\u0E25\u0E2D\u0E07\u0E40\u0E1E\u0E34\u0E48\u0E21 \u03BD \u0E08\u0E32\u0E01 0 \u0E40\u0E1B\u0E47\u0E19 1 \u0E42\u0E14\u0E22\u0E04\u0E07 \u03C3 \u0E44\u0E27\u0E49 \u0E41\u0E25\u0E49\u0E27\u0E14\u0E39\u0E42\u0E2D\u0E01\u0E32\u0E2A\u0E17\u0E35\u0E48 |X| \u0E40\u0E01\u0E34\u0E19 3 \u0E40\u0E17\u0E48\u0E32\u0E02\u0E2D\u0E07 SD \u0E41\u0E21\u0E49 variance \u0E08\u0E30\u0E40\u0E17\u0E48\u0E32\u0E01\u0E31\u0E19 \u0E2B\u0E32\u0E07\u0E02\u0E2D\u0E07\u0E2A\u0E2D\u0E07\u0E41\u0E1A\u0E1A\u0E08\u0E33\u0E25\u0E2D\u0E07\u0E01\u0E47\u0E44\u0E21\u0E48\u0E08\u0E33\u0E40\u0E1B\u0E47\u0E19\u0E15\u0E49\u0E2D\u0E07\u0E40\u0E2B\u0E21\u0E37\u0E2D\u0E19\u0E01\u0E31\u0E19", controls: [["nu", "Clock variance \u03BD", 0, 1, 0.05, 0.4], ["cut", "Tail threshold \xB7 \u0E40\u0E17\u0E48\u0E32\u0E02\u0E2D\u0E07 SD", 2, 4, 0.25, 3]], presets: [["Normal limit", { nu: 0 }], ["Thicker tails", { nu: 1 }]] },
    { title: "Random clock \xB7 \u0E40\u0E27\u0E25\u0E32\u0E40\u0E17\u0E48\u0E32\u0E01\u0E31\u0E19 \u0E41\u0E15\u0E48\u0E40\u0E14\u0E34\u0E19\u0E44\u0E21\u0E48\u0E40\u0E17\u0E48\u0E32\u0E01\u0E31\u0E19", task: "\u0E40\u0E25\u0E37\u0E48\u0E2D\u0E19 Observation \u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E14\u0E39\u0E17\u0E35\u0E25\u0E30\u0E0A\u0E48\u0E27\u0E07 \u0E2A\u0E31\u0E07\u0E40\u0E01\u0E15\u0E0A\u0E48\u0E27\u0E07\u0E17\u0E35\u0E48 \u0394G \u0E43\u0E2B\u0E0D\u0E48\u0E41\u0E25\u0E30\u0E02\u0E19\u0E32\u0E14 \u0394X \u0E08\u0E32\u0E01\u0E19\u0E31\u0E49\u0E19\u0E25\u0E2D\u0E07 \u03BD = 0 \u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E01\u0E25\u0E31\u0E1A\u0E2A\u0E39\u0E48\u0E19\u0E32\u0E2C\u0E34\u0E01\u0E32\u0E1B\u0E01\u0E15\u0E34", controls: [["nu", "Clock variance \u03BD", 0, 1, 0.05, 0.4], ["step", "Observation \xB7 \u0E08\u0E38\u0E14\u0E40\u0E27\u0E25\u0E32", 1, 120, 1, 60]], presets: [["Regular clock", { nu: 0 }], ["Random clock", { nu: 0.4 }]] },
    { title: "Shape explorer \xB7 \u0E1B\u0E23\u0E31\u0E1A\u0E23\u0E39\u0E1B\u0E17\u0E23\u0E07\u0E02\u0E2D\u0E07 Variance Gamma", task: "\u0E40\u0E23\u0E34\u0E48\u0E21\u0E08\u0E32\u0E01 \u03B8 = 0 \u0E41\u0E25\u0E49\u0E27\u0E25\u0E2D\u0E07\u0E04\u0E48\u0E32\u0E25\u0E1A\u0E41\u0E25\u0E30\u0E04\u0E48\u0E32\u0E1A\u0E27\u0E01 \u0E14\u0E39\u0E17\u0E31\u0E49\u0E07\u0E15\u0E33\u0E41\u0E2B\u0E19\u0E48\u0E07\u0E04\u0E48\u0E32\u0E40\u0E09\u0E25\u0E35\u0E48\u0E22\u0E41\u0E25\u0E30\u0E04\u0E27\u0E32\u0E21\u0E40\u0E1A\u0E49 \u0E08\u0E32\u0E01\u0E19\u0E31\u0E49\u0E19\u0E40\u0E1E\u0E34\u0E48\u0E21 \u03C3 \u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E41\u0E22\u0E01\u0E1C\u0E25\u0E02\u0E2D\u0E07\u0E04\u0E27\u0E32\u0E21\u0E01\u0E27\u0E49\u0E32\u0E07\u0E2D\u0E2D\u0E01\u0E08\u0E32\u0E01\u0E04\u0E27\u0E32\u0E21\u0E40\u0E1A\u0E49", controls: [["theta", "Drift \u03B8", -0.3, 0.3, 0.025, 0], ["sigma", "Brownian scale \u03C3", 0.1, 0.4, 0.025, 0.2], ["nu", "Clock variance \u03BD", 0, 1, 0.05, 0.4]], presets: [["Left skew", { theta: -0.2 }], ["Symmetric", { theta: 0 }], ["Right skew", { theta: 0.2 }]] }
  ];
  var fmt = (x, d = 3) => Math.abs(x) < 0.5 * 10 ** -d ? 0 .toFixed(d) : x.toFixed(d);
  var fine = (x) => x !== 0 && Math.abs(x) < 1e-5 ? x.toExponential(2) : fmt(x, 5);
  var metric = (label, value) => `<div><dt>${label}</dt><dd>${value}</dd></div>`;
  function chart({ series, min, max, ymin = 0, ymax, xlabel, ylabel, bars = false, marker, tail }) {
    const W = 680, H = 320, L = 62, R = 20, T = 32, B = 54, x = (v) => L + (v - min) / (max - min) * (W - L - R), y = (v) => H - B - (v - ymin) / (ymax - ymin) * (H - T - B);
    let svg = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${ylabel}; ${xlabel}"><title>${ylabel} versus ${xlabel}</title>`;
    for (let i = 0; i <= 4; i++) {
      const v = ymin + (ymax - ymin) * i / 4;
      svg += `<line class="grid" x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}"/><text x="${L - 8}" y="${y(v) + 4}" text-anchor="end">${fmt(v, 2)}</text>`;
    }
    for (let i = 0; i <= 4; i++) {
      const v = min + (max - min) * i / 4;
      svg += `<text x="${x(v)}" y="${H - B + 23}" text-anchor="middle">${fmt(v, 2)}</text>`;
    }
    svg += `<text x="${L}" y="18">${ylabel}</text><text x="${W / 2}" y="${H - 8}" text-anchor="middle">${xlabel}</text>`;
    series.forEach((points, i) => {
      if (bars && i === 0) {
        const width = (W - L - R) / points.length;
        for (const [a, b] of points) svg += `<rect class="vg-bar" style="opacity:${tail === void 0 ? 0.65 : Math.abs(a) > tail ? 0.95 : 0.3}" x="${x(a) - width / 2}" y="${y(b)}" width="${Math.max(1, width - 1)}" height="${Math.max(0, y(0) - y(b))}"/>`;
      } else svg += `<path class="${i ? "vg-benchmark" : "vg-series"}" d="${points.map(([a, b], j) => `${j ? "L" : "M"}${x(a).toFixed(2)},${y(b).toFixed(2)}`).join(" ")}"/>`;
    });
    if (tail !== void 0) for (const edge of [-tail, tail]) svg += `<line x1="${x(edge)}" x2="${x(edge)}" y1="${T}" y2="${H - B}" stroke="currentColor" stroke-dasharray="3 4"/>`;
    if (marker !== void 0) svg += `<line x1="${x(marker)}" x2="${x(marker)}" y1="${T}" y2="${H - B}" stroke="currentColor" stroke-dasharray="3 4"/>`;
    return svg + "</svg>";
  }
  for (const host of root.querySelectorAll("[data-vg-lab]")) {
    let render = function() {
      for (const [key] of def.controls) {
        host.querySelector(`#vg-${key}`).value = state[key];
        host.querySelector(`#out-${key}`).textContent = fmt(state[key], key === "step" ? 0 : 3);
      }
      if (kind === 1) {
        const key = `${state.nu}:${seed}`;
        if (key !== cacheKey) {
          cache = clockPath(state.nu, seed);
          cacheKey = key;
        }
        const rows = cache, r = rows[state.step], ymax = Math.max(1, ...rows.map((p) => p.g)) * 1.08;
        plot.innerHTML = chart({ series: [rows.map((p) => [p.t, p.g]), rows.map((p) => [p.t, p.t])], min: 0, max: 1, ymax, xlabel: "Calendar time t", ylabel: "Clock time G(t)", marker: r.t });
        const bound = Math.max(0.2, ...rows.flatMap((p) => [Math.abs(p.x), Math.abs(p.b)])) * 1.1;
        host.querySelector(".vg-second").innerHTML = chart({ series: [rows.map((p) => [p.t, p.x]), rows.map((p) => [p.t, p.b])], min: 0, max: 1, ymin: -bound, ymax: bound, xlabel: "Calendar time t", ylabel: "X(t) \xB7 decimal units", marker: r.t });
        metrics.innerHTML = metric("Calendar time t", fmt(r.t)) + metric("Clock time G(t)", fmt(r.g)) + metric("Selected \u0394G", fine(r.dg)) + metric("Selected \u0394X", fine(r.dx));
        status.textContent = `\u0E08\u0E38\u0E14\u0E17\u0E35\u0E48 ${state.step}/120: \u0E19\u0E32\u0E2C\u0E34\u0E01\u0E32\u0E1B\u0E0F\u0E34\u0E17\u0E34\u0E19\u0E40\u0E14\u0E34\u0E19 ${fmt(1 / 120, 5)} \u0E41\u0E15\u0E48\u0E19\u0E32\u0E2C\u0E34\u0E01\u0E32\u0E2A\u0E38\u0E48\u0E21\u0E40\u0E14\u0E34\u0E19 ${fine(r.dg)} \u0E2B\u0E19\u0E48\u0E27\u0E22\u0E40\u0E27\u0E25\u0E32 \u0E0A\u0E48\u0E27\u0E07\u0E17\u0E35\u0E48 \u0394G \u0E43\u0E2B\u0E0D\u0E48\u0E21\u0E35\u0E04\u0E27\u0E32\u0E21\u0E41\u0E1B\u0E23\u0E1B\u0E23\u0E27\u0E19\u0E41\u0E1A\u0E1A\u0E21\u0E35\u0E40\u0E07\u0E37\u0E48\u0E2D\u0E19\u0E44\u0E02\u0E02\u0E2D\u0E07 \u0394X \u0E21\u0E32\u0E01\u0E02\u0E36\u0E49\u0E19 \u0E41\u0E15\u0E48\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49\u0E41\u0E1B\u0E25\u0E27\u0E48\u0E32 \u0394X \u0E15\u0E49\u0E2D\u0E07\u0E21\u0E32\u0E01\u0E17\u0E38\u0E01\u0E04\u0E23\u0E31\u0E49\u0E07 \u0E40\u0E1E\u0E23\u0E32\u0E30\u0E22\u0E31\u0E07\u0E02\u0E36\u0E49\u0E19\u0E01\u0E31\u0E1A Z`;
      } else {
        const theta = state.theta ?? 0, sigma = state.sigma ?? 0.2, nu = state.nu, m = moments(theta, sigma, nu), key = `${theta}:${sigma}:${nu}:${seed}`;
        if (key !== cacheKey) {
          cache = sampleVG({ theta, sigma, nu, seed });
          cacheKey = key;
        }
        const min = kind === 0 ? -1 : -2.4, max = kind === 0 ? 1 : 2.4, h = histogram(cache, min, max, kind === 0 ? 64 : 96), line = Array.from({ length: 241 }, (_, i) => {
          const x = min + (max - min) * i / 240;
          return [x, normalDensity(x, m.mean, m.sd)];
        });
        plot.innerHTML = chart({ series: [h.points, line], min, max, ymax: Math.max(...h.points.map((p) => p[1]), ...line.map((p) => p[1])) * 1.12, xlabel: "X(T) \xB7 decimal log-return component", ylabel: "Probability density", bars: true, tail: kind === 0 ? state.cut * m.sd : void 0 });
        if (kind === 0) {
          const count = cache.filter((v) => Math.abs(v) > state.cut * m.sd).length, p = count / cache.length, se = Math.sqrt(p * (1 - p) / cache.length), normalTail = 2 * normalSurvival(state.cut);
          metrics.innerHTML = metric("VG tail \xB7 sample", fmt(100 * p, 2) + "%") + metric("Normal tail \xB7 theory", fmt(100 * normalTail, 3) + "%") + metric("Variance \xB7 theory", fmt(m.variance, 3)) + metric("Excess kurtosis \xB7 theory", fmt(m.excess, 2));
          status.textContent = `\u0E40\u0E2A\u0E49\u0E19\u0E15\u0E31\u0E49\u0E07\u0E04\u0E37\u0E2D\u0E40\u0E01\u0E13\u0E11\u0E4C |X| > ${fmt(state.cut * m.sd, 2)} (\u0E41\u0E17\u0E48\u0E07\u0E40\u0E02\u0E49\u0E21\u0E43\u0E0A\u0E49\u0E08\u0E38\u0E14\u0E01\u0E36\u0E48\u0E07\u0E01\u0E25\u0E32\u0E07 bin): \u0E1E\u0E1A ${count.toLocaleString()} \u0E08\u0E32\u0E01 24,000 \u0E15\u0E31\u0E27\u0E2D\u0E22\u0E48\u0E32\u0E07 \u0E04\u0E48\u0E32 VG tail \u0E21\u0E35 sampling SE \u2248 ${fmt(100 * se, 3)} \u0E08\u0E38\u0E14\u0E40\u0E1B\u0E2D\u0E23\u0E4C\u0E40\u0E0B\u0E47\u0E19\u0E15\u0E4C \u0E40\u0E21\u0E37\u0E48\u0E2D \u03BD = 0 \u0E41\u0E1A\u0E1A\u0E08\u0E33\u0E25\u0E2D\u0E07\u0E40\u0E1B\u0E47\u0E19 Normal \u0E41\u0E15\u0E48\u0E04\u0E48\u0E32\u0E1B\u0E23\u0E30\u0E21\u0E32\u0E13\u0E08\u0E32\u0E01\u0E15\u0E31\u0E27\u0E2D\u0E22\u0E48\u0E32\u0E07\u0E22\u0E31\u0E07\u0E41\u0E01\u0E27\u0E48\u0E07\u0E44\u0E14\u0E49`;
        } else {
          metrics.innerHTML = metric("Mean \xB7 theory", fmt(m.mean)) + metric("SD \xB7 theory", fmt(m.sd)) + metric("Skewness \xB7 theory", fmt(m.skew)) + metric("Excess kurtosis \xB7 theory", fmt(m.excess, 2));
          status.textContent = `${theta === 0 ? "\u03B8 = 0: \u0E23\u0E39\u0E1B\u0E17\u0E23\u0E07\u0E2A\u0E21\u0E21\u0E32\u0E15\u0E23\u0E15\u0E32\u0E21\u0E17\u0E24\u0E29\u0E0E\u0E35" : theta < 0 ? "\u03B8 < 0: \u0E04\u0E48\u0E32\u0E40\u0E09\u0E25\u0E35\u0E48\u0E22\u0E15\u0E34\u0E14\u0E25\u0E1A \u0E41\u0E25\u0E30\u0E04\u0E27\u0E32\u0E21\u0E40\u0E1A\u0E49\u0E15\u0E34\u0E14\u0E25\u0E1A\u0E40\u0E21\u0E37\u0E48\u0E2D \u03BD > 0" : "\u03B8 > 0: \u0E04\u0E48\u0E32\u0E40\u0E09\u0E25\u0E35\u0E48\u0E22\u0E40\u0E1B\u0E47\u0E19\u0E1A\u0E27\u0E01 \u0E41\u0E25\u0E30\u0E04\u0E27\u0E32\u0E21\u0E40\u0E1A\u0E49\u0E40\u0E1B\u0E47\u0E19\u0E1A\u0E27\u0E01\u0E40\u0E21\u0E37\u0E48\u0E2D \u03BD > 0"} \u0E04\u0E48\u0E32 mean = \u03B8T \u0E41\u0E25\u0E30 variance = (\u03C3\xB2 + \u03B8\xB2\u03BD)T \u0E14\u0E31\u0E07\u0E19\u0E31\u0E49\u0E19\u0E01\u0E32\u0E23\u0E40\u0E1B\u0E25\u0E35\u0E48\u0E22\u0E19 \u03B8 \u0E2D\u0E32\u0E08\u0E40\u0E1B\u0E25\u0E35\u0E48\u0E22\u0E19\u0E17\u0E31\u0E49\u0E07\u0E15\u0E33\u0E41\u0E2B\u0E19\u0E48\u0E07 \u0E04\u0E27\u0E32\u0E21\u0E01\u0E27\u0E49\u0E32\u0E07 \u0E41\u0E25\u0E30\u0E04\u0E27\u0E32\u0E21\u0E40\u0E1A\u0E49`;
        }
        host.querySelector(".vg-method").textContent = `Simulation \xB7 T = 1 \xB7 n = 24,000 \xB7 seed ${seed} \xB7 \u0E19\u0E2D\u0E01\u0E02\u0E2D\u0E1A\u0E01\u0E23\u0E32\u0E1F ${h.outside} \u0E04\u0E48\u0E32 (${fmt(h.outside / 240, 2)}%) \u0E44\u0E21\u0E48\u0E1B\u0E23\u0E31\u0E1A\u0E41\u0E17\u0E48\u0E07\u0E43\u0E2B\u0E49\u0E23\u0E27\u0E21\u0E40\u0E1B\u0E47\u0E19 100% \u0E40\u0E09\u0E1E\u0E32\u0E30\u0E0A\u0E48\u0E27\u0E07\u0E17\u0E35\u0E48\u0E41\u0E2A\u0E14\u0E07 \xB7 \u0E41\u0E01\u0E19 X \u0E04\u0E07\u0E17\u0E35\u0E48 \u0E41\u0E01\u0E19 Y \u0E1B\u0E23\u0E31\u0E1A\u0E15\u0E32\u0E21\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25`;
      }
      if (kind === 1) host.querySelector(".vg-method").textContent = `Simulation \xB7 T = 1 \xB7 120 intervals \xB7 \u03C3 = 0.2 \xB7 \u03B8 = 0 \xB7 seed ${seed} \xB7 \u0E41\u0E01\u0E19 Y \u0E1B\u0E23\u0E31\u0E1A\u0E15\u0E32\u0E21\u0E40\u0E2A\u0E49\u0E19\u0E17\u0E32\u0E07\u0E17\u0E35\u0E48\u0E2A\u0E38\u0E48\u0E21`;
    };
    const kind = Number(host.dataset.vgLab), def = definitions[kind], state = Object.fromEntries(def.controls.map(([key, , , , , value]) => [key, value]));
    let seed = 20260920, cacheKey = "", cache;
    host.innerHTML = `<p class="vg-eyebrow">INTERACTIVE VIZ \xB7 \u0E40\u0E19\u0E37\u0E49\u0E2D\u0E2B\u0E32\u0E40\u0E2A\u0E23\u0E34\u0E21</p><h2 id="interactive-viz">${def.title}</h2><p class="vg-task">${def.task}</p><div class="vg-controls">${def.controls.map(([key, label, min, max, step, value]) => `<label class="vg-control" for="vg-${key}"><span>${label}<output id="out-${key}" for="vg-${key}">${value}</output></span><input id="vg-${key}" data-key="${key}" type="range" min="${min}" max="${max}" step="${step}" value="${value}"></label>`).join("")}</div><div class="vg-buttons">${def.presets.map(([label], i) => `<button type="button" data-preset="${i}">${label}</button>`).join("")}${kind === 1 ? '<button type="button" data-action="jump">Largest clock step \xB7 \u0E0A\u0E48\u0E27\u0E07\u0E17\u0E35\u0E48 \u0394G \u0E43\u0E2B\u0E0D\u0E48\u0E2A\u0E38\u0E14</button>' : ""}<button type="button" data-action="resample">New sample \xB7 \u0E2A\u0E38\u0E48\u0E21\u0E43\u0E2B\u0E21\u0E48</button><button type="button" data-action="reset">Reset \xB7 \u0E40\u0E23\u0E34\u0E48\u0E21\u0E43\u0E2B\u0E21\u0E48</button></div><div class="vg-legend"><span>${kind === 1 ? "Gamma clock G(t) / VG X(t)" : "VG \xB7 simulated histogram"}</span><span>${kind === 1 ? "Regular clock t / Brownian comparator" : "Normal \xB7 same mean and variance"}</span></div><div class="vg-plot" tabindex="0" role="group" aria-label="\u0E01\u0E23\u0E32\u0E1F\u0E2B\u0E25\u0E31\u0E01 \u0E40\u0E25\u0E37\u0E48\u0E2D\u0E19\u0E41\u0E19\u0E27\u0E19\u0E2D\u0E19\u0E1A\u0E19\u0E08\u0E2D\u0E40\u0E25\u0E47\u0E01"></div>${kind === 1 ? '<div class="vg-plot vg-second" tabindex="0" role="group" aria-label="\u0E01\u0E23\u0E32\u0E1F\u0E01\u0E32\u0E23\u0E40\u0E04\u0E25\u0E37\u0E48\u0E2D\u0E19\u0E44\u0E2B\u0E27 \u0E40\u0E25\u0E37\u0E48\u0E2D\u0E19\u0E41\u0E19\u0E27\u0E19\u0E2D\u0E19\u0E1A\u0E19\u0E08\u0E2D\u0E40\u0E25\u0E47\u0E01"></div>' : ""}<dl class="vg-metrics"></dl><p class="vg-status" role="status" aria-live="polite"></p><details><summary>Model & reading guide \xB7 \u0E27\u0E34\u0E18\u0E35\u0E2D\u0E48\u0E32\u0E19\u0E41\u0E25\u0E30\u0E2A\u0E21\u0E21\u0E15\u0E34\u0E10\u0E32\u0E19</summary><p>${kind === 1 ? "\u0E08\u0E33\u0E25\u0E2D\u0E07 120 \u0E0A\u0E48\u0E27\u0E07\u0E43\u0E19\u0E40\u0E27\u0E25\u0E32 T = 1; \u0394G ~ Gamma(\u0394t/\u03BD, \u03BD), \u0394X = 0.2\u221A\u0394G Z \u0E40\u0E2A\u0E49\u0E19\u0E40\u0E0A\u0E37\u0E48\u0E2D\u0E21\u0E41\u0E2A\u0E14\u0E07\u0E04\u0E48\u0E32\u0E17\u0E35\u0E48\u0E08\u0E38\u0E14\u0E40\u0E27\u0E25\u0E32 \u0E44\u0E21\u0E48\u0E43\u0E0A\u0E48\u0E40\u0E2A\u0E49\u0E19\u0E17\u0E32\u0E07\u0E15\u0E48\u0E2D\u0E40\u0E19\u0E37\u0E48\u0E2D\u0E07\u0E08\u0E23\u0E34\u0E07\u0E02\u0E2D\u0E07 jump process \u0E40\u0E2A\u0E49\u0E19 Brownian \u0E43\u0E0A\u0E49 Z \u0E0A\u0E38\u0E14\u0E40\u0E14\u0E35\u0E22\u0E27\u0E01\u0E31\u0E19\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E40\u0E17\u0E35\u0E22\u0E1A\u0E1C\u0E25\u0E02\u0E2D\u0E07\u0E19\u0E32\u0E2C\u0E34\u0E01\u0E32 \u0E41\u0E15\u0E48\u0E44\u0E21\u0E48\u0E43\u0E0A\u0E48 Brownian \u0E40\u0E2A\u0E49\u0E19\u0E40\u0E14\u0E35\u0E22\u0E27\u0E01\u0E31\u0E19\u0E17\u0E35\u0E48\u0E19\u0E33\u0E21\u0E32\u0E2D\u0E48\u0E32\u0E19\u0E15\u0E48\u0E32\u0E07\u0E40\u0E27\u0E25\u0E32" : "\u0E08\u0E33\u0E25\u0E2D\u0E07 X(T) = \u03B8G(T) + \u03C3\u221AG(T)Z \u0E08\u0E33\u0E19\u0E27\u0E19 24,000 \u0E04\u0E48\u0E32 \u0E42\u0E14\u0E22 G(T) ~ Gamma(T/\u03BD, \u03BD), Z ~ Normal(0,1) \u0E41\u0E25\u0E30\u0E40\u0E1B\u0E47\u0E19\u0E2D\u0E34\u0E2A\u0E23\u0E30\u0E01\u0E31\u0E19 \u0E40\u0E2A\u0E49\u0E19\u0E1B\u0E23\u0E30\u0E04\u0E37\u0E2D Normal \u0E17\u0E35\u0E48\u0E21\u0E35 mean \u0E41\u0E25\u0E30 variance \u0E40\u0E17\u0E48\u0E32\u0E01\u0E31\u0E1A VG \u0E15\u0E32\u0E21\u0E17\u0E24\u0E29\u0E0E\u0E35 \u0E41\u0E17\u0E48\u0E07\u0E40\u0E1B\u0E47\u0E19\u0E04\u0E27\u0E32\u0E21\u0E2B\u0E19\u0E32\u0E41\u0E19\u0E48\u0E19\u0E08\u0E32\u0E01\u0E15\u0E31\u0E27\u0E2D\u0E22\u0E48\u0E32\u0E07\u0E2A\u0E38\u0E48\u0E21 \u0E44\u0E21\u0E48\u0E43\u0E0A\u0E48\u0E40\u0E2A\u0E49\u0E19\u0E04\u0E27\u0E32\u0E21\u0E2B\u0E19\u0E32\u0E41\u0E19\u0E48\u0E19\u0E41\u0E1A\u0E1A exact"}.</p><p>T = 1 \u0E2B\u0E19\u0E48\u0E27\u0E22\u0E40\u0E27\u0E25\u0E32, E[G(t)] = t, Var[G(t)] = \u03BDt; \u03BD = 0 \u0E43\u0E0A\u0E49\u0E02\u0E35\u0E14\u0E08\u0E33\u0E01\u0E31\u0E14 G(t) = t. X \u0E40\u0E1B\u0E47\u0E19\u0E2D\u0E07\u0E04\u0E4C\u0E1B\u0E23\u0E30\u0E01\u0E2D\u0E1A log-return \u0E2B\u0E19\u0E48\u0E27\u0E22\u0E17\u0E28\u0E19\u0E34\u0E22\u0E21 \u0E44\u0E21\u0E48\u0E43\u0E0A\u0E48\u0E23\u0E32\u0E04\u0E32\u0E2A\u0E34\u0E19\u0E17\u0E23\u0E31\u0E1E\u0E22\u0E4C\u0E2B\u0E23\u0E37\u0E2D simple return. ${kind === 0 ? "\u0E01\u0E33\u0E2B\u0E19\u0E14 \u03B8 = 0 \u0E41\u0E25\u0E30 \u03C3 = 0.2; SD = 0.2 \u0E04\u0E07\u0E17\u0E35\u0E48." : ""} \u0E1C\u0E25\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14\u0E40\u0E1B\u0E47\u0E19\u0E41\u0E1A\u0E1A\u0E08\u0E33\u0E25\u0E2D\u0E07\u0E2A\u0E21\u0E21\u0E15\u0E34 \u0E44\u0E21\u0E48\u0E43\u0E0A\u0E48\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E15\u0E25\u0E32\u0E14\u0E2B\u0E23\u0E37\u0E2D\u0E01\u0E32\u0E23\u0E1B\u0E23\u0E30\u0E40\u0E21\u0E34\u0E19\u0E23\u0E32\u0E04\u0E32\u0E2D\u0E2D\u0E1B\u0E0A\u0E31\u0E19</p><p>\u0E43\u0E0A\u0E49 seed \u0E40\u0E14\u0E34\u0E21\u0E40\u0E21\u0E37\u0E48\u0E2D\u0E1B\u0E23\u0E31\u0E1A\u0E04\u0E48\u0E32\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E43\u0E2B\u0E49\u0E17\u0E33\u0E0B\u0E49\u0E33\u0E44\u0E14\u0E49 \u0E01\u0E32\u0E23\u0E1B\u0E23\u0E31\u0E1A\u0E1E\u0E32\u0E23\u0E32\u0E21\u0E34\u0E40\u0E15\u0E2D\u0E23\u0E4C\u0E2D\u0E32\u0E08\u0E40\u0E1B\u0E25\u0E35\u0E48\u0E22\u0E19\u0E25\u0E33\u0E14\u0E31\u0E1A\u0E01\u0E32\u0E23\u0E2A\u0E38\u0E48\u0E21 Gamma \u0E08\u0E36\u0E07\u0E44\u0E21\u0E48\u0E43\u0E0A\u0E48\u0E01\u0E32\u0E23\u0E08\u0E31\u0E1A\u0E04\u0E39\u0E48\u0E15\u0E31\u0E27\u0E2D\u0E22\u0E48\u0E32\u0E07\u0E41\u0E1A\u0E1A\u0E2B\u0E19\u0E36\u0E48\u0E07\u0E15\u0E48\u0E2D\u0E2B\u0E19\u0E36\u0E48\u0E07 \u0E01\u0E14 New sample \u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E14\u0E39 sampling noise \u0E41\u0E25\u0E30 Reset \u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E01\u0E25\u0E31\u0E1A\u0E04\u0E48\u0E32\u0E40\u0E23\u0E34\u0E48\u0E21\u0E15\u0E49\u0E19</p><p>\u0E2D\u0E49\u0E32\u0E07\u0E2D\u0E34\u0E07: <a href="https://engineering.nyu.edu/sites/default/files/2018-09/CarrEuropeanFinReview1998.pdf">Madan, Carr & Chang (1998), \xA72</a></p></details><p class="vg-method"></p>`;
    const plot = host.querySelector(".vg-plot"), metrics = host.querySelector(".vg-metrics"), status = host.querySelector(".vg-status");
    host.addEventListener("input", (e) => {
      if (e.target.dataset.key) {
        state[e.target.dataset.key] = Number(e.target.value);
        render();
      }
    });
    host.addEventListener("click", (e) => {
      const b = e.target.closest("button");
      if (!b) return;
      if (b.dataset.preset !== void 0) Object.assign(state, def.presets[Number(b.dataset.preset)][1]);
      else if (b.dataset.action === "reset") {
        Object.assign(state, Object.fromEntries(def.controls.map(([key, , , , , value]) => [key, value])));
        seed = 20260920;
      } else if (b.dataset.action === "resample") seed++;
      else if (b.dataset.action === "jump") state.step = cache.reduce((best, r, i) => r.dg > cache[best].dg ? i : best, 1);
      render();
    });
    render();
  }
  function normalSurvival(x) {
    const t = 1 / (1 + 0.2316419 * x);
    return Math.exp(-x * x / 2) / Math.sqrt(2 * Math.PI) * t * (0.31938153 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
  }
})();

}
function mountSourceLabs(root,lifecycle,page){
if(page.sourceScripts.includes("assets/vg-interactive.mjs")) run_vg(root,lifecycle);
}
(globalThis.QuantCornerReaderAdapters ||= {})["the-magnificent-jump/20261015"]={mountSourceShell,mountSourceLabs};
})();
