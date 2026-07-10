---
layout: page
title: Blog
permalink: /blog/
description: Writing and notes by Zihao Zheng
---

<div class="blog-index" style="padding: 0; max-width: none;">
    <h1>Blog</h1>
    <p class="lead">Essays, technical notes, and project write-ups.</p>

    <ul class="post-list">
    {% for post in site.posts %}
        {% unless post.path contains "template" %}
        <li>
            <div class="post-item">
                <div>
                    {% if post.categories.size > 0 %}
                    <span class="category-label">{{ post.categories | first }}</span>
                    {% endif %}
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
