// bz-controls.js — <bz-controls> web component for BlitZoom.
// Strength sliders + bearing dials per property group.
//
// Declarative usage:
//   <bz-graph id="g" edges="data/karate.edges" nodes="data/karate.nodes"></bz-graph>
//   <bz-controls for="g"></bz-controls>
//
// Events:
//   'input'   — continuous during slider/dial drag, detail: { name, strength, bearing }
//   'change'  — on drag end,                        detail: { name, strength, bearing }
//   'colorby' — group label click,                  detail: { name }

class BzControls extends HTMLElement {
  static get observedAttributes() { return ['for', 'max-strength', 'checkboxes']; }

  constructor() {
    super();
    this._groups = [];
    this._maxStrength = 10;
    this._labelProps = new Set();
    this._colorBy = null;
    this._boundView = null;
    this._boundTarget = null;
    this._boundReadyHandler = null;
    this._boundStateHandler = null;
    this._onBoundInput = null;

    this._shadow = this.attachShadow({ mode: 'open' });
    this._shadow.innerHTML = `<style>
      :host { display: block; font: 11px -apple-system, system-ui, sans-serif; color: var(--fg, #dde); }
      .row { display: flex; align-items: center; gap: 6px; padding: 3px 0; min-width: 0; }
      .label { width: 70px; flex-shrink: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; cursor: pointer; font-size: 11px; }
      .label:hover { color: var(--accent, #5af); }
      .slider { flex: 1 1 0; min-width: 0; height: 3px; -webkit-appearance: none; appearance: none; background: var(--border, #334); border-radius: 2px; outline: none; cursor: pointer; touch-action: none; }
      .slider::-webkit-slider-thumb { -webkit-appearance: none; width: 12px; height: 12px; border-radius: 50%; background: var(--accent, #5af); cursor: pointer; }
      .slider::-moz-range-thumb { width: 12px; height: 12px; border-radius: 50%; background: var(--accent, #5af); border: none; cursor: pointer; }
      .val { font-size: 10px; color: var(--accent, #5af); min-width: 18px; text-align: right; font-family: 'JetBrains Mono', monospace; }
      .dial { width: 20px; height: 20px; border-radius: 50%; border: 0.5px solid var(--border, #334); background: var(--bg, #12122a); opacity: 0.4; position: relative; flex-shrink: 0; cursor: ns-resize; touch-action: none; outline: none; user-select: none; transition: opacity 0.15s, border-color 0.15s; }
      .dial.nonzero { opacity: 0.9; border: 1px solid var(--accent3, #6af7c8); }
      .dial:hover, .dial:focus { opacity: 1; border-color: var(--accent, #5af); }
      .tick { position: absolute; left: 50%; top: 2px; width: 2px; height: 8px; margin-left: -1px; background: var(--accent, #5af); transform-origin: 50% 100%; pointer-events: none; }
      .cb { width: 12px; height: 12px; accent-color: var(--accent, #5af); flex-shrink: 0; }
      .label.active { text-decoration: underline; }
      .container { display: flex; flex-direction: column; }
      .toolbar { display: flex; justify-content: space-between; padding: 4px 0 2px; }
      .toolbar-group { display: flex; gap: 4px; }
      .toolbar button { background: var(--bg, #12122a); color: var(--fg, #dde); border: 1px solid var(--border, #334); font: bold 10px -apple-system, system-ui, sans-serif; padding: 2px 6px; border-radius: 3px; cursor: pointer; line-height: 1.2; }
      .toolbar button:hover { border-color: var(--accent, #5af); color: var(--accent, #5af); }
    </style><div class="container"></div>`;
    this._container = this._shadow.querySelector('.container');
  }

  connectedCallback() {
    // Host-level keydown listener: forward canvas-level shortcuts (`,` `.` `f`
    // etc.) to the bound view's canvas regardless of which inner element
    // (slider, dial, checkbox) currently has focus. We listen at the host so
    // events from any focused descendant bubble through; we filter to the
    // forward set before re-dispatching so native input handlers (slider arrow
    // keys, dial Home/0) are unaffected.
    this._boundKeydown = this._onKeyDown.bind(this);
    this.addEventListener('keydown', this._boundKeydown);

    const forId = this.getAttribute('for');
    if (forId) this._bindToGraph(forId);
  }

