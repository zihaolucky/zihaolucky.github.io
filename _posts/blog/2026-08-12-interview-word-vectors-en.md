---
layout: post
title: "A Few Interview Questions I Like (1): Word Vectors"
description: Opening of the series. A deceptively basic question — why do semantically similar words end up close in vector space — often says more about whether someone has really used word vectors than any definition can.
category: blog
lang: en
translation: true
translation_key: interview-word-vectors
permalink: /interview-word-vectors/en/
explorables: true
---

In interviews I sometimes drop a few questions that look almost too basic. The point is not to trap anyone — it is to see quickly whether a concept has been internalized, or whether it still lives only as a name.

This is the first piece in the series. We start from a foundation of modern NLP: word vectors.


The core property compresses into one sentence: words that are close in meaning or concept are also close in vector space. Fruits like apple, banana, and watermelon cluster together; places like Beijing, Shanghai, and Hangzhou do too. So where does that property come from? Coincidence, or is there a reason?

Here is how I see it: the answer needs both a linguistic regularity and an algorithmic design. Neither is enough alone.

When I was learning word2vec, I kept hearing the phrase *distributional hypothesis*. For years the usual Chinese rendering — 「分布式假设」— was so opaque that I never really felt what it meant. Eventually I decided it was pointing at a distributional regularity in language: a word's appearances are tied to the contexts it sits in; sentences and words are not thrown together at random. After "I want to eat…" you almost always get something in the food category, not a place name or something else.

I asked Claude to build a small demo of the center–context relationship:

{% include interactive/wv-window.html %}

Second, the algorithm matters — otherwise why don't language models, or other word-vector models, put the same emphasis on this property? Skip-gram / CBOW line up with the linguistic story above, so the property shows up only when the two meet.

Saying it is "about the algorithm" is a bit abstract. What skip-gram actually does is wire that window into gradient descent: every stop of the window emits a few pairs, and those pairs are the training samples. And the "neither alone is enough" claim can be tested directly — leave the algorithm untouched, shuffle the word order in the corpus, and see what is left.

{% include interactive/wv-skipgram.html %}
