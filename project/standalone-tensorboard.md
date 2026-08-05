---
layout: page
case_study: true
explorables: true
title: Standalone TensorBoard
permalink: /project/standalone-tensorboard/
description: dmlc/tensorboard — a cross-framework explainability layer. A standalone logging and rendering tool, so any framework could inspect its own training runs without TensorFlow.
image: /images/projects/tensorboard-intro.png
image_alt: TensorBoard, the visualisation toolkit engineers use to inspect a model while it trains
---

<p class="project-kicker">Open source · Explainability infrastructure</p>

# Standalone TensorBoard

<p class="project-deck">Watching a model while it trains is how an engineer finds out whether it is learning what they think it is. In 2016 the tool that did this best, TensorBoard, ran only inside TensorFlow: teams on MXNet or PyTorch had no practical way to reach it. I rebuilt it as a standalone tool that did both halves — a logging interface any framework could write through, and the renderer itself, lifted out of TensorFlow — so that inspecting a training run no longer depended on which framework you had picked.</p>

<div class="fact-strip">
  <div><div class="fact-key">Project</div><div class="fact-val"><a href="https://github.com/dmlc/tensorboard">dmlc/tensorboard</a></div></div>
  <div><div class="fact-key">Role</div><div class="fact-val">Primary author</div></div>
  <div><div class="fact-key">Layer</div><div class="fact-val">Cross-framework inspection</div></div>
  <div><div class="fact-key">Built on it</div><div class="fact-val">AWS mxboard</div></div>
  <div><div class="fact-key">Cited in</div><div class="fact-val">SOCKEYE, AMTA 2018</div></div>
  <div><div class="fact-key">Standing</div><div class="fact-val">Top 3% of ML-visualisation repos</div></div>
</div>

<div class="lens lens--plain">
  <div class="lens-title">In one minute, without the jargon</div>
  <p>Training a neural network is hours or days of numbers going past. TensorBoard turns them into charts — loss curves, weight histograms, sample images — which is how an engineer inspects what a model is doing, checks it against what was intended, and catches a failure before it reaches anyone. In 2016 it was the best tool of its kind, and Google shipped it as part of TensorFlow.</p>
  <p>There are two halves to using it. Writing the log file, and reading it. Writing had precedents: the file format was public, and a few people had written small libraries that produced compatible files from other frameworks. Reading was the wall. The renderer — the web application that actually draws the charts — was built into TensorFlow and could not be run by itself. So an MXNet or PyTorch user could produce a perfectly valid log file and then had to install Google's entire framework, a direct rival to the one they had chosen, purely to look at their own training run.</p>
  <p>I built both halves into one standalone package: a logging interface a non-TensorFlow trainer could write through, and the renderer lifted out of TensorFlow. One install, the same charts, no framework attached. That layer is what other people then built on.</p>
</div>

<div class="adopt-grid">
  <div class="adopt">
    <span class="adopt-who">Apache MXNet</span>
    <div class="adopt-what">Its documentation names me the primary author of the repository.</div>
    <div class="adopt-src">“He carved out from TensorFlow necessary protobuf definitions and designed low level logging interfaces for building a standalone logging and rendering tool.”</div>
  </div>
  <div class="adopt">
    <span class="adopt-who">AWS</span>
    <div class="adopt-what"><code>mxboard</code>, the official MXNet visualisation library, was built on this work and credits it in the README.</div>
    <div class="adopt-src">“The idea of this project comes from discussions with Zihao Zheng, the author of dmlc/tensorboard, on delivering a visualization solution for MXNet users.”</div>
  </div>
  <div class="adopt">
    <span class="adopt-who">PyTorch</span>
    <div class="adopt-what"><code>tensorboardX</code> brought the same capability to a competing ecosystem and lists this project as a reference.</div>
    <div class="adopt-src">A rival framework's community building on the same layer.</div>
  </div>
  <div class="adopt">
    <span class="adopt-who">Amazon Science</span>
    <div class="adopt-what">SOCKEYE, Amazon's neural machine translation toolkit, writes training statistics to be rendered by this project, and cites it.</div>
    <div class="adopt-src">Peer-reviewed, AMTA 2018.</div>
  </div>
  <div class="adopt adopt--accent">
    <span class="adopt-who">Google</span>
    <div class="adopt-what">TensorBoard installs as its own package today, and TensorFlow is no longer in its requirements.</div>
    <div class="adopt-src">TensorFlow's engineering director committed to removing the dependency in 2017.</div>
  </div>