  disconnectedCallback() {
    if (this._boundKeydown) {
      this.removeEventListener('keydown', this._boundKeydown);
      this._boundKeydown = null;
    }
    this._unbind();
  }

  _onKeyDown(e) {
    // Delegate canvas-level shortcuts (level switch, FPS, etc.) to the bound
    // view. The canvas owns the policy and the dispatch — we just ask.
    this._boundView?.forwardKeyEvent(e);
  }

  attributeChangedCallback(name, _old, val) {
    if (name === 'for') this._bindToGraph(val);
    else if (name === 'max-strength') { this._maxStrength = parseFloat(val) || 10; this._rebuild(); }
    else if (name === 'checkboxes') this._rebuild();
  }

  // ─── Public API ─────────────────────────────────────────────────────────────

  get groups() { return this._groups; }
  set groups(arr) {
    this._groups = (arr || []).map(g => ({ ...g }));
    this._rebuild();
  }

  get maxStrength() { return this._maxStrength; }
  set maxStrength(v) { this._maxStrength = v; this._rebuild(); }

  get labelProps() { return this._labelProps; }
  set labelProps(s) { this._labelProps = s instanceof Set ? s : new Set(s || []); this._syncCheckboxes(); }

  get colorBy() { return this._colorBy; }
  set colorBy(v) { this._colorBy = v; this._syncColorBy(); }

  update(name, strength, bearing) {
    const g = this._groups.find(g => g.name === name);
    if (!g) return;
    g.strength = strength;
    g.bearing = bearing;
    this._syncRow(name);
  }

  updateAll(arr) {
    for (const src of arr) {
      const g = this._groups.find(g => g.name === src.name);
      if (g) {
        g.strength = src.strength;
        g.bearing = src.bearing;
        if (src.color) g.color = src.color;
      }
    }
    this._syncAllRows();
  }

  // ─── Rendering ──────────────────────────────────────────────────────────────

  _rebuild() {
    this._container.innerHTML = '';

    // Toolbar with 0, Q, and A buttons
    const toolbar = document.createElement('div');
    toolbar.className = 'toolbar';
    toolbar.innerHTML = `<div class="toolbar-group"><button data-action="quant" title="Cycle quantization mode">Q</button></div><div class="toolbar-group"><button data-action="zero" title="Reset all to zero">0</button><button data-action="auto" title="Auto-tune strengths and bearings">A</button></div>`;
    this._container.appendChild(toolbar);
    toolbar.addEventListener('click', (e) => {
      const action = e.target.dataset?.action;
      if (action === 'zero') {
        for (const g of this._groups) { g.strength = 0; g.bearing = 0; }
        this._syncAllRows();
        for (const g of this._groups) {
          this.dispatchEvent(new CustomEvent('change', { detail: { name: g.name, strength: 0, bearing: 0 }, bubbles: true }));
        }
      } else if (action === 'quant') {
        this.dispatchEvent(new Event('quantcycle', { bubbles: true }));
      } else if (action === 'auto') {
        this.dispatchEvent(new Event('autotune', { bubbles: true }));
      }
    });
    // _rebuild reconstructs the toolbar each time groups change; refresh
    // the Q button's label from the bound view (if any) so it doesn't reset
    // to "Q" after the rebuild.
    this.updateQuantBtn();

    for (const g of this._groups) {
      const row = document.createElement('div');
      row.className = 'row';
      row.dataset.group = g.name;
      const deg = Math.round(((g.bearing || 0) * 180 / Math.PI) % 360 + 360) % 360;

      const showCb = this.hasAttribute('checkboxes');
      const checked = this._labelProps.has(g.name);
      // Display label may differ from internal name (e.g. "category" instead
      // of "group" for datasets that use a non-canonical source field).
      const displayName = g.displayName || g.name;
      row.innerHTML = `${showCb ? `<input class="cb" type="checkbox" title="Include in label"${checked ? ' checked' : ''}>` : ''}
        <span class="label${this._colorBy === g.name ? ' active' : ''}" title="Color by ${displayName}">${displayName}</span>
        <input class="slider" type="range" min="0" max="${this._maxStrength}" step="0.1" value="${g.strength || 0}">
        <span class="val">${Math.round((g.strength || 0) * 10) / 10}</span>
        <div class="dial${deg ? ' nonzero' : ''}" tabindex="0" role="slider"
             aria-label="Bearing for ${displayName}" aria-valuemin="0" aria-valuemax="359" aria-valuenow="${deg}"
             aria-valuetext="${deg} degrees">
          <div class="tick" style="transform:rotate(${deg}deg)"></div>
        </div>`;
      this._container.appendChild(row);

      // Slider events
      const slider = row.querySelector('.slider');
      const valSpan = row.querySelector('.val');
      slider.addEventListener('input', () => {
        g.strength = parseFloat(slider.value);
        valSpan.textContent = Math.round(g.strength * 10) / 10;
        this._emit('input', g);
      });
      slider.addEventListener('change', () => this._emit('change', g));

      // Checkbox → labelchange
      const cb = row.querySelector('.cb');
      if (cb) {
        cb.addEventListener('change', () => {
          if (cb.checked) this._labelProps.add(g.name); else this._labelProps.delete(g.name);
          this.dispatchEvent(new CustomEvent('labelchange', {
            detail: { name: g.name, checked: cb.checked, labelProps: [...this._labelProps] },
            bubbles: true,
          }));
        });
      }

      // Label click → colorby
      row.querySelector('.label').addEventListener('click', () => {
        this._colorBy = this._colorBy === g.name ? null : g.name;
        this._syncColorBy();
        this.dispatchEvent(new CustomEvent('colorby', { detail: { name: g.name }, bubbles: true }));
      });

      // Bearing dial
      this._wireDial(row.querySelector('.dial'), g);
    }
  }

