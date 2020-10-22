import {
    ATTR,
    TEXT,
    REMOVE,
    REPLACE
} from './patchTypes'

let patches = {

}
let vnIndex = 0

export default function domDiff(oldVDom, newVDom) {
    let index = 0
    vnodeWalk(oldVDom, newVDom, index)
    return patches
}

function vnodeWalk(oldNode, newNode, index) {
    let vnPatch = []
    if (!newNode) {
        vnPatch.push({
            type: REMOVE,
            index
        })
    } else if (typeof oldNode === 'string' && typeof newNode === 'string') {
        if (oldNode !== newNode) {
            vnPatch.push({
                type: TEXT,
                text: newNode
            })
        }
    }
    else if (oldNode.type === newNode.type) {
        const attrPatch = attrsWalk(oldNode.props, newNode.props)

        if (Object.keys(attrPatch).length > 0) {
            vnPatch.push({
                type: ATTR,
                attrs: attrPatch
            })
        }
        ChildrenWalk(oldNode.children, newNode.children)
    } else {
        vnPatch.push({
            type: REPLACE,
            newNode
        })
    }
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
        vnodeWalk(c, newChildren[idx], ++vnIndex)
    })
}