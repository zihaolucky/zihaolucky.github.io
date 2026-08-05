---
layout: page
case_study: true
explorables: true
title: Standalone TensorBoard
permalink: /project/standalone-tensorboard/
description: dmlc/tensorboard — a cross-framework explainability layer. A standalone logging and rendering tool, so any framework could inspect its own training runs without TensorFlow.
image: /images/projects/tensorboard-intro.png
image_alt: TensorBoard, the visualisation toolkit for watching a model train
---

<p class="project-kicker">Open source · ML infrastructure · Cross-framework adoption</p>

# Standalone TensorBoard

<p class="project-deck">In 2016 the best way to watch a model train lived inside one framework. A team on MXNet or PyTorch could write the log file perfectly well and then had no way to open it — the renderer existed only inside a TensorFlow installation. I rebuilt it as a standalone tool that did both halves, logging and rendering, in one package. Amazon built its official MXNet tooling on that work, the PyTorch ecosystem referenced it, and TensorBoard itself now installs without TensorFlow.</p>

<div class="fact-strip">
  <div><div class="fact-key">Project</div><div class="fact-val"><a href="https://github.com/dmlc/tensorboard">dmlc/tensorboard</a></div></div>
  <div><div class="fact-key">Role</div><div class="fact-val">Primary author</div></div>
  <div><div class="fact-key">Problem</div><div class="fact-val">Framework lock-in</div></div>
  <div><div class="fact-key">Built on it</div><div class="fact-val">AWS mxboard</div></div>
  <div><div class="fact-key">Cited in</div><div class="fact-val">SOCKEYE, AMTA 2018</div></div>
  <div><div class="fact-key">Standing</div><div class="fact-val">Top 3% of ML-visualisation repos</div></div>
</div>

<div class="lens lens--plain">
  <div class="lens-title">In one minute, without the jargon</div>
  <p>Training a neural network is hours or days of numbers going past. TensorBoard turns them into charts — loss curves, weight histograms, sample images — so you can see whether a run is healthy before spending another day on it. In 2016 it was the best tool of its kind, and Google shipped it as part of TensorFlow.</p>
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
    <div class="adopt-src">“The idea of this project comes from discussions with Zihao Zheng, the author of dmlc/tensorboard.”</div>
  </div>
  <div class="adopt">
    <span class="adopt-who">PyTorch</span>
    <div class="adopt-what"><code>tensorboardX</code> brought the same capability to a competing ecosystem and lists this project as a reference.</div>
    <div class="adopt-src">A rival framework's community building on the same layer.</div>
  </div>
  <div class="adopt">
    <span class="adopt-who">Amazon Science</span>
    <div class="adopt-what">SOCKEYE, Amazon's neural machine translation toolkit, renders its training statistics with this project and cites it.</div>
    <div class="adopt-src">Peer-reviewed, AMTA 2018.</div>
  </div>
  <div class="adopt adopt--accent">
    <span class="adopt-who">Google</span>
    <div class="adopt-what">TensorBoard installs as its own package today, and TensorFlow is no longer in its requirements.</div>
    <div class="adopt-src">The architecture argued for here — publicly agreed to by TensorFlow's engineering director in 2017.</div>
  </div>
</div>

## A tool you could not open

In late 2016 I was training models on MXNet and doing what everyone else did: plotting metrics by hand with matplotlib, resizing images, mailing PNGs to colleagues. TensorBoard already solved all of that, and I could not use it.

I scoped the work in public, on the MXNet issue tracker, and the sticking point was there in the first pass:

<div class="testimony">
  <p>“Or we could install entire TF together with MXNet? Is that acceptable? I think it's okay but not good for our users and make this visualization tool too heavy.”</p>
  <cite><a href="https://github.com/apache/mxnet/issues/4003">apache/mxnet#4003</a>, 27 November 2016</cite>
</div>

That is the whole problem in one line. Asking a framework's users to install a competing framework in order to see their own charts is not a dependency, it is a tax — and one paid by every non-TensorFlow community at once, which is what made it worth fixing properly rather than fixing for MXNet.

The widget below is that decision, made concrete. Pick a framework, then try to get a chart on screen.

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

Two rival ecosystems ended up on it. AWS released [`mxboard`](https://github.com/awslabs/mxboard) in March 2018 as the official way to log MXNet data for TensorBoard, crediting this project as its origin. In the PyTorch world, [`tensorboardX`](https://github.com/lanpa/tensorboardX) — still one of the most widely used visualisation libraries outside TensorFlow — lists it as a reference. Amazon's research toolkit SOCKEYE [cited it in a peer-reviewed paper](https://aclanthology.org/W18-1820.pdf) for rendering training statistics.

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

Then the incumbent moved. In mid-2017 Google split TensorBoard out of TensorFlow into a project of its own, and in a public thread on this repository the engineering director leading TensorFlow acknowledged the work and addressed the dependency directly:

<div class="testimony">
  <p>“We appreciate all your work you have done to support this community. […] The last concern for this group is the dependency on TensorFlow. This will take a bit more work to remove, but it does make sense to keep it independent and we will remove it.”</p>
  <cite>Rajat Monga, Engineering Director for TensorFlow at Google — <a href="https://github.com/dmlc/tensorboard/issues/50">dmlc/tensorboard#50</a>, July 2017</cite>
</div>

They did remove it. TensorBoard's [own requirements file](https://github.com/tensorflow/tensorboard/blob/master/tensorboard/pip_package/requirements.txt) no longer lists TensorFlow, and the code keeps a stub that stands in when TensorFlow is absent — running without it is a maintained path, not an accident. Google's README states it directly: TensorBoard “can be run with a reduced feature set if you do not have TensorFlow installed.” A few plugins and Cloud Storage log directories still want it. For the ordinary case of writing a log and reading it back, the dependency this project existed to work around is gone from the original too. The strongest evidence that a piece of infrastructure was right is usually not that it was adopted downstream but that the incumbent adopted its position, and that is what happened here.

<figure class="project-figure">
  <img src="{{ site.baseurl }}/images/projects/tensorboard-issue50.png" alt="GitHub thread where Rajat Monga of Google thanks @zihaolucky for the standalone TensorBoard work" />
  <figcaption>The public thread on <a href="https://github.com/dmlc/tensorboard/issues/50">dmlc/tensorboard#50</a>.</figcaption>
</figure>

## Why a charting tool was a competitive problem

<div class="lens">
  <div class="lens-title">Why this is a business result, not only a technical one</div>
  <p>Amazon said the quiet part out loud when it launched <code>mxboard</code>: “We have had feedback from many different users, including corporate ones, that they started using TensorFlow because of the rich feature set offered in TensorBoard.” Teams were choosing an entire deep-learning stack — and with it a cloud, a hiring profile and years of code — on the strength of its inspection tooling.</p>
</div>

That reframes what this project was. Not developer convenience, but the removal of a switching cost that was steering enterprise customers toward one vendor. It is also why the work survived its author's involvement: AWS needed MXNet to be a credible choice, the PyTorch community needed the same, and both got there through the same layer.

There is a durable lesson in it for the work I do now. Inspectability decides whether a model can be trusted in production, and inspectability that only exists inside one vendor's stack is not inspectability for the field — it is a lock. The same instinct runs through [the memory-network NLU work]({{ site.baseurl }}/project/memory-network-nlu/), where attention weights were exposed so operators could see why a request routed the way it did, and through [the Indicator Loss patent]({{ site.baseurl }}/project/indicator-loss-asr/), where the whole point is that a biasing decision is a logged value rather than a guess.

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
