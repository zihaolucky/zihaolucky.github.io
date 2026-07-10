---
layout: page
title: Indicator Loss for Context-Aware ASR
permalink: /project/indicator-loss-asr/
description: Patent CN113808593B — explicit step-level gating for personalized speech recognition
---

<p class="project-kicker">Patent · Speech Recognition</p>

# Indicator Loss for Context-Aware ASR

Making contextual speech recognition auditable — first inventor on patent **CN113808593B**.

<figure class="project-figure">
  <img src="{{ site.baseurl }}/images/projects/asr-patent.png" alt="Google Patents page for CN113808593B — Voice interaction system, related methods, devices and equipment" />
  <figcaption>Granted patent CN113808593B (first inventor) — personalized end-to-end speech recognition for voice interaction.</figcaption>
</figure>

## Problem

Voice assistants need to bias recognition toward contacts, device names, and other personal vocabulary — a problem now often called **[dynamic vocabulary-based contextual biasing](https://www.emergentmind.com/topics/dynamic-vocabulary-based-contextual-biasing)**. The bias list changes per user or session and must be injected at runtime, without retraining the base ASR model.

Prior approaches (including Google’s CLAS-style contextual ASR) often treated biasing as an opaque soft attention over a list — hard to inspect, hard to update in real time, and hard to debug when the model ignored the bias.

## Approach

I invented **Indicator Loss**: an explicit, step-level supervised gate that decides when the decoder should attend to the bias list. Instead of relying only on decoder loss to hope the model “notices” a key phrase, Indicator Loss trains a binary relevance signal over the bias phrases at each decoding step — so operators can see *whether* biasing fired, not only the final transcript.

This sits in the same family of ideas that later surveys describe as **dynamic gating / activation** and **auxiliary bias-token supervision**: mechanisms that selectively enable biasing rather than always soft-fusing the full list.

<figure class="project-figure">
  <img src="{{ site.baseurl }}/images/projects/asr-architecture.jpeg" alt="Industry comparison of personalized ASR decoders: traditional ASR, Google CLAS, and Indicator Loss architecture" />
  <figcaption>Industry comparison: traditional ASR → Google CLAS → personalized decoder with Indicator Loss.</figcaption>
</figure>

Deployed on Alibaba’s Tmall Genie at national scale, the design enabled real-time bias-list updates without weeks-long language-model retraining — the practical requirement behind dynamic vocabulary biasing in production assistants.

<figure class="project-figure">
  <img src="{{ site.baseurl }}/images/projects/asr-results.jpeg" alt="Indicator Loss results compared with Google CLAS across IoT and contact test sets" />
  <figcaption>Head-to-head evaluation against CLAS on IoT and contact personalization sets.</figcaption>
</figure>

## Impact

- Granted Chinese patent **CN113808593B** (first inventor; filed 2020, granted 2025)
- Production deployment on a leading smart-speaker platform
- An early production instance of what the field now frames as dynamic vocabulary / contextual biasing — with an inspectable gate rather than opaque attention alone
- Independent academic work (Interspeech 2023–2025 and later surveys) continued to develop related themes: bias encoders, gating, and specialized bias objectives

## References

- Patent: [CN113808593B](https://patents.google.com/patent/CN113808593B)
- Survey / topic overview: [Dynamic Vocabulary-Based Contextual Biasing](https://www.emergentmind.com/topics/dynamic-vocabulary-based-contextual-biasing) (Emergent Mind)

<p class="project-nav"><a href="{{ site.baseurl }}/">← Back to home</a> · <a href="{{ site.baseurl }}/project/">All projects</a></p>
