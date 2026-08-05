---
layout: page
case_study: true
explorables: true
title: Indicator Loss for Context-Aware ASR
permalink: /project/indicator-loss-asr/
description: Patent CN113808593B — explicit step-level supervision that makes personalised speech recognition updatable in real time and auditable when it fails.
image: /images/projects/asr-patent.png
image_alt: Granted patent CN113808593B, Voice Interaction System, Related Methods, Devices and Equipment
---

<p class="project-kicker">Patent · Speech Recognition · Deployed at national scale</p>

# Indicator Loss for Context-Aware ASR

<p class="project-deck">A voice assistant has to hear names it was never trained on — your contacts, your devices, the song you played last night. I invented an explicit per-step supervision signal that makes that personalisation both instantly updatable and, for the first time, auditable when it goes wrong. Negative user feedback fell 32.9%.</p>

<div class="fact-strip">
  <div><div class="fact-key">Patent</div><div class="fact-val">CN113808593B</div></div>
  <div><div class="fact-key">Role</div><div class="fact-val">First inventor</div></div>
  <div><div class="fact-key">Filed</div><div class="fact-val">16 Jun 2020</div></div>
  <div><div class="fact-key">Granted</div><div class="fact-val">3 Jun 2025</div></div>
  <div><div class="fact-key">Assignee</div><div class="fact-val">Alibaba Group</div></div>
</div>

<div class="lens lens--plain">
  <div class="lens-title">In one minute, without the jargon</div>
  <p>Speech recognisers learn from enormous amounts of general speech. They have never heard your friend's name, your lamp's name, or an obscure song title — and those are exactly the words people say to a smart speaker. So systems keep a per-user list of important phrases and try to steer recognition toward it.</p>
  <p>The problem is how you steer. The industry standard, Google's CLAS, leaves that decision implicit: the decoder attends to the list and works it out for itself, so what you can read back afterwards is a soft attention weight rather than a decision. When a phrase is missed, that is not enough to tell you whether the steering was applied and wrong, or never applied at all. And the older generation of systems needed a full language-model rebuild — weeks of work — every time the vocabulary changed.</p>
  <p>My design supervises the decision directly: at every step of decoding, for every phrase on the list, the model is trained on an explicit yes/no target saying whether that phrase applies right now. The list can then be swapped at runtime with no retraining, and when something goes wrong an operator can see precisely where the steering did or did not fire.</p>
</div>

<div class="metric-grid">
  <div class="metric metric--accent">
    <span class="metric-value">−32.9<span class="unit">%</span></span>
    <div class="metric-label">Negative user feedback versus the traditional stack</div>
    <div class="metric-note">22.38% → 15.01% on live traffic</div>
  </div>
  <div class="metric">
    <span class="metric-value">78 → 87<span class="unit">%</span></span>
    <div class="metric-label">Multi-turn task completion</div>
    <div class="metric-note">+11.17% relative</div>
  </div>
  <div class="metric">
    <span class="metric-value">weeks → live</span>
    <div class="metric-label">Time to add a new phrase to the vocabulary</div>
    <div class="metric-note">Language-model retrain cycle eliminated</div>
  </div>
  <div class="metric">
    <span class="metric-value">−9.86 → −1.24</span>
    <div class="metric-label">Accuracy gap between single-turn and multi-turn, in points</div>
    <div class="metric-note">Sep 2019 to May 2020</div>
  </div>
  <div class="metric">
    <span class="metric-value">2023</span>
    <div class="metric-label">Alibaba Cloud still describing Tmall Genie's production speech stack in these terms</div>
    <div class="metric-note">Three years after deployment, two after I left</div>
  </div>
</div>

## A failure nobody could see

I was not assigned this problem. I found it by reading daily user-session logs, where the same pattern kept appearing: a request would fail, the user would repeat it, and it would fail again. On 1 January 2020 one user asked for the song *山谷里的思念* — "Longing in the Valley" — **six times** before the system got it.

