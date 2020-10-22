import Element from './Element'

export function createElement(type, props, children) {
    return new Element(type, props, children)
}

export function setAttrs(node, prop, value) {
    switch (prop) {
        case 'style':
            node.style.cssText = value
            break
        default:
            node.setAttribute(prop, value)
    }
}

export function render(vDom) {
    const { type, props, children } = vDom
    const el = document.createElement(vDom.type)
    for (let key in props) {
        //设置元素属性
        setAttrs(el, key, props[key])
    }
    children.map(c => {
        c = c instanceof Element ? render(c) : document.createTextNode(c)
        el.appendChild(c)
    })
    return el
}

export function renderDom(el, rootEl) {
    rootEl.appendChild(el)
}