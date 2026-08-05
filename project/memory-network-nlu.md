---
layout: page
case_study: true
explorables: true
title: Memory-Network NLU for Tmall Genie
permalink: /project/memory-network-nlu/
description: Patent CN112002313B — fusing hand-written rules and learned representations so a voice assistant routes every request to the right service, and can explain why.
image: /images/projects/nlu-patent.png
image_alt: Granted patent CN112002313B, Interaction Method, Apparatus, Speaker and Electronic Device
---

<p class="project-kicker">Patent · Voice Assistants · Deployed at national scale</p>

# Memory-Network NLU for Tmall Genie

<p class="project-deck">Every command a voice assistant hears must be handed to exactly one service. I replaced the brittle rule-versus-model cascade that made this decision with a memory-network architecture that learns the trade-off per utterance — and records it. Production routing accuracy went from about 65% to about 85%.</p>

<div class="fact-strip">
  <div><div class="fact-key">Patent</div><div class="fact-val">CN112002313B</div></div>
  <div><div class="fact-key">Role</div><div class="fact-val">First inventor</div></div>
  <div><div class="fact-key">Filed</div><div class="fact-val">9 May 2019</div></div>
  <div><div class="fact-key">Granted</div><div class="fact-val">7 Apr 2023</div></div>
  <div><div class="fact-key">Assignee</div><div class="fact-val">Alibaba Group</div></div>
</div>

<div class="lens lens--plain">
  <div class="lens-title">In one minute, without the jargon</div>
  <p>A smart speaker has dozens of separate services behind it — music, shopping, lights, weather, general questions. Something has to decide which one gets each request. Get that wrong and nothing downstream can save you: the user asked for a song and the speaker went shopping.</p>
  <p>The industry did this with hand-written matching rules layered on top of a machine-learning model. As more teams added rules, the rules started contradicting each other, and nobody could tell whether a failure came from a bad rule or a bad model. Accuracy stalled near 65% — roughly one request in three going to the wrong place.</p>
  <p>My design stops treating the two as a chain. It keeps the rules as a memory the model can consult, and learns — for each individual request — how much that memory should count. Accuracy reached about 85%, and every decision now carries a record of what drove it.</p>
  <p>One detail earns an extra sentence, because the granted claim turns on it. Whenever the system consults that memory, it also consults a permanent entry for every service it can route to — one learned summary of what music requests look like, one for questions, one for lights, and so on. They are always in the room. Without them, a request that happens to trip exactly one rule would have that rule counted as a certainty, not because it fitted well but because there was nothing else to weigh it against. With them, a rule that fires on a request it has misread can be outvoted by the service the meaning actually points to.</p>
</div>

<div class="metric-grid">
  <div class="metric metric--accent">
    <span class="metric-value">65% → 85%</span>
    <div class="metric-label">Live domain-classification accuracy</div>
    <div class="metric-note">Full production traffic, before and after</div>
  </div>
  <div class="metric">
    <span class="metric-value">35<span class="unit">%</span></span>
    <div class="metric-label">Fewer routing errors from the patented fusion layer alone</div>
  </div>
  <div class="metric">
    <span class="metric-value">98.89<span class="unit">%</span></span>
    <div class="metric-label">Accuracy when speech transcription is correct</div>
  </div>
  <div class="metric">
    <span class="metric-value">15.61<span class="unit">M</span></span>
    <div class="metric-label">Units shipped in China in 2019, while this system routed production traffic</div>
    <div class="metric-note">IDC: number-one smart speaker in China, up 87.9% year on year</div>
  </div>
</div>

## The decision that cannot be undone

Domain classification is the traffic controller of a voice assistant. It sits between speech recognition and everything the product can actually do, and it commits to one answer per request.

<figure class="project-figure project-figure--wide">
  {% include figures/nlu-explainer.svg %}
  <figcaption>Where the classifier sits. Stages light up in sequence; the routing step is the one this patent covers.</figcaption>
</figure>

Before this work, Tmall Genie did what the industry did: **rules first, then model**. Each product team hand-wrote matching templates for its own domain; a template match won outright, and the learned classifier only ran when nothing matched. At dozens of domains and hundreds of templates owned by different teams, every fix broke somebody else's cases, and when a request went wrong there was no way to tell whether a rule had misfired or the model had. Accuracy sat at roughly 65%.