These failures were invisible to ordinary monitoring because the system was not producing garbage. It was producing fluent, grammatical, entirely valid text that happened to be the wrong text. Measured across production, recognition accuracy in multi-turn dialogue ran **7.64 to 12.07 percentage points** below single-turn, and task completion **2.44 to 8.89 points** lower.

The widget below lets you drive the mechanism directly. Turn an entry off and watch a correct transcript decay into a plausible wrong one.

{% include interactive/asr-decoder.html %}

## What the patent does differently

The invention is called **Indicator Loss**. Alongside the ordinary training objective — produce the right transcript — the model is trained on a second, explicit target: at each decoding step, for each entry on the personalisation list, a binary label for whether that entry is in play.

That single change produces three properties the prior art did not have together:

<div class="split">
  <div class="split-panel">
    <h4>Updatable</h4>
    <p>The bias list is an input, not a trained parameter. Adding a contact or a newly launched device brand takes effect on the next utterance instead of requiring a language-model rebuild measured in weeks.</p>
  </div>
  <div class="split-panel">
    <h4>Auditable</h4>
    <p>Because biasing is supervised explicitly, whether it fired is a logged value. A failed request can be traced to a cause rather than reproduced by guesswork.</p>
  </div>
  <div class="split-panel split-panel--after">
    <h4>Accurate</h4>
    <p>Head to head against Google CLAS, character error rate improved on IoT device names, contact names, and a combined general set — while keeping a language-model module that CLAS does not have.</p>
  </div>
</div>

<figure class="project-figure project-figure--wide">
  {% include figures/asr-comparison.svg %}
  <figcaption>How the field approached the same task, and what the third design adds.</figcaption>
</figure>

A complementary mechanism shipped alongside it: a **self-correction data loop** that mines production logs for fail-then-succeed retry pairs — exactly the six-retry pattern above — and feeds them back as training signal. That loop alone cut negative feedback by 20.16%.

## What changed in production

<figure class="project-figure project-figure--wide">
  {% include figures/asr-results.svg %}
  <figcaption>Live Tmall Genie metrics across three generations of the speech stack, plus the head-to-head evaluation against Google CLAS.</figcaption>
</figure>

The character-error-rate margins against CLAS are real but modest. The decisive difference is operational: this was the only design in the evaluation that combined real-time vocabulary updates, sub-50-millisecond response, and grammar-free operation — and the only one where an engineer could tell, after the fact, whether personalisation had fired.

## Commercial consequence

<div class="lens">
  <div class="lens-title">Why this is a business result, not only a technical one</div>
  <p>Recognition failures are not a quality metric on a dashboard — they are the mechanism by which a household stops using a device. Internal analysis across <b>12.34 million monthly active users</b> found negative-feedback rate inversely correlated with engagement (r = −0.26): users in the low-failure band averaged <b>16.3 active days per month</b>, users in the high-failure band <b>11.5</b>. Roughly a fifth of the base sat in that high-failure band.</p>
</div>

Removing the retrain cycle also removed a recurring operating cost and a competitive constraint. Under the old architecture, a newly launched smart-device brand or a trending song title could not be recognised until a language-model rebuild shipped. Under this one, the vocabulary is data, changed in seconds.

