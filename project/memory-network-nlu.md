---
layout: page
title: Memory-Network NLU for Tmall Genie
permalink: /project/memory-network-nlu/
description: Patent CN112002313B — fusing rules and learned representations for domain classification
---

<p class="project-kicker">Patent · Voice Assistants</p>

# Memory-Network NLU for Tmall Genie

Fusing rules and neural memory for domain routing — first inventor on patent **CN112002313B**.

<figure class="project-figure">
  <img src="{{ site.baseurl }}/images/projects/nlu-patent.png" alt="Google Patents page for CN112002313B — Interaction method and device for voice interaction" />
  <figcaption>Granted patent CN112002313B (first inventor) — semantic matching for voice interaction.</figcaption>
</figure>

## Problem

Every voice command on Tmall Genie had to be routed to the right skill domain (music, shopping, IoT, …). Early rule-and-template systems topped out around **~65%** routing accuracy and failed opaquely on open-set or noisy ASR input. Pure neural classifiers were harder to constrain with product rules and harder to explain when wrong.

## Approach

I designed a **memory-network NLU** architecture that keeps rule knowledge as addressable memory while learning soft representations of the utterance. The fusion raised production domain-classification accuracy to about **~85%**, with open-set handling and acoustic “unclear expression” signals so failure modes stayed diagnosable.

<figure class="project-figure">
  <img src="{{ site.baseurl }}/images/projects/nlu-memnet.jpeg" alt="Domain classification architecture fusing DC model semantic features with rule memory via multi-head attention" />
  <figcaption>Domain classification: fusing a DC model with rule memory and bias through multi-head attention.</figcaption>
</figure>

This layer, together with the ASR stack, formed one of the two foundational AI paths every Tmall Genie command passed through.

<figure class="project-figure">
  <img src="{{ site.baseurl }}/images/projects/nlu-summary.jpeg" alt="Domain classification accuracy rising from 65% to 85% with MemNet and unclear-expression model milestones" />
  <figcaption>Full-sample DC accuracy: ~65% → ~85%; when ASR is correct, up to 98.89%.</figcaption>
</figure>

## Impact

- Granted Chinese patent **CN112002313B** (first inventor; filed 2019, granted 2023)
- Production routing for a platform that reached tens of millions of households
- Later cited as prior art by organizations outside Alibaba (including insurance and university filings)

## Links

- Patent: [CN112002313B](https://patents.google.com/patent/CN112002313B)
- Related PCT: [WO2020224570A1](https://patents.google.com/patent/WO2020224570A1)

<p class="project-nav"><a href="{{ site.baseurl }}/">← Back to home</a> · <a href="{{ site.baseurl }}/project/">All projects</a></p>
