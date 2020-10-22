## 手写Vue源码，DOM diff过程

### 前言

我们都知道Vue是通过js的对象去模拟页面真实的DOM元素，之前在准备面试的过程中也了解过这方面的内容，但是还没有真正得去模拟实现这个过程，如果对这方面的原理有兴趣可以去看看我之前写的总结文章 [都2020年了，不会还有人不知道虚拟DOM吧，不会吧不会吧](http://www.kweku.top/2020/07/14/09.vue-vnode/)，这篇文章主要介绍的是如何从零手写DOM diff的过程。演示的demo是通过webpack进行项目搭建的。[源码地址](https://github.com/Gouwenkang/DOM-diff)

### 创建虚拟DOM

我们首先需要知道，虚拟DOM长什么样子，就像下面：

![image-20201022202052275](https://github.com/Gouwenkang/DOM-diff/tree/master/img/image-20201022202052275.png)

我们来看看源码：

```js
const vDom1 = createElement('ul', {
    class: 'list',
    style: 'width: 300px; height: 300px; background-color: orange'
}, [
    createElement('li', {
        class: 'item',
        'data-index': 0
    }, [
        createElement('p', {
            class: 'text'
        }, [
            '第1个列表项'
        ])
    ]),
    createElement('li', {
        class: 'item',
        'data-index': 1
    }, [
        createElement('p', {
            class: 'text'
        }, [
            createElement('span', {
                class: 'title'
            }, [])
        ])
    ]),
    createElement('li', {
        class: 'item',
        'data-index': 2
    }, [
        '第3个列表项'
    ])
]);
```

从上面我们可以看到，我们通过一个构造函数 `createElement` 将虚拟DOM构造出来，其实这个实现很简单便可做到，我们新建一个文件 `Element.js` 创建一个类 `element` ，内容如下：

```js
export default class Element {
    constructor(type, props, children) {
        this.type = type
        this.props = props
        this.children = children
    }
}
```

是不是很简单，这样一个简单的虚拟DOM就完成了，接着，我们需要将这些虚拟DOM转换成页面正式的节点。

### 转换虚拟DOM为真实的结点并展示在页面

首先我们需要将虚拟DOM转化为真实的结点，代码如下：

```js
function render(vDom) {
    //获取虚拟DOM
    const { type, props, children } = vDom
    //通过createElement创建node
    const el = document.createElement(vDom.type)
    for (let key in props) {
        //通过自定义方法setAttrs设置元素属性
        setAttrs(el, key, props[key])
    }
    //遍历children，判断当前node是否为虚拟DOM，是的话继续上面的流程，不是的话创建文本结点
    children.map(c => {
        c = c instanceof Element ? render(c) : document.createTextNode(c)
        el.appendChild(c)
    })
    return el
}

function setAttrs(node, prop, value) {
    //判断prop的类型，采用不同的方式去添加属性
    switch (prop) {
        case 'style':
            node.style.cssText = value
            break
        default:
            node.setAttribute(prop, value)
    }
}
```

最后我们得到了下面这样子的真实DOM

![image-20201022203536014](https://github.com/Gouwenkang/DOM-diff/tree/master/img/image-20201022203536014.png)

然后我们便可以通过 `document.appendChild`的方法将它显示在页面上。

### 比较两棵虚拟DOM-Diff算法

在比较差异的时候，我们采用深度优先遍历的算法，为了保证完全比较，我们需要两个index去约束，代码如下：

```js
function domDiff(oldVDom, newVDom) {
    let index = 0
    //遍历虚拟结点
    vnodeWalk(oldVDom, newVDom, index)
    //全局定义的差异
    return patches
}

function vnodeWalk(oldNode, newNode, index) {
    //当前结点的差异
    let vnPatch = []
    //如果结点不存在了，说明被删除了
    if (!newNode) {
        vnPatch.push({
            type: REMOVE,
            index
        })
     // 如果值不一样了说明文本被修改了
    } else if (typeof oldNode === 'string' && typeof newNode === 'string') {
        if (oldNode !== newNode) {
            vnPatch.push({
                type: TEXT,
                text: newNode
            })
        }
    }
    //如果属性不一样，说明属性被修改了
    else if (oldNode.type === newNode.type) {
        //通过自定义的attrsWalk方法找到属性的差异attrPatch
        const attrPatch = attrsWalk(oldNode.props, newNode.props)
		//如果attrPatch长度大于1 说明属性被修改了
        if (Object.keys(attrPatch).length > 0) {
            vnPatch.push({
                type: ATTR,
                attrs: attrPatch
            })
        }
        // 继续通过自定义的childrenWalk去比较子结点的差异
        ChildrenWalk(oldNode.children, newNode.children)
        //其他的话就是替换了
    } else {
        vnPatch.push({
            type: REPLACE,
            newNode
        })
    }
    //最后，我们需要判断当前是否发生了变化，如果发生了将他保存在全局的patches中
    if (vnPatch.length > 0) {
        patches[index] = vnPatch
    }
}

function attrsWalk(oldAttrs, newAttrs) {
    let attrPatch = {}
    //修改
    for (let key in oldAttrs) {
        if (oldAttrs[key] !== newAttrs[key]) {
            attrPatch[key] = newAttrs[key]
        }
    }
    //新增
    for (let key in newAttrs) {
        if (!oldAttrs.hasOwnProperty(key)) {
            attrPatch[key] = newAttrs[key]
        }
    }
    return attrPatch
}


function ChildrenWalk(oldChildren, newChildren) {
    oldChildren.map((c, idx) => {
        //递归调用vnodeWalk，注意这个index
        vnodeWalk(c, newChildren[idx], ++vnIndex)
    })
}
```

然后我们比较下面两个虚拟DOM树：

```js

const vDom1 = createElement('ul', {
    class: 'list',
    style: 'width: 300px; height: 300px; background-color: orange'
}, [
    createElement('li', {
        class: 'item',
        'data-index': 0
    }, [
        createElement('p', {
            class: 'text'
        }, [
            '第1个列表项'
        ])
    ]),
    createElement('li', {
        class: 'item',
        'data-index': 1
    }, [
        createElement('p', {
            class: 'text'
        }, [
            createElement('span', {
                class: 'title'
            }, [])
        ])
    ]),
    createElement('li', {
        class: 'item',
        'data-index': 2
    }, [
        '第3个列表项'
    ])
]);


const vDom2 = createElement('ul', {
    class: 'list-wrap',
    style: 'width: 300px; height: 300px; background-color: orange'
}, [
    createElement('li', {
        class: 'item',
        'data-index': 0
    }, [
        createElement('p', {
            class: 'title'
        }, [
            '特殊列表项'
        ])
    ]),
    createElement('li', {
        class: 'item',
        'data-index': 1
    }, [
        createElement('p', {
            class: 'text'
        }, [])
    ]),
    createElement('div', {
        class: 'item',
        'data-index': 2
    }, [
        '第3个列表项'
    ])
]);
```

会发现patch后的差异如下所示

![image-20201022204729461](https://github.com/Gouwenkang/DOM-diff/tree/master/img/image-20201022204729461.png)

### 打补丁

我们通过上面的步骤得到了两个树的差异，那么我们该如何将这个差异作用在真实的DOM上呢？我们打开 `dopatch` 文件，可以看到有这么一个方法：

```js
function doPatch(rDom, patches) {
    finalPatches = patches;
    //传入真实结点
    rNodeWalk(rDom);
}
```

我们通过在全局范围内定义一个变量 `finalPatches`去接收`patches`，可以看到，在这儿使用了一个rNodeWalk（`小知识：在写底层代码的时候我们如果需要遍历或者递归某个值时，可以加上Walk后缀`），来看看rNodeWalk里面写的什么

```js
function rNodeWalk(rNode) {
    //当前差异
    const rnPatch = finalPatches[rnIndex++]
    //获取子节点
    const childNodes = [...rNode.childNodes];
	//递归调用
    childNodes.map((c) => {
        rNodeWalk(c);
    });
    //判断当前是否存在差异，如果存在在真实节点上修改
    if (rnPatch) {
        patchAction(rNode, rnPatch);
    }
}
function patchAction(rNode, rnPatch) {
    rnPatch.map(p => {
        switch (p.type) {
            case ATTR:
                for (let key in p.attrs) {
                    const value = p.attrs[key]
                    if (value) {
                        setAttrs(rNode, key, value)
                    } else {
                        rNode.removeAttribute(key)
                    }
                }
                break;
            case TEXT:
                rNode.textContent = p.text
                break;
            case REPLACE:
                const newNode = (p.newNode instanceof Element) ?
                    render(p.newNode) :
                    document.createTextNode(p.newNode)
                rNode.parentNode.replaceChild(newNode, rNode)
                break;
            case REMOVE:
                rNode.parentNode.removeChild(rNode)
                break;
            default:
                break
        }
    })
}
```

### 总结

本篇文章写得比较简单，其实真实的diff过程还存在很多复杂的过程，但是本文的重点是为了让你了解基本的DOM diff的流程，如果你对这些还比较感兴趣，可以在网上查一查。
