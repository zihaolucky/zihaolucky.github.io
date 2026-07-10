---
layout: post
title: Sparse Auto-encoder(2)
description: UFLDL学习笔记(2) 
category: blog
---

本系列文章是学习[UFLDL][2]的学习笔记和心得。上次我们粗略说了一下自编码神经网络的实现思路和方法，其中最后留下的“可视化”疑问值得继续探索、玩味。所以我们就花点时间继续深入一下。

##可视化自编码器学习结果
上周旁听研究生机器学习课的时候，自己就因为没有搞清楚代码中`display_network`而有些混乱。显然，这也是自己没有深入理解学习内容的苦果。这次来搞清楚，如果哪里有不妥当，请指出。

###可视化的是什么？
首先可以肯定的是，最后得到的图像是输入层与隐层间的连接系数`W1`

![trained_encoder](/images/sparse-encoder/trained_encoder.png)

仔细看这25个图块不难看到，每个图块都是8x8的，事实上`W1`是25x64的。我一开始是以为要可视化隐层，即输入的变换`W1*X`以观察变换后的情况。在分析

![RBM](/images/sparse-encoder/RBM.jpg)

###为什么这样做？






[zihaolucky]:    http://zihaolucky.github.io  "zihaolucky"
[1]:    {{ page.url}}  ({{ page.title }})
[2]:  http://ufldl.stanford.edu/wiki/index.php/UFLDL教程
[3]:  http://ufldl.stanford.edu/wiki/index.php/自编码算法与稀疏性