</div>

## A tool you could not open

In late 2016 I was training models on MXNet and doing what everyone else did: plotting metrics by hand with matplotlib, fiddling with the size and colour of every image, and finding the results awkward to share. TensorBoard already solved all of that, and I could not use it.

Stripping the tool out of TensorFlow had been floated on the MXNet tracker before I picked it up. I scoped it in public, and the sticking point was there in my first pass:

<div class="testimony">
  <p>“Or we could install entire TF together with MXNet? Is that acceptable? I think it's okay but not good for our users and make this visualization tool too heavy.”</p>
  <cite><a href="https://github.com/apache/mxnet/issues/4003">apache/mxnet#4003</a>, 27 November 2016</cite>
</div>

Every non-TensorFlow community had the same problem at once, which is why it seemed worth building the whole path properly — logging and rendering in one standalone tool — rather than writing something for MXNet alone.

The widget below sets out that choice. Pick a framework, then try to get a chart on screen.

{% include interactive/tensorboard-install.html %}

## What already existed, and what did not

<div class="split">
  <div class="split-panel">
    <h4>Writing the log — precedents existed</h4>
    <p>The event-file format was public, and community developers had already written pure-Python adapters that emitted compatible files. The package carries its own logging interface, built on those same public format specifications by design: the files are worthless unless TensorBoard's own renderer can read them.</p>
  </div>
  <div class="split-panel split-panel--after">
    <h4>Rendering it — nobody had done that</h4>
    <p>The renderer was compiled as part of TensorFlow and had no life outside it. Carving out the protobuf definitions and the rendering front end, then shipping them together with the logging interface so the whole path installed in one command with no TensorFlow present, is what did not exist before this project.</p>
  </div>
</div>

The SOCKEYE paper describes it as “a standalone Tensorboard fork,” and in open-source usage that word describes provenance — a repository derived from another — rather than a judgement about originality. Still, it is worth being exact, because the halves are not equally hard. The format was Google's and public, and logging adapters already existed. What the field lacked was a renderer that ran on its own — and, with it, a single tool that took you from a training loop to a chart without TensorFlow anywhere in the install.

## What the field did with it