  _syncRow(name) {
    const row = this._container.querySelector(`[data-group="${CSS.escape(name)}"]`);
    if (!row) return;
    const g = this._groups.find(g => g.name === name);
    if (!g) return;
    const slider = row.querySelector('.slider');
    const valSpan = row.querySelector('.val');
    const dial = row.querySelector('.dial');
    const tick = dial?.querySelector('.tick');
    if (slider) slider.value = g.strength;
    if (valSpan) valSpan.textContent = Math.round(g.strength * 10) / 10;
    if (dial && tick) {
      const d = Math.round(((g.bearing || 0) * 180 / Math.PI) % 360 + 360) % 360;
      tick.style.transform = `rotate(${d}deg)`;
      dial.classList.toggle('nonzero', d !== 0);
      dial.setAttribute('aria-valuenow', String(d));
      dial.setAttribute('aria-valuetext', `${d} degrees`);
    }
  }

  _syncAllRows() {
    for (const g of this._groups) this._syncRow(g.name);
  }

  _syncCheckboxes() {
    for (const row of this._container.children) {
      const cb = row.querySelector('.cb');
      if (cb) cb.checked = this._labelProps.has(row.dataset.group);
    }
  }

  _syncColorBy() {
    for (const row of this._container.children) {
      const label = row.querySelector('.label');
      if (label) label.classList.toggle('active', this._colorBy === row.dataset.group);
    }
  }

  // Reflect the given view's current quantMode in the Q toolbar button.
  // Public so bz-graph can call it for the internal controls panel (which
  // doesn't go through _bindToGraph). Defaults to this._boundView for the
  // standalone `for=` binding path.
  updateQuantBtn(view = this._boundView) {
    if (!view) return;
    const btn = this._shadow.querySelector('[data-action="quant"]');
    if (!btn) return;
    const mode = view.quantMode || 'gaussian';
    const labels = { gaussian: 'Q:G', rank: 'Q:R', norm: 'Q:N', polar: 'Q:P' };
    btn.textContent = labels[mode] || 'Q:?';
    btn.title = `Quant mode: ${mode} (click to cycle)`;
  }

  _emit(type, g) {
    this.dispatchEvent(new CustomEvent(type, {
      detail: { name: g.name, strength: g.strength, bearing: g.bearing || 0 },
      bubbles: true,
    }));
  }

  // ─── Bearing dial ───────────────────────────────────────────────────────────

