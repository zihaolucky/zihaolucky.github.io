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

  /* ====================================================================== */

  var WIDGETS = {
    'nlu-router': initNluRouter,
    'nlu-anchor': initNluAnchor,
    'asr-decoder': initAsrDecoder,
    'tensorboard-install': initTensorboardInstall
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