Two rival ecosystems ended up on it. AWS released [`mxboard`](https://github.com/awslabs/mxboard) in May 2018 as the official way to log MXNet data for TensorBoard, crediting this project as its origin in the README and closing its launch post with “special thanks to Zheng Zihao for providing technical support during the development of the project.” In the PyTorch world, [`tensorboardX`](https://github.com/lanpa/tensorboardX) — widely used for TensorBoard visualisation outside TensorFlow — lists it as a reference. Amazon's research toolkit SOCKEYE [cited it in a peer-reviewed paper](https://aclanthology.org/W18-1820.pdf) for rendering training statistics.

<figure class="project-figure">
  <img src="{{ site.baseurl }}/images/projects/mxboard-readme.png" alt="AWS mxboard GitHub repository, crediting discussions with Zihao Zheng, the author of dmlc/tensorboard" />
  <figcaption>AWS <code>mxboard</code> — official MXNet tooling, built on this architecture and crediting it in the README.</figcaption>
</figure>

Two of these numbers are not mine to claim — they count other people's packages. What they measure is whether the field still runs through this layer nearly a decade later.

<div class="metric-grid">
  <div class="metric metric--accent">
    <span class="metric-value">5.9<span class="unit">M</span></span>
    <div class="metric-label">Monthly downloads of <code>tensorboardX</code> — its README credits this project</div>
    <div class="metric-note">5,878,978 in the month to May 2026 — <a href="https://pypistats.org/packages/tensorboardx">live count</a></div>
  </div>
  <div class="metric">
    <span class="metric-value">2,075</span>
    <div class="metric-label">Monthly downloads of AWS's <code>mxboard</code> eight years after its last release</div>
    <div class="metric-note">Final release 0.1.0, May 2018; measured May 2026 — <a href="https://pypistats.org/packages/mxboard">live count</a></div>
  </div>
  <div class="metric">
    <span class="metric-value">Top 3<span class="unit">%</span></span>
    <div class="metric-label">GitHub ranking of <code>dmlc/tensorboard</code> among machine-learning visualisation repositories</div>
    <div class="metric-note">≈position 60 of ~2,000 tagged both <a href="https://github.com/search?q=topic%3Avisualization+topic%3Amachine-learning&amp;type=repositories&amp;s=stars&amp;o=desc">visualization and machine-learning</a>, and top 2.4% of the ~25,700 in <a href="https://github.com/search?q=topic%3Avisualization&amp;type=repositories&amp;s=stars&amp;o=desc">visualization</a> alone, by stars, June 2026</div>
  </div>
</div>

The <code>mxboard</code> figure is the small number that says the most. Its last release was May 2018, and Apache MXNet — the framework it served — was retired to the Apache Attic in September 2023. Eight years without an update and two years after its framework was formally shut down, it is still installed around two thousand times a month by people who need to see inside a training run. Every figure above links to a live counter rather than a screenshot; counts and rankings move, and these were read in May and June 2026.

Google reached the same conclusion. In mid-2017 it split TensorBoard out of TensorFlow into a project of its own, and in a public thread on this repository the engineering director leading TensorFlow addressed the dependency directly:

<div class="testimony">
  <p>“We appreciate all your work you have done to support this community. […] The last concern for this group is the dependency on TensorFlow. This will take a bit more work to remove, but it does make sense to keep it independent and we will remove it.”</p>
  <cite>Rajat Monga, Engineering Director for TensorFlow at Google, across the thread at <a href="https://github.com/dmlc/tensorboard/issues/50">dmlc/tensorboard#50</a>, July 2017</cite>
</div>

They did remove it. TensorBoard's [own requirements file](https://github.com/tensorflow/tensorboard/blob/master/tensorboard/pip_package/requirements.txt) no longer lists TensorFlow, and the code keeps a stub that stands in when TensorFlow is absent — running without it is a maintained path, not an accident. Google's README states it directly: TensorBoard “can be run with a reduced feature set if you do not have TensorFlow installed.” A few plugins and Cloud Storage log directories still want it. For the ordinary case of writing a log and reading it back, the dependency this project existed to work around is gone from the original too.

<figure class="project-figure">
  <img src="{{ site.baseurl }}/images/projects/tensorboard-issue50.png" alt="GitHub thread where Rajat Monga of Google thanks @zihaolucky for the standalone TensorBoard work" />
  <figcaption>The public thread on <a href="https://github.com/dmlc/tensorboard/issues/50">dmlc/tensorboard#50</a>.</figcaption>
</figure>

## Why inspection tooling was a competitive problem

<div class="lens">
  <div class="lens-title">Why this is a business result, not only a technical one</div>
  <p>Amazon was direct about this when it launched <code>mxboard</code>: “We have had feedback from many different users, including corporate ones, that they started using TensorFlow because of the rich feature set offered in TensorBoard.” Teams were choosing an entire deep-learning stack — and with it a cloud, a hiring profile and years of code — on the strength of its inspection tooling.</p>
</div>

So the tool was not only a convenience for developers. Being unable to inspect your own training runs was a switching cost, and it was steering enterprise customers toward one vendor. That is also why the work outlasted my involvement in it: AWS needed MXNet to be a credible choice and the PyTorch community needed the same, and both routes ran through the same layer.

It is the same question I have kept working on since. Whether a model can be trusted in production depends on whether the people running it can see what it is doing, and inspection that exists only inside one vendor's stack is not inspection the field can rely on. [The memory-network NLU work]({{ site.baseurl }}/project/memory-network-nlu/) exposes attention weights so an operator can see why a request routed the way it did; [the Indicator Loss patent]({{ site.baseurl }}/project/indicator-loss-asr/) makes a biasing decision a logged value instead of a guess. Different layers of the stack, the same requirement.

## Timeline

<ul class="timeline">
  <li class="is-key"><span class="tl-when">27 Nov 2016</span><span class="tl-what">Opened <a href="https://github.com/apache/mxnet/issues/4003">apache/mxnet#4003</a>, scoping a TensorBoard-class tool for MXNet by taking the renderer out of TensorFlow, with a working proof of concept.</span></li>
  <li class="is-key"><span class="tl-when">2017</span><span class="tl-what"><code>dmlc/tensorboard</code> released — logging interface and renderer in one package, installable in one command with no TensorFlow present, and published on PyPI under the <code>tensorboard</code> name. Apache MXNet's documentation names me the repository's primary author.</span></li>
  <li class="is-key"><span class="tl-when">3 Jul 2017</span><span class="tl-what">The PyPI name is transferred to Google. By my own count in <a href="https://github.com/dmlc/tensorboard/issues/50">the thread</a> that day, the repository was drawing several hundred visitors daily.</span></li>
  <li class="is-key"><span class="tl-when">4 Jul 2017</span><span class="tl-what">Google splits TensorBoard into a standalone project; its engineering director acknowledges this work publicly and commits, in writing, to removing the TensorFlow dependency.</span></li>
  <li><span class="tl-when">May 2018</span><span class="tl-what">AWS releases <code>mxboard</code> as official MXNet tooling, crediting this project as its origin; Amazon’s SOCKEYE paper cites the standalone fork at AMTA for rendering training statistics.</span></li>
  <li><span class="tl-when">2026</span><span class="tl-what">Nine years on: <a href="https://pypistats.org/packages/tensorboardx"><code>tensorboardX</code></a> records 5.9 million downloads a month and <a href="https://pypistats.org/packages/mxboard"><code>mxboard</code></a> another 2,075 despite no release since 2018, while <code>dmlc/tensorboard</code> still ranks in the <a href="https://github.com/search?q=topic%3Avisualization+topic%3Amachine-learning&amp;type=repositories&amp;s=stars&amp;o=desc">top 3% of machine-learning visualisation repositories</a> on GitHub.</span></li>
</ul>

## The underlying evidence

<figure class="project-figure">
  <img src="{{ site.baseurl }}/images/projects/tensorboard-intro.png" alt="TensorBoard visualisation toolkit — scalars, graphs and experiment tracking" />
  <figcaption>TensorBoard: the visualisation layer this project made framework-agnostic.</figcaption>
</figure>

<ul class="evidence">
  <li><span class="ev-tag">Repository</span><span><a href="https://github.com/dmlc/tensorboard">dmlc/tensorboard</a> — the project itself</span></li>
  <li><span class="ev-tag">Origin</span><span><a href="https://github.com/apache/mxnet/issues/4003">apache/mxnet#4003</a> — where the work was proposed and scoped in public, 27 November 2016</span></li>
  <li><span class="ev-tag">Authorship</span><span><a href="https://cwiki.apache.org/confluence/display/MXNET/Logging+MXNet+Data+for+Visualization+in+TensorBoard">Apache MXNet documentation</a> — “Zihao Zheng is the primary author of this repo”</span></li>
  <li><span class="ev-tag">Downstream</span><span><a href="https://github.com/awslabs/mxboard">awslabs/mxboard</a> — AWS's official MXNet visualisation library, crediting this project</span></li>
  <li><span class="ev-tag">Downstream</span><span><a href="https://github.com/lanpa/tensorboardX">tensorboardX</a> — the PyTorch ecosystem's equivalent, listing this project as a reference</span></li>
  <li><span class="ev-tag">Academic</span><span><a href="https://aclanthology.org/W18-1820.pdf">SOCKEYE (AMTA 2018)</a> — Amazon researchers citing the standalone fork for rendering training statistics</span></li>
  <li><span class="ev-tag">Recognition</span><span><a href="https://github.com/dmlc/tensorboard/issues/50">dmlc/tensorboard#50</a> — Google's TensorFlow engineering director on the work, and on removing the dependency</span></li>
  <li><span class="ev-tag">Demand</span><span><a href="https://medium.com/apache-mxnet/mxboard-mxnet-data-visualization-2eed6ae31d2c">Amazon's mxboard launch post, 18 May 2018</a> — users “started using TensorFlow because of the rich feature set offered in TensorBoard”, and a closing credit by name</span></li>
  <li><span class="ev-tag">Scale</span><span><a href="https://pypistats.org/packages/tensorboardx">tensorboardX</a> and <a href="https://pypistats.org/packages/mxboard">mxboard</a> download statistics — live PyPI counts, re-checkable at any time</span></li>
  <li><span class="ev-tag">Standing</span><span>GitHub topic search, by stars: <a href="https://github.com/search?q=topic%3Avisualization+topic%3Amachine-learning&amp;type=repositories&amp;s=stars&amp;o=desc">visualization + machine-learning</a> and <a href="https://github.com/search?q=topic%3Avisualization&amp;type=repositories&amp;s=stars&amp;o=desc">visualization</a> — top 3% and top 2.4% respectively</span></li>
  <li><span class="ev-tag">Today</span><span><a href="https://pypi.org/project/tensorboard/">tensorboard on PyPI</a> — TensorFlow no longer appears in its requirements</span></li>
</ul>

<p class="project-nav"><a href="{{ site.baseurl }}/">← Back to home</a> · <a href="{{ site.baseurl }}/project/">All projects</a></p>