The architecture long outlasted my tenure. In **May 2023** — three years after the deployment period closed, and two years after I left the company — [an Alibaba Cloud article](https://developer.aliyun.com/article/1224763) describing Tmall Genie's production speech stack still set it out in the same terms: fusion recognition, and personalised, scenario-aware recognition working along the user dimension and the dialogue-context dimension. Those are the two subsystems this patent covers. A stack still described that way years later, on a platform of this size and through successive model generations, is load-bearing infrastructure rather than an experiment that happened to ship.

## Timeline

<ul class="timeline">
  <li><span class="tl-when">2019</span><span class="tl-what">Identified the multi-turn recognition gap independently, from daily user-session log analysis.</span></li>
  <li class="is-key"><span class="tl-when">Sep 2019 → May 2020</span><span class="tl-what">Context-aware architecture deployed to production; single-turn/multi-turn accuracy gap narrows from 9.86 points to 1.24.</span></li>
  <li><span class="tl-when">1 Jan 2020</span><span class="tl-what">The six-retry song request in the logs that motivated the self-correction data loop.</span></li>
  <li class="is-key"><span class="tl-when">16 Jun 2020</span><span class="tl-what">Patent CN113808593B filed, first inventor.</span></li>
  <li class="is-key"><span class="tl-when">May 2023</span><span class="tl-what">Alibaba Cloud publishes an article describing Tmall Genie's production speech stack in the same terms as this architecture — three years after deployment, two after my departure.</span></li>
  <li><span class="tl-when">2023–2025</span><span class="tl-what">Explicit step-level supervision for contextual biasing becomes an active line of research at Interspeech, with independent groups in China, the United States, Japan and Singapore publishing across three consecutive cycles. That work was arrived at separately; the point here is simply that the direction taken in production years earlier turned out to be the one the field went on to pursue.</span></li>
  <li class="is-key"><span class="tl-when">3 Jun 2025</span><span class="tl-what">Patent granted.</span></li>
</ul>

## The underlying evidence

<figure class="project-figure">
  <img src="{{ site.baseurl }}/images/projects/asr-patent.png" alt="Google Patents record for CN113808593B, Voice interaction system, related methods, devices and equipment" />
  <figcaption>Granted patent CN113808593B — the primary record.</figcaption>
</figure>

<figure class="project-figure">
  <img src="{{ site.baseurl }}/images/projects/asr-architecture.jpeg" alt="Internal Alibaba slide comparing first-generation ASR, Google CLAS, and the personalised decoder with Indicator Loss" />
  <figcaption>The internal industry-comparison slide from the period (Chinese). The diagram above is its English rendering; the worked example in the right-hand column is the contact-name case reproduced in the interactive.</figcaption>
</figure>

<figure class="project-figure">
  <img src="{{ site.baseurl }}/images/projects/asr-results.jpeg" alt="Internal slide showing Indicator Loss results compared with Google CLAS across IoT and contact test sets" />
  <figcaption>Head-to-head character error rate against CLAS on the IoT and contact personalisation sets.</figcaption>
</figure>

<ul class="evidence">
  <li><span class="ev-tag">Patent</span><span><a href="https://patents.google.com/patent/CN113808593B">CN113808593B</a> — Voice Interaction System, Related Methods, Devices and Equipment</span></li>
  <li><span class="ev-tag">Cited by</span><span><a href="https://patents.google.com/patent/CN115206299B">CN115206299B</a> — Chengdu Qiyingtailun Technology, embedded AI for consumer appliances</span></li>
  <li><span class="ev-tag">Cited by</span><span><a href="https://patents.google.com/patent/CN116705004A">CN116705004A</a> — Alibaba's successor low-latency streaming ASR team</span></li>
  <li><span class="ev-tag">Still in use</span><span><a href="https://developer.aliyun.com/article/1224763">Alibaba Cloud Developer Community, 23 May 2023</a> — Tmall Genie's production speech stack described as fusion recognition plus personalised, scenario-aware recognition (Chinese)</span></li>
  <li><span class="ev-tag">Field</span><span><a href="https://www.emergentmind.com/topics/dynamic-vocabulary-based-contextual-biasing">Dynamic vocabulary-based contextual biasing</a> — how the field frames this problem today</span></li>
  <li><span class="ev-tag">Related</span><span><a href="{{ site.baseurl }}/project/memory-network-nlu/">Memory-network NLU</a> — the other foundational layer every Tmall Genie command passed through</span></li>
</ul>

<p class="project-nav"><a href="{{ site.baseurl }}/">← Back to home</a> · <a href="{{ site.baseurl }}/project/">All projects</a></p>