  _wireDial(dial, g) {
    const tick = dial.querySelector('.tick');
    const PIXELS_PER_ROTATION = 200;

    const setDeg = (deg) => {
      let d = Math.round(deg) % 360;
      if (d < 0) d += 360;
      if (d <= 5 || d >= 355) d = 0;
      tick.style.transform = `rotate(${d}deg)`;
      dial.classList.toggle('nonzero', d !== 0);
      dial.setAttribute('aria-valuenow', String(d));
      dial.setAttribute('aria-valuetext', `${d} degrees`);
      g.bearing = d * Math.PI / 180;
    };

    let dragging = false, startY = 0, startDeg = 0;
    dial.addEventListener('pointerdown', e => {
      if (e.ctrlKey || e.metaKey) { e.preventDefault(); setDeg(0); this._emit('change', g); return; }
      e.preventDefault();
      dial.focus();
      dragging = true;
      startY = e.clientY;
      startDeg = parseInt(dial.getAttribute('aria-valuenow') || '0', 10);
      dial.setPointerCapture(e.pointerId);
    });
    dial.addEventListener('pointermove', e => {
      if (!dragging) return;
      const dy = startY - e.clientY;
      const sensitivity = e.shiftKey ? PIXELS_PER_ROTATION * 4 : PIXELS_PER_ROTATION;
      setDeg(startDeg + (dy / sensitivity) * 360);
      this._emit('input', g);
    });
    const endDrag = (e) => {
      if (!dragging) return;
      dragging = false;
      try { dial.releasePointerCapture(e.pointerId); } catch (_) {}
      this._emit('change', g);
    };
    dial.addEventListener('pointerup', endDrag);
    dial.addEventListener('pointercancel', endDrag);
    dial.addEventListener('dblclick', e => { e.preventDefault(); setDeg(0); this._emit('change', g); });

    dial.addEventListener('keydown', e => {
      const current = parseInt(dial.getAttribute('aria-valuenow') || '0', 10);
      const step = e.shiftKey ? 45 : 15;
      let consumed = false;
      if (e.key === 'ArrowRight' || e.key === 'ArrowUp') { setDeg(current + step); consumed = true; }
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { setDeg(current - step); consumed = true; }
      else if (e.key === 'Home' || e.key === '0') { setDeg(0); consumed = true; }
      if (consumed) { e.preventDefault(); e.stopPropagation(); this._emit('input', g); }
    });
  }

  // ─── Auto-bind to <bz-graph> ────────────────────────────────────────────────

  _unbind() {
    this._unbindFromView();
    if (this._boundReadyHandler) {
      this._boundTarget?.removeEventListener('ready', this._boundReadyHandler);
      this._boundReadyHandler = null;
      this._boundTarget = null;
    }
  }

  _bindToGraph(id) {
    this._unbind();
    if (!id) return;

    const el = document.getElementById(id);
    if (!el) return;

    if (el.view) {
      this.bindToView(el.view);
    } else {
      this._boundTarget = el;
      this._boundReadyHandler = () => this.bindToView(el.view);
      el.addEventListener('ready', this._boundReadyHandler, { once: true });
    }
  }

