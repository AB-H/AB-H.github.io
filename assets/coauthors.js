// Co-author page: bar charts (SVG) and network (vis-network), theme-aware.
(() => {
  const D = window.COAUTH;
  if (!D) return;
  const $ = (id) => document.getElementById(id);
  const css = (name) => getComputedStyle($("viz-net")).getPropertyValue(name).trim();
  const NS = "http://www.w3.org/2000/svg";
  const el = (tag, attrs = {}, parent) => {
    const e = document.createElementNS(NS, tag);
    for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
    if (parent) parent.appendChild(e);
    return e;
  };
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  // Shared tooltip
  const tip = document.createElement("div");
  tip.className = "viz-tip";
  document.body.appendChild(tip);
  const showTip = (html, ev) => {
    tip.innerHTML = html;
    tip.style.opacity = 1;
    const r = tip.getBoundingClientRect();
    let x = ev.clientX + 14, y = ev.clientY + 14;
    if (x + r.width > window.innerWidth - 8) x = ev.clientX - r.width - 14;
    if (y + r.height > window.innerHeight - 8) y = ev.clientY - r.height - 14;
    tip.style.left = x + "px";
    tip.style.top = y + "px";
  };
  const hideTip = () => (tip.style.opacity = 0);

  // Bar with 4px rounded data-end, anchored square on the baseline
  const vbar = (x, y, w, h, r = 4) => {
    r = Math.min(r, w / 2, h);
    return `M${x},${y + h}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h}Z`;
  };
  const hbar = (x, y, w, h, r = 4) => {
    r = Math.min(r, h / 2, w);
    return `M${x},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h - r}Q${x + w},${y + h} ${x + w - r},${y + h}H${x}Z`;
  };

  function drawYears() {
    const box = $("viz-years");
    box.innerHTML = "";
    const data = D.perYear;
    const W = box.clientWidth, H = 220, m = { t: 12, r: 8, b: 26, l: 30 };
    const svg = el("svg", { width: W, height: H, role: "img", "aria-label": "Number of publications per year" }, box);
    const max = Math.max(...data.map((d) => d.n));
    const step = Math.max(1, Math.ceil(max / 4 / 2) * 2);
    const iw = W - m.l - m.r, ih = H - m.t - m.b;
    const bw = iw / data.length;
    const yv = (v) => m.t + ih - (v / max) * ih;
    for (let v = 0; v <= max; v += step) {
      el("line", { x1: m.l, x2: W - m.r, y1: yv(v), y2: yv(v), stroke: css("--grid"), "stroke-width": 1 }, svg);
      el("text", { x: m.l - 6, y: yv(v) + 4, "text-anchor": "end", class: "viz-axis" }, svg).textContent = v;
    }
    data.forEach((d, i) => {
      const x = m.l + i * bw;
      if (d.n > 0) {
        el("path", { d: vbar(x + 1, yv(d.n), Math.max(bw - 2, 1), m.t + ih - yv(d.n)), fill: css("--series-1") }, svg);
      }
      if (d.year % 5 === 0) {
        el("text", { x: x + bw / 2, y: H - 8, "text-anchor": "middle", class: "viz-axis" }, svg).textContent = d.year;
      }
      const hit = el("rect", { x, y: m.t, width: bw, height: ih, fill: "transparent" }, svg);
      hit.addEventListener("mousemove", (ev) => showTip(`<b>${d.year}</b><br>${d.n} publication${d.n === 1 ? "" : "s"}`, ev));
      hit.addEventListener("mouseleave", hideTip);
    });
  }

  function drawTop() {
    const box = $("viz-top");
    box.innerHTML = "";
    const data = D.top;
    const W = box.clientWidth, row = 26, labelW = Math.min(170, W * 0.4), m = { t: 4, r: 36 };
    const H = m.t + data.length * row;
    const svg = el("svg", { width: W, height: H, role: "img", "aria-label": "Co-authors with the most joint papers" }, box);
    const max = Math.max(...data.map((d) => d.papers));
    const iw = W - labelW - m.r;
    data.forEach((d, i) => {
      const y = m.t + i * row;
      el("text", { x: labelW - 10, y: y + row / 2 + 4, "text-anchor": "end", class: "viz-label" }, svg).textContent = d.author;
      const w = Math.max(2, (d.papers / max) * iw);
      el("path", { d: hbar(labelW, y + 5, w, row - 10), fill: css("--series-1") }, svg);
      el("text", { x: labelW + w + 6, y: y + row / 2 + 4, class: "viz-value" }, svg).textContent = d.papers;
      const hit = el("rect", { x: 0, y, width: W, height: row, fill: "transparent" }, svg);
      hit.addEventListener("mousemove", (ev) =>
        showTip(`<b>${esc(d.author)}</b><br>${d.papers} joint papers<br>${d.first === d.last ? d.first : d.first + "–" + d.last}`, ev));
      hit.addEventListener("mouseleave", hideTip);
    });
  }

  // Network ---------------------------------------------------------------
  const commColor = (rank) => (rank >= 1 && rank <= 3 ? css(`--series-${rank}`) : css("--neutral"));
  let network, nodesDS, edgesDS;

  function nodeStyle(n, dim) {
    const c = commColor(n.comm);
    return {
      color: { background: c, border: css("--surface"), highlight: { background: c, border: css("--text-primary") }, hover: { background: c, border: css("--text-primary") } },
      opacity: dim ? 0.15 : 1,
      font: { color: css("--text-primary"), strokeWidth: 3, strokeColor: css("--surface"), size: 15 },
    };
  }

  function drawNet() {
    const box = $("viz-net");
    const leads = new Set(D.communities.filter((c) => c.size >= 2).map((c) => c.lead));
    const nodes = D.nodes.map((n) => ({
      id: n.id,
      label: n.papers >= 4 || leads.has(n.id) ? n.id : undefined,
      value: n.papers,
      title: (() => {
        const t = document.createElement("div");
        t.innerHTML = `<b>${esc(n.id)}</b><br>${n.papers} joint papers (${n.first === n.last ? n.first : n.first + "–" + n.last})<br>Community: ${esc(D.communities[n.comm - 1].lead)}${D.communities[n.comm - 1].themes ? `<br><i>${esc(D.communities[n.comm - 1].themes)}</i>` : ""}`;
        return t;
      })(),
      borderWidth: 2,
      ...nodeStyle(n, false),
    }));
    const edges = D.edges.map((e, i) => ({ id: i, from: e.from, to: e.to, value: e.weight, color: { color: css("--edge"), highlight: css("--text-secondary"), hover: css("--text-secondary") } }));
    nodesDS = new vis.DataSet(nodes);
    edgesDS = new vis.DataSet(edges);
    network = new vis.Network(box, { nodes: nodesDS, edges: edgesDS }, {
      nodes: { shape: "dot", scaling: { min: 6, max: 26 } },
      edges: { scaling: { min: 1, max: 5 }, smooth: false },
      physics: { solver: "forceAtlas2Based", forceAtlas2Based: { gravitationalConstant: -40, springLength: 70 }, stabilization: { iterations: 400 } },
      interaction: { hover: true, tooltipDelay: 80, navigationButtons: false, zoomView: true },
    });
    network.once("stabilizationIterationsDone", () => network.setOptions({ physics: false }));
  }

  function highlight(ranks) {
    nodesDS.update(D.nodes.map((n) => ({ id: n.id, ...nodeStyle(n, ranks != null && !ranks.includes(n.comm)) })));
  }

  function drawComm() {
    const box = $("viz-comm");
    box.innerHTML = "<h3 class='viz-h'>Communities</h3>";
    const ul = document.createElement("ul");
    ul.className = "viz-comm-list";
    const groups = D.communities.filter((c) => c.size >= 2);
    const singles = D.communities.filter((c) => c.size < 2);
    if (singles.length) groups.push({ rank: -1, size: singles.length, lead: null, members: singles.map((c) => c.lead).join(", "), ranks: singles.map((c) => c.rank) });
    groups.forEach((c) => {
      const li = document.createElement("li");
      li.innerHTML = `<span class="viz-swatch" style="background:${commColor(c.rank)}"></span><span>${c.lead ? `<b>${esc(c.lead)}</b> and co.` : "<b>Isolated co-authors</b>"} <span class="viz-muted">· ${c.size} people${c.n_papers ? ` · ${c.n_papers} paper${c.n_papers > 1 ? "s" : ""} · ${c.period}` : ""}</span>${c.themes ? `<br><span class="viz-themes">${esc(c.themes)}</span>` : ""}<br><span class="viz-muted">${esc(c.members)}</span></span>`;
      li.tabIndex = 0;
      const on = () => highlight(c.ranks || [c.rank]);
      li.addEventListener("mouseenter", on);
      li.addEventListener("focus", on);
      li.addEventListener("mouseleave", () => highlight(null));
      li.addEventListener("blur", () => highlight(null));
      ul.appendChild(li);
    });
    box.appendChild(ul);
  }

  function restyle() {
    drawYears();
    drawTop();
    drawComm();
    if (nodesDS) {
      highlight(null);
      edgesDS.update(D.edges.map((e, i) => ({ id: i, color: { color: css("--edge"), highlight: css("--text-secondary"), hover: css("--text-secondary") } })));
    }
  }

  drawYears();
  drawTop();
  drawNet();
  drawComm();
  new MutationObserver(restyle).observe(document.body, { attributes: true, attributeFilter: ["class"] });
  let t;
  window.addEventListener("resize", () => { clearTimeout(t); t = setTimeout(() => { drawYears(); drawTop(); }, 150); });
})();
