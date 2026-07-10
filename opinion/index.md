---
layout: page
title: Opinion
permalink: /opinion/
description: Opinion essays by Zihao Zheng
---

<div class="blog-index" style="padding: 0; max-width: none;">
    <h1>Opinion</h1>
    <p class="lead">Essays and reflections. <a href="{{ site.baseurl }}/blog/">See all posts →</a></p>

    <ul class="post-list">
    {% for post in site.categories.opinion %}
        {% unless post.path contains "template" or post.translation %}
        <li>
            <div class="post-item">
                <div>
                    <h3><a href="{{ site.baseurl }}{{ post.url }}">{{ post.title }}</a></h3>
                    {% if post.description %}
                    <p class="post-desc">{{ post.description }}</p>
                    {% endif %}
                </div>
                <time class="post-date" datetime="{{ post.date | date_to_xmlschema }}">{{ post.date | date: "%b %d, %Y" }}</time>
            </div>
        </li>
        {% endunless %}
    {% endfor %}
    </ul>
</div>