  /**
   * Public binding API. Called by the standalone `for=` path (via
   * `_bindToGraph`) and directly by hosts that hold a `<bz-controls>`
   * element programmatically (`<bz-graph>`'s internal panel,
   * `blitzoom-viewer`'s static `strengthControls`).
   *
   * Wires the standard event flow:
   *   - input  → fastRebuild (rAF-coalesced)
   *   - change → endFastRebuild
   *   - colorby → toggle view.colorBy
   *   - labelchange → set view.labelProps + render
   *   - autotune → built-in flow (or `opts.onAutotune` override)
   *   - quantcycle → cycle quant mode + refresh button label
   *   - statechange → syncFromView + refresh button label
   *
   * Hosts that need additional behavior (cross-panel sync, custom
   * autotune flow, viewer-specific UI updates) can pass callbacks via
   * `opts` or attach their own listeners on the same element after
   * calling bindToView. Multiple listeners on the same event run in
   * registration order.
   *
   * @param {BlitZoomCanvas} view - the canvas to bind to
   * @param {object} [opts]
   * @param {Function} [opts.onAutotune] - replaces the built-in autotune
   *   flow. When provided, the autotune button click invokes this
   *   callback instead of running the standalone autotune.
   */
  bindToView(view, opts = {}) {
    this._unbindFromView();
    // Note: do NOT bail out when groupNames is empty. The viewer creates
    // its canvas before any dataset is loaded (groupNames=[] initially)
    // and binds compass/controls in its constructor. If we returned here,
    // none of the event listeners would be installed and the Q button
    // (and everything else) would be silently dead even after data loads.
    // _syncFromView and updateQuantBtn both handle empty group lists fine.
    if (!view || !view.groupNames) return;
    this._boundView = view;
    this._syncFromView();
    this.updateQuantBtn(view);

    // Push control changes → view. `input` events fire continuously during
    // a slider/dial drag — coalesce per animation frame and call
    // view.fastRebuild() (subsamples the layout/render for large graphs).
    // `change` events fire on release — call view.endFastRebuild() to drop
    // the subsample and run a full-quality rebuild.
    const applyDetail = (detail) => {
      view.propStrengths[detail.name] = detail.strength;
      view.propBearings[detail.name] = detail.bearing;
    };
    // _bindRebuildRaf and _bindEndRebuildPending live on `this` (not as
    // closure locals) so `_unbindFromView` can cancel or invalidate them
    // when rebinding or disconnecting, preventing a pending
    // fastRebuild/endFastRebuild from firing against a defunct view.
    this._bindRebuildRaf = null;
    this._bindEndRebuildPending = false;
    this._onBoundInput = (e) => {
      if (!e.detail) return;
      applyDetail(e.detail);
      if (this._bindRebuildRaf == null) {
        this._bindRebuildRaf = requestAnimationFrame(() => {
          this._bindRebuildRaf = null;
          // Guard: unbind may have fired after the rAF was scheduled.
          if (this._boundView === view) view.fastRebuild();
        });
      }
    };
    this._onBoundChange = (e) => {
      if (!e.detail) return;
      applyDetail(e.detail);
      // Cancel any rAF that hasn't fired yet — otherwise it would run
      // fastRebuild() AFTER endFastRebuild() and re-engage fast mode.
      if (this._bindRebuildRaf != null) {
        cancelAnimationFrame(this._bindRebuildRaf);
        this._bindRebuildRaf = null;
      }
      // Coalesce bursts of change events (e.g. _zeroAll dispatching N+1
      // events synchronously) into a single endFastRebuild via microtask.
      // Without this, only the first event's blend runs (the rest hit the
      // _blending guard and no-op), leaving propStrengths fully zeroed but
      // the rendered layout reflecting only the first group's change.
      if (!this._bindEndRebuildPending) {
        this._bindEndRebuildPending = true;
        queueMicrotask(() => {
          this._bindEndRebuildPending = false;
          // Guard: unbind may have fired after the microtask was queued.
          if (this._boundView === view) view.endFastRebuild();
        });
      }
    };
    this._onBoundColorby = (e) => {
      if (!e.detail) return;
      view.colorBy = (view.colorBy === e.detail.name) ? null : e.detail.name;
    };
    this._onBoundLabelchange = (e) => {
      if (!e.detail) return;
      view.labelProps = new Set(e.detail.labelProps);
      view._refreshPropCache();
      view.render();
    };
    this.addEventListener('input', this._onBoundInput);
    this.addEventListener('change', this._onBoundChange);
    this.addEventListener('colorby', this._onBoundColorby);
    this.addEventListener('labelchange', this._onBoundLabelchange);

    // Auto-tune button — host override or built-in flow
    if (opts.onAutotune) {
      this._onBoundAutotune = opts.onAutotune;
    } else {
      let tuneAbort = null;
      this._onBoundAutotune = async () => {
        if (tuneAbort) { tuneAbort.abort(); view.showProgress(null); return; }
        try {
          tuneAbort = new AbortController();
          view.showProgress('Auto-tuning...');
          const { autoTuneStrengths, autoTuneBearings } = await import('./blitzoom-utils.js');
          const result = await autoTuneStrengths(view.nodes, view.groupNames, view.adjList, view.nodeIndexFull, {
            strengths: true, alpha: true, signal: tuneAbort.signal,
            onProgress: (info) => {
              const pct = Math.round(100 * info.step / Math.max(1, info.total));
              const phase = info.phase === 'presets' ? 'scanning presets'
                : info.phase === 'done' ? 'done' : 'refining';
              view.showProgress(`Auto-tuning: ${phase} (${pct}%)`);
            },
          });
          for (const g of view.groupNames) view.propStrengths[g] = result.strengths[g] ?? 0;
          view.smoothAlpha = result.alpha;
          if (view.quantMode !== 'norm') view.quantMode = result.quantMode;
          view._quantStats = {};
          const bearings = autoTuneBearings(view.nodes, view.groupNames, result.strengths);
          view.propBearings = bearings;
          view.levels = new Array(view.levels.length).fill(null);
          await view._blend();
          view.layoutAll();
          view.showProgress(null);
        } catch (e) {
          view.showProgress(null);
          if (e.name !== 'AbortError') console.warn('[bz-controls] autotune failed:', e.message);
        }
        tuneAbort = null;
      };
    }
    this.addEventListener('autotune', this._onBoundAutotune);

    // Quant mode cycle button — Gaussian → Rank → Norm → Polar → Gaussian
    const QUANT_MODES = ['gaussian', 'rank', 'norm', 'polar'];
    this._onBoundQuantcycle = () => {
      const v = this._boundView;
      if (!v) return;
      const idx = QUANT_MODES.indexOf(v.quantMode);
      v.setQuantMode(QUANT_MODES[(idx + 1) % QUANT_MODES.length]);
      this.updateQuantBtn(v);
    };
    this.addEventListener('quantcycle', this._onBoundQuantcycle);

    // Pull view changes → controls after each statechange
    this._boundStateHandler = () => { this._syncFromView(); this.updateQuantBtn(view); };
    view.canvas.addEventListener('statechange', this._boundStateHandler);
  }

