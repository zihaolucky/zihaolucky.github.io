---
layout: post
title: stat learning 学习手记
description: 统计学习stat-learning与机器学习machine learning是同一问题的不同角度阐释。通过对统计学习的了解，可以看到统计/概率思维在处理问题中的重要作用
category: blog
---

##写在前面
[Stanford Online][2]是Stanford University推出的在线教育平台，这个寒假该平台上有两门重磅课程推荐。分别是统计学习和凸优化。

* [Statistical Learning][3]
![stat-learning](/images/stat-learning-notes/stat_learning.jpg)

* [Convex Optimization][4]
![convex](/images/stat-learning-notes/convex_optimization.jpg)

> 若要观看上面的视频，你应该需要[这个东西][5]；如果你是Mac用户，可以到[这里][6]

这是系列文章的第一部分，作为我在跟stat-learning这门课上的笔记。我会按课程的组织方式来安排文章的顺序，着重记录与machine learning不同的、或是之前学习中体会到的地方。

##Overview of Statistical Learning
###Introduction to Regression Models

**回归模型简介**




###Dimentionality and Structured Models


###Model Selection and Bias-Variance Tradeoff

**模型选择与折中**

###Classification

**分类问题简介**
与回归问题不同，分类问题的目标是对问题的`性质`或是`属性`、`label`进行预测。例如判定email是否为spam，或是数字识别问题：

    Here the response variable Y is qualitative.
	1.The email is spam or ham? ham = good email
	2.Digit class is one of {0,1,2,...,9}

**统计学习中，处理分类问题的目标**

* 对未知样本做分类预测 Build a classifier _C(X)_ that assigns a class label from _C_ to a future unlabeled observation _X_.
* 评估分类的准确性 Assess the uncertainty in each classification.
* 理解不同输入属性(predictors)的角色地位 Understand the roles of the different predictors among _X = (X1,X2,...,Xp)_




##Learning Regression






[zihaolucky]:    http://zihaolucky.github.io  "zihaolucky"
[1]:    {{ page.url}}  ({{ page.title }})
[2]: http://online.stanford.edu/
[3]: https://class.stanford.edu/courses/HumanitiesScience/StatLearning/Winter2014/info
[4]: https://class.stanford.edu/courses/Engineering/CVX101/Winter2014/info
[5]: http://mooc.guokr.com/post/401314/
[6]: http://www.guokr.com/blog/436937/

