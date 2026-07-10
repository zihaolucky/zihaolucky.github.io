---
layout: page
title: Standalone TensorBoard
permalink: /project/standalone-tensorboard/
description: Cross-framework ML explainability infrastructure — primary author of dmlc/tensorboard
---

<p class="project-kicker">Open Source · ML Infrastructure</p>

# Standalone TensorBoard

Decoupling TensorBoard from TensorFlow so any deep-learning framework can inspect training runs without lock-in.

<figure class="project-figure">
  <img src="{{ site.baseurl }}/images/projects/tensorboard-intro.png" alt="TensorBoard visualization toolkit — scalars, graphs, and experiment tracking UI" />
  <figcaption>TensorBoard: the visualization layer that standalone TensorBoard made framework-agnostic.</figcaption>
</figure>

## Problem

In the mid-2010s, TensorBoard was the de facto tool for watching deep-learning experiments — but it was tightly coupled to TensorFlow. Teams on MXNet, PyTorch, and other stacks either rebuilt visualization from scratch or abandoned inspectability. Explainability infrastructure should not force a framework choice.

## Approach

I created **standalone TensorBoard** ([`dmlc/tensorboard`](https://github.com/dmlc/tensorboard)) as primary author (~6K lines, 49 commits). The core idea: extract the event-file protocol and UI into a framework-agnostic layer that any trainer can write into.

<figure class="project-figure">
  <img src="{{ site.baseurl }}/images/projects/mxboard-readme.png" alt="AWS mxboard GitHub repository — logging MXNet data for visualization in TensorBoard" />
  <figcaption>AWS <code>mxboard</code> — official MXNet logging library built on the standalone TensorBoard architecture.</figcaption>
</figure>

That architecture became the basis for AWS’s official [`mxboard`](https://github.com/awslabs/mxboard), was referenced by PyTorch’s widely used `tensorboardX`, and was publicly acknowledged by Google’s TensorBoard engineering leadership.

<figure class="project-figure">
  <img src="{{ site.baseurl }}/images/projects/tensorboard-issue50.png" alt="Rajat Monga of Google TensorFlow thanking @zihaolucky for standalone TensorBoard community work on GitHub issue #50" />
  <figcaption>Rajat Monga (then leading TensorFlow / TensorBoard at Google) publicly thanking <code>@zihaolucky</code> on <a href="https://github.com/dmlc/tensorboard/issues/50">dmlc/tensorboard#50</a>.</figcaption>
</figure>

## Impact

- Cross-ecosystem adoption beyond a single framework
- A practical template for “inspectability as infrastructure”
- Still a useful reference for how ML tooling can stay portable

## Links

- [GitHub: dmlc/tensorboard](https://github.com/dmlc/tensorboard)
- [AWS mxboard](https://github.com/awslabs/mxboard)

<p class="project-nav"><a href="{{ site.baseurl }}/">← Back to home</a> · <a href="{{ site.baseurl }}/project/">All projects</a></p>