  /** Tear down all listeners installed by `bindToView`. Idempotent. */
  _unbindFromView() {
    if (!this._boundView) return;
    // Cancel any pending rAF from a drag-in-progress, and let any pending
    // microtask become a no-op via the `_boundView === view` guard inside
    // the callback. queueMicrotask can't be cancelled, so the guard is
    // the only way to neutralize it.
    if (this._bindRebuildRaf != null) {
      cancelAnimationFrame(this._bindRebuildRaf);
      this._bindRebuildRaf = null;
    }
    this._bindEndRebuildPending = false;
    if (this._boundStateHandler) {
      this._boundView.canvas.removeEventListener('statechange', this._boundStateHandler);
      this._boundStateHandler = null;
    }
    if (this._onBoundInput) { this.removeEventListener('input', this._onBoundInput); this._onBoundInput = null; }
    if (this._onBoundChange) { this.removeEventListener('change', this._onBoundChange); this._onBoundChange = null; }
    if (this._onBoundColorby) { this.removeEventListener('colorby', this._onBoundColorby); this._onBoundColorby = null; }
    if (this._onBoundLabelchange) { this.removeEventListener('labelchange', this._onBoundLabelchange); this._onBoundLabelchange = null; }
    if (this._onBoundAutotune) { this.removeEventListener('autotune', this._onBoundAutotune); this._onBoundAutotune = null; }
    if (this._onBoundQuantcycle) { this.removeEventListener('quantcycle', this._onBoundQuantcycle); this._onBoundQuantcycle = null; }
    this._boundView = null;
  }

  _syncFromView() {
    const v = this._boundView;
    if (!v) return;
    // Show ALL groups in the controls panel (label/structure/neighbors
    // included), matching the viewer's sidebar and bz-graph's controls
    // panel. The compass filters those three out because dial spokes
    // don't suit them; controls have no such constraint.
    const groups = v.groupNames.map(g => {
      const cmap = v.propColors && v.propColors[g];
      const color = cmap ? Object.values(cmap)[0] || '#888' : '#888';
      return {
        name: g,
        // Display label may differ from internal name when the dataset's
        // source field is "category" / "type" / "kind" instead of "group".
        displayName: v.displayNameFor ? v.displayNameFor(g) : g,
        color,
        strength: v.propStrengths[g] || 0,
        bearing: v.propBearings[g] || 0,
      };
    });
    if (this._groups.length === groups.length) {
      const same = groups.every((g, i) => {
        const o = this._groups[i];
        return o && o.name === g.name && o.strength === g.strength && o.bearing === g.bearing;
      });
      if (!same) this.updateAll(groups);
    } else {
      this.groups = groups;
    }
    this.colorBy = v.colorBy;
    this.labelProps = v.labelProps;
  }
}

customElements.define('bz-controls', BzControls);
export { BzControls };
