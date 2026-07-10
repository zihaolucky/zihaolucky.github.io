---
layout: post
title: 用Python Requests抓取知乎用户信息
description: 人生苦短，我用Python
category: blog
---

## 写在前面

最早接触的爬虫是GitHub上非常有名的开源爬虫框架[Scrapy][2]，到后面接触一个短小的[zhihu-to-renren][3]，再到最近接触[@苏莉安][4]同学的js代码。不过要熟悉爬虫还是建议从自己手写开始。这篇文章将向大家介绍如何用Python抓取知乎用户的**followers-list**

源代码[在这里][5]



### 工具介绍
抓取工作开始之前，我们先看本次需要使用的工具：

* Chrome/Firefox.用来监控网页与后台的通讯情况，以及查找相关参数的位置。
* iPython(Option).这个是要用来一行一行地测试代码；iPython的交互我比较喜欢，所以这次就用这个。不过这个是optional的。

### 思路概述
* 使用[Requests][6]包，建立session()会话对象。并用它实现模拟登录功能。使用session对象的好处是貌似不用去担心cookies，直接用session对象去做post和get就行了。
* 到达目标页面后发送请求，获得服务器返回的内容

### 一起读代码吧!

**模拟登录**
    import requests

    s = requests.session()
    login_data = {'email': '***', 'password': '***', }

    # post 数据实现登录
    s.post('http://www.zhihu.com/login', login_data)
                       
    # 验证是否登陆成功，抓取'知乎'首页看看内容
    r = s.get('http://www.zhihu.com')

具体运行上面的代码：
![login](/images/using-python-to-build-zhihu-crawler/login.jpg)

其中的`<Response [200]>`说明已经成功得到了想要的内容。这里还得跟大家介绍一下其他的一些用法：
1.`r.url`会返回目前所在的url，这个东西可以看到我们指向的地址。我们有时候get一个网址，事实上会转跳到另一个url，此时就可以用这个指令看到当前url；具体地拿我们这个应用举个例子：
![login](/images/using-python-to-build-zhihu-crawler/url.png)
在这个例子里，我们看到如果我们直接指向用户的followers页面，知乎会让我们转跳到登录页面的。也就是说，不登录的情况下是没法拿到我们想要的东西的。

2.`r.cookies`和`r.headers`顾名思义。


**转跳到用户页面.开始抓取**

    # 用户页面地址 http://www.zhihu.com/people/zihaolucky/followers
    r = s.get('http://www.zhihu.com/people/zihaolucky/followers')
    
爬虫模拟/伪装浏览器的原理是什么？爬虫要做到伪装浏览器，需要在发送请求的时候带上`cookies`,`headers`和必要的请求参数`params`；这也是我们下面要重点说的。

那么，我们如何拿到这些信息？因为想要得到followers列表，所以我下一步要实现页面点击“更多”按钮的功能。那么，**当我们点击“更多”按钮，发生了什么呢？**利用Chrome的network功能就可以了。


**headers**

![login](/images/using-python-to-build-zhihu-crawler/network-headers.jpg)

可以看到这是一个POST方法，其中的request以及header，form data都已经很清楚了，我们要做的就是把这些信息带上，然后发送这个请求！

    # 请求的header部分.按照chrome的监控情况填写
    global header_info
    header_info = {
        'User-Agent':'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/30.0.1581.2 Safari/537.36',
        'Host':'www.zhihu.com',
        'Origin':'http://www.zhihu.com',
        'Connection':'keep-alive',
        'Referer':'http://www.zhihu.com/people/zihaolucky/followers',
        'Content-Type':'application/x-www-form-urlencoded',
        }

**form data & params**

至于`form data`和`params`这里就需要注意了，因为这里有`hash_id`和`_xsrf`这些比较麻烦的东西，不过我们仍然有办法！至于怎么拿到这些信息，给个hint：还是用Chrome，然后结合正则表达式就行了。

    # form data.
    data = r.text
    raw_hash_id = re.findall('hash_id(.*)',data)
    hash_id = raw_hash_id[0][14:46]              # hash_id
    raw_xsrf = re.findall('xsrf(.*)',data)
    _xsrf = raw_xsrf[0][9:-3]                    # _xsrf

    offsets = 20
    # 由于返回的是json数据,所以用json处理parameters.
    params = json.dumps({"hash_id":hash_id,"order_by":"created","offset":offsets,})
    payload = {"method":"next", "params": params, "_xsrf":_xsrf,}

这里要谢谢[@Crossin][7]给出的建议，我们应该把`params`写成一个字典，然后`payload`又是一个字典。还要感谢[StackOverFlow][8]上的同学，他们建议我使用json处理：

> You can't pass nested dictionaries to the data parameter. Requests just doesn't know what to do with them.
>
> It's not clear, but it looks like the value of the params key is probably JSON. This means your payload code should look like this:

    params = json.dumps({"hash_id":hash_id,"order_by":"created","offset":20,})
    payload = {"method":"next", "params": params, "_xsrf":_xsrf,}


**小结 & Next Step.**
至此我们便把必要的请求信息都处理好了，剩下的就是发送这个请求。同样地，我们用`s`这个会话对象发送请求：

    click_url = 'http://www.zhihu.com/node/ProfileFollowersListV2'
    r = s.post(click_url,data=payload,headers=header_info)

这样我们的`r`便是收到的信息，这些信息便有我们需要的内容。




### 你可以做得更好
* 伪装IP地址。在抓取不同用户的时候可以随机换用不同的IP地址进行
* 将抓取结果储存到txt或者sqlite数据库中
* 结合Scrapy做更多性能更强的抓取
* [多线程抓取][9]

## 结语：抓知乎上的东西做研究，是在“与虎谋皮”吗？
我知道伸手党确实十分惹人厌，我明白知友辛苦耕耘、分享知识、经验和见解都是对其他知友以及互联网，甚至社会的贡献。知乎的出现，其实是在为社会进步出力。但当我们谈起知乎的时候，我们谈的是什么？

**我们谈的不是知乎本身，而是上面的用户。对吗？**如果你同意这一点，那我抓内容作为研究素材，对知乎来说是在“与虎谋皮”吗？对知乎来说，知乎需要做的不是“保护”和“禁锢”这些知识，而是保护她的用户，保护知乎的良性环境。
况且，我说服我的朋友以知乎作为研究对象，就是赌着“这里很不一样”的出发点来的。


对知乎来说，她存在的意义在用户身上。况且，我相信知乎团队这个有梦想、有担当的团队，不是虎；知乎团队一定了解并清楚地认识到自己的处境和立足点。祝知乎越来越好！大家加油！









[zihaolucky]:    http://zihaolucky.github.io  "zihaolucky"
[1]:    {{ page.url}}  ({{ page.title }})
[2]: https://github.com/scrapy/scrapy
[3]: https://github.com/bojanliu/zhihu-to-renren
[4]: http://www.zhihu.com/people/aton
[5]: https://github.com/zihaolucky/Undergraduate-Innovation-Program/blob/master/crawler_zhihu/Python/user_list.py
[6]: http://docs.python-requests.org/en/latest/
[7]: http://www.zhihu.com/people/crossin
[8]: http://stackoverflow.com/questions/21518669/how-to-request-the-load-more-function-with-python
[9]: http://zihaolucky.github.io/mutilthread-crawler/