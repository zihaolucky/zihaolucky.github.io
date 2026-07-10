---
layout: post
title: Sparse Auto-encoder
description: UFLDL学习笔记(一) 事物存在的合理性往往是让人意想不到的，如果我们善于思考和发现的话；自编码神经网络给我最大的惊喜是：别小瞧自编码器。不止如此，你会发现隐层也是很有意思的。
category: blog
---

本系列文章是学习[UFLDL][2]的学习笔记和心得。这次我们从神经网络讲开去，说说自编码器的东西。


##关于监督学习

监督学习是最容易入门的机器学习思想，作为人工智能领域最有力的工具，它操作简单却十分直观——给机器一组training data with label，通过算法处理，它便会为我们的testing data without label给出对应的label，恰好这个label就是我们想要的东西。因此这种思想在数字识别、语音识别、自动驾驶汽车以及提高人们对人类基因的认识上有成功的应用。

然而有监督学习(supervised learning)仍然有局限性。在使用回归模型时，我们根据现有数据的分布特征，选择线性或是更高次的多项式模型，亦或是logistic模型;使用SVM做分类问题时，数据集如何做变换，使得类之间尽可能出现明显的"簇"便是决定分类效果高低的关键。
这就是有监督学习的局限所在，它依赖于我们选择的特征。特征选择得好，模型效果/表现力就强。如此一来，我们将算法应用到新领域的时候，就希望有一个"专家"来告诉我们，什么样的变量有效。否则我们就要不断地对变量做变换，以提高模型性能。

在上杨坦老师开的'数据挖掘'课时有一个医疗领域的案例，恰能说明"行业经验"在数据挖掘实践中的作用。当时的数据是病人的血样指标，包括Na，K离子的含量等信息，以及对应的发病率。在对数据进行可视化时发现，单纯使用Na或K为特征，数据分布特征不明显，但当我们构造`Na/K`这个特征时，便发现了其与发病率的强相关性。
事实上，这个指标恰恰是医学上的重要指标。

正因如此，在Computer Vision、Audio Processing以及Natural Language Processing领域。目前有大量的研究人员在用他们的专业知识去寻找这些特征(features)，这无疑是非常耗费时间精力的事情，一旦新的问题出现，又需要重新构造特征。

Prof. Andrew Ng在CS294A的Lecture中这样说：
_Once a good feature representation is given,a supervised learning algorithm can do well. But in such domains as computer vision, audio processing, and natural language processing, there’re now hundreds or perhaps thousands of researchers who’ve spent years of their lives slowly and laboriously hand-engineering vision, audio or text features. While much of this feature-engineering work is extremely clever, one has to wonder if we can do better. Certainly this labor-intensive hand-engineering approach does not scale well to new problems; further, ideally we’d like to have algorithms that can automatically learn even better feature representa- tions than the hand-engineered ones._

问题是，我们能否想办法给出能自动生成有效特征的算法呢?这就是 **Sparse Autoencoder** 算法的目标，它是一种在unlabeled data中自动学习/寻找特征的算法。




##Sparse Auto-encoder
[Sparse Autoencoder][3]的组织思路是这样的：介绍有监督学习中的神经网络及反向传播算法；随后展示如何以此建立无监督的自编码神经网络，最后引入稀疏性概念并建立自编码神经网络。并可视化隐层的结构，以更好地理解稀疏性限制对特征学习能力的强化效果。

###看似枯燥的自我学习
自编码神经网络是一种无监督学习算法，它使用了反向传播算法，并让目标值等于输入值:
![sparse-encoder](/images/sparse-encoder/self-encoded-network.png)

这样看来，自编码神经网络尝试去逼近一个恒等函数，从而使得输出 $\hat{x}$ 接近于输入 $x$ ；你会发现，隐层的数目较少，如果这个逼近效果很不错的话，意味着什么呢？这表明我们可以用少的features去生成原有数据，即隐层是对原数据的压缩。不过，如果网络的输入数据是完全随机的，那么这一压缩表示将会非常难学习，也就是原数据隐含的结构特征并不是那么明显。

试想一下，如果该神经网络确实有较好的恒等逼近效果，那么起隐层（输入层的非线性组合）是不是代表了原数据的特征呢？这种由非监督得到的特征变换结果，是否好用？如果真的好用的话，岂不是省下了很多工夫？


###自编码神经网络隐层的奥秘
若要对隐层的抽象能力有比较直观的理解，最好的方法就是visualize隐层的输出,我们以在10×10图像（即$n=100$）上训练自编码器为例。事实上，决定隐层输出的是`联接参数`$W1$，这个参数是自编码神经网络通过BP算法得到的。

另外，或许是神经网络加入了稀疏性限制的缘故，我们若要可视化隐层的输出，最好就是让隐层的每个节点都得到“最大的激励”。而可以证明，令隐藏单元$i$得到最大激励的输入应由下面公式计算的像素$x_j$给出（共需计算100个像素，$j=1,\dots,100$）：

$$x_j = \frac{W_{ij}^{(1)}}{\sqrt{\sigma_{i=1}^100(W_{ij})^2}}$$

也就是说，当我们用上面的$x_j$作为输入，将会得到最大激励下的隐层各个节点的显示。此时我们能最好地看到这些节点的学习效果。我一开始没能理解为什么要这样选择$x_j$，而不是原数据；但细想之下才有这样的理解。


当我们用上式算出各像素的值、把它们组成一幅图像、并将图像呈现在我们面前之时，隐藏单元$i$所追寻特征的真正含义也渐渐明朗起来。
假如我们训练的自编码器有100个隐藏单元，可视化结果就会包含100幅这样的图像——每个隐藏单元都对应一幅图像。审视这100幅图像，我们可以试着体会这些隐藏单元学出来的整体效果是什么样的。

![visualized-image](/images/sparse-encoder/visualized.png)


我们可以看到，不同的隐藏单元学会了在图像的不同位置和方向进行边缘检测。恰恰边缘是图像识别中最突出的问题。




##应用
通过对自编码器的学习后，我们在自己做特征选择时，可以怎样利用这套方法呢？另外，如何使用选择出来的特征呢？





[zihaolucky]:    http://zihaolucky.github.io  "zihaolucky"
[1]:    {{ page.url}}  ({{ page.title }})
[2]:  http://ufldl.stanford.edu/wiki/index.php/UFLDL教程
[3]:  http://ufldl.stanford.edu/wiki/index.php/自编码算法与稀疏性