The uncomfortable part is that a cascade gives you nothing to tune. A template either matches or it does not, so the architecture offers exactly one decision — which component outranks the other — and it is taken once, in the wiring, for every request the system will ever handle. Try both orderings.

{% include interactive/nlu-router.html %}

Neither ordering wins, and the reason is worth stating plainly: **a match tells you a pattern fired, not that it understood**. `周杰伦的父亲` and `周杰伦的青花瓷` are the same template on two entities that both genuinely exist — 父亲 really is a song title — and one is a request for music while the other is a question about a person. Put the rules first and the question is answered with a song. Put the model first and you lose the cases where a template is the only thing that survives a transcription slip. The requests need opposite decisions, and a fixed ordering can only make one of them.

## What the patent does differently

The invention is to stop chaining the two sources of evidence and start weighing them. Rule and template knowledge is kept as an **addressable memory** of template embeddings. The neural model's semantic vector becomes a **query** against that memory: each matched template's similarity to the query is normalised into a weight, the templates are summed in those proportions into a single memory vector, and that vector is concatenated with the semantic vector and classified.

Two consequences follow, and both matter:

<div class="split">
  <div class="split-panel">
    <h4>Accuracy</h4>
    <p>The rule-versus-model weighting is learned from context rather than fixed by a human, so utterances that need the rules overruled and utterances that need the rules obeyed can both be handled by one system.</p>
  </div>
  <div class="split-panel split-panel--after">
    <h4>Diagnosability</h4>
    <p>The attention weights are an output, not an internal detail. An operator seeing a bad route can read which evidence drove it — a rule conflict or a model error — instead of guessing.</p>
  </div>
</div>

<figure class="project-figure project-figure--wide">
  {% include figures/nlu-architecture.svg %}
  <figcaption>The architecture claimed in CN112002313B, as deployed.</figcaption>
</figure>

### The detail claim 1 turns on

Normalising the similarities is what makes the weights readable — they sum to one, so each is the share of the decision that template accounts for. It also creates a failure that is easy to miss. A weight is a *relative* quantity: similarity divided by the sum of all similarities in the read. How many templates a request pulls into that read is not fixed — some utterances match a dozen, some match one. And when one is all that matched, the sum is that template, so its weight is 1.00 no matter how badly it fits. Normalised attention has no way to express "nothing here really matches"; the arithmetic will not produce it.

This is not a corner case, and it does not need bad data to happen. *Jay Chou's father* is a question about a person; *Jay Chou's Blue and White Porcelain* is a request for a song. Both are `@{artist}'s @{song}`, both fire the same music template on two entities that genuinely exist in the catalogue — 父亲 really is a song title. The template match is identical. Nothing at that layer can separate them.

So the independent claim requires that the matched set is never just what happened to match. It must "include at least a preset **basic template**." In production these were one per domain class, each a learned representation of what that class of request looks like, read for every utterance regardless of what else matched. They do two jobs at once. They occupy the denominator, so a template's weight has to be earned against standing competition rather than awarded by default. And because each one stands for a class, the weight that flows to them is not merely withheld from the template — it goes to the service the semantics actually point at. On *Jay Chou's father* the music template scores 0.10 and the question-answering class scores 0.70, and the read comes out as a question. The patent states the purpose in its own terms: including them means "the influence of dirty data can be reduced, and more accurate interaction results can be obtained even if the dirty data is hit by the search match."

{% include interactive/nlu-anchor.html %}

Two further mechanisms shipped alongside it: **open-set handling**, so unsupported requests are declined instead of forced into the nearest domain, and an **unclear-expression model** that reads raw acoustic features rather than transcribed text, catching cases where meaningless speech produces plausible-looking text.

## What changed in production

<figure class="project-figure project-figure--wide">
  {% include figures/nlu-results.svg %}
  <figcaption>Live production metrics on Tmall Genie, mid-2018 to mid-2019.</figcaption>
</figure>

## Commercial consequence

<div class="lens">
  <div class="lens-title">Why this is a business result, not only a technical one</div>
  <p>A 65% router is not a shippable consumer product. One request in three failing is the difference between a device people use daily and a device that ends up in a drawer. The accuracy work was the precondition for scale, not a refinement after it.</p>
