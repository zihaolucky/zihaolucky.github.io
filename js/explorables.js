/* Explorables — small interactive widgets for the patent case studies.
   No dependencies. Each widget mounts into [data-explorable] and degrades to
   a static text fallback when JavaScript is unavailable. */

(function () {
  'use strict';

  function el(tag, cls, text) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text !== undefined && text !== null) node.textContent = text;
    return node;
  }

  function pc(v) {
    return (v * 100) + '%';
  }

  function reducedMotion() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  /* ======================================================================
     1. The rule-first cascade — patent CN112002313B

     The industry baseline was "first rules, then model". A hand-written
     template either matches or it does not; there is no confidence dial to
     turn. The only decision available is which component outranks the other,
     and that ordering is fixed once for every utterance the system will ever
     see. These seven show why no ordering can be right: some need the
     template overruled, others need it obeyed, and a cascade cannot tell
     which kind it is holding.
     ====================================================================== */

  var NLU_CASES = [
    {
      utterance: '“play Blue and White Porcelain”',
      truth: 'Music',
      rule: { domain: 'Music', note: '<b>play @{song}</b> matches the catalogue' },
      model: { domain: 'Music' },
      learned: 0.55
    },
    {
      utterance: '“Jay Chou’s father”',
      truth: 'Q&A',
      rule: { domain: 'Music', note: '<b>@{artist}’s @{song}</b> matches — 父亲 really is a song' },
      model: { domain: 'Q&A' },
      learned: 0.12
    },
    {
      utterance: '“turn on the bard room light”',
      truth: 'Smart home',
      rule: { domain: 'Smart home', note: '<b>turn on the * light</b> survives the transcription slip' },
      model: { domain: 'Music' },
      learned: 0.78
    },
    {
      utterance: '“I want to buy the one I looked at yesterday”',
      truth: 'Shopping',
      rule: null,
      model: { domain: 'Shopping' },
      learned: 0.05
    },
    {
      utterance: '“put on something a bit more cheerful”',
      truth: 'Music',
      rule: null,
      model: { domain: 'Music' },
      learned: 0.08
    },
    {
      utterance: '“will I need an umbrella tomorrow”',
      truth: 'Weather',
      rule: { domain: 'Q&A', note: '<b>generic question</b> pattern claims it' },
      model: { domain: 'Weather' },
      learned: 0.30
    },
    {
      utterance: '“add milk to my shopping list”',
      truth: 'Shopping',
      rule: { domain: 'Shopping', note: '<b>add * to my * list</b> matches' },
      model: { domain: 'Smart home' },
      learned: 0.82
    }
  ];

  /* Rules first, then model — the industry standard. A template match wins
     outright, and the model is reached only when nothing matched at all. */
  function nluRouteRulesFirst(item) {
    return item.rule
      ? { domain: item.rule.domain, source: 'rule' }
      : { domain: item.model.domain, source: 'model' };
  }

  /* The only other way to order the same two components: the model decides,
     and the templates are demoted to a backstop for what it will not answer.
     These seven all get a model answer, so the templates never fire. */
  function nluRouteModelFirst(item) {
    return { domain: item.model.domain, source: 'model' };
  }

  /* The patent removes the ordering. Attention weighs the template evidence
     against the semantics for this utterance, and the larger share decides. */
  function nluRouteLearned(item) {
    return item.rule && item.learned > 0.5
      ? { domain: item.rule.domain, source: 'rule' }
      : { domain: item.model.domain, source: 'model' };
  }

  var NLU_WIRINGS = [
    { id: 'rules', name: 'Rules first, then model', route: nluRouteRulesFirst },
    { id: 'model', name: 'Model first, rules as backstop', route: nluRouteModelFirst },
    { id: 'learned', name: 'Weighed per utterance (the patent)', route: nluRouteLearned }
  ];

  function nluWiring(id) {
    for (var i = 0; i < NLU_WIRINGS.length; i++) {
      if (NLU_WIRINGS[i].id === id) return NLU_WIRINGS[i];
    }
    return NLU_WIRINGS[0];
  }

  function nluOutcomes(wiring) {
    return NLU_CASES.map(function (item) {
      var routed = wiring.route(item);
      return { routed: routed, ok: routed.domain === item.truth };
    });
  }

  function initNluRouter(root) {
    var mount = root.querySelector('[data-role="mount"]');
    if (!mount) return;

    var total = NLU_CASES.length;
    var state = { wiring: 'rules' };

    /* --- scoreboard: every way to wire these two components ------------- */
    var board = el('div', 'xpl-board');
    var optRefs = NLU_WIRINGS.map(function (wiring) {
      var btn = el('button', 'xpl-opt');
      btn.type = 'button';
      btn.appendChild(el('span', 'opt-name', wiring.name));

      var outcomes = nluOutcomes(wiring);
      var correct = 0;
      var pips = el('span', 'opt-pips');
      outcomes.forEach(function (o, i) {
        if (o.ok) correct++;
        var pip = el('span', 'pip ' + (o.ok ? 'is-ok' : 'is-bad'));
        pip.title = NLU_CASES[i].utterance + (o.ok ? ' — correct' : ' — wrong');
        pips.appendChild(pip);
      });

      btn.appendChild(el('span', 'opt-score', correct + ' / ' + total));
      btn.appendChild(pips);
      btn.setAttribute('aria-label', wiring.name + ': ' + correct + ' of ' + total + ' routed correctly');
      btn.addEventListener('click', function () { state.wiring = wiring.id; render(); });
      board.appendChild(btn);
      return { wiring: wiring, btn: btn };
    });

    var boardCap = el('p', 'xpl-track-cap',
      'Each square is one of the seven requests. There is no dial here — a template either matches or it does not, ' +
      'so the only choice a cascade offers is which component outranks the other. Both orderings score the same, ' +
      'and they fail on different requests.');

    /* --- tally --------------------------------------------------------- */
    var tally = el('div', 'xpl-tally');
    var tallyNum = el('span', 'xpl-tally-num', '');
    var tallyText = el('span', 'xpl-tally-text', '');
    tally.appendChild(tallyNum);
    tally.appendChild(tallyText);

    /* --- rows ---------------------------------------------------------- */
    var rows = el('ol', 'xpl-rows xpl-rows--cascade');
    var rowRefs = NLU_CASES.map(function (item) {
      var li = el('li', 'xpl-row');

      var main = el('div');
      main.appendChild(el('div', 'xpl-utt', item.utterance));
      var src = el('div', 'xpl-src');

      var stepRule = el('div', 'cas-step');
      stepRule.appendChild(el('span', 'cas-n', '1'));
      var ruleBody = el('span', 'cas-body');
      ruleBody.innerHTML = item.rule
        ? 'Template ' + item.rule.note + ' → <b>' + item.rule.domain + '</b>'
        : 'Template — <b>nothing matches</b>';
      stepRule.appendChild(ruleBody);
      var ruleState = el('span', 'cas-state');
      stepRule.appendChild(ruleState);

      var stepModel = el('div', 'cas-step');
      stepModel.appendChild(el('span', 'cas-n', '2'));
      var modelBody = el('span', 'cas-body');
      modelBody.innerHTML = 'Model → <b>' + item.model.domain + '</b>';
      stepModel.appendChild(modelBody);
      var modelState = el('span', 'cas-state');
      stepModel.appendChild(modelState);

      src.appendChild(stepRule);
      src.appendChild(stepModel);
      main.appendChild(src);

      var cap = el('div', 'xpl-track-cap');
      main.appendChild(cap);

      var verdict = el('div', 'xpl-verdict');

      li.appendChild(main);
      li.appendChild(verdict);
      rows.appendChild(li);

      return {
        item: item, cap: cap, verdict: verdict,
        stepRule: stepRule, ruleState: ruleState, stepModel: stepModel, modelState: modelState
      };
    });

    /* --- render -------------------------------------------------------- */
    function render() {
      var wiring = nluWiring(state.wiring);
      var learned = wiring.id === 'learned';
      var modelFirst = wiring.id === 'model';

      optRefs.forEach(function (ref) {
        var on = ref.wiring.id === wiring.id;
        ref.btn.classList.toggle('is-active', on);
        ref.btn.setAttribute('aria-pressed', on ? 'true' : 'false');
      });

      var correct = 0;
      rowRefs.forEach(function (ref) {
        var routed = wiring.route(ref.item);
        var isOk = routed.domain === ref.item.truth;
        if (isOk) correct++;

        /* In a cascade exactly one stage is live and the other is visibly
           switched off; only the patent lights both and shows their shares. */
        if (learned) {
          var wRule = ref.item.rule ? ref.item.learned : 0;
          ref.stepRule.className = 'cas-step is-weighed';
          ref.stepModel.className = 'cas-step is-weighed';
          ref.ruleState.textContent = ref.item.rule ? 'weight ' + wRule.toFixed(2) : 'nothing matched';
          ref.modelState.textContent = 'weight ' + (1 - wRule).toFixed(2);
          ref.cap.textContent = ref.item.rule
            ? 'attention weighed the template evidence at ' + wRule.toFixed(2) + ' against the semantics'
            : 'nothing in memory matched, so the semantic vector decides';
        } else if (modelFirst) {
          ref.stepRule.className = 'cas-step is-off';
          ref.stepModel.className = 'cas-step is-live';
          ref.ruleState.textContent = ref.item.rule ? 'outranked — not consulted' : 'no match';
          ref.modelState.textContent = 'decides';
          ref.cap.textContent = ref.item.rule && ref.item.rule.domain === ref.item.truth
            ? 'the template had this right, and was never asked'
            : 'the model answers, so the templates are never reached';
        } else {
          var fires = !!ref.item.rule;
          ref.stepRule.className = 'cas-step ' + (fires ? 'is-live' : 'is-off');
          ref.stepModel.className = 'cas-step ' + (fires ? 'is-off' : 'is-live');
          ref.ruleState.textContent = fires ? 'matches — decided here' : 'no match';
          ref.modelState.textContent = fires ? 'never runs' : 'decides';
          ref.cap.textContent = fires
            ? (isOk ? 'the template was right, and outranks the model' : 'the template matched and was wrong, and still outranks the model')
            : 'nothing matched, so the model is reached';
        }

        ref.verdict.className = 'xpl-verdict ' + (isOk ? 'is-ok' : 'is-bad');
        ref.verdict.innerHTML = '<span class="vd-mark">' + (isOk ? '✓' : '✗') + '</span>→ ' +
          routed.domain +
          '<small>' + (isOk ? 'correct' : 'should be ' + ref.item.truth) + '</small>';
      });

      tallyNum.textContent = correct + ' / ' + total;
      if (learned) {
        tallyText.innerHTML = 'routed correctly — because neither source outranks the other. The template evidence is weighed <b>per utterance</b> against the semantics, so the same system can overrule a template on one request and obey it on the next.';
      } else if (modelFirst) {
        tallyText.innerHTML = 'routed correctly. Demoting the templates fixes the two the rules got wrong and breaks two the rules got right — including the one where a transcription slip left the model with nothing to work from.';
      } else {
        tallyText.innerHTML = 'routed correctly. The two failures are requests where a template matched perfectly and meant something else — and because the ordering is fixed, there is nothing to tune that would let the model overrule it.';
      }
    }

    mount.appendChild(board);
    mount.appendChild(boardCap);
    mount.appendChild(tally);
    mount.appendChild(rows);
    render();
    root.classList.add('is-ready');
  }

  /* ======================================================================
     1b. The preset basic templates — patent CN112002313B, claim 1

     Attention weights are normalised similarities, so a weight says how well
     a template fits relative to the rest of the read. With a single match the
     denominator is that match, and the weight is 1 whatever the similarity.
     The patent requires preset basic templates in every read, so the
     denominator is never empty. The dirty-match numbers are the patent's own
     worked example (Figure 2).
     ====================================================================== */

  var ANCHOR_CASES = [
    {
      id: 'mismatch',
      tab: 'The template fires on the wrong intent',
      utterance: '周杰伦的父亲',
      gloss: '“Jay Chou’s father”',
      why: 'Both entities are real and clean. <b>周杰伦</b> is a genuine artist, and <b>父亲</b> is a genuine song title sitting in the catalogue, so the template <b>@{artist}’s @{song}</b> matches exactly. Nothing about the match is defective. The request is simply a question about a person, and only the semantics can reveal that.',
      matched: { name: '@{artist}’s @{song}', sub: 'matched template · music playback', sim: 0.10 },
      basics: [
        { name: 'basic template · Music', sub: 'learned class representation', sim: 0.10 },
        { name: 'basic template · Q&A', sub: 'learned class representation', sim: 0.70 },
        { name: 'basic template · Smart home', sub: 'learned class representation', sim: 0.10 }
      ],
      on: {
        good: true,
        label: 'The class the semantics point at wins the read',
        text: 'The music template fires, but it fits the meaning of the request badly, so it takes a tenth of the read. The question-answering class fits well and takes 70% of it.',
        effect: 'Routed to question answering. Genie answers who Jay Chou’s father is.'
      },
      off: {
        good: false,
        label: 'One template in the read, so one certainty',
        text: 'Take the class representations out and the music template is the whole denominator. Its weight is 1.00 — not because it fits, but because there is nothing left to compare it with.',
        effect: 'Routed to music playback. Genie plays the song 《父亲》 instead of answering the question.'
      }
    },
    {
      id: 'genuine',
      tab: 'The same template, firing correctly',
      utterance: '周杰伦的青花瓷',
      gloss: '“Jay Chou’s Blue and White Porcelain”',
      why: 'The identical template matches an identical surface form — <b>@{artist}’s @{song}</b> — on two equally real entities. This time the request really is a playback request. Nothing in the template match distinguishes this from the other tab; only the semantic vector does.',
      matched: { name: '@{artist}’s @{song}', sub: 'matched template · music playback', sim: 0.80 },
      basics: [
        { name: 'basic template · Music', sub: 'learned class representation', sim: 0.70 },
        { name: 'basic template · Q&A', sub: 'learned class representation', sim: 0.10 },
        { name: 'basic template · Smart home', sub: 'learned class representation', sim: 0.10 }
      ],
      on: {
        good: true,
        label: 'Template and class agree, and reinforce',
        text: 'The template fits, and so does the music class representation. They are not competing for the same weight — between them they hold 88% of the read, and both point the same way.',
        effect: 'Routed to music playback. The song plays.'
      },
      off: {
        good: true,
        label: 'Same answer, no information',
        text: 'On its own this match also reads 1.00 — the identical weight the wrong template received on the other tab, which fits eight times worse.',
        effect: 'Still routed to music playback, correctly, but the weight can no longer tell a good match from a bad one.'
      }
    }
  ];

  function initNluAnchor(root) {
    var mount = root.querySelector('[data-role="mount"]');
    if (!mount) return;

    var state = { caseIdx: 0, anchors: true };

    /* --- case tabs ----------------------------------------------------- */
    var tabs = el('div', 'xpl-tabs');
    var tabBtns = ANCHOR_CASES.map(function (item, i) {
      var b = el('button', 'xpl-btn', item.tab);
      b.type = 'button';
      b.addEventListener('click', function () {
        state.caseIdx = i;
        render();
      });
      tabs.appendChild(b);
      return b;
    });

    /* --- the utterance ------------------------------------------------- */
    var uttPanel = el('div', 'xpl-panel');
    uttPanel.appendChild(el('div', 'xpl-panel-title', 'The request'));
    var uttCjk = el('div', 'anch-utt');
    var uttGloss = el('div', 'anch-gloss');
    var uttWhy = el('p', 'anch-why');
    uttPanel.appendChild(uttCjk);
    uttPanel.appendChild(uttGloss);
    uttPanel.appendChild(uttWhy);

    /* --- the anchor toggle --------------------------------------------- */
    var modes = el('div', 'xpl-modes');
    var btnOn = el('button', 'xpl-btn', 'Basic templates in the read (the patent)');
    btnOn.type = 'button';
    var btnOff = el('button', 'xpl-btn', 'Basic templates removed');
    btnOff.type = 'button';
    btnOn.addEventListener('click', function () { state.anchors = true; render(); });
    btnOff.addEventListener('click', function () { state.anchors = false; render(); });
    modes.appendChild(btnOn);
    modes.appendChild(btnOff);

    /* --- the memory read ----------------------------------------------- */
    var readPanel = el('div', 'xpl-panel');
    readPanel.appendChild(el('div', 'xpl-panel-title', 'What attention reads out of memory'));
    var hdr = el('div', 'mem-slot mem-hdr');
    hdr.appendChild(el('div', null, 'template in the read'));
    hdr.appendChild(el('div', 'mem-sim', 'sim.'));
    hdr.appendChild(el('div', null, ''));
    hdr.appendChild(el('div', 'mem-wt', 'weight'));
    readPanel.appendChild(hdr);
    var slots = el('div', 'mem-slots');
    var sum = el('div', 'mem-sum');
    readPanel.appendChild(slots);
    readPanel.appendChild(sum);

    /* --- consequence ---------------------------------------------------- */
    var out = el('div', 'xpl-out');
    var outLabel = el('div', 'xpl-out-label');
    var outText = el('div', 'anch-out-text');
    var outEffect = el('div', 'xpl-out-effect');
    out.appendChild(outLabel);
    out.appendChild(outText);
    out.appendChild(outEffect);

    var hint = el('p', 'anch-hint');

    function slotRow(entry, weight, isDirty) {
      var row = el('div', 'mem-slot' + (isDirty ? ' is-dirty' : ''));

      var head = el('div', 'mem-head');
      head.appendChild(el('div', 'mem-name', entry.name));
      head.appendChild(el('div', 'mem-sub', entry.sub));
      row.appendChild(head);

      row.appendChild(el('div', 'mem-sim', entry.sim.toFixed(2)));

      var bar = el('div', 'mem-bar');
      var fill = el('div', 'mem-fill');
      fill.style.width = Math.round(weight * 100) + '%';
      bar.appendChild(fill);
      row.appendChild(bar);

      row.appendChild(el('div', 'mem-wt', Math.round(weight * 100) + '%'));
      return row;
    }

    function render() {
      var item = ANCHOR_CASES[state.caseIdx];
      var anchors = state.anchors;

      tabBtns.forEach(function (b, i) {
        b.classList.toggle('is-active', i === state.caseIdx);
      });
      btnOn.classList.toggle('is-active', anchors);
      btnOff.classList.toggle('is-active', !anchors);

      uttCjk.textContent = item.utterance;
      uttGloss.textContent = item.gloss;
      uttWhy.innerHTML = item.why;

      var entries = anchors ? item.basics.concat([item.matched]) : [item.matched];
      var denom = entries.reduce(function (acc, e) { return acc + e.sim; }, 0);

      slots.innerHTML = '';
      entries.forEach(function (e) {
        slots.appendChild(slotRow(e, e.sim / denom, e === item.matched));
      });

      sum.innerHTML = 'denominator = ' +
        entries.map(function (e) { return e.sim.toFixed(2); }).join(' + ') +
        ' = <b>' + denom.toFixed(2) + '</b>';

      var verdict = anchors ? item.on : item.off;
      out.className = 'xpl-out' + (verdict.good ? ' is-good' : '');
      outLabel.textContent = verdict.label;
      outText.textContent = verdict.text;
      outEffect.textContent = verdict.effect;

      var pctOn = Math.round(item.matched.sim / (denom) * 100);
      hint.innerHTML = anchors
        ? 'The matched template scores <b>' + item.matched.sim.toFixed(2) + '</b> and receives <b>' + pctOn +
          '%</b>. Remove the basic templates and that same ' + item.matched.sim.toFixed(2) +
          ' becomes <b>100%</b> — the similarity did not change, only what it was divided by.'
        : 'The matched template still scores <b>' + item.matched.sim.toFixed(2) +
          '</b>. Nothing about the match improved; the denominator simply lost its other terms, and a weight of <b>100%</b> is the only value normalisation can return.';
    }

    mount.appendChild(tabs);
    mount.appendChild(uttPanel);
    mount.appendChild(modes);
    mount.appendChild(readPanel);
    mount.appendChild(hint);
    mount.appendChild(out);
    render();
    root.classList.add('is-ready');
  }

  /* ======================================================================
     2. The live bias list — patent CN113808593B

     An editable personalisation list plus a step-through decoder. Turning an
     entry off degrades the transcript in place; turning it on recovers it,
     with no retraining. A second toggle replaces the per-step indicators with
     the implicit, soft attention a CLAS-style decoder leaves behind.
     ====================================================================== */

  var ASR_SCENARIOS = [
    {
      id: 'contact',
      tab: 'Call a contact',
      prompt: 'The user says <b>“call Zheng Zihao”</b> — a name the base recogniser has never been trained on.',
      steps: [
        { syl: 'dǎ', plain: '打', biased: '打' },
        { syl: 'diàn', plain: '电', biased: '电' },
        { syl: 'huà', plain: '话', biased: '话' },
        { syl: 'gěi', plain: '给', biased: '给' },
        { syl: 'zhèng', plain: '正', biased: '郑' },
        { syl: 'zǐ', plain: '子', biased: '梓' },
        { syl: 'háo', plain: '号', biased: '豪' }
      ],
      chips: [
        { cjk: '郑梓豪', latin: 'Zheng Zihao', meta: 'contact · from this user’s phone book', pattern: [0, 0, 0, 0, 1, 1, 1] },
        { cjk: '楚哲', latin: 'Chu Zhe', meta: 'contact · from this user’s phone book', pattern: [0, 0, 0, 0, 0, 0, 0] },
        { cjk: '客厅灯', latin: 'living-room light', meta: 'device · paired in this home', pattern: [0, 0, 0, 0, 0, 0, 0] }
      ],
      good: { gloss: '“call Zheng Zihao”', effect: 'The call is placed on the first try.' },
      bad: { gloss: 'the right sounds, the wrong characters — not a name', effect: 'No contact matches. The call is never placed and the user starts over.' }
    },
    {
      id: 'multiturn',
      tab: 'Answer a follow-up',
      prompt: 'The user said “turn on the light”. Genie asked <b>“bedroom or living room?”</b> The user answers with one word.',
      steps: [
        { syl: 'wò', plain: '我', biased: '卧' },
        { syl: 'shì', plain: '是', biased: '室' }
      ],
      chips: [
        { cjk: '卧室', latin: 'bedroom', meta: 'from the assistant’s own question', pattern: [1, 1] },
        { cjk: '客厅', latin: 'living room', meta: 'from the assistant’s own question', pattern: [0, 0] }
      ],
      good: { gloss: '“bedroom”', effect: 'The bedroom light turns on. The exchange completes in one utterance.' },
      bad: { gloss: '“I am” — a perfectly valid sentence, so nothing looks broken', effect: 'No device matches. The command is silently dropped mid-conversation.' }
    },
    {
      id: 'song',
      tab: 'Play a rare song',
      prompt: 'The user asks for a song title that almost never appears in training data.',
      steps: [
        { syl: 'shān', plain: '山', biased: '山' },
        { syl: 'gǔ', plain: '谷', biased: '谷' },
        { syl: 'lǐ', plain: '里', biased: '里' },
        { syl: 'de', plain: '的', biased: '的' },
        { syl: 'sī', plain: '私', biased: '思' },
        { syl: 'niàn', plain: '念', biased: '念' }
      ],
      chips: [
        { cjk: '山谷里的思念', latin: 'Longing in the Valley', meta: 'played in this household recently', pattern: [1, 1, 1, 1, 1, 1] }
      ],
      good: { gloss: '“Longing in the Valley” — a real title in the catalogue', effect: 'The song plays.' },
      bad: { gloss: 'one character off; not a title anyone has ever released', effect: 'No result. In the production logs this exact request was retried six times on 1 January 2020 before it worked.' }
    }
  ];

  function initAsrDecoder(root) {
    var mount = root.querySelector('[data-role="mount"]');
    if (!mount) return;

    var state = { scenario: 0, enabled: {}, step: 0, clas: false, edits: 0, timer: null };

    function scenario() { return ASR_SCENARIOS[state.scenario]; }

    function resetScenario(index) {
      state.scenario = index;
      state.enabled = {};
      scenario().chips.forEach(function (_, i) { state.enabled[i] = true; });
      state.step = scenario().steps.length;
      stopPlay();
    }

    /* --- scenario tabs -------------------------------------------------- */
    var tabs = el('div', 'xpl-tabs');
    var tabBtns = ASR_SCENARIOS.map(function (sc, i) {
      var b = el('button', 'xpl-btn', sc.tab);
      b.type = 'button';
      b.addEventListener('click', function () {
        resetScenario(i);
        render();
      });
      tabs.appendChild(b);
      return b;
    });

    var prompt = el('p', 'xpl-intro');

    /* --- layout --------------------------------------------------------- */
    var cols = el('div', 'xpl-cols');

    var left = el('div', 'xpl-panel');
    left.appendChild(el('div', 'xpl-panel-title', 'The user’s bias list'));
    var chipList = el('div');
    left.appendChild(chipList);
    var counter = el('div', 'xpl-counter');
    left.appendChild(counter);

    var right = el('div');
    var decodeWrap = el('div', 'xpl-decode');
    var out = el('div', 'xpl-out');
    var controls = el('div', 'xpl-controls');

    var btnReplay = el('button', 'xpl-btn', 'Replay decoding');
    btnReplay.type = 'button';
    var btnClas = el('button', 'xpl-btn', 'Switch to CLAS-style implicit biasing');
    btnClas.type = 'button';
    var hint = el('span', 'xpl-hint', 'Tick entries off and on — the transcript changes immediately.');
    controls.appendChild(btnReplay);
    controls.appendChild(btnClas);
    controls.appendChild(hint);

    right.appendChild(decodeWrap);
    right.appendChild(out);
    right.appendChild(controls);

    cols.appendChild(left);
    cols.appendChild(right);

    /* --- decode --------------------------------------------------------- */
    function decode() {
      var sc = scenario();
      return sc.steps.map(function (st, i) {
        var hit = false;
        sc.chips.forEach(function (chip, ci) {
          if (state.enabled[ci] && chip.pattern[i] === 1) hit = true;
        });
        return { char: hit ? st.biased : st.plain, biased: hit, differs: st.biased !== st.plain };
      });
    }

    function stopPlay() {
      if (state.timer) {
        clearInterval(state.timer);
        state.timer = null;
      }
    }

    function play() {
      stopPlay();
      if (reducedMotion()) { state.step = scenario().steps.length; render(); return; }
      state.step = 0;
      render();
      state.timer = setInterval(function () {
        state.step++;
        if (state.step >= scenario().steps.length) {
          state.step = scenario().steps.length;
          stopPlay();
        }
        render();
      }, 420);
    }

    btnReplay.addEventListener('click', play);
    btnClas.addEventListener('click', function () {
      state.clas = !state.clas;
      render();
    });

    /* --- render --------------------------------------------------------- */
    function render() {
      var sc = scenario();
      var cells = decode();
      var n = sc.steps.length;

      tabBtns.forEach(function (b, i) { b.classList.toggle('is-active', i === state.scenario); });
      prompt.innerHTML = sc.prompt;

      // bias list
      chipList.innerHTML = '';
      sc.chips.forEach(function (chip, i) {
        var on = !!state.enabled[i];
        var b = el('button', 'xpl-chip' + (on ? ' is-on' : ''));
        b.type = 'button';
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
        b.appendChild(el('span', 'ch-box'));
        var txt = el('span');
        var cjk = el('span', 'ch-cjk', chip.cjk);
        txt.appendChild(cjk);
        txt.appendChild(document.createTextNode(' ' + chip.latin));
        txt.appendChild(el('span', 'ch-meta', chip.meta));
        b.appendChild(txt);
        b.addEventListener('click', function () {
          state.enabled[i] = !state.enabled[i];
          state.edits++;
          state.step = n;
          stopPlay();
          render();
        });
        chipList.appendChild(b);
      });

      counter.innerHTML =
        '<b>' + state.edits + '</b> edits to the list this session' +
        '<div style="margin-top:.6rem"><b>0</b> models retrained</div>';

      // decode table
      decodeWrap.innerHTML = '';
      var table = el('table', 'xpl-dtable');
      var tbody = el('tbody');

      var sylRow = el('tr');
      sylRow.appendChild(el('th', null, ''));
      sc.steps.forEach(function (st) {
        var td = el('td', 'xpl-syl', st.syl);
        sylRow.appendChild(td);
      });
      tbody.appendChild(sylRow);

      var charRow = el('tr');
      charRow.appendChild(el('th', null, 'Decoder output'));
      cells.forEach(function (c, i) {
        var td = el('td');
        var revealed = i < state.step;
        var cls = 'xpl-cell';
        if (!revealed) cls += ' is-pending';
        else if (c.biased) cls += ' is-biased';
        else if (c.differs) cls += ' is-wrong';
        td.appendChild(el('div', cls, c.char));
        charRow.appendChild(td);
      });
      tbody.appendChild(charRow);

      var headRow = el('tr');
      var headCell = el('td', 'xpl-syl');
      headCell.setAttribute('colspan', n + 1);
      headCell.style.textAlign = 'left';
      headCell.style.paddingTop = '0.9rem';
      headCell.textContent = state.clas
        ? 'CLAS-style biasing — soft attention, never supervised as a decision'
        : 'Indicator targets — is this phrase in play at this step?';
      headRow.appendChild(headCell);
      tbody.appendChild(headRow);

      sc.chips.forEach(function (chip, ci) {
        var on = !!state.enabled[ci];
        var tr = el('tr');
        var th = el('th', 'xpl-rowlabel' + (on ? '' : ' is-off'));
        var rl = el('span', 'rl-cjk', chip.cjk);
        th.appendChild(rl);
        th.appendChild(el('span', 'rl-sub', on ? chip.latin : chip.latin + ' · off'));
        tr.appendChild(th);
        chip.pattern.forEach(function (v, i) {
          var td = el('td');
          var revealed = i < state.step;
          var live = on && v === 1 && revealed;
          var cls = 'xpl-ind';
          if (state.clas) cls += ' is-hidden';
          else if (live) cls += ' is-hot';
          var box = el('div', cls, state.clas ? '?' : (on && revealed ? String(v) : '·'));
          td.appendChild(box);
          tr.appendChild(td);
        });
        tbody.appendChild(tr);
      });

      table.appendChild(tbody);
      decodeWrap.appendChild(table);

      // outcome
      var produced = cells.map(function (c) { return c.char; }).join('');
      var ideal = sc.steps.map(function (s) { return s.biased; }).join('');
      var good = produced === ideal;
      var complete = state.step >= n;

      out.className = 'xpl-out' + (good && complete ? ' is-good' : '');
      out.innerHTML = '';
      out.appendChild(el('div', 'xpl-out-label', complete ? 'Transcript' : 'Decoding…'));
      out.appendChild(el('div', 'xpl-out-text', produced));
      if (complete) {
        out.appendChild(el('div', 'xpl-out-gloss', good ? sc.good.gloss : sc.bad.gloss));
        out.appendChild(el('div', 'xpl-out-effect', good ? sc.good.effect : sc.bad.effect));
      }

      btnClas.classList.toggle('is-active', state.clas);
      btnClas.textContent = state.clas
        ? 'Show the indicator targets again'
        : 'Switch to CLAS-style implicit biasing';
      hint.textContent = state.clas
        ? 'CLAS does leave attention weights behind, but they are a soft by-product, not a supervised decision — same failure, and no clear answer as to whether the list ever fired.'
        : 'Tick entries off and on — the transcript changes immediately, with no retraining.';
    }

    resetScenario(0);
    mount.appendChild(tabs);
    mount.appendChild(prompt);
    mount.appendChild(cols);
    render();
    root.classList.add('is-ready');
  }

  /* ======================================================================
     3. The install — dmlc/tensorboard

     Writing an event file had precedents for every framework; rendering one
     had none. Choosing a non-TensorFlow framework with the standalone tool off
     reproduces the 2016 dead end: a valid log on disk and no way to open it
     short of installing a rival framework.
     ====================================================================== */

  var TB_FRAMEWORKS = [
    { tab: 'Apache MXNet', pkg: 'mxnet', backer: 'backed by Amazon', native: false },
    { tab: 'PyTorch', pkg: 'pytorch', backer: 'backed by Facebook', native: false },
    { tab: 'TensorFlow', pkg: 'tensorflow', backer: 'Google — ships the renderer inside', native: true }
  ];

  /* A deterministic, slightly noisy loss curve. Plot area x 18–304, y 14–128. */
  var TB_CURVE = (function () {
    var pts = [];
    var seed = 7;
    for (var i = 0; i <= 44; i++) {
      seed = (seed * 1103515245 + 12345) % 2147483648;
      var jitter = ((seed / 2147483648) - 0.5) * 7 * (i < 2 ? 0.2 : 1);
      var v = 104 * Math.exp(-i / 9) + 8 + jitter;
      pts.push({
        x: 18 + i * (286 / 44),
        y: 128 - Math.max(4, Math.min(114, v))
      });
    }
    return pts;
  })();

  function initTensorboardInstall(root) {
    var mount = root.querySelector('[data-role="mount"]');
    if (!mount) return;

    var SVGNS = 'http://www.w3.org/2000/svg';
    var state = { fw: 0, standalone: false };

    function fw() { return TB_FRAMEWORKS[state.fw]; }
    function isBlocked() { return !state.standalone && !fw().native; }

    /* --- framework tabs -------------------------------------------------- */
    var tabs = el('div', 'xpl-tabs');
    var tabBtns = TB_FRAMEWORKS.map(function (f, i) {
      var b = el('button', 'xpl-btn', f.tab);
      b.type = 'button';
      b.addEventListener('click', function () { state.fw = i; render(); });
      tabs.appendChild(b);
      return b;
    });

    /* --- layout ---------------------------------------------------------- */
    var cols = el('div', 'xpl-cols');

    var left = el('div', 'xpl-panel');
    left.appendChild(el('div', 'xpl-panel-title', 'What you have to install'));
    var pkgs = el('div', 'tb-pkgs');
    left.appendChild(pkgs);
    var steps = el('div', 'tb-steps');
    left.appendChild(steps);

    var right = el('div');
    var viewer = el('div', 'tb-viewer');
    var verdict = el('div', 'tb-verdict');
    var controls = el('div', 'xpl-controls');
    var btnStandalone = el('button', 'xpl-btn');
    btnStandalone.type = 'button';
    btnStandalone.addEventListener('click', function () {
      state.standalone = !state.standalone;
      render();
    });
    var hint = el('span', 'xpl-hint');
    controls.appendChild(btnStandalone);
    controls.appendChild(hint);

    right.appendChild(viewer);
    right.appendChild(verdict);
    right.appendChild(controls);

    cols.appendChild(left);
    cols.appendChild(right);

    /* --- the chart, when you are allowed to see it ----------------------- */
    function drawChart() {
      var svg = document.createElementNS(SVGNS, 'svg');
      svg.setAttribute('viewBox', '0 0 320 150');
      svg.setAttribute('class', 'tb-chart');
      svg.setAttribute('role', 'img');
      svg.setAttribute('aria-label', 'A training loss curve falling and flattening out');

      var axis = document.createElementNS(SVGNS, 'path');
      axis.setAttribute('d', 'M18 14 L18 128 L304 128');
      axis.setAttribute('class', 'tb-axis');
      svg.appendChild(axis);

      var d = TB_CURVE.map(function (p, i) {
        return (i === 0 ? 'M' : 'L') + p.x.toFixed(1) + ' ' + p.y.toFixed(1);
      }).join(' ');

      var line = document.createElementNS(SVGNS, 'path');
      line.setAttribute('d', d);
      line.setAttribute('class', 'tb-line' + (reducedMotion() ? '' : ' is-drawing'));
      svg.appendChild(line);

      var label = document.createElementNS(SVGNS, 'text');
      label.setAttribute('x', '304');
      label.setAttribute('y', '26');
      label.setAttribute('text-anchor', 'end');
      label.setAttribute('class', 'tb-chart-label');
      label.textContent = 'training loss';
      svg.appendChild(label);

      var epochs = document.createElementNS(SVGNS, 'text');
      epochs.setAttribute('x', '304');
      epochs.setAttribute('y', '144');
      epochs.setAttribute('text-anchor', 'end');
      epochs.setAttribute('class', 'tb-chart-label');
      epochs.textContent = 'epochs';
      svg.appendChild(epochs);

      return svg;
    }

    function drawBlocked() {
      var wrap = el('div', 'tb-blocked');
      wrap.appendChild(el('div', 'tb-file', 'events.out.tfevents'));
      wrap.appendChild(el('div', 'tb-blocked-msg', 'Written, valid, unreadable'));
      wrap.appendChild(el('div', 'tb-blocked-sub', 'No renderer on this machine, and no way to install one without TensorFlow.'));
      return wrap;
    }

    /* --- render ---------------------------------------------------------- */
    function render() {
      var f = fw();
      var stuck = isBlocked();

      tabBtns.forEach(function (b, i) { b.classList.toggle('is-active', i === state.fw); });

      var list = [{
        name: f.pkg,
        note: 'the framework you chose — ' + f.backer,
        kind: 'base'
      }];

      if (!f.native && !state.standalone) {
        list.push({
          name: 'logging adapter',
          note: 'writes the event file; the format is public and adapters already existed',
          kind: 'ok'
        });
      }

      if (state.standalone) {
        list.push({
          name: 'tensorboard (standalone)',
          note: f.native
            ? 'works here too, though TensorFlow already bundles a copy'
            : 'logs and renders in one package — the whole path, with no TensorFlow',
          kind: 'good'
        });
      } else if (f.native) {
        list.push({
          name: 'tensorboard',
          note: 'bundled inside TensorFlow — nothing extra to do',
          kind: 'ok'
        });
      } else {
        list.push({
          name: 'tensorflow',
          note: 'an entire rival framework, installed for nothing but the charts',
          kind: 'heavy'
        });
      }

      pkgs.innerHTML = '';
      list.forEach(function (p) {
        var row = el('div', 'tb-pkg is-' + p.kind);
        row.appendChild(el('code', 'tb-pkg-name', p.name));
        row.appendChild(el('span', 'tb-pkg-note', p.note));
        pkgs.appendChild(row);
      });

      steps.innerHTML = '';
      [
        {
          label: 'Write the event file',
          ok: true,
          note: f.native
            ? 'first-party API'
            : (state.standalone
              ? 'through the standalone tool’s own logging interface'
              : 'a community adapter can already do this')
        },
        {
          label: 'Render the charts',
          ok: !stuck,
          note: stuck
            ? 'needs a renderer that does not exist outside TensorFlow'
            : (state.standalone ? 'same package, no framework attached' : 'bundled with the framework')
        }
      ].forEach(function (s) {
        var row = el('div', 'tb-step ' + (s.ok ? 'is-ok' : 'is-blocked'));
        row.appendChild(el('span', 'tb-step-mark', s.ok ? '✓' : '✕'));
        var body = el('span', 'tb-step-body');
        body.appendChild(el('b', null, s.label));
        body.appendChild(el('span', 'tb-step-note', s.note));
        row.appendChild(body);
        steps.appendChild(row);
      });

      viewer.className = 'tb-viewer' + (stuck ? ' is-blocked' : '');
      viewer.innerHTML = '';
      viewer.appendChild(stuck ? drawBlocked() : drawChart());

      verdict.className = 'tb-verdict' + (stuck ? ' is-bad' : ' is-good');
      if (stuck) {
        verdict.innerHTML = '<b>Blocked.</b> The log is on disk and perfectly valid. Seeing it means ' +
          'installing the framework you deliberately did not choose.';
      } else if (f.native) {
        verdict.innerHTML = '<b>Fine, as it always was.</b> This was never a TensorFlow user’s problem. ' +
          'It belonged to everyone else — which is why the fix had to be a framework-independent layer ' +
          'rather than a feature for one framework.';
      } else {
        verdict.innerHTML = '<b>Charts, no TensorFlow.</b> This is the layer <code>dmlc/tensorboard</code> ' +
          'supplied, and what AWS’s <code>mxboard</code> and PyTorch’s <code>tensorboardX</code> were ' +
          'built on top of.';
      }

      btnStandalone.classList.toggle('is-active', state.standalone);
      btnStandalone.textContent = state.standalone
        ? 'Take the standalone tool away'
        : 'Install the standalone tool';
      hint.textContent = state.standalone
        ? 'Switch it off to stand where every non-TensorFlow team stood in 2016.'
        : 'Now try it with MXNet or PyTorch selected.';
    }

    mount.appendChild(tabs);
    mount.appendChild(cols);
    render();
    root.classList.add('is-ready');
  }

  /* ======================================================================
     4. Word vectors — interview notes (1)

     A sliding window over a dozen lines of corpus shows two things at once:
     the contexts the window collects already carry semantics (wv-window), and
     skip-gram is just treating every pair the window emits as a training
     sample (wv-skipgram). Both widgets share one corpus and one window path
     per language.
     ====================================================================== */

  var WV_GROUP_CLS = { fruit: 'is-fruit', city: 'is-city' };

  var WV_DIM = 4;
  var WV_EPOCHS = 80;
  var WV_NEG = 5;
  var WV_RADIUS = 2;
  var WV_STOP_MS = 420;

  function wvLangOf(root) {
    var lang = (root.getAttribute('data-lang') ||
      (document.documentElement && document.documentElement.lang) ||
      'zh').toLowerCase();
    return lang.indexOf('en') === 0 ? 'en' : 'zh';
  }

  function wvBuildPath(corpus) {
    var out = [];
    corpus.forEach(function (line, li) {
      for (var ti = 0; ti < line.length; ti++) out.push({ line: li, tok: ti });
    });
    return out;
  }

  function wvLocale(lang) {
    var isEn = lang === 'en';
    var corpus = isEn ? [
      ['I', 'morning', 'ate', 'an', 'apple'],
      ['I', 'tomorrow', 'will', 'visit', 'Beijing'],
      ['He', 'noon', 'ate', 'an', 'watermelon'],
      ['He', 'tomorrow', 'will', 'visit', 'Shanghai'],
      ['She', 'yesterday', 'ate', 'an', 'banana'],
      ['She', 'soon', 'will', 'visit', 'Hangzhou'],
      ['This', 'apple', 'tastes', 'sweet'],
      ['Beijing', 'housing', 'prices', 'keep', 'rising'],
      ['This', 'watermelon', 'tastes', 'sweet'],
      ['Shanghai', 'housing', 'prices', 'keep', 'rising'],
      ['This', 'banana', 'tastes', 'sweet'],
      ['Hangzhou', 'housing', 'prices', 'keep', 'rising'],
      ['Beijing', 'duck', 'tastes', 'great']
    ] : [
      ['我', '早上', '吃', '了', '苹果'],
      ['我', '明天', '要', '去', '北京'],
      ['他', '中午', '吃', '了', '西瓜'],
      ['他', '明天', '要', '去', '上海'],
      ['她', '昨天', '吃', '了', '香蕉'],
      ['她', '下周', '要', '去', '杭州'],
      ['这个', '苹果', '真', '甜'],
      ['北京', '的', '房价', '又', '涨'],
      ['这个', '西瓜', '真', '甜'],
      ['上海', '的', '房价', '又', '涨'],
      ['这个', '香蕉', '真', '甜'],
      ['杭州', '的', '房价', '又', '涨'],
      ['北京', '烤鸭', '真', '好吃']
    ];

    var words = isEn ? [
      { id: 'apple', group: 'fruit' },
      { id: 'banana', group: 'fruit' },
      { id: 'watermelon', group: 'fruit' },
      { id: 'Beijing', group: 'city' },
      { id: 'Shanghai', group: 'city' },
      { id: 'Hangzhou', group: 'city' }
    ] : [
      { id: '苹果', group: 'fruit' },
      { id: '香蕉', group: 'fruit' },
      { id: '西瓜', group: 'fruit' },
      { id: '北京', group: 'city' },
      { id: '上海', group: 'city' },
      { id: '杭州', group: 'city' }
    ];

    var targets = {};
    words.forEach(function (w) { targets[w.id] = w.group; });

    var anchor = words[0].id;   /* apple / 苹果 */
    var near = words[1].id;     /* banana / 香蕉 */
    var far = words[3].id;      /* Beijing / 北京 */

    var t = isEn ? {
      play: 'Play',
      pause: 'Pause',
      step: 'Step',
      finishSweep: 'Finish sweep',
      reset: 'Reset',
      radius: 'Window radius',
      tallyTitle: 'Contexts each of the six words collected',
      tallyEmpty: 'Not reached yet',
      intraLabel: 'Shared contexts within a type',
      interLabel: 'Shared contexts across types',
      countUnit: '',
      corpusStart: 'Corpus · window starts at the first word',
      corpusDone: function (n) { return 'Corpus · window finished all ' + n + ' positions'; },
      corpusAt: function (center, ctx, i, n) {
        return 'Center “' + center + '” · context ' + ctx.join(', ') +
          ' · position ' + i + '/' + n;
      },
      winIdleLabel: 'The window has not started',
      winIdleText: function (r) {
        return 'Hit Play. Every time the window stops on a word, the ' + r +
          ' words on each side become its context — that is the entire sampling rule for skip-gram.';
      },
      winBusyLabel: 'Counting',
      winBusyText: 'Watch the three fruit lines and the three city lines: the contexts they collect are nearly the same set. A highlighted chip means another word of the same type also received it.',
      winDoneLabel: 'Sweep finished',
      winDoneText: function (a, b, fruitShare, crossShare) {
        return '“' + a + '” and “' + b + '” share ' + fruitShare.length +
          ' context words (' + fruitShare.join(', ') + '); “' + a + '” and “' +
          far + '” share only ' + crossShare.length +
          (crossShare.length ? ' (' + crossShare.join(', ') + ')' : '') + '.';
      },
      winDoneEffect: 'No model and no vectors yet. Closeness in meaning is already written into the corpus — that is what the distributional hypothesis is about.',

      tabReal: 'Normal corpus',
      tabShuffled: 'Control: shuffle word order',
      corpusIdle: 'Window waiting — hit Play or Step',
      corpusEpoch: function (ep, eps, i, n) {
        return 'Epoch ' + ep + '/' + eps + ' · window on word ' + i + '/' + n;
      },
      corpusTrainDone: function (eps) {
        return 'Training done · corpus seen for ' + eps + ' epochs';
      },
      taskTitle: 'Training sample from this stop',
      taskTitleLast: 'Training sample from the last stop',
      taskCenter: 'Center',
      taskArrow: 'predicts',
      taskCap: 'These pairs are all of skip-gram\'s training data. The number under each context word is the model\'s current confidence that the center brings it out — every gradient step nudges it toward 1.',
      cardsTitle: 'The homework each of the six words was asked to do',
      cardsCap: 'The top of each card lists words that word was asked to predict; overlaps with “' +
        anchor + '” are marked in orange — that is the corpus\'s homework. The bar below is its cosine with “' +
        anchor + '” — that is the training\'s geometry. Watch the two halves line up.',
      cardEmpty: 'Window has not stopped on this word yet',
      cardAnchor: 'Anchor',
      samplesLabel: 'Samples fed so far',
      cosNearLabel: 'cos(' + anchor + ', ' + near + ')',
      cosFarLabel: 'cos(' + anchor + ', ' + far + ')',
      stepStop: 'Step one stop',
      jumpTarget: 'Jump to next target',
      finishTrain: 'Train all ' + WV_EPOCHS + ' epochs',
      retrain: 'Re-initialize',
      replay: 'Train again',
      hintReal: 'Step slowly to see how samples form, then hit “Train all” for the result.',
      hintShuffled: 'Same algorithm, hyperparameters, and epochs — only the corpus was shuffled.',
      outBusyLabel: 'The only thing the gradient is doing',
      outBusyReal: 'Make the center vector better at predicting the words in the window. That is all — a few more stops and the homework lists on the “' +
        anchor + '”, “' + near + '”, and watermelon cards become the same set.',
      outBusyShuffled: 'Look at the six cards: after shuffling, each word\'s homework is random noise. “' +
        anchor + '” and “' + near + '” no longer share a list, so the model is fitting meaningless pairings.',
      outBadLabel: 'Same algorithm, nothing learned',
      outBadText: 'The model still converges — it really is fitting this corpus. But look at the cards: the homework lists are random, so the cosine bars scatter with them. Some fruits sit far from “' +
        anchor + '”; some cities sit close. Who ends up near whom is now chance.',
      outBadEffect: 'So this property is not something skip-gram invents on its own. The algorithm only presses regularities that already exist in the corpus into vector space; what is not in the corpus cannot be pressed out.',
      outGoodLabel: 'Closeness is the result of sharing homework',
      outGoodText: 'Nobody told the model that “' + anchor + ' and ' + near + ' are both fruits.” Look at the six cards: the more orange chips on top, the longer the cosine bar below — they line up. The cheapest way to do the same homework well is to point those vectors in almost the same direction.',
      outGoodEffect: 'Linguistic regularity decides they share homework; the training objective turns “same homework” into “same direction.” That is what “neither alone is enough” means.'
    } : {
      play: '播放',
      pause: '暂停',
      step: '单步',
      finishSweep: '直接扫完',
      reset: '重来',
      radius: '窗口半径',
      tallyTitle: '这六个词各自收集到的上下文',
      tallyEmpty: '还没轮到它',
      intraLabel: '同类词之间共享的上下文词',
      interLabel: '不同类词之间共享的上下文词',
      countUnit: ' 个',
      corpusStart: '语料 · 窗口从第一个词开始',
      corpusDone: function (n) { return '语料 · 窗口已经扫完全部 ' + n + ' 个位置'; },
      corpusAt: function (center, ctx, i, n) {
        return '中心词「' + center + '」 · 上下文 ' + ctx.join('、') +
          ' · 第 ' + i + '/' + n + ' 个位置';
      },
      winIdleLabel: '窗口还没开始走',
      winIdleText: function (r) {
        return '点「播放」。窗口每停在一个词上，就把它左右各 ' + r +
          ' 个词记为这个词的上下文——这就是 skip-gram 取样的全部规则。';
      },
      winBusyLabel: '正在数',
      winBusyText: '注意水果那三行和城市那三行：它们收集到的上下文词几乎是同一批。高亮的词表示同类的另一个词也收到了它。',
      winDoneLabel: '扫完了',
      winDoneText: function (a, b, fruitShare, crossShare) {
        return '「' + a + '」和「' + b + '」共享 ' + fruitShare.length +
          ' 个上下文词（' + fruitShare.join('、') + '）；「' + a + '」和「' +
          far + '」只共享 ' + crossShare.length + ' 个' +
          (crossShare.length ? '（' + crossShare.join('、') + '）' : '') + '。';
      },
      winDoneEffect: '到这一步还没有任何模型、任何向量。语义的远近已经写在语料里了——这就是分布假说说的事。',

      tabReal: '正常语料',
      tabShuffled: '对照组：把语料的词序打乱',
      corpusIdle: '窗口还在原地，按「播放」或「走一停」',
      corpusEpoch: function (ep, eps, i, n) {
        return '第 ' + ep + '/' + eps + ' 轮 · 窗口停在第 ' + i + '/' + n + ' 个词';
      },
      corpusTrainDone: function (eps) {
        return '训练结束 · 语料一共过了 ' + eps + ' 轮';
      },
      taskTitle: '这一停产出的训练样本',
      taskTitleLast: '最后一停产出的训练样本',
      taskCenter: '中心词',
      taskArrow: '要预测出',
      taskCap: 'skip-gram 的训练数据就只有这些。每个上下文词下面的数字，是模型此刻认为「中心词会带出这个词」的把握——梯度每次就把它往 1 推一点。',
      cardsTitle: '六个词各自被要求做的题',
      cardsCap: '上半张卡是这个词被要求预测过的词，和「' + anchor +
        '」重合的标成橙色，这是语料给的题目；下面那条是它的向量此刻和「' + anchor +
        '」的余弦，是训练给的结果。看这两半是怎么对上的。',
      cardEmpty: '窗口还没停到这个词上',
      cardAnchor: '基准词',
      samplesLabel: '已经喂进去的样本',
      cosNearLabel: 'cos(' + anchor + ', ' + near + ')',
      cosFarLabel: 'cos(' + anchor + ', ' + far + ')',
      stepStop: '走一停',
      jumpTarget: '跳到下一个目标词',
      finishTrain: '直接训完 ' + WV_EPOCHS + ' 轮',
      retrain: '重新随机初始化',
      replay: '再训一次',
      hintReal: '慢慢单步看清楚样本怎么来的，再按「直接训完」看结果。',
      hintShuffled: '算法、超参、轮数都没动，只有语料被打乱了。',
      outBusyLabel: '梯度在做的唯一一件事',
      outBusyReal: '让中心词的向量更容易预测出窗口里那几个词。仅此而已——多走几停就会看到，「' +
        anchor + '」「' + near + '」「西瓜」三张卡上的题目单慢慢变成了同一批词。',
      outBusyShuffled: '看下面六张卡：词序打乱之后，每个词收到的题目都是随便凑的，「' +
        anchor + '」和「' + near + '」的题目单不再重合，模型学的是一堆没有道理的搭配。',
      outBadLabel: '同一个算法，什么也没学到',
      outBadText: '模型照样收敛了，它确实在拟合这份语料。但看六张卡：题目单已经是随机拼凑的，下面那排余弦也就跟着乱了——有的水果离「' +
        anchor + '」很远，有的城市反倒很近。谁和谁近，现在纯属偶然。',
      outBadEffect: '所以这个性质不是 skip-gram 单独变出来的。算法只负责把语料里已有的规律压进向量空间；语料里没有的，它也压不出来。',
      outGoodLabel: '相近是「被要求做同一道题」的结果',
      outGoodText: '没有人告诉模型「' + anchor + '和' + near +
        '都是水果」。看六张卡：上半张橙色的词越多，下半张的余弦条就越长，两者严丝合缝。要同时做好同一批题，最省力的办法就是把这几个向量放到几乎同一个方向上。',
      outGoodEffect: '语言学规律决定了它们要做同一道题，训练目标把「同一道题」变成「同一个方向」——所谓「缺一不可」，指的就是这两步。'
    };

    /* Fix the one hard-coded Chinese fruit name in the EN busy text. */
    if (isEn) {
      t.outBusyReal = 'Make the center vector better at predicting the words in the window. That is all — a few more stops and the homework lists on the “' +
        anchor + '”, “' + near + '”, and “watermelon” cards become the same set.';
    }

    return {
      lang: lang,
      corpus: corpus,
      words: words,
      targets: targets,
      path: wvBuildPath(corpus),
      anchor: anchor,
      near: near,
      far: far,
      t: t
    };
  }

  function wvContextsAt(corpus, pos, radius) {
    var line = corpus[pos.line];
    var from = Math.max(0, pos.tok - radius);
    var to = Math.min(line.length - 1, pos.tok + radius);
    var out = [];
    for (var i = from; i <= to; i++) {
      if (i !== pos.tok) out.push(line[i]);
    }
    return out;
  }

  function wvIndex(words, id) {
    for (var i = 0; i < words.length; i++) {
      if (words[i].id === id) return i;
    }
    return 0;
  }

  /* A tiny deterministic PRNG, so every reader sees the same run. */
  function wvRandom(seed) {
    var s = seed >>> 0;
    return function () {
      s = (s + 0x6d2b79f5) >>> 0;
      var t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function wvSigmoid(x) {
    if (x > 30) return 1;
    if (x < -30) return 0;
    return 1 / (1 + Math.exp(-x));
  }

  function wvCosine(a, b) {
    var dot = 0, na = 0, nb = 0;
    for (var i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      na += a[i] * a[i];
      nb += b[i] * b[i];
    }
    if (na === 0 || nb === 0) return 0;
    return dot / (Math.sqrt(na) * Math.sqrt(nb));
  }

  /* The corpus is drawn once; moving the window only moves class names. */
  function wvCorpusView(corpus, targets) {
    var data = corpus;
    var root = el('div', 'wv-corpus');
    var spans = [];

    data.forEach(function (line) {
      var row = el('div', 'wv-line');
      var rowSpans = line.map(function (w) {
        var s = el('span', 'wv-token', w);
        row.appendChild(s);
        return s;
      });
      spans.push(rowSpans);
      root.appendChild(row);
    });

    function render(pos, radius) {
      spans.forEach(function (rowSpans, li) {
        rowSpans.forEach(function (s, ti) {
          var group = targets[data[li][ti]];
          var cls = 'wv-token';
          if (group) cls += ' ' + WV_GROUP_CLS[group];
          if (pos) {
            if (li === pos.line && ti === pos.tok) cls += ' is-center';
            else if (li === pos.line && Math.abs(ti - pos.tok) <= radius) cls += ' is-context';
            else cls += ' is-dim';
          }
          s.className = cls;
        });
      });
    }

    function setCorpus(next) {
      data = next;
      spans.forEach(function (rowSpans, li) {
        rowSpans.forEach(function (s, ti) { s.textContent = data[li][ti]; });
      });
    }

    return { root: root, render: render, setCorpus: setCorpus };
  }

  function wvShuffledCorpus(corpus) {
    var rng = wvRandom(778899);
    var bag = [];
    corpus.forEach(function (line) {
      line.forEach(function (w) { bag.push(w); });
    });
    for (var i = bag.length - 1; i > 0; i--) {
      var j = Math.floor(rng() * (i + 1));
      var t = bag[i]; bag[i] = bag[j]; bag[j] = t;
    }
    var k = 0;
    return corpus.map(function (line) {
      return line.map(function () { return bag[k++]; });
    });
  }

  /* ---------------------------------------------------------------------
     4a. The window — where the regularity is visible without any model
     --------------------------------------------------------------------- */

  function initWvWindow(root) {
    var mount = root.querySelector('[data-role="mount"]');
    if (!mount) return;

    var L = wvLocale(wvLangOf(root));
    var t = L.t;
    var state = { step: -1, radius: 2, timer: null, tally: {} };

    var view = wvCorpusView(L.corpus, L.targets);
    var corpusPanel = el('div', 'xpl-panel');
    var corpusTitle = el('div', 'xpl-panel-title', t.corpusStart);
    corpusPanel.appendChild(corpusTitle);
    corpusPanel.appendChild(view.root);

    var controls = el('div', 'xpl-controls');
    var btnPlay = el('button', 'xpl-btn', t.play);
    btnPlay.type = 'button';
    var btnStep = el('button', 'xpl-btn', t.step);
    btnStep.type = 'button';
    var btnEnd = el('button', 'xpl-btn', t.finishSweep);
    btnEnd.type = 'button';
    var btnReset = el('button', 'xpl-btn', t.reset);
    btnReset.type = 'button';

    var radiusBox = el('span', 'wv-radius');
    radiusBox.appendChild(el('span', 'wv-radius-cap', t.radius));
    var btnMinus = el('button', 'xpl-btn wv-mini', '−');
    btnMinus.type = 'button';
    var radiusVal = el('span', 'wv-radius-val', '2');
    var btnPlus = el('button', 'xpl-btn wv-mini', '+');
    btnPlus.type = 'button';
    radiusBox.appendChild(btnMinus);
    radiusBox.appendChild(radiusVal);
    radiusBox.appendChild(btnPlus);

    controls.appendChild(btnPlay);
    controls.appendChild(btnStep);
    controls.appendChild(btnEnd);
    controls.appendChild(btnReset);
    controls.appendChild(radiusBox);
    corpusPanel.appendChild(controls);

    var tallyPanel = el('div', 'xpl-panel wv-tally-panel');
    tallyPanel.appendChild(el('div', 'xpl-panel-title', t.tallyTitle));
    var tallyRows = L.words.map(function (w) {
      var row = el('div', 'wv-tally-row');
      row.appendChild(el('span', 'wv-tally-name ' + WV_GROUP_CLS[w.group], w.id));
      var chips = el('span', 'wv-tally-chips');
      row.appendChild(chips);
      tallyPanel.appendChild(row);
      return chips;
    });

    var stats = el('div', 'wv-stats');
    function statBlock(label) {
      var box = el('div', 'wv-stat');
      var val = el('div', 'wv-stat-val', '—');
      box.appendChild(val);
      box.appendChild(el('div', 'wv-stat-label', label));
      stats.appendChild(box);
      return val;
    }
    var intraVal = statBlock(t.intraLabel);
    var interVal = statBlock(t.interLabel);

    var out = el('div', 'xpl-out');
    var outLabel = el('div', 'xpl-out-label');
    var outText = el('div', 'anch-out-text');
    var outEffect = el('div', 'xpl-out-effect');
    out.appendChild(outLabel);
    out.appendChild(outText);
    out.appendChild(outEffect);

    function stop() {
      if (state.timer) {
        clearInterval(state.timer);
        state.timer = null;
      }
    }

    function reset() {
      stop();
      state.step = -1;
      state.tally = {};
      L.words.forEach(function (w) { state.tally[w.id] = {}; });
    }

    function advance() {
      if (state.step >= L.path.length - 1) {
        stop();
        state.step = L.path.length;
        return false;
      }
      state.step++;
      var pos = L.path[state.step];
      var center = L.corpus[pos.line][pos.tok];
      if (L.targets[center]) {
        var bucket = state.tally[center];
        wvContextsAt(L.corpus, pos, state.radius).forEach(function (c) {
          bucket[c] = (bucket[c] || 0) + 1;
        });
      }
      return true;
    }

    function play() {
      if (state.timer) { stop(); render(); return; }
      if (state.step >= L.path.length) reset();
      state.timer = setInterval(function () {
        if (!advance()) { render(); return; }
        render();
      }, reducedMotion() ? 40 : 240);
      render();
    }

    btnPlay.addEventListener('click', play);
    btnStep.addEventListener('click', function () {
      stop();
      if (state.step >= L.path.length) reset();
      advance();
      render();
    });
    btnEnd.addEventListener('click', function () {
      stop();
      if (state.step >= L.path.length) reset();
      while (advance()) { /* run the whole corpus */ }
      render();
    });
    btnReset.addEventListener('click', function () {
      reset();
      render();
    });
    btnMinus.addEventListener('click', function () {
      if (state.radius <= 1) return;
      state.radius--;
      reset();
      while (advance()) { /* recount with the new window */ }
      render();
    });
    btnPlus.addEventListener('click', function () {
      if (state.radius >= 4) return;
      state.radius++;
      reset();
      while (advance()) { /* recount with the new window */ }
      render();
    });

    function shared(a, b) {
      var out2 = [];
      Object.keys(state.tally[a]).forEach(function (w) {
        if (state.tally[b][w]) out2.push(w);
      });
      return out2;
    }

    function render() {
      var done = state.step >= L.path.length;
      var started = state.step >= 0;
      var pos = started && !done ? L.path[state.step] : null;

      view.render(pos, state.radius);
      radiusVal.textContent = String(state.radius);
      btnPlay.textContent = state.timer ? t.pause : t.play;
      btnPlay.classList.toggle('is-active', !!state.timer);

      if (pos) {
        var center = L.corpus[pos.line][pos.tok];
        var ctx = wvContextsAt(L.corpus, pos, state.radius);
        corpusTitle.textContent = t.corpusAt(center, ctx, state.step + 1, L.path.length);
      } else if (done) {
        corpusTitle.textContent = t.corpusDone(L.path.length);
      } else {
        corpusTitle.textContent = t.corpusStart;
      }

      tallyRows.forEach(function (chips, i) {
        var word = L.words[i];
        var bucket = state.tally[word.id] || {};
        var entries = Object.keys(bucket).map(function (w) {
          return { w: w, n: bucket[w] };
        });
        entries.sort(function (a, b) { return b.n - a.n; });

        chips.innerHTML = '';
        if (!entries.length) {
          chips.appendChild(el('span', 'wv-tally-empty', t.tallyEmpty));
          return;
        }
        entries.forEach(function (e) {
          var alsoElsewhere = L.words.some(function (other) {
            return other.id !== word.id &&
              other.group === word.group &&
              state.tally[other.id] &&
              state.tally[other.id][e.w];
          });
          var chip = el('span', 'wv-tally-chip' + (alsoElsewhere ? ' is-shared' : ''), e.w);
          if (e.n > 1) chip.appendChild(el('small', null, '×' + e.n));
          chips.appendChild(chip);
        });
      });

      var intra = [], inter = [];
      for (var i = 0; i < L.words.length; i++) {
        for (var j = i + 1; j < L.words.length; j++) {
          var n = shared(L.words[i].id, L.words[j].id).length;
          if (L.words[i].group === L.words[j].group) intra.push(n);
          else inter.push(n);
        }
      }
      function avg(arr) {
        return arr.reduce(function (sum, v) { return sum + v; }, 0) / arr.length;
      }
      intraVal.textContent = started ? avg(intra).toFixed(1) + t.countUnit : '—';
      interVal.textContent = started ? avg(inter).toFixed(1) + t.countUnit : '—';

      if (!started) {
        out.className = 'xpl-out';
        outLabel.textContent = t.winIdleLabel;
        outText.textContent = t.winIdleText(state.radius);
        outEffect.textContent = '';
      } else if (!done) {
        out.className = 'xpl-out';
        outLabel.textContent = t.winBusyLabel;
        outText.textContent = t.winBusyText;
        outEffect.textContent = '';
      } else {
        var fruitShare = shared(L.anchor, L.near);
        var crossShare = shared(L.anchor, L.far);
        out.className = 'xpl-out is-good';
        outLabel.textContent = t.winDoneLabel;
        outText.textContent = t.winDoneText(L.anchor, L.near, fruitShare, crossShare);
        outEffect.textContent = t.winDoneEffect;
      }
    }

    mount.appendChild(corpusPanel);
    mount.appendChild(tallyPanel);
    mount.appendChild(stats);
    mount.appendChild(out);
    reset();
    render();
    root.classList.add('is-ready');
  }

  /* ---------------------------------------------------------------------
     4b. The same window, wired into skip-gram
     --------------------------------------------------------------------- */

  function initWvSkipgram(root) {
    var mount = root.querySelector('[data-role="mount"]');
    if (!mount) return;

    var L = wvLocale(wvLangOf(root));
    var t = L.t;
    var state = {
      shuffled: false, step: 0, epoch: 0, samples: 0,
      timer: null, started: false, tasks: {}
    };
    var corpus, vocab, vocabIndex, V, U, negTable, rng, current;

    var tabs = el('div', 'xpl-tabs');
    var btnReal = el('button', 'xpl-btn', t.tabReal);
    btnReal.type = 'button';
    var btnShuffled = el('button', 'xpl-btn', t.tabShuffled);
    btnShuffled.type = 'button';
    tabs.appendChild(btnReal);
    tabs.appendChild(btnShuffled);

    var view = wvCorpusView(L.corpus, L.targets);
    var corpusPanel = el('div', 'xpl-panel');
    var corpusTitle = el('div', 'xpl-panel-title', t.corpusIdle);
    corpusPanel.appendChild(corpusTitle);
    corpusPanel.appendChild(view.root);

    var taskPanel = el('div', 'xpl-panel wv-task-panel');
    var taskTitle = el('div', 'xpl-panel-title', t.taskTitle);
    taskPanel.appendChild(taskTitle);

    var task = el('div', 'wv-task');
    var taskCenter = el('div', 'wv-task-center');
    taskCenter.appendChild(el('span', 'wv-task-cap', t.taskCenter));
    var taskWord = el('span', 'wv-task-word', '—');
    taskCenter.appendChild(taskWord);
    var taskArrow = el('div', 'wv-task-arrow', t.taskArrow);
    var taskCtx = el('div', 'wv-task-ctx');
    task.appendChild(taskCenter);
    task.appendChild(taskArrow);
    task.appendChild(taskCtx);
    taskPanel.appendChild(task);

    var taskCap = el('p', 'xpl-track-cap', t.taskCap);
    taskPanel.appendChild(taskCap);

    var cardsPanel = el('div', 'xpl-panel');
    var cardsTitle = el('div', 'xpl-panel-title', t.cardsTitle);
    cardsPanel.appendChild(cardsTitle);

    var cardGrid = el('div', 'wv-cards');
    var cards = {};
    L.words.forEach(function (w) {
      var card = el('div', 'wv-card ' + WV_GROUP_CLS[w.group]);
      var head = el('div', 'wv-card-head');
      head.appendChild(el('span', 'wv-card-word', w.id));
      var badge = el('span', 'wv-card-badge', '—');
      head.appendChild(badge);
      var body = el('div', 'wv-card-ctx');
      var track = el('div', 'wv-card-bar');
      var fill = el('i');
      track.appendChild(fill);
      card.appendChild(head);
      card.appendChild(body);
      card.appendChild(track);
      cardGrid.appendChild(card);
      cards[w.id] = { root: card, badge: badge, body: body, fill: fill };
    });
    cardsPanel.appendChild(cardGrid);

    var cardsCap = el('p', 'xpl-track-cap', t.cardsCap);
    cardsPanel.appendChild(cardsCap);

    var progress = el('div', 'wv-progress');
    var bar = el('div', 'wv-progress-fill');
    progress.appendChild(bar);
    cardsPanel.appendChild(progress);

    var stats = el('div', 'wv-stats wv-stats--three');
    function statBlock(label) {
      var box = el('div', 'wv-stat');
      var val = el('div', 'wv-stat-val', '—');
      box.appendChild(val);
      box.appendChild(el('div', 'wv-stat-label', label));
      stats.appendChild(box);
      return val;
    }
    var sampleVal = statBlock(t.samplesLabel);
    var simNearVal = statBlock(t.cosNearLabel);
    var simFarVal = statBlock(t.cosFarLabel);

    var controls = el('div', 'xpl-controls');
    var btnPlay = el('button', 'xpl-btn', t.play);
    btnPlay.type = 'button';
    var btnStep = el('button', 'xpl-btn', t.stepStop);
    btnStep.type = 'button';
    var btnJump = el('button', 'xpl-btn', t.jumpTarget);
    btnJump.type = 'button';
    var btnFinish = el('button', 'xpl-btn', t.finishTrain);
    btnFinish.type = 'button';
    var btnRetrain = el('button', 'xpl-btn', t.retrain);
    btnRetrain.type = 'button';
    var hint = el('span', 'xpl-hint');
    controls.appendChild(btnPlay);
    controls.appendChild(btnStep);
    controls.appendChild(btnJump);
    controls.appendChild(btnFinish);
    controls.appendChild(btnRetrain);
    controls.appendChild(hint);

    var out = el('div', 'xpl-out');
    var outLabel = el('div', 'xpl-out-label');
    var outText = el('div', 'anch-out-text');
    var outEffect = el('div', 'xpl-out-effect');
    out.appendChild(outLabel);
    out.appendChild(outText);
    out.appendChild(outEffect);

    function stop() {
      if (state.timer) {
        clearInterval(state.timer);
        state.timer = null;
      }
    }

    function setup() {
      stop();
      corpus = state.shuffled ? wvShuffledCorpus(L.corpus) : L.corpus;
      view.setCorpus(corpus);

      vocab = [];
      vocabIndex = {};
      var counts = [];
      corpus.forEach(function (line) {
        line.forEach(function (w) {
          if (vocabIndex[w] == null) {
            vocabIndex[w] = vocab.length;
            vocab.push(w);
            counts.push(0);
          }
          counts[vocabIndex[w]]++;
        });
      });

      rng = wvRandom(state.shuffled ? 5150 : 90210);
      function randomVector() {
        var v = [];
        for (var i = 0; i < WV_DIM; i++) v.push((rng() - 0.5) * 0.6);
        return v;
      }
      V = vocab.map(randomVector);
      U = vocab.map(randomVector);

      negTable = [];
      counts.forEach(function (c, i) {
        var slots = Math.max(1, Math.round(Math.pow(c, 0.75) * 3));
        for (var k = 0; k < slots; k++) negTable.push(i);
      });

      state.step = 0;
      state.epoch = 0;
      state.samples = 0;
      state.tasks = {};
      current = null;
    }

    function update(label, wi, ci) {
      var v = V[wi], u = U[ci];
      var dot = 0;
      for (var i = 0; i < WV_DIM; i++) dot += v[i] * u[i];
      var lr = 0.12 * Math.max(0.08, 1 - state.epoch / WV_EPOCHS);
      var g = (wvSigmoid(dot) - label) * lr;
      for (var k = 0; k < WV_DIM; k++) {
        var vk = v[k];
        v[k] -= g * u[k];
        u[k] -= g * vk;
      }
    }

    function stepOnce() {
      var pos = L.path[state.step];
      var center = corpus[pos.line][pos.tok];
      var ctx = wvContextsAt(corpus, pos, WV_RADIUS);
      var wi = vocabIndex[center];

      ctx.forEach(function (c) {
        var ci = vocabIndex[c];
        update(1, wi, ci);
        for (var s = 0; s < WV_NEG; s++) {
          var neg = negTable[Math.floor(rng() * negTable.length)];
          if (neg !== ci) update(0, wi, neg);
        }
        state.samples++;
      });

      if (L.targets[center]) {
        var seen = state.tasks[center] || (state.tasks[center] = { order: [], set: {} });
        ctx.forEach(function (c) {
          if (!seen.set[c]) {
            seen.set[c] = true;
            seen.order.push(c);
          }
        });
        seen.rounds = (seen.rounds || 0) + 1;
      }

      current = { pos: pos, center: center, ctx: ctx, index: state.step + 1 };
      state.step++;
      if (state.step >= L.path.length) {
        state.step = 0;
        state.epoch++;
      }
    }

    function done() {
      return state.epoch >= WV_EPOCHS;
    }

    function play() {
      stop();
      if (done()) return;
      state.timer = setInterval(function () {
        stepOnce();
        if (done()) stop();
        render();
      }, WV_STOP_MS);
      render();
    }

    function start() {
      stop();
      setup();
      if (reducedMotion()) {
        while (!done()) stepOnce();
        render();
        return;
      }
      render();
    }

    btnReal.addEventListener('click', function () {
      state.shuffled = false;
      state.started = true;
      start();
      play();
    });
    btnShuffled.addEventListener('click', function () {
      state.shuffled = true;
      state.started = true;
      start();
      play();
    });
    btnRetrain.addEventListener('click', function () {
      state.started = true;
      start();
      play();
    });
    btnPlay.addEventListener('click', function () {
      state.started = true;
      if (done()) {
        start();
        play();
      } else if (state.timer) {
        stop();
        render();
      } else {
        play();
      }
    });
    btnStep.addEventListener('click', function () {
      state.started = true;
      stop();
      if (!done()) stepOnce();
      render();
    });
    btnJump.addEventListener('click', function () {
      state.started = true;
      stop();
      for (var i = 0; i < L.path.length && !done(); i++) {
        stepOnce();
        if (current && L.targets[current.center]) break;
      }
      render();
    });
    btnFinish.addEventListener('click', function () {
      state.started = true;
      stop();
      while (!done()) stepOnce();
      render();
    });

    function scoreOf(center, ctx) {
      var v = V[vocabIndex[center]], u = U[vocabIndex[ctx]];
      if (!v || !u) return 0;
      var dot = 0;
      for (var i = 0; i < WV_DIM; i++) dot += v[i] * u[i];
      return wvSigmoid(dot);
    }

    function scoreChip(word, score) {
      var chip = el('span', 'wv-pair');
      chip.appendChild(el('b', null, word));
      chip.appendChild(el('small', null, score.toFixed(2)));
      chip.style.borderColor = 'rgba(217, 119, 87, ' + (0.15 + score * 0.85).toFixed(2) + ')';
      return chip;
    }

    function render() {
      btnReal.classList.toggle('is-active', !state.shuffled);
      btnShuffled.classList.toggle('is-active', state.shuffled);

      var finished = done();
      view.render(current ? current.pos : null, WV_RADIUS);

      taskCtx.innerHTML = '';
      if (current) {
        taskWord.textContent = current.center;
        taskWord.className = 'wv-task-word' +
          (L.targets[current.center] ? ' ' + WV_GROUP_CLS[L.targets[current.center]] : '');
        current.ctx.forEach(function (c) {
          taskCtx.appendChild(scoreChip(c, scoreOf(current.center, c)));
        });
      } else {
        taskWord.textContent = '—';
        taskWord.className = 'wv-task-word';
      }

      var appleTasks = state.tasks[L.anchor];
      var appleVec = V[vocabIndex[L.anchor]];
      L.words.forEach(function (w) {
        var card = cards[w.id];
        var seen = state.tasks[w.id];
        card.root.classList.toggle('is-live', !!(current && current.center === w.id));

        card.body.innerHTML = '';
        if (!seen) {
          card.body.appendChild(el('span', 'wv-card-empty', t.cardEmpty));
        } else {
          seen.order.forEach(function (c) {
            var sharedChip = w.id !== L.anchor && appleTasks && appleTasks.set[c];
            card.body.appendChild(el('span', 'wv-tally-chip' + (sharedChip ? ' is-shared' : ''), c));
          });
        }

        if (w.id === L.anchor) {
          card.badge.textContent = t.cardAnchor;
          card.fill.style.width = '100%';
        } else {
          var cos = wvCosine(appleVec, V[vocabIndex[w.id]]);
          card.badge.textContent = 'cos ' + cos.toFixed(2);
          card.fill.style.width = (Math.max(0, cos) * 100).toFixed(1) + '%';
        }
      });

      corpusTitle.textContent = finished
        ? t.corpusTrainDone(WV_EPOCHS)
        : (current
          ? t.corpusEpoch(state.epoch + 1, WV_EPOCHS, current.index, L.path.length)
          : t.corpusIdle);

      var vectors = L.words.map(function (w) { return V[vocabIndex[w.id]]; });
      var iApple = wvIndex(L.words, L.anchor);
      bar.style.width = Math.min(100, (state.epoch / WV_EPOCHS) * 100).toFixed(1) + '%';
      taskTitle.textContent = finished ? t.taskTitleLast : t.taskTitle;
      btnPlay.textContent = finished ? t.replay : (state.timer ? t.pause : t.play);

      sampleVal.textContent = state.samples.toLocaleString();
      simNearVal.textContent = wvCosine(vectors[iApple], vectors[wvIndex(L.words, L.near)]).toFixed(2);
      simFarVal.textContent = wvCosine(vectors[iApple], vectors[wvIndex(L.words, L.far)]).toFixed(2);

      hint.textContent = state.shuffled ? t.hintShuffled : t.hintReal;

      if (!finished) {
        out.className = 'xpl-out';
        outLabel.textContent = t.outBusyLabel;
        outText.textContent = state.shuffled ? t.outBusyShuffled : t.outBusyReal;
        outEffect.textContent = '';
      } else if (state.shuffled) {
        out.className = 'xpl-out';
        outLabel.textContent = t.outBadLabel;
        outText.textContent = t.outBadText;
        outEffect.textContent = t.outBadEffect;
      } else {
        out.className = 'xpl-out is-good';
        outLabel.textContent = t.outGoodLabel;
        outText.textContent = t.outGoodText;
        outEffect.textContent = t.outGoodEffect;
      }
    }

    mount.appendChild(tabs);
    mount.appendChild(corpusPanel);
    mount.appendChild(taskPanel);
    mount.appendChild(cardsPanel);
    mount.appendChild(stats);
    mount.appendChild(controls);
    mount.appendChild(out);

    setup();
    render();
    root.classList.add('is-ready');

    if (window.IntersectionObserver) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting && !state.started) {
            state.started = true;
            io.disconnect();
            play();
          } else if (!entry.isIntersecting && state.timer) {
            stop();
            render();
          }
        });
      }, { threshold: 0.25 });
      io.observe(root);
    } else {
      state.started = true;
      play();
    }
  }

  /* ====================================================================== */

  var WIDGETS = {
    'nlu-router': initNluRouter,
    'nlu-anchor': initNluAnchor,
    'asr-decoder': initAsrDecoder,
    'tensorboard-install': initTensorboardInstall,
    'wv-window': initWvWindow,
    'wv-skipgram': initWvSkipgram
  };

  function boot() {
    var nodes = document.querySelectorAll('[data-explorable]');
    for (var i = 0; i < nodes.length; i++) {
      var kind = nodes[i].getAttribute('data-explorable');
      if (WIDGETS[kind]) {
        try {
          WIDGETS[kind](nodes[i]);
        } catch (err) {
          if (window.console) console.error('Explorable "' + kind + '" failed to start', err);
        }
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