</div>

The architecture stayed in production as Tmall Genie's routing layer from 2018 through 2020. In 2019, midway through that period, Tmall Genie shipped **15.61 million units in China** and took the number-one position in the market, growing 87.9% year on year (IDC). Globally, Canalys recorded **25.7 million cumulative units across 2018–2019**. By 2023 — two years after I left the company — [Alibaba Cloud was publicly describing the platform](https://developer.aliyun.com/article/1224763) as serving **40 million households** and **350 million connectable IoT devices**, across 1,000+ device manufacturers and 1,600+ brands.

The platform's corporate entity received the 9th Wu Wenjun AI Science and Technology Progress Award in 2019, during the period this architecture was in production.

## Timeline

<ul class="timeline">
  <li><span class="tl-when">2017</span><span class="tl-what">Placed on the founding team of Tmall Genie, Alibaba's smart-speaker platform.</span></li>
  <li class="is-key"><span class="tl-when">Mid-2018 → mid-2019</span><span class="tl-what">Open-set handling, the memory-network classifier, and the unclear-expression model deployed in sequence to live traffic.</span></li>
  <li class="is-key"><span class="tl-when">9 May 2019</span><span class="tl-what">Patent CN112002313B filed, first inventor.</span></li>
  <li><span class="tl-when">2019</span><span class="tl-what">Tmall Genie becomes China's number-one smart speaker: 15.61 million units, up 87.9% year on year.</span></li>
  <li><span class="tl-when">2020</span><span class="tl-what">Still the production routing layer. This is as far as my direct knowledge extends; I cannot speak to what replaced it, if anything.</span></li>
  <li><span class="tl-when">7 Apr 2023</span><span class="tl-what">Patent granted after examination for novelty and non-obviousness.</span></li>
  <li><span class="tl-when">2023–2024</span><span class="tl-what">Cited as prior art by Ping An Life Insurance and Tianjin University in unrelated fields.</span></li>
</ul>

## The underlying evidence

<figure class="project-figure">
  <img src="{{ site.baseurl }}/images/projects/nlu-patent.png" alt="Google Patents record for CN112002313B, Interaction method and device for voice interaction" />
  <figcaption>Granted patent CN112002313B — the primary record.</figcaption>
</figure>

<figure class="project-figure">
  <img src="{{ site.baseurl }}/images/projects/nlu-memnet.jpeg" alt="Internal Alibaba slide showing the domain-classification architecture fusing DC model semantic features with rule memory via multi-head attention" />
  <figcaption>The internal architecture slide from the period (Chinese). The diagram above is its English rendering; the reported result is a 35% reduction in domain-classification error.</figcaption>
</figure>

<figure class="project-figure">
  <img src="{{ site.baseurl }}/images/projects/nlu-summary.jpeg" alt="Internal slide showing domain classification accuracy rising from 65% to 85% across MemNet and unclear-expression milestones" />
  <figcaption>Internal deployment summary: accuracy across the rollout sequence, and 98.89% when transcription is correct.</figcaption>
</figure>

<ul class="evidence">
  <li><span class="ev-tag">Patent</span><span><a href="https://patents.google.com/patent/CN112002313B">CN112002313B</a> — Interaction Method, Apparatus, Speaker, Electronic Device and Storage Medium</span></li>
  <li><span class="ev-tag">Family</span><span><a href="https://patents.google.com/patent/WO2020224570A1">WO2020224570A1</a> — international application in the same family</span></li>
  <li><span class="ev-tag">Cited by</span><span><a href="https://patents.google.com/patent/CN112559687B">CN112559687B</a> — Ping An Life Insurance, financial-services question identification</span></li>
  <li><span class="ev-tag">Cited by</span><span><a href="https://patents.google.com/patent/CN114036823B">CN114036823B</a> — Tianjin University, power-transformer load forecasting</span></li>
  <li><span class="ev-tag">Related</span><span><a href="{{ site.baseurl }}/project/indicator-loss-asr/">Indicator Loss for context-aware ASR</a> — the other foundational layer every Tmall Genie command passed through</span></li>
</ul>

<p class="project-nav"><a href="{{ site.baseurl }}/">← Back to home</a> · <a href="{{ site.baseurl }}/project/">All projects</a></p>
