(function () {
    'use strict';

    function vnode(sel, data, children, text, elm) {
        const key = data === undefined ? undefined : data.key;
        return { sel, data, children, text, elm, key };
    }

    const array = Array.isArray;
    function primitive(s) {
        return typeof s === "string" || typeof s === "number";
    }

    function createElement(tagName, options) {
        return document.createElement(tagName, options);
    }
    function createElementNS(namespaceURI, qualifiedName, options) {
        return document.createElementNS(namespaceURI, qualifiedName, options);
    }
    function createTextNode(text) {
        return document.createTextNode(text);
    }
    function createComment(text) {
        return document.createComment(text);
    }
    function insertBefore(parentNode, newNode, referenceNode) {
        parentNode.insertBefore(newNode, referenceNode);
    }
    function removeChild(node, child) {
        node.removeChild(child);
    }
    function appendChild(node, child) {
        node.appendChild(child);
    }
    function parentNode(node) {
        return node.parentNode;
    }
    function nextSibling(node) {
        return node.nextSibling;
    }
    function tagName(elm) {
        return elm.tagName;
    }
    function setTextContent(node, text) {
        node.textContent = text;
    }
    function getTextContent(node) {
        return node.textContent;
    }
    function isElement(node) {
        return node.nodeType === 1;
    }
    function isText(node) {
        return node.nodeType === 3;
    }
    function isComment(node) {
        return node.nodeType === 8;
    }
    const htmlDomApi = {
        createElement,
        createElementNS,
        createTextNode,
        createComment,
        insertBefore,
        removeChild,
        appendChild,
        parentNode,
        nextSibling,
        tagName,
        setTextContent,
        getTextContent,
        isElement,
        isText,
        isComment,
    };

    function isUndef(s) {
        return s === undefined;
    }
    function isDef(s) {
        return s !== undefined;
    }
    const emptyNode = vnode("", {}, [], undefined, undefined);
    function sameVnode(vnode1, vnode2) {
        var _a, _b;
        const isSameKey = vnode1.key === vnode2.key;
        const isSameIs = ((_a = vnode1.data) === null || _a === void 0 ? void 0 : _a.is) === ((_b = vnode2.data) === null || _b === void 0 ? void 0 : _b.is);
        const isSameSel = vnode1.sel === vnode2.sel;
        return isSameSel && isSameKey && isSameIs;
    }
    function isVnode(vnode) {
        return vnode.sel !== undefined;
    }
    function createKeyToOldIdx(children, beginIdx, endIdx) {
        var _a;
        const map = {};
        for (let i = beginIdx; i <= endIdx; ++i) {
            const key = (_a = children[i]) === null || _a === void 0 ? void 0 : _a.key;
            if (key !== undefined) {
                map[key] = i;
            }
        }
        return map;
    }
    const hooks = [
        "create",
        "update",
        "remove",
        "destroy",
        "pre",
        "post",
    ];
    function init(modules, domApi) {
        let i;
        let j;
        const cbs = {
            create: [],
            update: [],
            remove: [],
            destroy: [],
            pre: [],
            post: [],
        };
        const api = domApi !== undefined ? domApi : htmlDomApi;
        for (i = 0; i < hooks.length; ++i) {
            cbs[hooks[i]] = [];
            for (j = 0; j < modules.length; ++j) {
                const hook = modules[j][hooks[i]];
                if (hook !== undefined) {
                    cbs[hooks[i]].push(hook);
                }
            }
        }
        function emptyNodeAt(elm) {
            const id = elm.id ? "#" + elm.id : "";
            // elm.className doesn't return a string when elm is an SVG element inside a shadowRoot.
            // https://stackoverflow.com/questions/29454340/detecting-classname-of-svganimatedstring
            const classes = elm.getAttribute("class");
            const c = classes ? "." + classes.split(" ").join(".") : "";
            return vnode(api.tagName(elm).toLowerCase() + id + c, {}, [], undefined, elm);
        }
        function createRmCb(childElm, listeners) {
            return function rmCb() {
                if (--listeners === 0) {
                    const parent = api.parentNode(childElm);
                    api.removeChild(parent, childElm);
                }
            };
        }
        function createElm(vnode, insertedVnodeQueue) {
            var _a, _b;
            let i;
            let data = vnode.data;
            if (data !== undefined) {
                const init = (_a = data.hook) === null || _a === void 0 ? void 0 : _a.init;
                if (isDef(init)) {
                    init(vnode);
                    data = vnode.data;
                }
            }
            const children = vnode.children;
            const sel = vnode.sel;
            if (sel === "!") {
                if (isUndef(vnode.text)) {
                    vnode.text = "";
                }
                vnode.elm = api.createComment(vnode.text);
            }
            else if (sel !== undefined) {
                // Parse selector
                const hashIdx = sel.indexOf("#");
                const dotIdx = sel.indexOf(".", hashIdx);
                const hash = hashIdx > 0 ? hashIdx : sel.length;
                const dot = dotIdx > 0 ? dotIdx : sel.length;
                const tag = hashIdx !== -1 || dotIdx !== -1
                    ? sel.slice(0, Math.min(hash, dot))
                    : sel;
                const elm = (vnode.elm =
                    isDef(data) && isDef((i = data.ns))
                        ? api.createElementNS(i, tag, data)
                        : api.createElement(tag, data));
                if (hash < dot)
                    elm.setAttribute("id", sel.slice(hash + 1, dot));
                if (dotIdx > 0)
                    elm.setAttribute("class", sel.slice(dot + 1).replace(/\./g, " "));
                for (i = 0; i < cbs.create.length; ++i)
                    cbs.create[i](emptyNode, vnode);
                if (array(children)) {
                    for (i = 0; i < children.length; ++i) {
                        const ch = children[i];
                        if (ch != null) {
                            api.appendChild(elm, createElm(ch, insertedVnodeQueue));
                        }
                    }
                }
                else if (primitive(vnode.text)) {
                    api.appendChild(elm, api.createTextNode(vnode.text));
                }
                const hook = vnode.data.hook;
                if (isDef(hook)) {
                    (_b = hook.create) === null || _b === void 0 ? void 0 : _b.call(hook, emptyNode, vnode);
                    if (hook.insert) {
                        insertedVnodeQueue.push(vnode);
                    }
                }
            }
            else {
                vnode.elm = api.createTextNode(vnode.text);
            }
            return vnode.elm;
        }
        function addVnodes(parentElm, before, vnodes, startIdx, endIdx, insertedVnodeQueue) {
            for (; startIdx <= endIdx; ++startIdx) {
                const ch = vnodes[startIdx];
                if (ch != null) {
                    api.insertBefore(parentElm, createElm(ch, insertedVnodeQueue), before);
                }
            }
        }
        function invokeDestroyHook(vnode) {
            var _a, _b;
            const data = vnode.data;
            if (data !== undefined) {
                (_b = (_a = data === null || data === void 0 ? void 0 : data.hook) === null || _a === void 0 ? void 0 : _a.destroy) === null || _b === void 0 ? void 0 : _b.call(_a, vnode);
                for (let i = 0; i < cbs.destroy.length; ++i)
                    cbs.destroy[i](vnode);
                if (vnode.children !== undefined) {
                    for (let j = 0; j < vnode.children.length; ++j) {
                        const child = vnode.children[j];
                        if (child != null && typeof child !== "string") {
                            invokeDestroyHook(child);
                        }
                    }
                }
            }
        }
        function removeVnodes(parentElm, vnodes, startIdx, endIdx) {
            var _a, _b;
            for (; startIdx <= endIdx; ++startIdx) {
                let listeners;
                let rm;
                const ch = vnodes[startIdx];
                if (ch != null) {
                    if (isDef(ch.sel)) {
                        invokeDestroyHook(ch);
                        listeners = cbs.remove.length + 1;
                        rm = createRmCb(ch.elm, listeners);
                        for (let i = 0; i < cbs.remove.length; ++i)
                            cbs.remove[i](ch, rm);
                        const removeHook = (_b = (_a = ch === null || ch === void 0 ? void 0 : ch.data) === null || _a === void 0 ? void 0 : _a.hook) === null || _b === void 0 ? void 0 : _b.remove;
                        if (isDef(removeHook)) {
                            removeHook(ch, rm);
                        }
                        else {
                            rm();
                        }
                    }
                    else {
                        // Text node
                        api.removeChild(parentElm, ch.elm);
                    }
                }
            }
        }
        function updateChildren(parentElm, oldCh, newCh, insertedVnodeQueue) {
            let oldStartIdx = 0;
            let newStartIdx = 0;
            let oldEndIdx = oldCh.length - 1;
            let oldStartVnode = oldCh[0];
            let oldEndVnode = oldCh[oldEndIdx];
            let newEndIdx = newCh.length - 1;
            let newStartVnode = newCh[0];
            let newEndVnode = newCh[newEndIdx];
            let oldKeyToIdx;
            let idxInOld;
            let elmToMove;
            let before;
            while (oldStartIdx <= oldEndIdx && newStartIdx <= newEndIdx) {
                if (oldStartVnode == null) {
                    oldStartVnode = oldCh[++oldStartIdx]; // Vnode might have been moved left
                }
                else if (oldEndVnode == null) {
                    oldEndVnode = oldCh[--oldEndIdx];
                }
                else if (newStartVnode == null) {
                    newStartVnode = newCh[++newStartIdx];
                }
                else if (newEndVnode == null) {
                    newEndVnode = newCh[--newEndIdx];
                }
                else if (sameVnode(oldStartVnode, newStartVnode)) {
                    patchVnode(oldStartVnode, newStartVnode, insertedVnodeQueue);
                    oldStartVnode = oldCh[++oldStartIdx];
                    newStartVnode = newCh[++newStartIdx];
                }
                else if (sameVnode(oldEndVnode, newEndVnode)) {
                    patchVnode(oldEndVnode, newEndVnode, insertedVnodeQueue);
                    oldEndVnode = oldCh[--oldEndIdx];
                    newEndVnode = newCh[--newEndIdx];
                }
                else if (sameVnode(oldStartVnode, newEndVnode)) {
                    // Vnode moved right
                    patchVnode(oldStartVnode, newEndVnode, insertedVnodeQueue);
                    api.insertBefore(parentElm, oldStartVnode.elm, api.nextSibling(oldEndVnode.elm));
                    oldStartVnode = oldCh[++oldStartIdx];
                    newEndVnode = newCh[--newEndIdx];
                }
                else if (sameVnode(oldEndVnode, newStartVnode)) {
                    // Vnode moved left
                    patchVnode(oldEndVnode, newStartVnode, insertedVnodeQueue);
                    api.insertBefore(parentElm, oldEndVnode.elm, oldStartVnode.elm);
                    oldEndVnode = oldCh[--oldEndIdx];
                    newStartVnode = newCh[++newStartIdx];
                }
                else {
                    if (oldKeyToIdx === undefined) {
                        oldKeyToIdx = createKeyToOldIdx(oldCh, oldStartIdx, oldEndIdx);
                    }
                    idxInOld = oldKeyToIdx[newStartVnode.key];
                    if (isUndef(idxInOld)) {
                        // New element
                        api.insertBefore(parentElm, createElm(newStartVnode, insertedVnodeQueue), oldStartVnode.elm);
                    }
                    else {
                        elmToMove = oldCh[idxInOld];
                        if (elmToMove.sel !== newStartVnode.sel) {
                            api.insertBefore(parentElm, createElm(newStartVnode, insertedVnodeQueue), oldStartVnode.elm);
                        }
                        else {
                            patchVnode(elmToMove, newStartVnode, insertedVnodeQueue);
                            oldCh[idxInOld] = undefined;
                            api.insertBefore(parentElm, elmToMove.elm, oldStartVnode.elm);
                        }
                    }
                    newStartVnode = newCh[++newStartIdx];
                }
            }
            if (oldStartIdx <= oldEndIdx || newStartIdx <= newEndIdx) {
                if (oldStartIdx > oldEndIdx) {
                    before = newCh[newEndIdx + 1] == null ? null : newCh[newEndIdx + 1].elm;
                    addVnodes(parentElm, before, newCh, newStartIdx, newEndIdx, insertedVnodeQueue);
                }
                else {
                    removeVnodes(parentElm, oldCh, oldStartIdx, oldEndIdx);
                }
            }
        }
        function patchVnode(oldVnode, vnode, insertedVnodeQueue) {
            var _a, _b, _c, _d, _e;
            const hook = (_a = vnode.data) === null || _a === void 0 ? void 0 : _a.hook;
            (_b = hook === null || hook === void 0 ? void 0 : hook.prepatch) === null || _b === void 0 ? void 0 : _b.call(hook, oldVnode, vnode);
            const elm = (vnode.elm = oldVnode.elm);
            const oldCh = oldVnode.children;
            const ch = vnode.children;
            if (oldVnode === vnode)
                return;
            if (vnode.data !== undefined) {
                for (let i = 0; i < cbs.update.length; ++i)
                    cbs.update[i](oldVnode, vnode);
                (_d = (_c = vnode.data.hook) === null || _c === void 0 ? void 0 : _c.update) === null || _d === void 0 ? void 0 : _d.call(_c, oldVnode, vnode);
            }
            if (isUndef(vnode.text)) {
                if (isDef(oldCh) && isDef(ch)) {
                    if (oldCh !== ch)
                        updateChildren(elm, oldCh, ch, insertedVnodeQueue);
                }
                else if (isDef(ch)) {
                    if (isDef(oldVnode.text))
                        api.setTextContent(elm, "");
                    addVnodes(elm, null, ch, 0, ch.length - 1, insertedVnodeQueue);
                }
                else if (isDef(oldCh)) {
                    removeVnodes(elm, oldCh, 0, oldCh.length - 1);
                }
                else if (isDef(oldVnode.text)) {
                    api.setTextContent(elm, "");
                }
            }
            else if (oldVnode.text !== vnode.text) {
                if (isDef(oldCh)) {
                    removeVnodes(elm, oldCh, 0, oldCh.length - 1);
                }
                api.setTextContent(elm, vnode.text);
            }
            (_e = hook === null || hook === void 0 ? void 0 : hook.postpatch) === null || _e === void 0 ? void 0 : _e.call(hook, oldVnode, vnode);
        }
        return function patch(oldVnode, vnode) {
            let i, elm, parent;
            const insertedVnodeQueue = [];
            for (i = 0; i < cbs.pre.length; ++i)
                cbs.pre[i]();
            if (!isVnode(oldVnode)) {
                oldVnode = emptyNodeAt(oldVnode);
            }
            if (sameVnode(oldVnode, vnode)) {
                patchVnode(oldVnode, vnode, insertedVnodeQueue);
            }
            else {
                elm = oldVnode.elm;
                parent = api.parentNode(elm);
                createElm(vnode, insertedVnodeQueue);
                if (parent !== null) {
                    api.insertBefore(parent, vnode.elm, api.nextSibling(elm));
                    removeVnodes(parent, [oldVnode], 0, 0);
                }
            }
            for (i = 0; i < insertedVnodeQueue.length; ++i) {
                insertedVnodeQueue[i].data.hook.insert(insertedVnodeQueue[i]);
            }
            for (i = 0; i < cbs.post.length; ++i)
                cbs.post[i]();
            return vnode;
        };
    }

    function updateClass(oldVnode, vnode) {
        let cur;
        let name;
        const elm = vnode.elm;
        let oldClass = oldVnode.data.class;
        let klass = vnode.data.class;
        if (!oldClass && !klass)
            return;
        if (oldClass === klass)
            return;
        oldClass = oldClass || {};
        klass = klass || {};
        for (name in oldClass) {
            if (oldClass[name] && !Object.prototype.hasOwnProperty.call(klass, name)) {
                // was `true` and now not provided
                elm.classList.remove(name);
            }
        }
        for (name in klass) {
            cur = klass[name];
            if (cur !== oldClass[name]) {
                elm.classList[cur ? "add" : "remove"](name);
            }
        }
    }
    const classModule = { create: updateClass, update: updateClass };

    function updateProps(oldVnode, vnode) {
        let key;
        let cur;
        let old;
        const elm = vnode.elm;
        let oldProps = oldVnode.data.props;
        let props = vnode.data.props;
        if (!oldProps && !props)
            return;
        if (oldProps === props)
            return;
        oldProps = oldProps || {};
        props = props || {};
        for (key in props) {
            cur = props[key];
            old = oldProps[key];
            if (old !== cur && (key !== "value" || elm[key] !== cur)) {
                elm[key] = cur;
            }
        }
    }
    const propsModule = { create: updateProps, update: updateProps };

    // Bindig `requestAnimationFrame` like this fixes a bug in IE/Edge. See #360 and #409.
    const raf = (typeof window !== "undefined" &&
        window.requestAnimationFrame.bind(window)) ||
        setTimeout;
    const nextFrame = function (fn) {
        raf(function () {
            raf(fn);
        });
    };
    let reflowForced = false;
    function setNextFrame(obj, prop, val) {
        nextFrame(function () {
            obj[prop] = val;
        });
    }
    function updateStyle(oldVnode, vnode) {
        let cur;
        let name;
        const elm = vnode.elm;
        let oldStyle = oldVnode.data.style;
        let style = vnode.data.style;
        if (!oldStyle && !style)
            return;
        if (oldStyle === style)
            return;
        oldStyle = oldStyle || {};
        style = style || {};
        const oldHasDel = "delayed" in oldStyle;
        for (name in oldStyle) {
            if (!style[name]) {
                if (name[0] === "-" && name[1] === "-") {
                    elm.style.removeProperty(name);
                }
                else {
                    elm.style[name] = "";
                }
            }
        }
        for (name in style) {
            cur = style[name];
            if (name === "delayed" && style.delayed) {
                for (const name2 in style.delayed) {
                    cur = style.delayed[name2];
                    if (!oldHasDel || cur !== oldStyle.delayed[name2]) {
                        setNextFrame(elm.style, name2, cur);
                    }
                }
            }
            else if (name !== "remove" && cur !== oldStyle[name]) {
                if (name[0] === "-" && name[1] === "-") {
                    elm.style.setProperty(name, cur);
                }
                else {
                    elm.style[name] = cur;
                }
            }
        }
    }
    function applyDestroyStyle(vnode) {
        let style;
        let name;
        const elm = vnode.elm;
        const s = vnode.data.style;
        if (!s || !(style = s.destroy))
            return;
        for (name in style) {
            elm.style[name] = style[name];
        }
    }
    function applyRemoveStyle(vnode, rm) {
        const s = vnode.data.style;
        if (!s || !s.remove) {
            rm();
            return;
        }
        if (!reflowForced) {
            // eslint-disable-next-line @typescript-eslint/no-unused-expressions
            vnode.elm.offsetLeft;
            reflowForced = true;
        }
        let name;
        const elm = vnode.elm;
        let i = 0;
        const style = s.remove;
        let amount = 0;
        const applied = [];
        for (name in style) {
            applied.push(name);
            elm.style[name] = style[name];
        }
        const compStyle = getComputedStyle(elm);
        const props = compStyle["transition-property"].split(", ");
        for (; i < props.length; ++i) {
            if (applied.indexOf(props[i]) !== -1)
                amount++;
        }
        elm.addEventListener("transitionend", function (ev) {
            if (ev.target === elm)
                --amount;
            if (amount === 0)
                rm();
        });
    }
    function forceReflow() {
        reflowForced = false;
    }
    const styleModule = {
        pre: forceReflow,
        create: updateStyle,
        update: updateStyle,
        destroy: applyDestroyStyle,
        remove: applyRemoveStyle,
    };

    function invokeHandler(handler, vnode, event) {
        if (typeof handler === "function") {
            // call function handler
            handler.call(vnode, event, vnode);
        }
        else if (typeof handler === "object") {
            // call multiple handlers
            for (let i = 0; i < handler.length; i++) {
                invokeHandler(handler[i], vnode, event);
            }
        }
    }
    function handleEvent(event, vnode) {
        const name = event.type;
        const on = vnode.data.on;
        // call event handler(s) if exists
        if (on && on[name]) {
            invokeHandler(on[name], vnode, event);
        }
    }
    function createListener() {
        return function handler(event) {
            handleEvent(event, handler.vnode);
        };
    }
    function updateEventListeners(oldVnode, vnode) {
        const oldOn = oldVnode.data.on;
        const oldListener = oldVnode.listener;
        const oldElm = oldVnode.elm;
        const on = vnode && vnode.data.on;
        const elm = (vnode && vnode.elm);
        let name;
        // optimization for reused immutable handlers
        if (oldOn === on) {
            return;
        }
        // remove existing listeners which no longer used
        if (oldOn && oldListener) {
            // if element changed or deleted we remove all existing listeners unconditionally
            if (!on) {
                for (name in oldOn) {
                    // remove listener if element was changed or existing listeners removed
                    oldElm.removeEventListener(name, oldListener, false);
                }
            }
            else {
                for (name in oldOn) {
                    // remove listener if existing listener removed
                    if (!on[name]) {
                        oldElm.removeEventListener(name, oldListener, false);
                    }
                }
            }
        }
        // add new listeners which has not already attached
        if (on) {
            // reuse existing listener or create new
            const listener = (vnode.listener =
                oldVnode.listener || createListener());
            // update vnode for listener
            listener.vnode = vnode;
            // if element changed or added we add all needed listeners unconditionally
            if (!oldOn) {
                for (name in on) {
                    // add listener if element was changed or new listeners added
                    elm.addEventListener(name, listener, false);
                }
            }
            else {
                for (name in on) {
                    // add listener if new listener added
                    if (!oldOn[name]) {
                        elm.addEventListener(name, listener, false);
                    }
                }
            }
        }
    }
    const eventListenersModule = {
        create: updateEventListeners,
        update: updateEventListeners,
        destroy: updateEventListeners,
    };

    function addNS(data, children, sel) {
        data.ns = "http://www.w3.org/2000/svg";
        if (sel !== "foreignObject" && children !== undefined) {
            for (let i = 0; i < children.length; ++i) {
                const childData = children[i].data;
                if (childData !== undefined) {
                    addNS(childData, children[i].children, children[i].sel);
                }
            }
        }
    }
    function h(sel, b, c) {
        let data = {};
        let children;
        let text;
        let i;
        if (c !== undefined) {
            if (b !== null) {
                data = b;
            }
            if (array(c)) {
                children = c;
            }
            else if (primitive(c)) {
                text = c;
            }
            else if (c && c.sel) {
                children = [c];
            }
        }
        else if (b !== undefined && b !== null) {
            if (array(b)) {
                children = b;
            }
            else if (primitive(b)) {
                text = b;
            }
            else if (b && b.sel) {
                children = [b];
            }
            else {
                data = b;
            }
        }
        if (children !== undefined) {
            for (i = 0; i < children.length; ++i) {
                if (primitive(children[i]))
                    children[i] = vnode(undefined, undefined, undefined, children[i], undefined);
            }
        }
        if (sel[0] === "s" &&
            sel[1] === "v" &&
            sel[2] === "g" &&
            (sel.length === 3 || sel[3] === "." || sel[3] === "#")) {
            addNS(data, children, sel);
        }
        return vnode(sel, data, children, text, undefined);
    }

    const CAPS_REGEX = /[A-Z]/g;
    function updateDataset(oldVnode, vnode) {
        const elm = vnode.elm;
        let oldDataset = oldVnode.data.dataset;
        let dataset = vnode.data.dataset;
        let key;
        if (!oldDataset && !dataset)
            return;
        if (oldDataset === dataset)
            return;
        oldDataset = oldDataset || {};
        dataset = dataset || {};
        const d = elm.dataset;
        for (key in oldDataset) {
            if (!dataset[key]) {
                if (d) {
                    if (key in d) {
                        delete d[key];
                    }
                }
                else {
                    elm.removeAttribute("data-" + key.replace(CAPS_REGEX, "-$&").toLowerCase());
                }
            }
        }
        for (key in dataset) {
            if (oldDataset[key] !== dataset[key]) {
                if (d) {
                    d[key] = dataset[key];
                }
                else {
                    elm.setAttribute("data-" + key.replace(CAPS_REGEX, "-$&").toLowerCase(), dataset[key]);
                }
            }
        }
    }
    const datasetModule = {
        create: updateDataset,
        update: updateDataset,
    };

    const xlinkNS = "http://www.w3.org/1999/xlink";
    const xmlNS = "http://www.w3.org/XML/1998/namespace";
    const colonChar = 58;
    const xChar = 120;
    function updateAttrs(oldVnode, vnode) {
        let key;
        const elm = vnode.elm;
        let oldAttrs = oldVnode.data.attrs;
        let attrs = vnode.data.attrs;
        if (!oldAttrs && !attrs)
            return;
        if (oldAttrs === attrs)
            return;
        oldAttrs = oldAttrs || {};
        attrs = attrs || {};
        // update modified attributes, add new attributes
        for (key in attrs) {
            const cur = attrs[key];
            const old = oldAttrs[key];
            if (old !== cur) {
                if (cur === true) {
                    elm.setAttribute(key, "");
                }
                else if (cur === false) {
                    elm.removeAttribute(key);
                }
                else {
                    if (key.charCodeAt(0) !== xChar) {
                        elm.setAttribute(key, cur);
                    }
                    else if (key.charCodeAt(3) === colonChar) {
                        // Assume xml namespace
                        elm.setAttributeNS(xmlNS, key, cur);
                    }
                    else if (key.charCodeAt(5) === colonChar) {
                        // Assume xlink namespace
                        elm.setAttributeNS(xlinkNS, key, cur);
                    }
                    else {
                        elm.setAttribute(key, cur);
                    }
                }
            }
        }
        // remove removed attributes
        // use `in` operator since the previous `for` iteration uses it (.i.e. add even attributes with undefined value)
        // the other option is to remove all attributes with value == undefined
        for (key in oldAttrs) {
            if (!(key in attrs)) {
                elm.removeAttribute(key);
            }
        }
    }
    const attributesModule = {
        create: updateAttrs,
        update: updateAttrs,
    };

    var patch = init([// Init patch function with chosen modules
    classModule, // makes it easy to toggle classes
    propsModule, // for setting properties on DOM elements
    styleModule, // handles styling on elements with support for animations
    eventListenersModule, // attaches event listeners
    datasetModule, attributesModule]);
    var Node = h('div#wrap', [h('div.left', [h('img', {
      props: {
        src: '../—Pngtree—vector users icon_4144740.png'
      }
    }), h('div.score', [h('p', '800')])]), h('div.middle', [h('div.popup', {
      style: {
        transform: 'translateY(-2em)'
      }
    }, [h('div', 'Your answer is correct!'), h('img', {
      props: {
        src: '../resource/greentick.png'
      }
    })]), h('p', '10/15'), h('p', '15')]), h('div.right', [h('img', {
      props: {
        src: '../—Pngtree—vector users icon_4144740.png'
      }
    }), h('div.score', [h('p', '800')])])]);
    var wrp = document.getElementById('wrap');
    patch(wrp, Node);
    var VNode;
    var score = 0;
    var gameIndex = 0; //cau hien tai dang choi

    var middle = document.getElementsByClassName('middle');
    var element = {
      scoreElm: document.getElementsByClassName('left')[0].getElementsByClassName('score')[0].getElementsByTagName('p')[0],
      questionNUmb: middle[0].getElementsByTagName('p')[0],
      quizz: document.getElementById('quizz')
    };
    var timmer = {
      timmerObj: undefined,
      timmerIndex: 15,
      time: middle[0].getElementsByTagName('p')[1]
    };
    var data = {
      selected: undefined,
      ques: [{
        question: 'Table',
        key: 'Table',
        answer: [{
          value: 'Bitmap',
          key: 'bitmap'
        }, {
          value: 'Table',
          key: 'Table'
        }, {
          value: 'Raster',
          key: 'raster'
        }, {
          value: 'GIF',
          key: 'gif'
        }]
      }, {
        question: 'Airport',
        key: 'Airport',
        answer: [{
          value: 'Airport',
          key: 'Airport'
        }, {
          value: 'Stadium',
          key: 'Stadium'
        }, {
          value: 'Museum',
          key: 'Museum'
        }, {
          value: 'Building',
          key: 'Building'
        }]
      }, {
        question: 'Elephant',
        key: 'Elephant',
        answer: [{
          value: 'Lion',
          key: 'Lion'
        }, {
          value: 'Elephant',
          key: 'Elephant'
        }, {
          value: 'Cat',
          key: 'Cat'
        }, {
          value: 'Dog',
          key: 'Dog'
        }]
      }, {
        question: 'Lion',
        key: 'Lion',
        answer: [{
          value: 'Bear',
          key: 'Bear'
        }, {
          value: 'Lion',
          key: 'Lion'
        }, {
          value: 'Bird',
          key: 'Bird'
        }, {
          value: 'Rabbit',
          key: 'Rabbit'
        }]
      }, {
        question: 'Car',
        key: 'Car',
        answer: [{
          value: 'Air plane',
          key: 'Air plane'
        }, {
          value: 'Train',
          key: 'Train'
        }, {
          value: 'Bus',
          key: 'Bus'
        }, {
          value: 'Car',
          key: 'Car'
        }]
      }, {
        question: 'Cat',
        key: 'Cat',
        answer: [{
          value: 'Dog',
          key: 'Dog'
        }, {
          value: 'Hedgehog',
          key: 'Hedgehog'
        }, {
          value: 'lizard',
          key: 'lizard'
        }, {
          value: 'Cat',
          key: 'Cat'
        }]
      }, {
        question: 'Zoo',
        key: 'Zoo',
        answer: [{
          value: 'Museum',
          key: 'Museum'
        }, {
          value: 'Zoo',
          key: 'Zoo'
        }, {
          value: 'City',
          key: 'City'
        }, {
          value: 'Park',
          key: 'Park'
        }]
      }, {
        question: 'Lamp',
        key: 'Lamp',
        answer: [{
          value: 'Laptop',
          key: 'Laptop'
        }, {
          value: 'Table',
          key: 'Table'
        }, {
          value: 'Lamp',
          key: 'Lamp'
        }, {
          value: 'Chair',
          key: 'Chair'
        }]
      }, {
        question: 'Window',
        key: 'Window',
        answer: [{
          value: 'Door',
          key: 'Door'
        }, {
          value: 'Gate',
          key: 'Gate'
        }, {
          value: 'Window',
          key: 'Window'
        }, {
          value: 'Tunnel',
          key: 'Tunnel'
        }]
      }, {
        question: 'Laptop',
        key: 'Laptop',
        answer: [{
          value: 'Laptop',
          key: 'Laptop'
        }, {
          value: 'Macbook',
          key: 'Macbook'
        }, {
          value: 'Computer',
          key: 'Computer'
        }, {
          value: 'Chair',
          key: 'Chair'
        }]
      }]
    };

    function preload(images) {
      if (document.images) {
        var a = [];
        var imageArray = images;
        console.log('\n\nImage array:\n\n' + imageArray);

        for (var i = 0; i <= imageArray.length - 1; i++) {
          var imageObj = new Image();
          imageObj.src = './resource/question/' + imageArray[i].question + '.png';
          console.log('Preload image: ' + imageArray[i].question);
          console.log(imageObj);
          a.push(i);
        }

        console.log(a);
      }
    }

    function render(data, scoreElm, yourAns, questionNUmbElm) {
      VNode = patch(VNode, selectPharse(gameIndex, data, scoreElm, yourAns).node);
      timmer.timmerIndex = 15;
      runtime(timmer.time, data);
      gameIndex = gameIndex + 1;

      var func = function func() {
        VNode = patch(VNode, viewQUes(gameIndex, data, scoreElm, questionNUmbElm).node);
      };

      setTimeout(func, 800);
    }

    var runtime = function runtime(clockELm, data) {
      timmer.timmerObj = setInterval(function () {
        updateClock(clockELm, data);
      }, 1000);
    };

    var updateClock = function updateClock(clockELm, data) {
      timmer.timmerIndex--;

      if (timmer.timmerIndex == -1) {
        timmer.timmerIndex = 15;
        clearTimeout(timmer.timmerObj);
      }

      if (timmer.timmerIndex == 15) {
        var yourANs = {
          Value: null,
          Index: null,
          Key: generate(gameIndex, data).key
        };
        render(data, element.scoreElm, yourANs, element.questionNUmb);
      }

      if (gameIndex == 10) {
        clearTimeout(timmer.timmerObj);
        window.alert('end game');
        return;
      }

      clockELm.innerText = "".concat(timmer.timmerIndex);
    };

    function generateGameIndexes(array, score) {
      var currentIndex = array.length,
          temporaryValue,
          randomIndex;

      while (0 !== currentIndex) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
      }

      score.innerText = 0;
      return array;
    }
    console.log(data);
    document.getElementById('question');
    document.getElementById('wrap'); // var VNode;

    var selectPharse = function selectPharse(gameIndex, questionIngame, scoreElm, yourANs) {
      var qa = generate(gameIndex, questionIngame);
      var question = qa.question;
      var Node = [];
      console.log('rendering...');

      for (var i = 0; i < qa.answers.length; i++) {
        console.log('ANSWER INDEX: ' + yourANs.index);

        if (i == yourANs.Index && yourANs.Key === yourANs.Value) {
          Node.push(h('div', {
            style: {
              background: 'green'
            }
          }, qa.answers[i].value));
          score += 10;
          scoreElm.innerText = score;
        } else if (yourANs.Key === qa.answers[i].key) {
          Node.push(h('div', {
            style: {
              background: 'green'
            }
          }, qa.answers[i].value));
        } else if (i == yourANs.Index && !(yourANs.Key === yourANs.Value)) {
          Node.push(h('div', {
            style: {
              background: 'red'
            }
          }, qa.answers[i].value));
        } else {
          Node.push(h('div', qa.answers[i].value));
        }
      }

      return {
        node: h('div.quizz', {
          style: {
            transform: 'translateY(-2em)',
            // delayed: { transform: 'translate(1)', opacity: '0' },
            destroy: {
              transform: 'translateY(-2em)',
              opacity: '0'
            }
          }
        }, [h('div#question', [h('div.big-image', [h('img', {
          props: {
            src: './resource/question/' + question + '.png'
          }
        })])]), h('div.answer', Node)])
      };
    };

    var viewQUes = function viewQUes(gameIndex, questionIngame, scoreElm, questionNUmbElm) {
      questionNUmbElm.innerText = gameIndex + 1 + '/' + questionIngame.length;
      var qa = generate(gameIndex, questionIngame);
      var tmp = score;
      var question = qa.question;
      var answers = qa.answers;
      var key = qa.key;
      var node = answers.map(function (value, index) {
        return h('div', {
          on: {
            click: function click(e) {
              console.log('value and index you clicked: ' + value.value + ':' + index);
              e.target;
              var yourANs = {
                Value: value.value,
                Index: index,
                Key: key
              };
              clearTimeout(timmer.timmerObj);
              render(questionIngame, scoreElm, yourANs, questionNUmbElm);
            }
          }
        }, value.value);
      });
      return {
        node: h('div.quizz', {
          style: {
            transform: 'translateY(2em)',
            // delayed: { transform: 'translate(0)', opacity: '1' },
            destroy: {
              transform: 'translateY(2em)'
            }
          }
        }, [h('div#question', [h('div.big-image', [h('img', {
          props: {
            src: './resource/question/' + question + '.png'
          }
        })])]), h('div.answer', node)]),
        Score: tmp
      };
    };

    var generate = function generate(gameIndex, data) {
      return {
        question: data[gameIndex].question,
        answers: data[gameIndex].answer,
        key: data[gameIndex].key
      };
    };

    window.addEventListener('DOMContentLoaded', function () {
      //khoi tao tro choi
      var questionInGame = generateGameIndexes(data.ques, element.scoreElm);
      console.log('questionInGame.question ' + questionInGame[0].question);
      preload(questionInGame);
      var updateView = viewQUes(gameIndex, questionInGame, element.scoreElm, element.questionNUmb);
      VNode = patch(element.quizz, updateView.node);
      console.log(VNode);
      runtime(timmer.time, questionInGame);
    });

}());
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5nYW1lQnVpbGQuanMiLCJzb3VyY2VzIjpbIi4uL25vZGVfbW9kdWxlcy9zbmFiYmRvbS9idWlsZC92bm9kZS5qcyIsIi4uL25vZGVfbW9kdWxlcy9zbmFiYmRvbS9idWlsZC9pcy5qcyIsIi4uL25vZGVfbW9kdWxlcy9zbmFiYmRvbS9idWlsZC9odG1sZG9tYXBpLmpzIiwiLi4vbm9kZV9tb2R1bGVzL3NuYWJiZG9tL2J1aWxkL2luaXQuanMiLCIuLi9ub2RlX21vZHVsZXMvc25hYmJkb20vYnVpbGQvbW9kdWxlcy9jbGFzcy5qcyIsIi4uL25vZGVfbW9kdWxlcy9zbmFiYmRvbS9idWlsZC9tb2R1bGVzL3Byb3BzLmpzIiwiLi4vbm9kZV9tb2R1bGVzL3NuYWJiZG9tL2J1aWxkL21vZHVsZXMvc3R5bGUuanMiLCIuLi9ub2RlX21vZHVsZXMvc25hYmJkb20vYnVpbGQvbW9kdWxlcy9ldmVudGxpc3RlbmVycy5qcyIsIi4uL25vZGVfbW9kdWxlcy9zbmFiYmRvbS9idWlsZC9oLmpzIiwiLi4vbm9kZV9tb2R1bGVzL3NuYWJiZG9tL2J1aWxkL21vZHVsZXMvZGF0YXNldC5qcyIsIi4uL25vZGVfbW9kdWxlcy9zbmFiYmRvbS9idWlsZC9tb2R1bGVzL2F0dHJpYnV0ZXMuanMiLCIuLi9zcmMvanMvaW5nYW1lLmpzIl0sInNvdXJjZXNDb250ZW50IjpbImV4cG9ydCBmdW5jdGlvbiB2bm9kZShzZWwsIGRhdGEsIGNoaWxkcmVuLCB0ZXh0LCBlbG0pIHtcbiAgICBjb25zdCBrZXkgPSBkYXRhID09PSB1bmRlZmluZWQgPyB1bmRlZmluZWQgOiBkYXRhLmtleTtcbiAgICByZXR1cm4geyBzZWwsIGRhdGEsIGNoaWxkcmVuLCB0ZXh0LCBlbG0sIGtleSB9O1xufVxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9dm5vZGUuanMubWFwIiwiZXhwb3J0IGNvbnN0IGFycmF5ID0gQXJyYXkuaXNBcnJheTtcbmV4cG9ydCBmdW5jdGlvbiBwcmltaXRpdmUocykge1xuICAgIHJldHVybiB0eXBlb2YgcyA9PT0gXCJzdHJpbmdcIiB8fCB0eXBlb2YgcyA9PT0gXCJudW1iZXJcIjtcbn1cbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWlzLmpzLm1hcCIsImZ1bmN0aW9uIGNyZWF0ZUVsZW1lbnQodGFnTmFtZSwgb3B0aW9ucykge1xuICAgIHJldHVybiBkb2N1bWVudC5jcmVhdGVFbGVtZW50KHRhZ05hbWUsIG9wdGlvbnMpO1xufVxuZnVuY3Rpb24gY3JlYXRlRWxlbWVudE5TKG5hbWVzcGFjZVVSSSwgcXVhbGlmaWVkTmFtZSwgb3B0aW9ucykge1xuICAgIHJldHVybiBkb2N1bWVudC5jcmVhdGVFbGVtZW50TlMobmFtZXNwYWNlVVJJLCBxdWFsaWZpZWROYW1lLCBvcHRpb25zKTtcbn1cbmZ1bmN0aW9uIGNyZWF0ZVRleHROb2RlKHRleHQpIHtcbiAgICByZXR1cm4gZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUodGV4dCk7XG59XG5mdW5jdGlvbiBjcmVhdGVDb21tZW50KHRleHQpIHtcbiAgICByZXR1cm4gZG9jdW1lbnQuY3JlYXRlQ29tbWVudCh0ZXh0KTtcbn1cbmZ1bmN0aW9uIGluc2VydEJlZm9yZShwYXJlbnROb2RlLCBuZXdOb2RlLCByZWZlcmVuY2VOb2RlKSB7XG4gICAgcGFyZW50Tm9kZS5pbnNlcnRCZWZvcmUobmV3Tm9kZSwgcmVmZXJlbmNlTm9kZSk7XG59XG5mdW5jdGlvbiByZW1vdmVDaGlsZChub2RlLCBjaGlsZCkge1xuICAgIG5vZGUucmVtb3ZlQ2hpbGQoY2hpbGQpO1xufVxuZnVuY3Rpb24gYXBwZW5kQ2hpbGQobm9kZSwgY2hpbGQpIHtcbiAgICBub2RlLmFwcGVuZENoaWxkKGNoaWxkKTtcbn1cbmZ1bmN0aW9uIHBhcmVudE5vZGUobm9kZSkge1xuICAgIHJldHVybiBub2RlLnBhcmVudE5vZGU7XG59XG5mdW5jdGlvbiBuZXh0U2libGluZyhub2RlKSB7XG4gICAgcmV0dXJuIG5vZGUubmV4dFNpYmxpbmc7XG59XG5mdW5jdGlvbiB0YWdOYW1lKGVsbSkge1xuICAgIHJldHVybiBlbG0udGFnTmFtZTtcbn1cbmZ1bmN0aW9uIHNldFRleHRDb250ZW50KG5vZGUsIHRleHQpIHtcbiAgICBub2RlLnRleHRDb250ZW50ID0gdGV4dDtcbn1cbmZ1bmN0aW9uIGdldFRleHRDb250ZW50KG5vZGUpIHtcbiAgICByZXR1cm4gbm9kZS50ZXh0Q29udGVudDtcbn1cbmZ1bmN0aW9uIGlzRWxlbWVudChub2RlKSB7XG4gICAgcmV0dXJuIG5vZGUubm9kZVR5cGUgPT09IDE7XG59XG5mdW5jdGlvbiBpc1RleHQobm9kZSkge1xuICAgIHJldHVybiBub2RlLm5vZGVUeXBlID09PSAzO1xufVxuZnVuY3Rpb24gaXNDb21tZW50KG5vZGUpIHtcbiAgICByZXR1cm4gbm9kZS5ub2RlVHlwZSA9PT0gODtcbn1cbmV4cG9ydCBjb25zdCBodG1sRG9tQXBpID0ge1xuICAgIGNyZWF0ZUVsZW1lbnQsXG4gICAgY3JlYXRlRWxlbWVudE5TLFxuICAgIGNyZWF0ZVRleHROb2RlLFxuICAgIGNyZWF0ZUNvbW1lbnQsXG4gICAgaW5zZXJ0QmVmb3JlLFxuICAgIHJlbW92ZUNoaWxkLFxuICAgIGFwcGVuZENoaWxkLFxuICAgIHBhcmVudE5vZGUsXG4gICAgbmV4dFNpYmxpbmcsXG4gICAgdGFnTmFtZSxcbiAgICBzZXRUZXh0Q29udGVudCxcbiAgICBnZXRUZXh0Q29udGVudCxcbiAgICBpc0VsZW1lbnQsXG4gICAgaXNUZXh0LFxuICAgIGlzQ29tbWVudCxcbn07XG4vLyMgc291cmNlTWFwcGluZ1VSTD1odG1sZG9tYXBpLmpzLm1hcCIsImltcG9ydCB7IHZub2RlIH0gZnJvbSBcIi4vdm5vZGVcIjtcbmltcG9ydCAqIGFzIGlzIGZyb20gXCIuL2lzXCI7XG5pbXBvcnQgeyBodG1sRG9tQXBpIH0gZnJvbSBcIi4vaHRtbGRvbWFwaVwiO1xuZnVuY3Rpb24gaXNVbmRlZihzKSB7XG4gICAgcmV0dXJuIHMgPT09IHVuZGVmaW5lZDtcbn1cbmZ1bmN0aW9uIGlzRGVmKHMpIHtcbiAgICByZXR1cm4gcyAhPT0gdW5kZWZpbmVkO1xufVxuY29uc3QgZW1wdHlOb2RlID0gdm5vZGUoXCJcIiwge30sIFtdLCB1bmRlZmluZWQsIHVuZGVmaW5lZCk7XG5mdW5jdGlvbiBzYW1lVm5vZGUodm5vZGUxLCB2bm9kZTIpIHtcbiAgICB2YXIgX2EsIF9iO1xuICAgIGNvbnN0IGlzU2FtZUtleSA9IHZub2RlMS5rZXkgPT09IHZub2RlMi5rZXk7XG4gICAgY29uc3QgaXNTYW1lSXMgPSAoKF9hID0gdm5vZGUxLmRhdGEpID09PSBudWxsIHx8IF9hID09PSB2b2lkIDAgPyB2b2lkIDAgOiBfYS5pcykgPT09ICgoX2IgPSB2bm9kZTIuZGF0YSkgPT09IG51bGwgfHwgX2IgPT09IHZvaWQgMCA/IHZvaWQgMCA6IF9iLmlzKTtcbiAgICBjb25zdCBpc1NhbWVTZWwgPSB2bm9kZTEuc2VsID09PSB2bm9kZTIuc2VsO1xuICAgIHJldHVybiBpc1NhbWVTZWwgJiYgaXNTYW1lS2V5ICYmIGlzU2FtZUlzO1xufVxuZnVuY3Rpb24gaXNWbm9kZSh2bm9kZSkge1xuICAgIHJldHVybiB2bm9kZS5zZWwgIT09IHVuZGVmaW5lZDtcbn1cbmZ1bmN0aW9uIGNyZWF0ZUtleVRvT2xkSWR4KGNoaWxkcmVuLCBiZWdpbklkeCwgZW5kSWR4KSB7XG4gICAgdmFyIF9hO1xuICAgIGNvbnN0IG1hcCA9IHt9O1xuICAgIGZvciAobGV0IGkgPSBiZWdpbklkeDsgaSA8PSBlbmRJZHg7ICsraSkge1xuICAgICAgICBjb25zdCBrZXkgPSAoX2EgPSBjaGlsZHJlbltpXSkgPT09IG51bGwgfHwgX2EgPT09IHZvaWQgMCA/IHZvaWQgMCA6IF9hLmtleTtcbiAgICAgICAgaWYgKGtleSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBtYXBba2V5XSA9IGk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG1hcDtcbn1cbmNvbnN0IGhvb2tzID0gW1xuICAgIFwiY3JlYXRlXCIsXG4gICAgXCJ1cGRhdGVcIixcbiAgICBcInJlbW92ZVwiLFxuICAgIFwiZGVzdHJveVwiLFxuICAgIFwicHJlXCIsXG4gICAgXCJwb3N0XCIsXG5dO1xuZXhwb3J0IGZ1bmN0aW9uIGluaXQobW9kdWxlcywgZG9tQXBpKSB7XG4gICAgbGV0IGk7XG4gICAgbGV0IGo7XG4gICAgY29uc3QgY2JzID0ge1xuICAgICAgICBjcmVhdGU6IFtdLFxuICAgICAgICB1cGRhdGU6IFtdLFxuICAgICAgICByZW1vdmU6IFtdLFxuICAgICAgICBkZXN0cm95OiBbXSxcbiAgICAgICAgcHJlOiBbXSxcbiAgICAgICAgcG9zdDogW10sXG4gICAgfTtcbiAgICBjb25zdCBhcGkgPSBkb21BcGkgIT09IHVuZGVmaW5lZCA/IGRvbUFwaSA6IGh0bWxEb21BcGk7XG4gICAgZm9yIChpID0gMDsgaSA8IGhvb2tzLmxlbmd0aDsgKytpKSB7XG4gICAgICAgIGNic1tob29rc1tpXV0gPSBbXTtcbiAgICAgICAgZm9yIChqID0gMDsgaiA8IG1vZHVsZXMubGVuZ3RoOyArK2opIHtcbiAgICAgICAgICAgIGNvbnN0IGhvb2sgPSBtb2R1bGVzW2pdW2hvb2tzW2ldXTtcbiAgICAgICAgICAgIGlmIChob29rICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICBjYnNbaG9va3NbaV1dLnB1c2goaG9vayk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgZnVuY3Rpb24gZW1wdHlOb2RlQXQoZWxtKSB7XG4gICAgICAgIGNvbnN0IGlkID0gZWxtLmlkID8gXCIjXCIgKyBlbG0uaWQgOiBcIlwiO1xuICAgICAgICAvLyBlbG0uY2xhc3NOYW1lIGRvZXNuJ3QgcmV0dXJuIGEgc3RyaW5nIHdoZW4gZWxtIGlzIGFuIFNWRyBlbGVtZW50IGluc2lkZSBhIHNoYWRvd1Jvb3QuXG4gICAgICAgIC8vIGh0dHBzOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzI5NDU0MzQwL2RldGVjdGluZy1jbGFzc25hbWUtb2Ytc3ZnYW5pbWF0ZWRzdHJpbmdcbiAgICAgICAgY29uc3QgY2xhc3NlcyA9IGVsbS5nZXRBdHRyaWJ1dGUoXCJjbGFzc1wiKTtcbiAgICAgICAgY29uc3QgYyA9IGNsYXNzZXMgPyBcIi5cIiArIGNsYXNzZXMuc3BsaXQoXCIgXCIpLmpvaW4oXCIuXCIpIDogXCJcIjtcbiAgICAgICAgcmV0dXJuIHZub2RlKGFwaS50YWdOYW1lKGVsbSkudG9Mb3dlckNhc2UoKSArIGlkICsgYywge30sIFtdLCB1bmRlZmluZWQsIGVsbSk7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGNyZWF0ZVJtQ2IoY2hpbGRFbG0sIGxpc3RlbmVycykge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gcm1DYigpIHtcbiAgICAgICAgICAgIGlmICgtLWxpc3RlbmVycyA9PT0gMCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHBhcmVudCA9IGFwaS5wYXJlbnROb2RlKGNoaWxkRWxtKTtcbiAgICAgICAgICAgICAgICBhcGkucmVtb3ZlQ2hpbGQocGFyZW50LCBjaGlsZEVsbSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfVxuICAgIGZ1bmN0aW9uIGNyZWF0ZUVsbSh2bm9kZSwgaW5zZXJ0ZWRWbm9kZVF1ZXVlKSB7XG4gICAgICAgIHZhciBfYSwgX2I7XG4gICAgICAgIGxldCBpO1xuICAgICAgICBsZXQgZGF0YSA9IHZub2RlLmRhdGE7XG4gICAgICAgIGlmIChkYXRhICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIGNvbnN0IGluaXQgPSAoX2EgPSBkYXRhLmhvb2spID09PSBudWxsIHx8IF9hID09PSB2b2lkIDAgPyB2b2lkIDAgOiBfYS5pbml0O1xuICAgICAgICAgICAgaWYgKGlzRGVmKGluaXQpKSB7XG4gICAgICAgICAgICAgICAgaW5pdCh2bm9kZSk7XG4gICAgICAgICAgICAgICAgZGF0YSA9IHZub2RlLmRhdGE7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgY2hpbGRyZW4gPSB2bm9kZS5jaGlsZHJlbjtcbiAgICAgICAgY29uc3Qgc2VsID0gdm5vZGUuc2VsO1xuICAgICAgICBpZiAoc2VsID09PSBcIiFcIikge1xuICAgICAgICAgICAgaWYgKGlzVW5kZWYodm5vZGUudGV4dCkpIHtcbiAgICAgICAgICAgICAgICB2bm9kZS50ZXh0ID0gXCJcIjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZub2RlLmVsbSA9IGFwaS5jcmVhdGVDb21tZW50KHZub2RlLnRleHQpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKHNlbCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAvLyBQYXJzZSBzZWxlY3RvclxuICAgICAgICAgICAgY29uc3QgaGFzaElkeCA9IHNlbC5pbmRleE9mKFwiI1wiKTtcbiAgICAgICAgICAgIGNvbnN0IGRvdElkeCA9IHNlbC5pbmRleE9mKFwiLlwiLCBoYXNoSWR4KTtcbiAgICAgICAgICAgIGNvbnN0IGhhc2ggPSBoYXNoSWR4ID4gMCA/IGhhc2hJZHggOiBzZWwubGVuZ3RoO1xuICAgICAgICAgICAgY29uc3QgZG90ID0gZG90SWR4ID4gMCA/IGRvdElkeCA6IHNlbC5sZW5ndGg7XG4gICAgICAgICAgICBjb25zdCB0YWcgPSBoYXNoSWR4ICE9PSAtMSB8fCBkb3RJZHggIT09IC0xXG4gICAgICAgICAgICAgICAgPyBzZWwuc2xpY2UoMCwgTWF0aC5taW4oaGFzaCwgZG90KSlcbiAgICAgICAgICAgICAgICA6IHNlbDtcbiAgICAgICAgICAgIGNvbnN0IGVsbSA9ICh2bm9kZS5lbG0gPVxuICAgICAgICAgICAgICAgIGlzRGVmKGRhdGEpICYmIGlzRGVmKChpID0gZGF0YS5ucykpXG4gICAgICAgICAgICAgICAgICAgID8gYXBpLmNyZWF0ZUVsZW1lbnROUyhpLCB0YWcsIGRhdGEpXG4gICAgICAgICAgICAgICAgICAgIDogYXBpLmNyZWF0ZUVsZW1lbnQodGFnLCBkYXRhKSk7XG4gICAgICAgICAgICBpZiAoaGFzaCA8IGRvdClcbiAgICAgICAgICAgICAgICBlbG0uc2V0QXR0cmlidXRlKFwiaWRcIiwgc2VsLnNsaWNlKGhhc2ggKyAxLCBkb3QpKTtcbiAgICAgICAgICAgIGlmIChkb3RJZHggPiAwKVxuICAgICAgICAgICAgICAgIGVsbS5zZXRBdHRyaWJ1dGUoXCJjbGFzc1wiLCBzZWwuc2xpY2UoZG90ICsgMSkucmVwbGFjZSgvXFwuL2csIFwiIFwiKSk7XG4gICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgY2JzLmNyZWF0ZS5sZW5ndGg7ICsraSlcbiAgICAgICAgICAgICAgICBjYnMuY3JlYXRlW2ldKGVtcHR5Tm9kZSwgdm5vZGUpO1xuICAgICAgICAgICAgaWYgKGlzLmFycmF5KGNoaWxkcmVuKSkge1xuICAgICAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCBjaGlsZHJlbi5sZW5ndGg7ICsraSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBjaCA9IGNoaWxkcmVuW2ldO1xuICAgICAgICAgICAgICAgICAgICBpZiAoY2ggIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgYXBpLmFwcGVuZENoaWxkKGVsbSwgY3JlYXRlRWxtKGNoLCBpbnNlcnRlZFZub2RlUXVldWUpKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKGlzLnByaW1pdGl2ZSh2bm9kZS50ZXh0KSkge1xuICAgICAgICAgICAgICAgIGFwaS5hcHBlbmRDaGlsZChlbG0sIGFwaS5jcmVhdGVUZXh0Tm9kZSh2bm9kZS50ZXh0KSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCBob29rID0gdm5vZGUuZGF0YS5ob29rO1xuICAgICAgICAgICAgaWYgKGlzRGVmKGhvb2spKSB7XG4gICAgICAgICAgICAgICAgKF9iID0gaG9vay5jcmVhdGUpID09PSBudWxsIHx8IF9iID09PSB2b2lkIDAgPyB2b2lkIDAgOiBfYi5jYWxsKGhvb2ssIGVtcHR5Tm9kZSwgdm5vZGUpO1xuICAgICAgICAgICAgICAgIGlmIChob29rLmluc2VydCkge1xuICAgICAgICAgICAgICAgICAgICBpbnNlcnRlZFZub2RlUXVldWUucHVzaCh2bm9kZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdm5vZGUuZWxtID0gYXBpLmNyZWF0ZVRleHROb2RlKHZub2RlLnRleHQpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB2bm9kZS5lbG07XG4gICAgfVxuICAgIGZ1bmN0aW9uIGFkZFZub2RlcyhwYXJlbnRFbG0sIGJlZm9yZSwgdm5vZGVzLCBzdGFydElkeCwgZW5kSWR4LCBpbnNlcnRlZFZub2RlUXVldWUpIHtcbiAgICAgICAgZm9yICg7IHN0YXJ0SWR4IDw9IGVuZElkeDsgKytzdGFydElkeCkge1xuICAgICAgICAgICAgY29uc3QgY2ggPSB2bm9kZXNbc3RhcnRJZHhdO1xuICAgICAgICAgICAgaWYgKGNoICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICBhcGkuaW5zZXJ0QmVmb3JlKHBhcmVudEVsbSwgY3JlYXRlRWxtKGNoLCBpbnNlcnRlZFZub2RlUXVldWUpLCBiZWZvcmUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIGZ1bmN0aW9uIGludm9rZURlc3Ryb3lIb29rKHZub2RlKSB7XG4gICAgICAgIHZhciBfYSwgX2I7XG4gICAgICAgIGNvbnN0IGRhdGEgPSB2bm9kZS5kYXRhO1xuICAgICAgICBpZiAoZGF0YSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAoX2IgPSAoX2EgPSBkYXRhID09PSBudWxsIHx8IGRhdGEgPT09IHZvaWQgMCA/IHZvaWQgMCA6IGRhdGEuaG9vaykgPT09IG51bGwgfHwgX2EgPT09IHZvaWQgMCA/IHZvaWQgMCA6IF9hLmRlc3Ryb3kpID09PSBudWxsIHx8IF9iID09PSB2b2lkIDAgPyB2b2lkIDAgOiBfYi5jYWxsKF9hLCB2bm9kZSk7XG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGNicy5kZXN0cm95Lmxlbmd0aDsgKytpKVxuICAgICAgICAgICAgICAgIGNicy5kZXN0cm95W2ldKHZub2RlKTtcbiAgICAgICAgICAgIGlmICh2bm9kZS5jaGlsZHJlbiAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCB2bm9kZS5jaGlsZHJlbi5sZW5ndGg7ICsraikge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBjaGlsZCA9IHZub2RlLmNoaWxkcmVuW2pdO1xuICAgICAgICAgICAgICAgICAgICBpZiAoY2hpbGQgIT0gbnVsbCAmJiB0eXBlb2YgY2hpbGQgIT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGludm9rZURlc3Ryb3lIb29rKGNoaWxkKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICBmdW5jdGlvbiByZW1vdmVWbm9kZXMocGFyZW50RWxtLCB2bm9kZXMsIHN0YXJ0SWR4LCBlbmRJZHgpIHtcbiAgICAgICAgdmFyIF9hLCBfYjtcbiAgICAgICAgZm9yICg7IHN0YXJ0SWR4IDw9IGVuZElkeDsgKytzdGFydElkeCkge1xuICAgICAgICAgICAgbGV0IGxpc3RlbmVycztcbiAgICAgICAgICAgIGxldCBybTtcbiAgICAgICAgICAgIGNvbnN0IGNoID0gdm5vZGVzW3N0YXJ0SWR4XTtcbiAgICAgICAgICAgIGlmIChjaCAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgaWYgKGlzRGVmKGNoLnNlbCkpIHtcbiAgICAgICAgICAgICAgICAgICAgaW52b2tlRGVzdHJveUhvb2soY2gpO1xuICAgICAgICAgICAgICAgICAgICBsaXN0ZW5lcnMgPSBjYnMucmVtb3ZlLmxlbmd0aCArIDE7XG4gICAgICAgICAgICAgICAgICAgIHJtID0gY3JlYXRlUm1DYihjaC5lbG0sIGxpc3RlbmVycyk7XG4gICAgICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY2JzLnJlbW92ZS5sZW5ndGg7ICsraSlcbiAgICAgICAgICAgICAgICAgICAgICAgIGNicy5yZW1vdmVbaV0oY2gsIHJtKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcmVtb3ZlSG9vayA9IChfYiA9IChfYSA9IGNoID09PSBudWxsIHx8IGNoID09PSB2b2lkIDAgPyB2b2lkIDAgOiBjaC5kYXRhKSA9PT0gbnVsbCB8fCBfYSA9PT0gdm9pZCAwID8gdm9pZCAwIDogX2EuaG9vaykgPT09IG51bGwgfHwgX2IgPT09IHZvaWQgMCA/IHZvaWQgMCA6IF9iLnJlbW92ZTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGlzRGVmKHJlbW92ZUhvb2spKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZW1vdmVIb29rKGNoLCBybSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBybSgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAvLyBUZXh0IG5vZGVcbiAgICAgICAgICAgICAgICAgICAgYXBpLnJlbW92ZUNoaWxkKHBhcmVudEVsbSwgY2guZWxtKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgZnVuY3Rpb24gdXBkYXRlQ2hpbGRyZW4ocGFyZW50RWxtLCBvbGRDaCwgbmV3Q2gsIGluc2VydGVkVm5vZGVRdWV1ZSkge1xuICAgICAgICBsZXQgb2xkU3RhcnRJZHggPSAwO1xuICAgICAgICBsZXQgbmV3U3RhcnRJZHggPSAwO1xuICAgICAgICBsZXQgb2xkRW5kSWR4ID0gb2xkQ2gubGVuZ3RoIC0gMTtcbiAgICAgICAgbGV0IG9sZFN0YXJ0Vm5vZGUgPSBvbGRDaFswXTtcbiAgICAgICAgbGV0IG9sZEVuZFZub2RlID0gb2xkQ2hbb2xkRW5kSWR4XTtcbiAgICAgICAgbGV0IG5ld0VuZElkeCA9IG5ld0NoLmxlbmd0aCAtIDE7XG4gICAgICAgIGxldCBuZXdTdGFydFZub2RlID0gbmV3Q2hbMF07XG4gICAgICAgIGxldCBuZXdFbmRWbm9kZSA9IG5ld0NoW25ld0VuZElkeF07XG4gICAgICAgIGxldCBvbGRLZXlUb0lkeDtcbiAgICAgICAgbGV0IGlkeEluT2xkO1xuICAgICAgICBsZXQgZWxtVG9Nb3ZlO1xuICAgICAgICBsZXQgYmVmb3JlO1xuICAgICAgICB3aGlsZSAob2xkU3RhcnRJZHggPD0gb2xkRW5kSWR4ICYmIG5ld1N0YXJ0SWR4IDw9IG5ld0VuZElkeCkge1xuICAgICAgICAgICAgaWYgKG9sZFN0YXJ0Vm5vZGUgPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIG9sZFN0YXJ0Vm5vZGUgPSBvbGRDaFsrK29sZFN0YXJ0SWR4XTsgLy8gVm5vZGUgbWlnaHQgaGF2ZSBiZWVuIG1vdmVkIGxlZnRcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKG9sZEVuZFZub2RlID09IG51bGwpIHtcbiAgICAgICAgICAgICAgICBvbGRFbmRWbm9kZSA9IG9sZENoWy0tb2xkRW5kSWR4XTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKG5ld1N0YXJ0Vm5vZGUgPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIG5ld1N0YXJ0Vm5vZGUgPSBuZXdDaFsrK25ld1N0YXJ0SWR4XTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKG5ld0VuZFZub2RlID09IG51bGwpIHtcbiAgICAgICAgICAgICAgICBuZXdFbmRWbm9kZSA9IG5ld0NoWy0tbmV3RW5kSWR4XTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKHNhbWVWbm9kZShvbGRTdGFydFZub2RlLCBuZXdTdGFydFZub2RlKSkge1xuICAgICAgICAgICAgICAgIHBhdGNoVm5vZGUob2xkU3RhcnRWbm9kZSwgbmV3U3RhcnRWbm9kZSwgaW5zZXJ0ZWRWbm9kZVF1ZXVlKTtcbiAgICAgICAgICAgICAgICBvbGRTdGFydFZub2RlID0gb2xkQ2hbKytvbGRTdGFydElkeF07XG4gICAgICAgICAgICAgICAgbmV3U3RhcnRWbm9kZSA9IG5ld0NoWysrbmV3U3RhcnRJZHhdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoc2FtZVZub2RlKG9sZEVuZFZub2RlLCBuZXdFbmRWbm9kZSkpIHtcbiAgICAgICAgICAgICAgICBwYXRjaFZub2RlKG9sZEVuZFZub2RlLCBuZXdFbmRWbm9kZSwgaW5zZXJ0ZWRWbm9kZVF1ZXVlKTtcbiAgICAgICAgICAgICAgICBvbGRFbmRWbm9kZSA9IG9sZENoWy0tb2xkRW5kSWR4XTtcbiAgICAgICAgICAgICAgICBuZXdFbmRWbm9kZSA9IG5ld0NoWy0tbmV3RW5kSWR4XTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKHNhbWVWbm9kZShvbGRTdGFydFZub2RlLCBuZXdFbmRWbm9kZSkpIHtcbiAgICAgICAgICAgICAgICAvLyBWbm9kZSBtb3ZlZCByaWdodFxuICAgICAgICAgICAgICAgIHBhdGNoVm5vZGUob2xkU3RhcnRWbm9kZSwgbmV3RW5kVm5vZGUsIGluc2VydGVkVm5vZGVRdWV1ZSk7XG4gICAgICAgICAgICAgICAgYXBpLmluc2VydEJlZm9yZShwYXJlbnRFbG0sIG9sZFN0YXJ0Vm5vZGUuZWxtLCBhcGkubmV4dFNpYmxpbmcob2xkRW5kVm5vZGUuZWxtKSk7XG4gICAgICAgICAgICAgICAgb2xkU3RhcnRWbm9kZSA9IG9sZENoWysrb2xkU3RhcnRJZHhdO1xuICAgICAgICAgICAgICAgIG5ld0VuZFZub2RlID0gbmV3Q2hbLS1uZXdFbmRJZHhdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoc2FtZVZub2RlKG9sZEVuZFZub2RlLCBuZXdTdGFydFZub2RlKSkge1xuICAgICAgICAgICAgICAgIC8vIFZub2RlIG1vdmVkIGxlZnRcbiAgICAgICAgICAgICAgICBwYXRjaFZub2RlKG9sZEVuZFZub2RlLCBuZXdTdGFydFZub2RlLCBpbnNlcnRlZFZub2RlUXVldWUpO1xuICAgICAgICAgICAgICAgIGFwaS5pbnNlcnRCZWZvcmUocGFyZW50RWxtLCBvbGRFbmRWbm9kZS5lbG0sIG9sZFN0YXJ0Vm5vZGUuZWxtKTtcbiAgICAgICAgICAgICAgICBvbGRFbmRWbm9kZSA9IG9sZENoWy0tb2xkRW5kSWR4XTtcbiAgICAgICAgICAgICAgICBuZXdTdGFydFZub2RlID0gbmV3Q2hbKytuZXdTdGFydElkeF07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBpZiAob2xkS2V5VG9JZHggPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICBvbGRLZXlUb0lkeCA9IGNyZWF0ZUtleVRvT2xkSWR4KG9sZENoLCBvbGRTdGFydElkeCwgb2xkRW5kSWR4KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWR4SW5PbGQgPSBvbGRLZXlUb0lkeFtuZXdTdGFydFZub2RlLmtleV07XG4gICAgICAgICAgICAgICAgaWYgKGlzVW5kZWYoaWR4SW5PbGQpKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIE5ldyBlbGVtZW50XG4gICAgICAgICAgICAgICAgICAgIGFwaS5pbnNlcnRCZWZvcmUocGFyZW50RWxtLCBjcmVhdGVFbG0obmV3U3RhcnRWbm9kZSwgaW5zZXJ0ZWRWbm9kZVF1ZXVlKSwgb2xkU3RhcnRWbm9kZS5lbG0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgZWxtVG9Nb3ZlID0gb2xkQ2hbaWR4SW5PbGRdO1xuICAgICAgICAgICAgICAgICAgICBpZiAoZWxtVG9Nb3ZlLnNlbCAhPT0gbmV3U3RhcnRWbm9kZS5zZWwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFwaS5pbnNlcnRCZWZvcmUocGFyZW50RWxtLCBjcmVhdGVFbG0obmV3U3RhcnRWbm9kZSwgaW5zZXJ0ZWRWbm9kZVF1ZXVlKSwgb2xkU3RhcnRWbm9kZS5lbG0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgcGF0Y2hWbm9kZShlbG1Ub01vdmUsIG5ld1N0YXJ0Vm5vZGUsIGluc2VydGVkVm5vZGVRdWV1ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBvbGRDaFtpZHhJbk9sZF0gPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICAgICAgICAgICAgICBhcGkuaW5zZXJ0QmVmb3JlKHBhcmVudEVsbSwgZWxtVG9Nb3ZlLmVsbSwgb2xkU3RhcnRWbm9kZS5lbG0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIG5ld1N0YXJ0Vm5vZGUgPSBuZXdDaFsrK25ld1N0YXJ0SWR4XTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAob2xkU3RhcnRJZHggPD0gb2xkRW5kSWR4IHx8IG5ld1N0YXJ0SWR4IDw9IG5ld0VuZElkeCkge1xuICAgICAgICAgICAgaWYgKG9sZFN0YXJ0SWR4ID4gb2xkRW5kSWR4KSB7XG4gICAgICAgICAgICAgICAgYmVmb3JlID0gbmV3Q2hbbmV3RW5kSWR4ICsgMV0gPT0gbnVsbCA/IG51bGwgOiBuZXdDaFtuZXdFbmRJZHggKyAxXS5lbG07XG4gICAgICAgICAgICAgICAgYWRkVm5vZGVzKHBhcmVudEVsbSwgYmVmb3JlLCBuZXdDaCwgbmV3U3RhcnRJZHgsIG5ld0VuZElkeCwgaW5zZXJ0ZWRWbm9kZVF1ZXVlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHJlbW92ZVZub2RlcyhwYXJlbnRFbG0sIG9sZENoLCBvbGRTdGFydElkeCwgb2xkRW5kSWR4KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICBmdW5jdGlvbiBwYXRjaFZub2RlKG9sZFZub2RlLCB2bm9kZSwgaW5zZXJ0ZWRWbm9kZVF1ZXVlKSB7XG4gICAgICAgIHZhciBfYSwgX2IsIF9jLCBfZCwgX2U7XG4gICAgICAgIGNvbnN0IGhvb2sgPSAoX2EgPSB2bm9kZS5kYXRhKSA9PT0gbnVsbCB8fCBfYSA9PT0gdm9pZCAwID8gdm9pZCAwIDogX2EuaG9vaztcbiAgICAgICAgKF9iID0gaG9vayA9PT0gbnVsbCB8fCBob29rID09PSB2b2lkIDAgPyB2b2lkIDAgOiBob29rLnByZXBhdGNoKSA9PT0gbnVsbCB8fCBfYiA9PT0gdm9pZCAwID8gdm9pZCAwIDogX2IuY2FsbChob29rLCBvbGRWbm9kZSwgdm5vZGUpO1xuICAgICAgICBjb25zdCBlbG0gPSAodm5vZGUuZWxtID0gb2xkVm5vZGUuZWxtKTtcbiAgICAgICAgY29uc3Qgb2xkQ2ggPSBvbGRWbm9kZS5jaGlsZHJlbjtcbiAgICAgICAgY29uc3QgY2ggPSB2bm9kZS5jaGlsZHJlbjtcbiAgICAgICAgaWYgKG9sZFZub2RlID09PSB2bm9kZSlcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgaWYgKHZub2RlLmRhdGEgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjYnMudXBkYXRlLmxlbmd0aDsgKytpKVxuICAgICAgICAgICAgICAgIGNicy51cGRhdGVbaV0ob2xkVm5vZGUsIHZub2RlKTtcbiAgICAgICAgICAgIChfZCA9IChfYyA9IHZub2RlLmRhdGEuaG9vaykgPT09IG51bGwgfHwgX2MgPT09IHZvaWQgMCA/IHZvaWQgMCA6IF9jLnVwZGF0ZSkgPT09IG51bGwgfHwgX2QgPT09IHZvaWQgMCA/IHZvaWQgMCA6IF9kLmNhbGwoX2MsIG9sZFZub2RlLCB2bm9kZSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGlzVW5kZWYodm5vZGUudGV4dCkpIHtcbiAgICAgICAgICAgIGlmIChpc0RlZihvbGRDaCkgJiYgaXNEZWYoY2gpKSB7XG4gICAgICAgICAgICAgICAgaWYgKG9sZENoICE9PSBjaClcbiAgICAgICAgICAgICAgICAgICAgdXBkYXRlQ2hpbGRyZW4oZWxtLCBvbGRDaCwgY2gsIGluc2VydGVkVm5vZGVRdWV1ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChpc0RlZihjaCkpIHtcbiAgICAgICAgICAgICAgICBpZiAoaXNEZWYob2xkVm5vZGUudGV4dCkpXG4gICAgICAgICAgICAgICAgICAgIGFwaS5zZXRUZXh0Q29udGVudChlbG0sIFwiXCIpO1xuICAgICAgICAgICAgICAgIGFkZFZub2RlcyhlbG0sIG51bGwsIGNoLCAwLCBjaC5sZW5ndGggLSAxLCBpbnNlcnRlZFZub2RlUXVldWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoaXNEZWYob2xkQ2gpKSB7XG4gICAgICAgICAgICAgICAgcmVtb3ZlVm5vZGVzKGVsbSwgb2xkQ2gsIDAsIG9sZENoLmxlbmd0aCAtIDEpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoaXNEZWYob2xkVm5vZGUudGV4dCkpIHtcbiAgICAgICAgICAgICAgICBhcGkuc2V0VGV4dENvbnRlbnQoZWxtLCBcIlwiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChvbGRWbm9kZS50ZXh0ICE9PSB2bm9kZS50ZXh0KSB7XG4gICAgICAgICAgICBpZiAoaXNEZWYob2xkQ2gpKSB7XG4gICAgICAgICAgICAgICAgcmVtb3ZlVm5vZGVzKGVsbSwgb2xkQ2gsIDAsIG9sZENoLmxlbmd0aCAtIDEpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYXBpLnNldFRleHRDb250ZW50KGVsbSwgdm5vZGUudGV4dCk7XG4gICAgICAgIH1cbiAgICAgICAgKF9lID0gaG9vayA9PT0gbnVsbCB8fCBob29rID09PSB2b2lkIDAgPyB2b2lkIDAgOiBob29rLnBvc3RwYXRjaCkgPT09IG51bGwgfHwgX2UgPT09IHZvaWQgMCA/IHZvaWQgMCA6IF9lLmNhbGwoaG9vaywgb2xkVm5vZGUsIHZub2RlKTtcbiAgICB9XG4gICAgcmV0dXJuIGZ1bmN0aW9uIHBhdGNoKG9sZFZub2RlLCB2bm9kZSkge1xuICAgICAgICBsZXQgaSwgZWxtLCBwYXJlbnQ7XG4gICAgICAgIGNvbnN0IGluc2VydGVkVm5vZGVRdWV1ZSA9IFtdO1xuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgY2JzLnByZS5sZW5ndGg7ICsraSlcbiAgICAgICAgICAgIGNicy5wcmVbaV0oKTtcbiAgICAgICAgaWYgKCFpc1Zub2RlKG9sZFZub2RlKSkge1xuICAgICAgICAgICAgb2xkVm5vZGUgPSBlbXB0eU5vZGVBdChvbGRWbm9kZSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHNhbWVWbm9kZShvbGRWbm9kZSwgdm5vZGUpKSB7XG4gICAgICAgICAgICBwYXRjaFZub2RlKG9sZFZub2RlLCB2bm9kZSwgaW5zZXJ0ZWRWbm9kZVF1ZXVlKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGVsbSA9IG9sZFZub2RlLmVsbTtcbiAgICAgICAgICAgIHBhcmVudCA9IGFwaS5wYXJlbnROb2RlKGVsbSk7XG4gICAgICAgICAgICBjcmVhdGVFbG0odm5vZGUsIGluc2VydGVkVm5vZGVRdWV1ZSk7XG4gICAgICAgICAgICBpZiAocGFyZW50ICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgYXBpLmluc2VydEJlZm9yZShwYXJlbnQsIHZub2RlLmVsbSwgYXBpLm5leHRTaWJsaW5nKGVsbSkpO1xuICAgICAgICAgICAgICAgIHJlbW92ZVZub2RlcyhwYXJlbnQsIFtvbGRWbm9kZV0sIDAsIDApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBpbnNlcnRlZFZub2RlUXVldWUubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICAgIGluc2VydGVkVm5vZGVRdWV1ZVtpXS5kYXRhLmhvb2suaW5zZXJ0KGluc2VydGVkVm5vZGVRdWV1ZVtpXSk7XG4gICAgICAgIH1cbiAgICAgICAgZm9yIChpID0gMDsgaSA8IGNicy5wb3N0Lmxlbmd0aDsgKytpKVxuICAgICAgICAgICAgY2JzLnBvc3RbaV0oKTtcbiAgICAgICAgcmV0dXJuIHZub2RlO1xuICAgIH07XG59XG4vLyMgc291cmNlTWFwcGluZ1VSTD1pbml0LmpzLm1hcCIsImZ1bmN0aW9uIHVwZGF0ZUNsYXNzKG9sZFZub2RlLCB2bm9kZSkge1xuICAgIGxldCBjdXI7XG4gICAgbGV0IG5hbWU7XG4gICAgY29uc3QgZWxtID0gdm5vZGUuZWxtO1xuICAgIGxldCBvbGRDbGFzcyA9IG9sZFZub2RlLmRhdGEuY2xhc3M7XG4gICAgbGV0IGtsYXNzID0gdm5vZGUuZGF0YS5jbGFzcztcbiAgICBpZiAoIW9sZENsYXNzICYmICFrbGFzcylcbiAgICAgICAgcmV0dXJuO1xuICAgIGlmIChvbGRDbGFzcyA9PT0ga2xhc3MpXG4gICAgICAgIHJldHVybjtcbiAgICBvbGRDbGFzcyA9IG9sZENsYXNzIHx8IHt9O1xuICAgIGtsYXNzID0ga2xhc3MgfHwge307XG4gICAgZm9yIChuYW1lIGluIG9sZENsYXNzKSB7XG4gICAgICAgIGlmIChvbGRDbGFzc1tuYW1lXSAmJiAhT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKGtsYXNzLCBuYW1lKSkge1xuICAgICAgICAgICAgLy8gd2FzIGB0cnVlYCBhbmQgbm93IG5vdCBwcm92aWRlZFxuICAgICAgICAgICAgZWxtLmNsYXNzTGlzdC5yZW1vdmUobmFtZSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgZm9yIChuYW1lIGluIGtsYXNzKSB7XG4gICAgICAgIGN1ciA9IGtsYXNzW25hbWVdO1xuICAgICAgICBpZiAoY3VyICE9PSBvbGRDbGFzc1tuYW1lXSkge1xuICAgICAgICAgICAgZWxtLmNsYXNzTGlzdFtjdXIgPyBcImFkZFwiIDogXCJyZW1vdmVcIl0obmFtZSk7XG4gICAgICAgIH1cbiAgICB9XG59XG5leHBvcnQgY29uc3QgY2xhc3NNb2R1bGUgPSB7IGNyZWF0ZTogdXBkYXRlQ2xhc3MsIHVwZGF0ZTogdXBkYXRlQ2xhc3MgfTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWNsYXNzLmpzLm1hcCIsImZ1bmN0aW9uIHVwZGF0ZVByb3BzKG9sZFZub2RlLCB2bm9kZSkge1xuICAgIGxldCBrZXk7XG4gICAgbGV0IGN1cjtcbiAgICBsZXQgb2xkO1xuICAgIGNvbnN0IGVsbSA9IHZub2RlLmVsbTtcbiAgICBsZXQgb2xkUHJvcHMgPSBvbGRWbm9kZS5kYXRhLnByb3BzO1xuICAgIGxldCBwcm9wcyA9IHZub2RlLmRhdGEucHJvcHM7XG4gICAgaWYgKCFvbGRQcm9wcyAmJiAhcHJvcHMpXG4gICAgICAgIHJldHVybjtcbiAgICBpZiAob2xkUHJvcHMgPT09IHByb3BzKVxuICAgICAgICByZXR1cm47XG4gICAgb2xkUHJvcHMgPSBvbGRQcm9wcyB8fCB7fTtcbiAgICBwcm9wcyA9IHByb3BzIHx8IHt9O1xuICAgIGZvciAoa2V5IGluIHByb3BzKSB7XG4gICAgICAgIGN1ciA9IHByb3BzW2tleV07XG4gICAgICAgIG9sZCA9IG9sZFByb3BzW2tleV07XG4gICAgICAgIGlmIChvbGQgIT09IGN1ciAmJiAoa2V5ICE9PSBcInZhbHVlXCIgfHwgZWxtW2tleV0gIT09IGN1cikpIHtcbiAgICAgICAgICAgIGVsbVtrZXldID0gY3VyO1xuICAgICAgICB9XG4gICAgfVxufVxuZXhwb3J0IGNvbnN0IHByb3BzTW9kdWxlID0geyBjcmVhdGU6IHVwZGF0ZVByb3BzLCB1cGRhdGU6IHVwZGF0ZVByb3BzIH07XG4vLyMgc291cmNlTWFwcGluZ1VSTD1wcm9wcy5qcy5tYXAiLCIvLyBCaW5kaWcgYHJlcXVlc3RBbmltYXRpb25GcmFtZWAgbGlrZSB0aGlzIGZpeGVzIGEgYnVnIGluIElFL0VkZ2UuIFNlZSAjMzYwIGFuZCAjNDA5LlxuY29uc3QgcmFmID0gKHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgJiZcbiAgICB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lLmJpbmQod2luZG93KSkgfHxcbiAgICBzZXRUaW1lb3V0O1xuY29uc3QgbmV4dEZyYW1lID0gZnVuY3Rpb24gKGZuKSB7XG4gICAgcmFmKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmFmKGZuKTtcbiAgICB9KTtcbn07XG5sZXQgcmVmbG93Rm9yY2VkID0gZmFsc2U7XG5mdW5jdGlvbiBzZXROZXh0RnJhbWUob2JqLCBwcm9wLCB2YWwpIHtcbiAgICBuZXh0RnJhbWUoZnVuY3Rpb24gKCkge1xuICAgICAgICBvYmpbcHJvcF0gPSB2YWw7XG4gICAgfSk7XG59XG5mdW5jdGlvbiB1cGRhdGVTdHlsZShvbGRWbm9kZSwgdm5vZGUpIHtcbiAgICBsZXQgY3VyO1xuICAgIGxldCBuYW1lO1xuICAgIGNvbnN0IGVsbSA9IHZub2RlLmVsbTtcbiAgICBsZXQgb2xkU3R5bGUgPSBvbGRWbm9kZS5kYXRhLnN0eWxlO1xuICAgIGxldCBzdHlsZSA9IHZub2RlLmRhdGEuc3R5bGU7XG4gICAgaWYgKCFvbGRTdHlsZSAmJiAhc3R5bGUpXG4gICAgICAgIHJldHVybjtcbiAgICBpZiAob2xkU3R5bGUgPT09IHN0eWxlKVxuICAgICAgICByZXR1cm47XG4gICAgb2xkU3R5bGUgPSBvbGRTdHlsZSB8fCB7fTtcbiAgICBzdHlsZSA9IHN0eWxlIHx8IHt9O1xuICAgIGNvbnN0IG9sZEhhc0RlbCA9IFwiZGVsYXllZFwiIGluIG9sZFN0eWxlO1xuICAgIGZvciAobmFtZSBpbiBvbGRTdHlsZSkge1xuICAgICAgICBpZiAoIXN0eWxlW25hbWVdKSB7XG4gICAgICAgICAgICBpZiAobmFtZVswXSA9PT0gXCItXCIgJiYgbmFtZVsxXSA9PT0gXCItXCIpIHtcbiAgICAgICAgICAgICAgICBlbG0uc3R5bGUucmVtb3ZlUHJvcGVydHkobmFtZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBlbG0uc3R5bGVbbmFtZV0gPSBcIlwiO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIGZvciAobmFtZSBpbiBzdHlsZSkge1xuICAgICAgICBjdXIgPSBzdHlsZVtuYW1lXTtcbiAgICAgICAgaWYgKG5hbWUgPT09IFwiZGVsYXllZFwiICYmIHN0eWxlLmRlbGF5ZWQpIHtcbiAgICAgICAgICAgIGZvciAoY29uc3QgbmFtZTIgaW4gc3R5bGUuZGVsYXllZCkge1xuICAgICAgICAgICAgICAgIGN1ciA9IHN0eWxlLmRlbGF5ZWRbbmFtZTJdO1xuICAgICAgICAgICAgICAgIGlmICghb2xkSGFzRGVsIHx8IGN1ciAhPT0gb2xkU3R5bGUuZGVsYXllZFtuYW1lMl0pIHtcbiAgICAgICAgICAgICAgICAgICAgc2V0TmV4dEZyYW1lKGVsbS5zdHlsZSwgbmFtZTIsIGN1cik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKG5hbWUgIT09IFwicmVtb3ZlXCIgJiYgY3VyICE9PSBvbGRTdHlsZVtuYW1lXSkge1xuICAgICAgICAgICAgaWYgKG5hbWVbMF0gPT09IFwiLVwiICYmIG5hbWVbMV0gPT09IFwiLVwiKSB7XG4gICAgICAgICAgICAgICAgZWxtLnN0eWxlLnNldFByb3BlcnR5KG5hbWUsIGN1cik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBlbG0uc3R5bGVbbmFtZV0gPSBjdXI7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG59XG5mdW5jdGlvbiBhcHBseURlc3Ryb3lTdHlsZSh2bm9kZSkge1xuICAgIGxldCBzdHlsZTtcbiAgICBsZXQgbmFtZTtcbiAgICBjb25zdCBlbG0gPSB2bm9kZS5lbG07XG4gICAgY29uc3QgcyA9IHZub2RlLmRhdGEuc3R5bGU7XG4gICAgaWYgKCFzIHx8ICEoc3R5bGUgPSBzLmRlc3Ryb3kpKVxuICAgICAgICByZXR1cm47XG4gICAgZm9yIChuYW1lIGluIHN0eWxlKSB7XG4gICAgICAgIGVsbS5zdHlsZVtuYW1lXSA9IHN0eWxlW25hbWVdO1xuICAgIH1cbn1cbmZ1bmN0aW9uIGFwcGx5UmVtb3ZlU3R5bGUodm5vZGUsIHJtKSB7XG4gICAgY29uc3QgcyA9IHZub2RlLmRhdGEuc3R5bGU7XG4gICAgaWYgKCFzIHx8ICFzLnJlbW92ZSkge1xuICAgICAgICBybSgpO1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmICghcmVmbG93Rm9yY2VkKSB7XG4gICAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tdW51c2VkLWV4cHJlc3Npb25zXG4gICAgICAgIHZub2RlLmVsbS5vZmZzZXRMZWZ0O1xuICAgICAgICByZWZsb3dGb3JjZWQgPSB0cnVlO1xuICAgIH1cbiAgICBsZXQgbmFtZTtcbiAgICBjb25zdCBlbG0gPSB2bm9kZS5lbG07XG4gICAgbGV0IGkgPSAwO1xuICAgIGNvbnN0IHN0eWxlID0gcy5yZW1vdmU7XG4gICAgbGV0IGFtb3VudCA9IDA7XG4gICAgY29uc3QgYXBwbGllZCA9IFtdO1xuICAgIGZvciAobmFtZSBpbiBzdHlsZSkge1xuICAgICAgICBhcHBsaWVkLnB1c2gobmFtZSk7XG4gICAgICAgIGVsbS5zdHlsZVtuYW1lXSA9IHN0eWxlW25hbWVdO1xuICAgIH1cbiAgICBjb25zdCBjb21wU3R5bGUgPSBnZXRDb21wdXRlZFN0eWxlKGVsbSk7XG4gICAgY29uc3QgcHJvcHMgPSBjb21wU3R5bGVbXCJ0cmFuc2l0aW9uLXByb3BlcnR5XCJdLnNwbGl0KFwiLCBcIik7XG4gICAgZm9yICg7IGkgPCBwcm9wcy5sZW5ndGg7ICsraSkge1xuICAgICAgICBpZiAoYXBwbGllZC5pbmRleE9mKHByb3BzW2ldKSAhPT0gLTEpXG4gICAgICAgICAgICBhbW91bnQrKztcbiAgICB9XG4gICAgZWxtLmFkZEV2ZW50TGlzdGVuZXIoXCJ0cmFuc2l0aW9uZW5kXCIsIGZ1bmN0aW9uIChldikge1xuICAgICAgICBpZiAoZXYudGFyZ2V0ID09PSBlbG0pXG4gICAgICAgICAgICAtLWFtb3VudDtcbiAgICAgICAgaWYgKGFtb3VudCA9PT0gMClcbiAgICAgICAgICAgIHJtKCk7XG4gICAgfSk7XG59XG5mdW5jdGlvbiBmb3JjZVJlZmxvdygpIHtcbiAgICByZWZsb3dGb3JjZWQgPSBmYWxzZTtcbn1cbmV4cG9ydCBjb25zdCBzdHlsZU1vZHVsZSA9IHtcbiAgICBwcmU6IGZvcmNlUmVmbG93LFxuICAgIGNyZWF0ZTogdXBkYXRlU3R5bGUsXG4gICAgdXBkYXRlOiB1cGRhdGVTdHlsZSxcbiAgICBkZXN0cm95OiBhcHBseURlc3Ryb3lTdHlsZSxcbiAgICByZW1vdmU6IGFwcGx5UmVtb3ZlU3R5bGUsXG59O1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9c3R5bGUuanMubWFwIiwiZnVuY3Rpb24gaW52b2tlSGFuZGxlcihoYW5kbGVyLCB2bm9kZSwgZXZlbnQpIHtcbiAgICBpZiAodHlwZW9mIGhhbmRsZXIgPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAvLyBjYWxsIGZ1bmN0aW9uIGhhbmRsZXJcbiAgICAgICAgaGFuZGxlci5jYWxsKHZub2RlLCBldmVudCwgdm5vZGUpO1xuICAgIH1cbiAgICBlbHNlIGlmICh0eXBlb2YgaGFuZGxlciA9PT0gXCJvYmplY3RcIikge1xuICAgICAgICAvLyBjYWxsIG11bHRpcGxlIGhhbmRsZXJzXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgaGFuZGxlci5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgaW52b2tlSGFuZGxlcihoYW5kbGVyW2ldLCB2bm9kZSwgZXZlbnQpO1xuICAgICAgICB9XG4gICAgfVxufVxuZnVuY3Rpb24gaGFuZGxlRXZlbnQoZXZlbnQsIHZub2RlKSB7XG4gICAgY29uc3QgbmFtZSA9IGV2ZW50LnR5cGU7XG4gICAgY29uc3Qgb24gPSB2bm9kZS5kYXRhLm9uO1xuICAgIC8vIGNhbGwgZXZlbnQgaGFuZGxlcihzKSBpZiBleGlzdHNcbiAgICBpZiAob24gJiYgb25bbmFtZV0pIHtcbiAgICAgICAgaW52b2tlSGFuZGxlcihvbltuYW1lXSwgdm5vZGUsIGV2ZW50KTtcbiAgICB9XG59XG5mdW5jdGlvbiBjcmVhdGVMaXN0ZW5lcigpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gaGFuZGxlcihldmVudCkge1xuICAgICAgICBoYW5kbGVFdmVudChldmVudCwgaGFuZGxlci52bm9kZSk7XG4gICAgfTtcbn1cbmZ1bmN0aW9uIHVwZGF0ZUV2ZW50TGlzdGVuZXJzKG9sZFZub2RlLCB2bm9kZSkge1xuICAgIGNvbnN0IG9sZE9uID0gb2xkVm5vZGUuZGF0YS5vbjtcbiAgICBjb25zdCBvbGRMaXN0ZW5lciA9IG9sZFZub2RlLmxpc3RlbmVyO1xuICAgIGNvbnN0IG9sZEVsbSA9IG9sZFZub2RlLmVsbTtcbiAgICBjb25zdCBvbiA9IHZub2RlICYmIHZub2RlLmRhdGEub247XG4gICAgY29uc3QgZWxtID0gKHZub2RlICYmIHZub2RlLmVsbSk7XG4gICAgbGV0IG5hbWU7XG4gICAgLy8gb3B0aW1pemF0aW9uIGZvciByZXVzZWQgaW1tdXRhYmxlIGhhbmRsZXJzXG4gICAgaWYgKG9sZE9uID09PSBvbikge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIC8vIHJlbW92ZSBleGlzdGluZyBsaXN0ZW5lcnMgd2hpY2ggbm8gbG9uZ2VyIHVzZWRcbiAgICBpZiAob2xkT24gJiYgb2xkTGlzdGVuZXIpIHtcbiAgICAgICAgLy8gaWYgZWxlbWVudCBjaGFuZ2VkIG9yIGRlbGV0ZWQgd2UgcmVtb3ZlIGFsbCBleGlzdGluZyBsaXN0ZW5lcnMgdW5jb25kaXRpb25hbGx5XG4gICAgICAgIGlmICghb24pIHtcbiAgICAgICAgICAgIGZvciAobmFtZSBpbiBvbGRPbikge1xuICAgICAgICAgICAgICAgIC8vIHJlbW92ZSBsaXN0ZW5lciBpZiBlbGVtZW50IHdhcyBjaGFuZ2VkIG9yIGV4aXN0aW5nIGxpc3RlbmVycyByZW1vdmVkXG4gICAgICAgICAgICAgICAgb2xkRWxtLnJlbW92ZUV2ZW50TGlzdGVuZXIobmFtZSwgb2xkTGlzdGVuZXIsIGZhbHNlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGZvciAobmFtZSBpbiBvbGRPbikge1xuICAgICAgICAgICAgICAgIC8vIHJlbW92ZSBsaXN0ZW5lciBpZiBleGlzdGluZyBsaXN0ZW5lciByZW1vdmVkXG4gICAgICAgICAgICAgICAgaWYgKCFvbltuYW1lXSkge1xuICAgICAgICAgICAgICAgICAgICBvbGRFbG0ucmVtb3ZlRXZlbnRMaXN0ZW5lcihuYW1lLCBvbGRMaXN0ZW5lciwgZmFsc2UpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICAvLyBhZGQgbmV3IGxpc3RlbmVycyB3aGljaCBoYXMgbm90IGFscmVhZHkgYXR0YWNoZWRcbiAgICBpZiAob24pIHtcbiAgICAgICAgLy8gcmV1c2UgZXhpc3RpbmcgbGlzdGVuZXIgb3IgY3JlYXRlIG5ld1xuICAgICAgICBjb25zdCBsaXN0ZW5lciA9ICh2bm9kZS5saXN0ZW5lciA9XG4gICAgICAgICAgICBvbGRWbm9kZS5saXN0ZW5lciB8fCBjcmVhdGVMaXN0ZW5lcigpKTtcbiAgICAgICAgLy8gdXBkYXRlIHZub2RlIGZvciBsaXN0ZW5lclxuICAgICAgICBsaXN0ZW5lci52bm9kZSA9IHZub2RlO1xuICAgICAgICAvLyBpZiBlbGVtZW50IGNoYW5nZWQgb3IgYWRkZWQgd2UgYWRkIGFsbCBuZWVkZWQgbGlzdGVuZXJzIHVuY29uZGl0aW9uYWxseVxuICAgICAgICBpZiAoIW9sZE9uKSB7XG4gICAgICAgICAgICBmb3IgKG5hbWUgaW4gb24pIHtcbiAgICAgICAgICAgICAgICAvLyBhZGQgbGlzdGVuZXIgaWYgZWxlbWVudCB3YXMgY2hhbmdlZCBvciBuZXcgbGlzdGVuZXJzIGFkZGVkXG4gICAgICAgICAgICAgICAgZWxtLmFkZEV2ZW50TGlzdGVuZXIobmFtZSwgbGlzdGVuZXIsIGZhbHNlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGZvciAobmFtZSBpbiBvbikge1xuICAgICAgICAgICAgICAgIC8vIGFkZCBsaXN0ZW5lciBpZiBuZXcgbGlzdGVuZXIgYWRkZWRcbiAgICAgICAgICAgICAgICBpZiAoIW9sZE9uW25hbWVdKSB7XG4gICAgICAgICAgICAgICAgICAgIGVsbS5hZGRFdmVudExpc3RlbmVyKG5hbWUsIGxpc3RlbmVyLCBmYWxzZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxufVxuZXhwb3J0IGNvbnN0IGV2ZW50TGlzdGVuZXJzTW9kdWxlID0ge1xuICAgIGNyZWF0ZTogdXBkYXRlRXZlbnRMaXN0ZW5lcnMsXG4gICAgdXBkYXRlOiB1cGRhdGVFdmVudExpc3RlbmVycyxcbiAgICBkZXN0cm95OiB1cGRhdGVFdmVudExpc3RlbmVycyxcbn07XG4vLyMgc291cmNlTWFwcGluZ1VSTD1ldmVudGxpc3RlbmVycy5qcy5tYXAiLCJpbXBvcnQgeyB2bm9kZSB9IGZyb20gXCIuL3Zub2RlXCI7XG5pbXBvcnQgKiBhcyBpcyBmcm9tIFwiLi9pc1wiO1xuZnVuY3Rpb24gYWRkTlMoZGF0YSwgY2hpbGRyZW4sIHNlbCkge1xuICAgIGRhdGEubnMgPSBcImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCI7XG4gICAgaWYgKHNlbCAhPT0gXCJmb3JlaWduT2JqZWN0XCIgJiYgY2hpbGRyZW4gIT09IHVuZGVmaW5lZCkge1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGNoaWxkcmVuLmxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgICBjb25zdCBjaGlsZERhdGEgPSBjaGlsZHJlbltpXS5kYXRhO1xuICAgICAgICAgICAgaWYgKGNoaWxkRGF0YSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgYWRkTlMoY2hpbGREYXRhLCBjaGlsZHJlbltpXS5jaGlsZHJlbiwgY2hpbGRyZW5baV0uc2VsKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbn1cbmV4cG9ydCBmdW5jdGlvbiBoKHNlbCwgYiwgYykge1xuICAgIGxldCBkYXRhID0ge307XG4gICAgbGV0IGNoaWxkcmVuO1xuICAgIGxldCB0ZXh0O1xuICAgIGxldCBpO1xuICAgIGlmIChjICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgaWYgKGIgIT09IG51bGwpIHtcbiAgICAgICAgICAgIGRhdGEgPSBiO1xuICAgICAgICB9XG4gICAgICAgIGlmIChpcy5hcnJheShjKSkge1xuICAgICAgICAgICAgY2hpbGRyZW4gPSBjO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGlzLnByaW1pdGl2ZShjKSkge1xuICAgICAgICAgICAgdGV4dCA9IGM7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoYyAmJiBjLnNlbCkge1xuICAgICAgICAgICAgY2hpbGRyZW4gPSBbY107XG4gICAgICAgIH1cbiAgICB9XG4gICAgZWxzZSBpZiAoYiAhPT0gdW5kZWZpbmVkICYmIGIgIT09IG51bGwpIHtcbiAgICAgICAgaWYgKGlzLmFycmF5KGIpKSB7XG4gICAgICAgICAgICBjaGlsZHJlbiA9IGI7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoaXMucHJpbWl0aXZlKGIpKSB7XG4gICAgICAgICAgICB0ZXh0ID0gYjtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChiICYmIGIuc2VsKSB7XG4gICAgICAgICAgICBjaGlsZHJlbiA9IFtiXTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGRhdGEgPSBiO1xuICAgICAgICB9XG4gICAgfVxuICAgIGlmIChjaGlsZHJlbiAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBjaGlsZHJlbi5sZW5ndGg7ICsraSkge1xuICAgICAgICAgICAgaWYgKGlzLnByaW1pdGl2ZShjaGlsZHJlbltpXSkpXG4gICAgICAgICAgICAgICAgY2hpbGRyZW5baV0gPSB2bm9kZSh1bmRlZmluZWQsIHVuZGVmaW5lZCwgdW5kZWZpbmVkLCBjaGlsZHJlbltpXSwgdW5kZWZpbmVkKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBpZiAoc2VsWzBdID09PSBcInNcIiAmJlxuICAgICAgICBzZWxbMV0gPT09IFwidlwiICYmXG4gICAgICAgIHNlbFsyXSA9PT0gXCJnXCIgJiZcbiAgICAgICAgKHNlbC5sZW5ndGggPT09IDMgfHwgc2VsWzNdID09PSBcIi5cIiB8fCBzZWxbM10gPT09IFwiI1wiKSkge1xuICAgICAgICBhZGROUyhkYXRhLCBjaGlsZHJlbiwgc2VsKTtcbiAgICB9XG4gICAgcmV0dXJuIHZub2RlKHNlbCwgZGF0YSwgY2hpbGRyZW4sIHRleHQsIHVuZGVmaW5lZCk7XG59XG4vLyMgc291cmNlTWFwcGluZ1VSTD1oLmpzLm1hcCIsImNvbnN0IENBUFNfUkVHRVggPSAvW0EtWl0vZztcbmZ1bmN0aW9uIHVwZGF0ZURhdGFzZXQob2xkVm5vZGUsIHZub2RlKSB7XG4gICAgY29uc3QgZWxtID0gdm5vZGUuZWxtO1xuICAgIGxldCBvbGREYXRhc2V0ID0gb2xkVm5vZGUuZGF0YS5kYXRhc2V0O1xuICAgIGxldCBkYXRhc2V0ID0gdm5vZGUuZGF0YS5kYXRhc2V0O1xuICAgIGxldCBrZXk7XG4gICAgaWYgKCFvbGREYXRhc2V0ICYmICFkYXRhc2V0KVxuICAgICAgICByZXR1cm47XG4gICAgaWYgKG9sZERhdGFzZXQgPT09IGRhdGFzZXQpXG4gICAgICAgIHJldHVybjtcbiAgICBvbGREYXRhc2V0ID0gb2xkRGF0YXNldCB8fCB7fTtcbiAgICBkYXRhc2V0ID0gZGF0YXNldCB8fCB7fTtcbiAgICBjb25zdCBkID0gZWxtLmRhdGFzZXQ7XG4gICAgZm9yIChrZXkgaW4gb2xkRGF0YXNldCkge1xuICAgICAgICBpZiAoIWRhdGFzZXRba2V5XSkge1xuICAgICAgICAgICAgaWYgKGQpIHtcbiAgICAgICAgICAgICAgICBpZiAoa2V5IGluIGQpIHtcbiAgICAgICAgICAgICAgICAgICAgZGVsZXRlIGRba2V5XTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBlbG0ucmVtb3ZlQXR0cmlidXRlKFwiZGF0YS1cIiArIGtleS5yZXBsYWNlKENBUFNfUkVHRVgsIFwiLSQmXCIpLnRvTG93ZXJDYXNlKCkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIGZvciAoa2V5IGluIGRhdGFzZXQpIHtcbiAgICAgICAgaWYgKG9sZERhdGFzZXRba2V5XSAhPT0gZGF0YXNldFtrZXldKSB7XG4gICAgICAgICAgICBpZiAoZCkge1xuICAgICAgICAgICAgICAgIGRba2V5XSA9IGRhdGFzZXRba2V5XTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGVsbS5zZXRBdHRyaWJ1dGUoXCJkYXRhLVwiICsga2V5LnJlcGxhY2UoQ0FQU19SRUdFWCwgXCItJCZcIikudG9Mb3dlckNhc2UoKSwgZGF0YXNldFtrZXldKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbn1cbmV4cG9ydCBjb25zdCBkYXRhc2V0TW9kdWxlID0ge1xuICAgIGNyZWF0ZTogdXBkYXRlRGF0YXNldCxcbiAgICB1cGRhdGU6IHVwZGF0ZURhdGFzZXQsXG59O1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9ZGF0YXNldC5qcy5tYXAiLCJjb25zdCB4bGlua05TID0gXCJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rXCI7XG5jb25zdCB4bWxOUyA9IFwiaHR0cDovL3d3dy53My5vcmcvWE1MLzE5OTgvbmFtZXNwYWNlXCI7XG5jb25zdCBjb2xvbkNoYXIgPSA1ODtcbmNvbnN0IHhDaGFyID0gMTIwO1xuZnVuY3Rpb24gdXBkYXRlQXR0cnMob2xkVm5vZGUsIHZub2RlKSB7XG4gICAgbGV0IGtleTtcbiAgICBjb25zdCBlbG0gPSB2bm9kZS5lbG07XG4gICAgbGV0IG9sZEF0dHJzID0gb2xkVm5vZGUuZGF0YS5hdHRycztcbiAgICBsZXQgYXR0cnMgPSB2bm9kZS5kYXRhLmF0dHJzO1xuICAgIGlmICghb2xkQXR0cnMgJiYgIWF0dHJzKVxuICAgICAgICByZXR1cm47XG4gICAgaWYgKG9sZEF0dHJzID09PSBhdHRycylcbiAgICAgICAgcmV0dXJuO1xuICAgIG9sZEF0dHJzID0gb2xkQXR0cnMgfHwge307XG4gICAgYXR0cnMgPSBhdHRycyB8fCB7fTtcbiAgICAvLyB1cGRhdGUgbW9kaWZpZWQgYXR0cmlidXRlcywgYWRkIG5ldyBhdHRyaWJ1dGVzXG4gICAgZm9yIChrZXkgaW4gYXR0cnMpIHtcbiAgICAgICAgY29uc3QgY3VyID0gYXR0cnNba2V5XTtcbiAgICAgICAgY29uc3Qgb2xkID0gb2xkQXR0cnNba2V5XTtcbiAgICAgICAgaWYgKG9sZCAhPT0gY3VyKSB7XG4gICAgICAgICAgICBpZiAoY3VyID09PSB0cnVlKSB7XG4gICAgICAgICAgICAgICAgZWxtLnNldEF0dHJpYnV0ZShrZXksIFwiXCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoY3VyID09PSBmYWxzZSkge1xuICAgICAgICAgICAgICAgIGVsbS5yZW1vdmVBdHRyaWJ1dGUoa2V5KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGlmIChrZXkuY2hhckNvZGVBdCgwKSAhPT0geENoYXIpIHtcbiAgICAgICAgICAgICAgICAgICAgZWxtLnNldEF0dHJpYnV0ZShrZXksIGN1cik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKGtleS5jaGFyQ29kZUF0KDMpID09PSBjb2xvbkNoYXIpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gQXNzdW1lIHhtbCBuYW1lc3BhY2VcbiAgICAgICAgICAgICAgICAgICAgZWxtLnNldEF0dHJpYnV0ZU5TKHhtbE5TLCBrZXksIGN1cik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKGtleS5jaGFyQ29kZUF0KDUpID09PSBjb2xvbkNoYXIpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gQXNzdW1lIHhsaW5rIG5hbWVzcGFjZVxuICAgICAgICAgICAgICAgICAgICBlbG0uc2V0QXR0cmlidXRlTlMoeGxpbmtOUywga2V5LCBjdXIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgZWxtLnNldEF0dHJpYnV0ZShrZXksIGN1cik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIC8vIHJlbW92ZSByZW1vdmVkIGF0dHJpYnV0ZXNcbiAgICAvLyB1c2UgYGluYCBvcGVyYXRvciBzaW5jZSB0aGUgcHJldmlvdXMgYGZvcmAgaXRlcmF0aW9uIHVzZXMgaXQgKC5pLmUuIGFkZCBldmVuIGF0dHJpYnV0ZXMgd2l0aCB1bmRlZmluZWQgdmFsdWUpXG4gICAgLy8gdGhlIG90aGVyIG9wdGlvbiBpcyB0byByZW1vdmUgYWxsIGF0dHJpYnV0ZXMgd2l0aCB2YWx1ZSA9PSB1bmRlZmluZWRcbiAgICBmb3IgKGtleSBpbiBvbGRBdHRycykge1xuICAgICAgICBpZiAoIShrZXkgaW4gYXR0cnMpKSB7XG4gICAgICAgICAgICBlbG0ucmVtb3ZlQXR0cmlidXRlKGtleSk7XG4gICAgICAgIH1cbiAgICB9XG59XG5leHBvcnQgY29uc3QgYXR0cmlidXRlc01vZHVsZSA9IHtcbiAgICBjcmVhdGU6IHVwZGF0ZUF0dHJzLFxuICAgIHVwZGF0ZTogdXBkYXRlQXR0cnMsXG59O1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9YXR0cmlidXRlcy5qcy5tYXAiLCJcbmltcG9ydCB7IGluaXQgfSBmcm9tICdzbmFiYmRvbS9idWlsZC9pbml0JztcbmltcG9ydCB7IGNsYXNzTW9kdWxlIH0gZnJvbSAnc25hYmJkb20vYnVpbGQvbW9kdWxlcy9jbGFzcyc7XG5pbXBvcnQgeyBwcm9wc01vZHVsZSB9IGZyb20gJ3NuYWJiZG9tL2J1aWxkL21vZHVsZXMvcHJvcHMnO1xuaW1wb3J0IHsgc3R5bGVNb2R1bGUgfSBmcm9tICdzbmFiYmRvbS9idWlsZC9tb2R1bGVzL3N0eWxlJztcbmltcG9ydCB7IGV2ZW50TGlzdGVuZXJzTW9kdWxlIH0gZnJvbSAnc25hYmJkb20vYnVpbGQvbW9kdWxlcy9ldmVudGxpc3RlbmVycyc7XG5pbXBvcnQgeyBoIH0gZnJvbSAnc25hYmJkb20vYnVpbGQvaCc7XG5pbXBvcnQgeyBkYXRhc2V0TW9kdWxlIH0gZnJvbSAnc25hYmJkb20vYnVpbGQvbW9kdWxlcy9kYXRhc2V0JztcbmltcG9ydCB7IGF0dHJpYnV0ZXNNb2R1bGUgfSBmcm9tICdzbmFiYmRvbS9idWlsZC9tb2R1bGVzL2F0dHJpYnV0ZXMnO1xudmFyIHBhdGNoID0gaW5pdChbIC8vIEluaXQgcGF0Y2ggZnVuY3Rpb24gd2l0aCBjaG9zZW4gbW9kdWxlc1xuICAgIGNsYXNzTW9kdWxlLCAvLyBtYWtlcyBpdCBlYXN5IHRvIHRvZ2dsZSBjbGFzc2VzXG4gICAgcHJvcHNNb2R1bGUsIC8vIGZvciBzZXR0aW5nIHByb3BlcnRpZXMgb24gRE9NIGVsZW1lbnRzXG4gICAgc3R5bGVNb2R1bGUsIC8vIGhhbmRsZXMgc3R5bGluZyBvbiBlbGVtZW50cyB3aXRoIHN1cHBvcnQgZm9yIGFuaW1hdGlvbnNcbiAgICBldmVudExpc3RlbmVyc01vZHVsZSwgLy8gYXR0YWNoZXMgZXZlbnQgbGlzdGVuZXJzXG4gICAgZGF0YXNldE1vZHVsZSxcbiAgICBhdHRyaWJ1dGVzTW9kdWxlXG5dKTtcblxudmFyIE5vZGUgPSBoKCdkaXYjd3JhcCcsW1xuICAgIGgoJ2Rpdi5sZWZ0JyxbXG4gICAgICAgIGgoJ2ltZycseyBwcm9wczogeyBzcmM6Jy4uL+KAlFBuZ3RyZWXigJR2ZWN0b3IgdXNlcnMgaWNvbl80MTQ0NzQwLnBuZycgfSB9KSxcbiAgICAgICAgaCgnZGl2LnNjb3JlJyxbXG4gICAgICAgICAgICBoKCdwJywnODAwJylcbiAgICAgICAgXSlcbiAgICBdKSxcbiAgICBoKCdkaXYubWlkZGxlJyxbXG4gICAgICAgIGgoJ2Rpdi5wb3B1cCcse3N0eWxlOiB7XG4gICAgICAgICAgICB0cmFuc2Zvcm06ICd0cmFuc2xhdGVZKC0yZW0pJ1xuICAgICAgICB9fSxbXG4gICAgICAgICAgICBoKCdkaXYnLCdZb3VyIGFuc3dlciBpcyBjb3JyZWN0IScpLFxuICAgICAgICAgICAgaCgnaW1nJyx7IHByb3BzOiB7IHNyYzonLi4vcmVzb3VyY2UvZ3JlZW50aWNrLnBuZycgfSB9KVxuICAgICAgICBdKSxcbiAgICAgICAgaCgncCcsJzEwLzE1JyksXG4gICAgICAgIGgoJ3AnLCcxNScpXG4gICAgXSksXG4gICAgaCgnZGl2LnJpZ2h0JyxbXG4gICAgICAgIGgoJ2ltZycseyBwcm9wczogeyBzcmM6Jy4uL+KAlFBuZ3RyZWXigJR2ZWN0b3IgdXNlcnMgaWNvbl80MTQ0NzQwLnBuZycgfSB9KSxcbiAgICAgICAgaCgnZGl2LnNjb3JlJyxbXG4gICAgICAgICAgICBoKCdwJywnODAwJylcbiAgICAgICAgXSlcbiAgICBdKVxuXSk7XG5cbnZhciB3cnAgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnd3JhcCcpO1xucGF0Y2god3JwLE5vZGUpO1xudmFyIFZOb2RlO1xudmFyIHNjb3JlID0gMDtcbnZhciBnYW1lSW5kZXggPSAwOy8vY2F1IGhpZW4gdGFpIGRhbmcgY2hvaVxudmFyIG1pZGRsZT0gZG9jdW1lbnQuZ2V0RWxlbWVudHNCeUNsYXNzTmFtZSgnbWlkZGxlJyk7XG52YXIgZWxlbWVudCA9IHtcbiAgICBzY29yZUVsbTogZG9jdW1lbnQuZ2V0RWxlbWVudHNCeUNsYXNzTmFtZSgnbGVmdCcpWzBdLmdldEVsZW1lbnRzQnlDbGFzc05hbWUoJ3Njb3JlJylbMF0uZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ3AnKVswXSxcbiAgICBxdWVzdGlvbk5VbWI6IG1pZGRsZVswXS5nZXRFbGVtZW50c0J5VGFnTmFtZSgncCcpWzBdLFxuICAgIHF1aXp6OiBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncXVpenonKVxufTtcbnZhciB0aW1tZXIgPSB7XG4gICAgdGltbWVyT2JqOiB1bmRlZmluZWQsXG4gICAgdGltbWVySW5kZXg6IDE1LFxuICAgIHRpbWUgOiBtaWRkbGVbMF0uZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ3AnKVsxXVxufTtcblxudmFyIGRhdGEgPSB7XG4gICAgc2VsZWN0ZWQ6dW5kZWZpbmVkLFxuICAgIHF1ZXM6W1xuXG4gICAgICAgIHtxdWVzdGlvbjonVGFibGUnICxrZXk6ICdUYWJsZScgLGFuc3dlcjpbe3ZhbHVlOiAnQml0bWFwJywga2V5OidiaXRtYXAnfSwge3ZhbHVlOidUYWJsZScsIGtleTonVGFibGUnfSwge3ZhbHVlOidSYXN0ZXInLGtleToncmFzdGVyJ30sIHt2YWx1ZTonR0lGJyxrZXk6J2dpZid9XX0sXG4gICAgICAgIHtxdWVzdGlvbjonQWlycG9ydCcgLGtleTogJ0FpcnBvcnQnICxhbnN3ZXI6W3t2YWx1ZTogJ0FpcnBvcnQnLCBrZXk6J0FpcnBvcnQnfSwge3ZhbHVlOidTdGFkaXVtJywga2V5OidTdGFkaXVtJ30sIHt2YWx1ZTonTXVzZXVtJyxrZXk6J011c2V1bSd9LCB7dmFsdWU6J0J1aWxkaW5nJyxrZXk6J0J1aWxkaW5nJ31dfSxcbiAgICAgICAge3F1ZXN0aW9uOidFbGVwaGFudCcgLGtleTogJ0VsZXBoYW50JyAsYW5zd2VyOlt7dmFsdWU6ICdMaW9uJywga2V5OidMaW9uJ30sIHt2YWx1ZTonRWxlcGhhbnQnLCBrZXk6J0VsZXBoYW50J30sIHt2YWx1ZTonQ2F0JyxrZXk6J0NhdCd9LCB7dmFsdWU6J0RvZycsa2V5OidEb2cnfV19LFxuICAgICAgICB7cXVlc3Rpb246J0xpb24nICxrZXk6ICdMaW9uJyAsYW5zd2VyOlt7dmFsdWU6ICdCZWFyJywga2V5OidCZWFyJ30sIHt2YWx1ZTonTGlvbicsIGtleTonTGlvbid9LCB7dmFsdWU6J0JpcmQnLGtleTonQmlyZCd9LCB7dmFsdWU6J1JhYmJpdCcsa2V5OidSYWJiaXQnfV19LFxuICAgICAgICB7cXVlc3Rpb246J0NhcicgLGtleTogJ0NhcicgLGFuc3dlcjpbe3ZhbHVlOiAnQWlyIHBsYW5lJywga2V5OidBaXIgcGxhbmUnfSwge3ZhbHVlOidUcmFpbicsIGtleTonVHJhaW4nfSwge3ZhbHVlOidCdXMnLGtleTonQnVzJ30sIHt2YWx1ZTonQ2FyJyxrZXk6J0Nhcid9XX0sXG4gICAgICAgIHtxdWVzdGlvbjonQ2F0JyAsa2V5OiAnQ2F0JyAsYW5zd2VyOlt7dmFsdWU6ICdEb2cnLCBrZXk6J0RvZyd9LCB7dmFsdWU6J0hlZGdlaG9nJywga2V5OidIZWRnZWhvZyd9LCB7dmFsdWU6J2xpemFyZCcsa2V5OidsaXphcmQnfSwge3ZhbHVlOidDYXQnLGtleTonQ2F0J31dfSxcbiAgICAgICAge3F1ZXN0aW9uOidab28nICxrZXk6ICdab28nICxhbnN3ZXI6W3t2YWx1ZTogJ011c2V1bScsIGtleTonTXVzZXVtJ30sIHt2YWx1ZTonWm9vJywga2V5Oidab28nfSwge3ZhbHVlOidDaXR5JyxrZXk6J0NpdHknfSwge3ZhbHVlOidQYXJrJyxrZXk6J1BhcmsnfV19LFxuICAgICAgICB7cXVlc3Rpb246J0xhbXAnICxrZXk6ICdMYW1wJyAsYW5zd2VyOlt7dmFsdWU6ICdMYXB0b3AnLCBrZXk6J0xhcHRvcCd9LCB7dmFsdWU6J1RhYmxlJywga2V5OidUYWJsZSd9LCB7dmFsdWU6J0xhbXAnLGtleTonTGFtcCd9LCB7dmFsdWU6J0NoYWlyJyxrZXk6J0NoYWlyJ31dfSxcbiAgICAgICAge3F1ZXN0aW9uOidXaW5kb3cnICxrZXk6ICdXaW5kb3cnICxhbnN3ZXI6W3t2YWx1ZTogJ0Rvb3InLCBrZXk6J0Rvb3InfSwge3ZhbHVlOidHYXRlJywga2V5OidHYXRlJ30sIHt2YWx1ZTonV2luZG93JyxrZXk6J1dpbmRvdyd9LCB7dmFsdWU6J1R1bm5lbCcsa2V5OidUdW5uZWwnfV19LFxuICAgICAgICB7cXVlc3Rpb246J0xhcHRvcCcgLGtleTogJ0xhcHRvcCcgLGFuc3dlcjpbe3ZhbHVlOiAnTGFwdG9wJywga2V5OidMYXB0b3AnfSwge3ZhbHVlOidNYWNib29rJywga2V5OidNYWNib29rJ30sIHt2YWx1ZTonQ29tcHV0ZXInLGtleTonQ29tcHV0ZXInfSwge3ZhbHVlOidDaGFpcicsa2V5OidDaGFpcid9XX0sXG4gICAgXSxcbn07XG5cblxuXG5cbmZ1bmN0aW9uIHByZWxvYWQoaW1hZ2VzKSB7XG4gICAgaWYgKGRvY3VtZW50LmltYWdlcykge1xuICAgICAgICB2YXIgYT1bXTtcblxuICAgICAgICB2YXIgaW1hZ2VBcnJheSA9IGltYWdlcztcbiAgICAgICAgY29uc29sZS5sb2coJ1xcblxcbkltYWdlIGFycmF5OlxcblxcbicraW1hZ2VBcnJheSk7XG4gICAgICAgIGZvcihsZXQgaT0wOyBpPD1pbWFnZUFycmF5Lmxlbmd0aC0xOyBpKyspIHtcbiAgICAgICAgICAgIHZhciBpbWFnZU9iaiA9IG5ldyBJbWFnZSgpO1xuICAgICAgICAgICAgaW1hZ2VPYmouc3JjPScuL3Jlc291cmNlL3F1ZXN0aW9uLycraW1hZ2VBcnJheVtpXS5xdWVzdGlvbisnLnBuZyc7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnUHJlbG9hZCBpbWFnZTogJytpbWFnZUFycmF5W2ldLnF1ZXN0aW9uKTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGltYWdlT2JqKTtcbiAgICAgICAgICAgIGEucHVzaChpKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zb2xlLmxvZyhhKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uICByZW5kZXIgKGRhdGEsIHNjb3JlRWxtLCB5b3VyQW5zLCBxdWVzdGlvbk5VbWJFbG0pIHtcbiAgICBWTm9kZSA9IHBhdGNoKFZOb2RlLCBzZWxlY3RQaGFyc2UoZ2FtZUluZGV4LGRhdGEsc2NvcmVFbG0seW91ckFucykubm9kZSk7XG4gICAgdGltbWVyLnRpbW1lckluZGV4ID0gMTU7XG4gICAgcnVudGltZSh0aW1tZXIudGltZSxkYXRhKTtcbiAgICBnYW1lSW5kZXggPSBnYW1lSW5kZXgrMTtcbiAgICB2YXIgZnVuYyA9IGZ1bmN0aW9uKCkgeyBcbiAgICAgICAgVk5vZGUgPSAgcGF0Y2goVk5vZGUsIHZpZXdRVWVzKGdhbWVJbmRleCxkYXRhLHNjb3JlRWxtLHF1ZXN0aW9uTlVtYkVsbSkubm9kZSk7XG4gICAgfTtcbiAgICBzZXRUaW1lb3V0KGZ1bmMsODAwKTtcbn1cblxuXG52YXIgcnVudGltZSA9IGZ1bmN0aW9uKGNsb2NrRUxtLCBkYXRhKSB7XG4gICAgdGltbWVyLnRpbW1lck9iaiA9ICBzZXRJbnRlcnZhbChmdW5jdGlvbigpIHsgdXBkYXRlQ2xvY2soY2xvY2tFTG0sIGRhdGEpOyB9LDEwMDApO1xufTtcblxudmFyIHVwZGF0ZUNsb2NrID0gZnVuY3Rpb24gKGNsb2NrRUxtLCBkYXRhKSB7XG4gICAgdGltbWVyLnRpbW1lckluZGV4LS07XG4gICAgaWYgKHRpbW1lci50aW1tZXJJbmRleCA9PSAtMSkge1xuICAgICAgICB0aW1tZXIudGltbWVySW5kZXggPSAxNTtcbiAgICAgICAgY2xlYXJUaW1lb3V0KHRpbW1lci50aW1tZXJPYmopO1xuICAgIH0gXG4gICAgaWYodGltbWVyLnRpbW1lckluZGV4ID09IDE1KXtcbiAgICAgICAgdmFyIHlvdXJBTnMgPSB7XG4gICAgICAgICAgICBWYWx1ZTogbnVsbCxcbiAgICAgICAgICAgIEluZGV4OiBudWxsLFxuICAgICAgICAgICAgS2V5OiBnZW5lcmF0ZShnYW1lSW5kZXgsIGRhdGEpLmtleVxuICAgICAgICB9O1xuICAgICAgICByZW5kZXIoZGF0YSwgZWxlbWVudC5zY29yZUVsbSwgeW91ckFOcywgZWxlbWVudC5xdWVzdGlvbk5VbWIpO1xuICAgIH1cbiAgICBpZihnYW1lSW5kZXggPT0gMTApe1xuICAgICAgICBjbGVhclRpbWVvdXQodGltbWVyLnRpbW1lck9iaik7XG4gICAgICAgIHdpbmRvdy5hbGVydCgnZW5kIGdhbWUnKTtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBjbG9ja0VMbS5pbm5lclRleHQgPSBgJHt0aW1tZXIudGltbWVySW5kZXh9YDtcbn07XG5cbmZ1bmN0aW9uIGdlbmVyYXRlR2FtZUluZGV4ZXMgKGFycmF5LCBzY29yZSkge1xuICAgIHZhciBjdXJyZW50SW5kZXggPSBhcnJheS5sZW5ndGgsIHRlbXBvcmFyeVZhbHVlLCByYW5kb21JbmRleDtcbiAgICB3aGlsZSAoMCAhPT0gY3VycmVudEluZGV4KSB7XG4gICAgICAgIHJhbmRvbUluZGV4ID0gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogY3VycmVudEluZGV4KTtcbiAgICAgICAgY3VycmVudEluZGV4IC09IDE7XG4gICAgICAgIHRlbXBvcmFyeVZhbHVlID0gYXJyYXlbY3VycmVudEluZGV4XTtcbiAgICAgICAgYXJyYXlbY3VycmVudEluZGV4XSA9IGFycmF5W3JhbmRvbUluZGV4XTtcbiAgICAgICAgYXJyYXlbcmFuZG9tSW5kZXhdID0gdGVtcG9yYXJ5VmFsdWU7XG4gICAgfVxuICAgIHNjb3JlLmlubmVyVGV4dCA9IDA7IFxuICAgIHJldHVybiBhcnJheTtcbn1cblxuY29uc3QgZmFkZUluT3V0U3R5bGUgPSB7XG4gICAgb3BhY2l0eTogJzAnLCBkZWxheWVkOiB7IG9wYWNpdHk6ICcxJyB9LCByZW1vdmU6IHsgb3BhY2l0eTogJzAnIH1cbn07XG5jb25zb2xlLmxvZyhkYXRhKTtcbnZhciBjb250YWluZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncXVlc3Rpb24nKTtcbnZhciBib2R5ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3dyYXAnKTtcbi8vIHZhciBWTm9kZTtcblxudmFyIHNlbGVjdFBoYXJzZSA9IGZ1bmN0aW9uIChnYW1lSW5kZXgsIHF1ZXN0aW9uSW5nYW1lLHNjb3JlRWxtLCB5b3VyQU5zKSB7XG4gICAgdmFyIHFhID0gZ2VuZXJhdGUoZ2FtZUluZGV4LCBxdWVzdGlvbkluZ2FtZSk7XG4gICAgdmFyIHF1ZXN0aW9uID0gcWEucXVlc3Rpb247XG4gICAgdmFyIE5vZGUgPSAgW107XG4gICAgY29uc29sZS5sb2coJ3JlbmRlcmluZy4uLicpO1xuICAgIGZvcihsZXQgaSA9MDsgaTxxYS5hbnN3ZXJzLmxlbmd0aDsgaSsrKXtcbiAgICAgICAgY29uc29sZS5sb2coJ0FOU1dFUiBJTkRFWDogJyt5b3VyQU5zLmluZGV4ICk7XG4gICAgICAgIGlmKGkgPT0geW91ckFOcy5JbmRleCAmJiAoeW91ckFOcy5LZXkgPT09IHlvdXJBTnMuVmFsdWUpICApe1xuICAgICAgICAgICAgTm9kZS5wdXNoKGgoJ2RpdicseyBzdHlsZToge2JhY2tncm91bmQ6J2dyZWVuJ30gfSwgcWEuYW5zd2Vyc1tpXS52YWx1ZSkpO1xuICAgICAgICAgICAgc2NvcmUrPTEwO1xuICAgICAgICAgICAgc2NvcmVFbG0uaW5uZXJUZXh0PXNjb3JlO1xuICAgICAgICB9ZWxzZSBpZih5b3VyQU5zLktleSA9PT0gcWEuYW5zd2Vyc1tpXS5rZXkpe1xuICAgICAgICAgICAgTm9kZS5wdXNoKGgoJ2RpdicseyBzdHlsZToge2JhY2tncm91bmQ6J2dyZWVuJ30gfSwgcWEuYW5zd2Vyc1tpXS52YWx1ZSkpO1xuICAgICAgICB9ZWxzZSBpZihpID09IHlvdXJBTnMuSW5kZXggJiYgISh5b3VyQU5zLktleSA9PT0geW91ckFOcy5WYWx1ZSkgKXtcbiAgICAgICAgICAgIE5vZGUucHVzaChoKCdkaXYnLHsgc3R5bGU6IHsgIGJhY2tncm91bmQ6ICdyZWQnIH0gfSwgcWEuYW5zd2Vyc1tpXS52YWx1ZSkpO1xuICAgICAgICB9ZWxzZXtcbiAgICAgICAgICAgIE5vZGUucHVzaChoKCdkaXYnLCBxYS5hbnN3ZXJzW2ldLnZhbHVlKSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJue1xuICAgICAgICBub2RlOiBoKCdkaXYucXVpenonLHtzdHlsZTp7XG4gICAgICAgICAgICB0cmFuc2Zvcm06ICd0cmFuc2xhdGVZKC0yZW0pJyxcbiAgICAgICAgICAgIC8vIGRlbGF5ZWQ6IHsgdHJhbnNmb3JtOiAndHJhbnNsYXRlKDEpJywgb3BhY2l0eTogJzAnIH0sXG4gICAgICAgICAgICBkZXN0cm95OiB7IHRyYW5zZm9ybTogJ3RyYW5zbGF0ZVkoLTJlbSknLCBvcGFjaXR5OiAnMCcgfVxuICAgICAgICB9fSxbaCgnZGl2I3F1ZXN0aW9uJyxbXG4gICAgICAgICAgICBoKCdkaXYuYmlnLWltYWdlJyxbXG4gICAgICAgICAgICAgICAgaCgnaW1nJyx7IHByb3BzOiB7IHNyYzogJy4vcmVzb3VyY2UvcXVlc3Rpb24vJytxdWVzdGlvbisnLnBuZycgfSB9KVxuICAgICAgICAgICAgXSlcbiAgICAgICAgXSksXG4gICAgICAgIGgoJ2Rpdi5hbnN3ZXInLCBcbiAgICAgICAgICAgIE5vZGVcbiAgICAgICAgKV0pXG4gICAgfTtcbn07XG5cbnZhciB2aWV3UVVlcyA9ICBmdW5jdGlvbiAoZ2FtZUluZGV4LCBxdWVzdGlvbkluZ2FtZSwgc2NvcmVFbG0sIHF1ZXN0aW9uTlVtYkVsbSkge1xuICAgIHF1ZXN0aW9uTlVtYkVsbS5pbm5lclRleHQgPSAoZ2FtZUluZGV4KzEpKycvJytxdWVzdGlvbkluZ2FtZS5sZW5ndGg7XG4gICAgdmFyIHFhID0gZ2VuZXJhdGUoZ2FtZUluZGV4LCBxdWVzdGlvbkluZ2FtZSk7XG4gICAgdmFyIHRtcCA9IHNjb3JlO1xuICAgIHZhciBxdWVzdGlvbiA9IHFhLnF1ZXN0aW9uO1xuICAgIHZhciBhbnN3ZXJzID0gcWEuYW5zd2VycztcbiAgICB2YXIga2V5ID0gcWEua2V5O1xuICAgIHZhciBub2RlID0gIGFuc3dlcnMubWFwKCh2YWx1ZSwgaW5kZXgpID0+IFxuICAgICAgICBoKCdkaXYnLHsgXG4gICAgICAgICAgICBvbjoge1xuICAgICAgICAgICAgICAgIGNsaWNrOiBmdW5jdGlvbihlKXsgXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCd2YWx1ZSBhbmQgaW5kZXggeW91IGNsaWNrZWQ6ICcrdmFsdWUudmFsdWUrJzonKyBpbmRleCk7XG4gICAgICAgICAgICAgICAgICAgIGxldCBlbG0gPSBlLnRhcmdldDtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHlvdXJBTnM9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIFZhbHVlOiB2YWx1ZS52YWx1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIEluZGV4OiBpbmRleCxcbiAgICAgICAgICAgICAgICAgICAgICAgIEtleToga2V5XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIGNsZWFyVGltZW91dCh0aW1tZXIudGltbWVyT2JqKTtcbiAgICAgICAgICAgICAgICAgICAgcmVuZGVyKHF1ZXN0aW9uSW5nYW1lLHNjb3JlRWxtLHlvdXJBTnMscXVlc3Rpb25OVW1iRWxtKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IFxuICAgICAgICB9LCB2YWx1ZS52YWx1ZSlcbiAgICApO1xuICAgIHJldHVybntcbiAgICAgICAgbm9kZTogaCgnZGl2LnF1aXp6Jyx7IHN0eWxlOiB7XG4gICAgICAgICAgICB0cmFuc2Zvcm06ICd0cmFuc2xhdGVZKDJlbSknLFxuICAgICAgICAgICAgLy8gZGVsYXllZDogeyB0cmFuc2Zvcm06ICd0cmFuc2xhdGUoMCknLCBvcGFjaXR5OiAnMScgfSxcbiAgICAgICAgICAgIGRlc3Ryb3k6IHsgdHJhbnNmb3JtOiAndHJhbnNsYXRlWSgyZW0pJyB9XG4gICAgICAgIH19LFtoKCdkaXYjcXVlc3Rpb24nLFtcbiAgICAgICAgICAgIGgoJ2Rpdi5iaWctaW1hZ2UnLFtcbiAgICAgICAgICAgICAgICBoKCdpbWcnLHsgcHJvcHM6IHsgc3JjOiAnLi9yZXNvdXJjZS9xdWVzdGlvbi8nK3F1ZXN0aW9uKycucG5nJyB9IH0pXG4gICAgICAgICAgICBdKVxuICAgICAgICBdKSxcbiAgICAgICAgaCgnZGl2LmFuc3dlcicsIFxuICAgICAgICAgICAgbm9kZVxuICAgICAgICApXSksXG4gICAgICAgIFNjb3JlIDogdG1wXG4gICAgfTtcbn07XG5cbnZhciBnZW5lcmF0ZSA9IGZ1bmN0aW9uIChnYW1lSW5kZXgsIGRhdGEpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICBxdWVzdGlvbjogZGF0YVtnYW1lSW5kZXhdLnF1ZXN0aW9uLFxuICAgICAgICBhbnN3ZXJzOiAgZGF0YVtnYW1lSW5kZXhdLmFuc3dlcixcbiAgICAgICAga2V5OiBkYXRhW2dhbWVJbmRleF0ua2V5XG4gICAgfTtcbn07XG5cbndpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdET01Db250ZW50TG9hZGVkJywgKCkgPT4ge1xuICAgIC8va2hvaSB0YW8gdHJvIGNob2lcbiAgICBsZXQgcXVlc3Rpb25JbkdhbWUgPSBnZW5lcmF0ZUdhbWVJbmRleGVzKGRhdGEucXVlcyxlbGVtZW50LnNjb3JlRWxtKTtcbiAgICBjb25zb2xlLmxvZygncXVlc3Rpb25JbkdhbWUucXVlc3Rpb24gJytxdWVzdGlvbkluR2FtZVswXS5xdWVzdGlvbik7XG4gICAgcHJlbG9hZChxdWVzdGlvbkluR2FtZSk7XG5cbiAgICB2YXIgdXBkYXRlVmlldyA9IHZpZXdRVWVzKGdhbWVJbmRleCxxdWVzdGlvbkluR2FtZSxlbGVtZW50LnNjb3JlRWxtLGVsZW1lbnQucXVlc3Rpb25OVW1iKTtcbiAgICBWTm9kZSA9IHBhdGNoKGVsZW1lbnQucXVpenosIHVwZGF0ZVZpZXcubm9kZSk7XG4gICAgY29uc29sZS5sb2coVk5vZGUpO1xuICAgIHJ1bnRpbWUodGltbWVyLnRpbWUscXVlc3Rpb25JbkdhbWUpO1xuXG59KTsiXSwibmFtZXMiOlsiaXMuYXJyYXkiLCJpcy5wcmltaXRpdmUiLCJwYXRjaCIsImluaXQiLCJjbGFzc01vZHVsZSIsInByb3BzTW9kdWxlIiwic3R5bGVNb2R1bGUiLCJldmVudExpc3RlbmVyc01vZHVsZSIsImRhdGFzZXRNb2R1bGUiLCJhdHRyaWJ1dGVzTW9kdWxlIiwiTm9kZSIsImgiLCJwcm9wcyIsInNyYyIsInN0eWxlIiwidHJhbnNmb3JtIiwid3JwIiwiZG9jdW1lbnQiLCJnZXRFbGVtZW50QnlJZCIsIlZOb2RlIiwic2NvcmUiLCJnYW1lSW5kZXgiLCJtaWRkbGUiLCJnZXRFbGVtZW50c0J5Q2xhc3NOYW1lIiwiZWxlbWVudCIsInNjb3JlRWxtIiwiZ2V0RWxlbWVudHNCeVRhZ05hbWUiLCJxdWVzdGlvbk5VbWIiLCJxdWl6eiIsInRpbW1lciIsInRpbW1lck9iaiIsInVuZGVmaW5lZCIsInRpbW1lckluZGV4IiwidGltZSIsImRhdGEiLCJzZWxlY3RlZCIsInF1ZXMiLCJxdWVzdGlvbiIsImtleSIsImFuc3dlciIsInZhbHVlIiwicHJlbG9hZCIsImltYWdlcyIsImEiLCJpbWFnZUFycmF5IiwiY29uc29sZSIsImxvZyIsImkiLCJsZW5ndGgiLCJpbWFnZU9iaiIsIkltYWdlIiwicHVzaCIsInJlbmRlciIsInlvdXJBbnMiLCJxdWVzdGlvbk5VbWJFbG0iLCJzZWxlY3RQaGFyc2UiLCJub2RlIiwicnVudGltZSIsImZ1bmMiLCJ2aWV3UVVlcyIsInNldFRpbWVvdXQiLCJjbG9ja0VMbSIsInNldEludGVydmFsIiwidXBkYXRlQ2xvY2siLCJjbGVhclRpbWVvdXQiLCJ5b3VyQU5zIiwiVmFsdWUiLCJJbmRleCIsIktleSIsImdlbmVyYXRlIiwid2luZG93IiwiYWxlcnQiLCJpbm5lclRleHQiLCJnZW5lcmF0ZUdhbWVJbmRleGVzIiwiYXJyYXkiLCJjdXJyZW50SW5kZXgiLCJ0ZW1wb3JhcnlWYWx1ZSIsInJhbmRvbUluZGV4IiwiTWF0aCIsImZsb29yIiwicmFuZG9tIiwicXVlc3Rpb25JbmdhbWUiLCJxYSIsImFuc3dlcnMiLCJpbmRleCIsImJhY2tncm91bmQiLCJkZXN0cm95Iiwib3BhY2l0eSIsInRtcCIsIm1hcCIsIm9uIiwiY2xpY2siLCJlIiwidGFyZ2V0IiwiU2NvcmUiLCJhZGRFdmVudExpc3RlbmVyIiwicXVlc3Rpb25JbkdhbWUiLCJ1cGRhdGVWaWV3Il0sIm1hcHBpbmdzIjoiOzs7SUFBTyxTQUFTLEtBQUssQ0FBQyxHQUFHLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFFO0lBQ3RELElBQUksTUFBTSxHQUFHLEdBQUcsSUFBSSxLQUFLLFNBQVMsR0FBRyxTQUFTLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQztJQUMxRCxJQUFJLE9BQU8sRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxDQUFDO0lBQ25EOztJQ0hPLE1BQU0sS0FBSyxHQUFHLEtBQUssQ0FBQyxPQUFPLENBQUM7SUFDNUIsU0FBUyxTQUFTLENBQUMsQ0FBQyxFQUFFO0lBQzdCLElBQUksT0FBTyxPQUFPLENBQUMsS0FBSyxRQUFRLElBQUksT0FBTyxDQUFDLEtBQUssUUFBUSxDQUFDO0lBQzFEOztJQ0hBLFNBQVMsYUFBYSxDQUFDLE9BQU8sRUFBRSxPQUFPLEVBQUU7SUFDekMsSUFBSSxPQUFPLFFBQVEsQ0FBQyxhQUFhLENBQUMsT0FBTyxFQUFFLE9BQU8sQ0FBQyxDQUFDO0lBQ3BELENBQUM7SUFDRCxTQUFTLGVBQWUsQ0FBQyxZQUFZLEVBQUUsYUFBYSxFQUFFLE9BQU8sRUFBRTtJQUMvRCxJQUFJLE9BQU8sUUFBUSxDQUFDLGVBQWUsQ0FBQyxZQUFZLEVBQUUsYUFBYSxFQUFFLE9BQU8sQ0FBQyxDQUFDO0lBQzFFLENBQUM7SUFDRCxTQUFTLGNBQWMsQ0FBQyxJQUFJLEVBQUU7SUFDOUIsSUFBSSxPQUFPLFFBQVEsQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDekMsQ0FBQztJQUNELFNBQVMsYUFBYSxDQUFDLElBQUksRUFBRTtJQUM3QixJQUFJLE9BQU8sUUFBUSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUN4QyxDQUFDO0lBQ0QsU0FBUyxZQUFZLENBQUMsVUFBVSxFQUFFLE9BQU8sRUFBRSxhQUFhLEVBQUU7SUFDMUQsSUFBSSxVQUFVLENBQUMsWUFBWSxDQUFDLE9BQU8sRUFBRSxhQUFhLENBQUMsQ0FBQztJQUNwRCxDQUFDO0lBQ0QsU0FBUyxXQUFXLENBQUMsSUFBSSxFQUFFLEtBQUssRUFBRTtJQUNsQyxJQUFJLElBQUksQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDNUIsQ0FBQztJQUNELFNBQVMsV0FBVyxDQUFDLElBQUksRUFBRSxLQUFLLEVBQUU7SUFDbEMsSUFBSSxJQUFJLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQzVCLENBQUM7SUFDRCxTQUFTLFVBQVUsQ0FBQyxJQUFJLEVBQUU7SUFDMUIsSUFBSSxPQUFPLElBQUksQ0FBQyxVQUFVLENBQUM7SUFDM0IsQ0FBQztJQUNELFNBQVMsV0FBVyxDQUFDLElBQUksRUFBRTtJQUMzQixJQUFJLE9BQU8sSUFBSSxDQUFDLFdBQVcsQ0FBQztJQUM1QixDQUFDO0lBQ0QsU0FBUyxPQUFPLENBQUMsR0FBRyxFQUFFO0lBQ3RCLElBQUksT0FBTyxHQUFHLENBQUMsT0FBTyxDQUFDO0lBQ3ZCLENBQUM7SUFDRCxTQUFTLGNBQWMsQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFO0lBQ3BDLElBQUksSUFBSSxDQUFDLFdBQVcsR0FBRyxJQUFJLENBQUM7SUFDNUIsQ0FBQztJQUNELFNBQVMsY0FBYyxDQUFDLElBQUksRUFBRTtJQUM5QixJQUFJLE9BQU8sSUFBSSxDQUFDLFdBQVcsQ0FBQztJQUM1QixDQUFDO0lBQ0QsU0FBUyxTQUFTLENBQUMsSUFBSSxFQUFFO0lBQ3pCLElBQUksT0FBTyxJQUFJLENBQUMsUUFBUSxLQUFLLENBQUMsQ0FBQztJQUMvQixDQUFDO0lBQ0QsU0FBUyxNQUFNLENBQUMsSUFBSSxFQUFFO0lBQ3RCLElBQUksT0FBTyxJQUFJLENBQUMsUUFBUSxLQUFLLENBQUMsQ0FBQztJQUMvQixDQUFDO0lBQ0QsU0FBUyxTQUFTLENBQUMsSUFBSSxFQUFFO0lBQ3pCLElBQUksT0FBTyxJQUFJLENBQUMsUUFBUSxLQUFLLENBQUMsQ0FBQztJQUMvQixDQUFDO0lBQ00sTUFBTSxVQUFVLEdBQUc7SUFDMUIsSUFBSSxhQUFhO0lBQ2pCLElBQUksZUFBZTtJQUNuQixJQUFJLGNBQWM7SUFDbEIsSUFBSSxhQUFhO0lBQ2pCLElBQUksWUFBWTtJQUNoQixJQUFJLFdBQVc7SUFDZixJQUFJLFdBQVc7SUFDZixJQUFJLFVBQVU7SUFDZCxJQUFJLFdBQVc7SUFDZixJQUFJLE9BQU87SUFDWCxJQUFJLGNBQWM7SUFDbEIsSUFBSSxjQUFjO0lBQ2xCLElBQUksU0FBUztJQUNiLElBQUksTUFBTTtJQUNWLElBQUksU0FBUztJQUNiLENBQUM7O0lDMURELFNBQVMsT0FBTyxDQUFDLENBQUMsRUFBRTtJQUNwQixJQUFJLE9BQU8sQ0FBQyxLQUFLLFNBQVMsQ0FBQztJQUMzQixDQUFDO0lBQ0QsU0FBUyxLQUFLLENBQUMsQ0FBQyxFQUFFO0lBQ2xCLElBQUksT0FBTyxDQUFDLEtBQUssU0FBUyxDQUFDO0lBQzNCLENBQUM7SUFDRCxNQUFNLFNBQVMsR0FBRyxLQUFLLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsU0FBUyxFQUFFLFNBQVMsQ0FBQyxDQUFDO0lBQzFELFNBQVMsU0FBUyxDQUFDLE1BQU0sRUFBRSxNQUFNLEVBQUU7SUFDbkMsSUFBSSxJQUFJLEVBQUUsRUFBRSxFQUFFLENBQUM7SUFDZixJQUFJLE1BQU0sU0FBUyxHQUFHLE1BQU0sQ0FBQyxHQUFHLEtBQUssTUFBTSxDQUFDLEdBQUcsQ0FBQztJQUNoRCxJQUFJLE1BQU0sUUFBUSxHQUFHLENBQUMsQ0FBQyxFQUFFLEdBQUcsTUFBTSxDQUFDLElBQUksTUFBTSxJQUFJLElBQUksRUFBRSxLQUFLLEtBQUssQ0FBQyxHQUFHLEtBQUssQ0FBQyxHQUFHLEVBQUUsQ0FBQyxFQUFFLE9BQU8sQ0FBQyxFQUFFLEdBQUcsTUFBTSxDQUFDLElBQUksTUFBTSxJQUFJLElBQUksRUFBRSxLQUFLLEtBQUssQ0FBQyxHQUFHLEtBQUssQ0FBQyxHQUFHLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQztJQUN6SixJQUFJLE1BQU0sU0FBUyxHQUFHLE1BQU0sQ0FBQyxHQUFHLEtBQUssTUFBTSxDQUFDLEdBQUcsQ0FBQztJQUNoRCxJQUFJLE9BQU8sU0FBUyxJQUFJLFNBQVMsSUFBSSxRQUFRLENBQUM7SUFDOUMsQ0FBQztJQUNELFNBQVMsT0FBTyxDQUFDLEtBQUssRUFBRTtJQUN4QixJQUFJLE9BQU8sS0FBSyxDQUFDLEdBQUcsS0FBSyxTQUFTLENBQUM7SUFDbkMsQ0FBQztJQUNELFNBQVMsaUJBQWlCLENBQUMsUUFBUSxFQUFFLFFBQVEsRUFBRSxNQUFNLEVBQUU7SUFDdkQsSUFBSSxJQUFJLEVBQUUsQ0FBQztJQUNYLElBQUksTUFBTSxHQUFHLEdBQUcsRUFBRSxDQUFDO0lBQ25CLElBQUksS0FBSyxJQUFJLENBQUMsR0FBRyxRQUFRLEVBQUUsQ0FBQyxJQUFJLE1BQU0sRUFBRSxFQUFFLENBQUMsRUFBRTtJQUM3QyxRQUFRLE1BQU0sR0FBRyxHQUFHLENBQUMsRUFBRSxHQUFHLFFBQVEsQ0FBQyxDQUFDLENBQUMsTUFBTSxJQUFJLElBQUksRUFBRSxLQUFLLEtBQUssQ0FBQyxHQUFHLEtBQUssQ0FBQyxHQUFHLEVBQUUsQ0FBQyxHQUFHLENBQUM7SUFDbkYsUUFBUSxJQUFJLEdBQUcsS0FBSyxTQUFTLEVBQUU7SUFDL0IsWUFBWSxHQUFHLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQ3pCLFNBQVM7SUFDVCxLQUFLO0lBQ0wsSUFBSSxPQUFPLEdBQUcsQ0FBQztJQUNmLENBQUM7SUFDRCxNQUFNLEtBQUssR0FBRztJQUNkLElBQUksUUFBUTtJQUNaLElBQUksUUFBUTtJQUNaLElBQUksUUFBUTtJQUNaLElBQUksU0FBUztJQUNiLElBQUksS0FBSztJQUNULElBQUksTUFBTTtJQUNWLENBQUMsQ0FBQztJQUNLLFNBQVMsSUFBSSxDQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUU7SUFDdEMsSUFBSSxJQUFJLENBQUMsQ0FBQztJQUNWLElBQUksSUFBSSxDQUFDLENBQUM7SUFDVixJQUFJLE1BQU0sR0FBRyxHQUFHO0lBQ2hCLFFBQVEsTUFBTSxFQUFFLEVBQUU7SUFDbEIsUUFBUSxNQUFNLEVBQUUsRUFBRTtJQUNsQixRQUFRLE1BQU0sRUFBRSxFQUFFO0lBQ2xCLFFBQVEsT0FBTyxFQUFFLEVBQUU7SUFDbkIsUUFBUSxHQUFHLEVBQUUsRUFBRTtJQUNmLFFBQVEsSUFBSSxFQUFFLEVBQUU7SUFDaEIsS0FBSyxDQUFDO0lBQ04sSUFBSSxNQUFNLEdBQUcsR0FBRyxNQUFNLEtBQUssU0FBUyxHQUFHLE1BQU0sR0FBRyxVQUFVLENBQUM7SUFDM0QsSUFBSSxLQUFLLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEtBQUssQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDLEVBQUU7SUFDdkMsUUFBUSxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDO0lBQzNCLFFBQVEsS0FBSyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxPQUFPLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQyxFQUFFO0lBQzdDLFlBQVksTUFBTSxJQUFJLEdBQUcsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQzlDLFlBQVksSUFBSSxJQUFJLEtBQUssU0FBUyxFQUFFO0lBQ3BDLGdCQUFnQixHQUFHLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ3pDLGFBQWE7SUFDYixTQUFTO0lBQ1QsS0FBSztJQUNMLElBQUksU0FBUyxXQUFXLENBQUMsR0FBRyxFQUFFO0lBQzlCLFFBQVEsTUFBTSxFQUFFLEdBQUcsR0FBRyxDQUFDLEVBQUUsR0FBRyxHQUFHLEdBQUcsR0FBRyxDQUFDLEVBQUUsR0FBRyxFQUFFLENBQUM7SUFDOUM7SUFDQTtJQUNBLFFBQVEsTUFBTSxPQUFPLEdBQUcsR0FBRyxDQUFDLFlBQVksQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUNsRCxRQUFRLE1BQU0sQ0FBQyxHQUFHLE9BQU8sR0FBRyxHQUFHLEdBQUcsT0FBTyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxDQUFDO0lBQ3BFLFFBQVEsT0FBTyxLQUFLLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxXQUFXLEVBQUUsR0FBRyxFQUFFLEdBQUcsQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsU0FBUyxFQUFFLEdBQUcsQ0FBQyxDQUFDO0lBQ3RGLEtBQUs7SUFDTCxJQUFJLFNBQVMsVUFBVSxDQUFDLFFBQVEsRUFBRSxTQUFTLEVBQUU7SUFDN0MsUUFBUSxPQUFPLFNBQVMsSUFBSSxHQUFHO0lBQy9CLFlBQVksSUFBSSxFQUFFLFNBQVMsS0FBSyxDQUFDLEVBQUU7SUFDbkMsZ0JBQWdCLE1BQU0sTUFBTSxHQUFHLEdBQUcsQ0FBQyxVQUFVLENBQUMsUUFBUSxDQUFDLENBQUM7SUFDeEQsZ0JBQWdCLEdBQUcsQ0FBQyxXQUFXLENBQUMsTUFBTSxFQUFFLFFBQVEsQ0FBQyxDQUFDO0lBQ2xELGFBQWE7SUFDYixTQUFTLENBQUM7SUFDVixLQUFLO0lBQ0wsSUFBSSxTQUFTLFNBQVMsQ0FBQyxLQUFLLEVBQUUsa0JBQWtCLEVBQUU7SUFDbEQsUUFBUSxJQUFJLEVBQUUsRUFBRSxFQUFFLENBQUM7SUFDbkIsUUFBUSxJQUFJLENBQUMsQ0FBQztJQUNkLFFBQVEsSUFBSSxJQUFJLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQztJQUM5QixRQUFRLElBQUksSUFBSSxLQUFLLFNBQVMsRUFBRTtJQUNoQyxZQUFZLE1BQU0sSUFBSSxHQUFHLENBQUMsRUFBRSxHQUFHLElBQUksQ0FBQyxJQUFJLE1BQU0sSUFBSSxJQUFJLEVBQUUsS0FBSyxLQUFLLENBQUMsR0FBRyxLQUFLLENBQUMsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDO0lBQ3ZGLFlBQVksSUFBSSxLQUFLLENBQUMsSUFBSSxDQUFDLEVBQUU7SUFDN0IsZ0JBQWdCLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUM1QixnQkFBZ0IsSUFBSSxHQUFHLEtBQUssQ0FBQyxJQUFJLENBQUM7SUFDbEMsYUFBYTtJQUNiLFNBQVM7SUFDVCxRQUFRLE1BQU0sUUFBUSxHQUFHLEtBQUssQ0FBQyxRQUFRLENBQUM7SUFDeEMsUUFBUSxNQUFNLEdBQUcsR0FBRyxLQUFLLENBQUMsR0FBRyxDQUFDO0lBQzlCLFFBQVEsSUFBSSxHQUFHLEtBQUssR0FBRyxFQUFFO0lBQ3pCLFlBQVksSUFBSSxPQUFPLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxFQUFFO0lBQ3JDLGdCQUFnQixLQUFLLENBQUMsSUFBSSxHQUFHLEVBQUUsQ0FBQztJQUNoQyxhQUFhO0lBQ2IsWUFBWSxLQUFLLENBQUMsR0FBRyxHQUFHLEdBQUcsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ3RELFNBQVM7SUFDVCxhQUFhLElBQUksR0FBRyxLQUFLLFNBQVMsRUFBRTtJQUNwQztJQUNBLFlBQVksTUFBTSxPQUFPLEdBQUcsR0FBRyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUM3QyxZQUFZLE1BQU0sTUFBTSxHQUFHLEdBQUcsQ0FBQyxPQUFPLENBQUMsR0FBRyxFQUFFLE9BQU8sQ0FBQyxDQUFDO0lBQ3JELFlBQVksTUFBTSxJQUFJLEdBQUcsT0FBTyxHQUFHLENBQUMsR0FBRyxPQUFPLEdBQUcsR0FBRyxDQUFDLE1BQU0sQ0FBQztJQUM1RCxZQUFZLE1BQU0sR0FBRyxHQUFHLE1BQU0sR0FBRyxDQUFDLEdBQUcsTUFBTSxHQUFHLEdBQUcsQ0FBQyxNQUFNLENBQUM7SUFDekQsWUFBWSxNQUFNLEdBQUcsR0FBRyxPQUFPLEtBQUssQ0FBQyxDQUFDLElBQUksTUFBTSxLQUFLLENBQUMsQ0FBQztJQUN2RCxrQkFBa0IsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsR0FBRyxDQUFDLENBQUM7SUFDbkQsa0JBQWtCLEdBQUcsQ0FBQztJQUN0QixZQUFZLE1BQU0sR0FBRyxJQUFJLEtBQUssQ0FBQyxHQUFHO0lBQ2xDLGdCQUFnQixLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksS0FBSyxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUMsRUFBRSxFQUFFO0lBQ25ELHNCQUFzQixHQUFHLENBQUMsZUFBZSxDQUFDLENBQUMsRUFBRSxHQUFHLEVBQUUsSUFBSSxDQUFDO0lBQ3ZELHNCQUFzQixHQUFHLENBQUMsYUFBYSxDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO0lBQ3BELFlBQVksSUFBSSxJQUFJLEdBQUcsR0FBRztJQUMxQixnQkFBZ0IsR0FBRyxDQUFDLFlBQVksQ0FBQyxJQUFJLEVBQUUsR0FBRyxDQUFDLEtBQUssQ0FBQyxJQUFJLEdBQUcsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUM7SUFDakUsWUFBWSxJQUFJLE1BQU0sR0FBRyxDQUFDO0lBQzFCLGdCQUFnQixHQUFHLENBQUMsWUFBWSxDQUFDLE9BQU8sRUFBRSxHQUFHLENBQUMsS0FBSyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUM7SUFDbEYsWUFBWSxLQUFLLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQztJQUNsRCxnQkFBZ0IsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFTLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFDaEQsWUFBWSxJQUFJQSxLQUFRLENBQUMsUUFBUSxDQUFDLEVBQUU7SUFDcEMsZ0JBQWdCLEtBQUssQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsUUFBUSxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUMsRUFBRTtJQUN0RCxvQkFBb0IsTUFBTSxFQUFFLEdBQUcsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQzNDLG9CQUFvQixJQUFJLEVBQUUsSUFBSSxJQUFJLEVBQUU7SUFDcEMsd0JBQXdCLEdBQUcsQ0FBQyxXQUFXLENBQUMsR0FBRyxFQUFFLFNBQVMsQ0FBQyxFQUFFLEVBQUUsa0JBQWtCLENBQUMsQ0FBQyxDQUFDO0lBQ2hGLHFCQUFxQjtJQUNyQixpQkFBaUI7SUFDakIsYUFBYTtJQUNiLGlCQUFpQixJQUFJQyxTQUFZLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxFQUFFO0lBQy9DLGdCQUFnQixHQUFHLENBQUMsV0FBVyxDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUMsY0FBYyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO0lBQ3JFLGFBQWE7SUFDYixZQUFZLE1BQU0sSUFBSSxHQUFHLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDO0lBQ3pDLFlBQVksSUFBSSxLQUFLLENBQUMsSUFBSSxDQUFDLEVBQUU7SUFDN0IsZ0JBQWdCLENBQUMsRUFBRSxHQUFHLElBQUksQ0FBQyxNQUFNLE1BQU0sSUFBSSxJQUFJLEVBQUUsS0FBSyxLQUFLLENBQUMsR0FBRyxLQUFLLENBQUMsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxTQUFTLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFDeEcsZ0JBQWdCLElBQUksSUFBSSxDQUFDLE1BQU0sRUFBRTtJQUNqQyxvQkFBb0Isa0JBQWtCLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQ25ELGlCQUFpQjtJQUNqQixhQUFhO0lBQ2IsU0FBUztJQUNULGFBQWE7SUFDYixZQUFZLEtBQUssQ0FBQyxHQUFHLEdBQUcsR0FBRyxDQUFDLGNBQWMsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDdkQsU0FBUztJQUNULFFBQVEsT0FBTyxLQUFLLENBQUMsR0FBRyxDQUFDO0lBQ3pCLEtBQUs7SUFDTCxJQUFJLFNBQVMsU0FBUyxDQUFDLFNBQVMsRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFFLFFBQVEsRUFBRSxNQUFNLEVBQUUsa0JBQWtCLEVBQUU7SUFDeEYsUUFBUSxPQUFPLFFBQVEsSUFBSSxNQUFNLEVBQUUsRUFBRSxRQUFRLEVBQUU7SUFDL0MsWUFBWSxNQUFNLEVBQUUsR0FBRyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUM7SUFDeEMsWUFBWSxJQUFJLEVBQUUsSUFBSSxJQUFJLEVBQUU7SUFDNUIsZ0JBQWdCLEdBQUcsQ0FBQyxZQUFZLENBQUMsU0FBUyxFQUFFLFNBQVMsQ0FBQyxFQUFFLEVBQUUsa0JBQWtCLENBQUMsRUFBRSxNQUFNLENBQUMsQ0FBQztJQUN2RixhQUFhO0lBQ2IsU0FBUztJQUNULEtBQUs7SUFDTCxJQUFJLFNBQVMsaUJBQWlCLENBQUMsS0FBSyxFQUFFO0lBQ3RDLFFBQVEsSUFBSSxFQUFFLEVBQUUsRUFBRSxDQUFDO0lBQ25CLFFBQVEsTUFBTSxJQUFJLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQztJQUNoQyxRQUFRLElBQUksSUFBSSxLQUFLLFNBQVMsRUFBRTtJQUNoQyxZQUFZLENBQUMsRUFBRSxHQUFHLENBQUMsRUFBRSxHQUFHLElBQUksS0FBSyxJQUFJLElBQUksSUFBSSxLQUFLLEtBQUssQ0FBQyxHQUFHLEtBQUssQ0FBQyxHQUFHLElBQUksQ0FBQyxJQUFJLE1BQU0sSUFBSSxJQUFJLEVBQUUsS0FBSyxLQUFLLENBQUMsR0FBRyxLQUFLLENBQUMsR0FBRyxFQUFFLENBQUMsT0FBTyxNQUFNLElBQUksSUFBSSxFQUFFLEtBQUssS0FBSyxDQUFDLEdBQUcsS0FBSyxDQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFDeEwsWUFBWSxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsR0FBRyxDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDO0lBQ3ZELGdCQUFnQixHQUFHLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQ3RDLFlBQVksSUFBSSxLQUFLLENBQUMsUUFBUSxLQUFLLFNBQVMsRUFBRTtJQUM5QyxnQkFBZ0IsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEtBQUssQ0FBQyxRQUFRLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQyxFQUFFO0lBQ2hFLG9CQUFvQixNQUFNLEtBQUssR0FBRyxLQUFLLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3BELG9CQUFvQixJQUFJLEtBQUssSUFBSSxJQUFJLElBQUksT0FBTyxLQUFLLEtBQUssUUFBUSxFQUFFO0lBQ3BFLHdCQUF3QixpQkFBaUIsQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUNqRCxxQkFBcUI7SUFDckIsaUJBQWlCO0lBQ2pCLGFBQWE7SUFDYixTQUFTO0lBQ1QsS0FBSztJQUNMLElBQUksU0FBUyxZQUFZLENBQUMsU0FBUyxFQUFFLE1BQU0sRUFBRSxRQUFRLEVBQUUsTUFBTSxFQUFFO0lBQy9ELFFBQVEsSUFBSSxFQUFFLEVBQUUsRUFBRSxDQUFDO0lBQ25CLFFBQVEsT0FBTyxRQUFRLElBQUksTUFBTSxFQUFFLEVBQUUsUUFBUSxFQUFFO0lBQy9DLFlBQVksSUFBSSxTQUFTLENBQUM7SUFDMUIsWUFBWSxJQUFJLEVBQUUsQ0FBQztJQUNuQixZQUFZLE1BQU0sRUFBRSxHQUFHLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQztJQUN4QyxZQUFZLElBQUksRUFBRSxJQUFJLElBQUksRUFBRTtJQUM1QixnQkFBZ0IsSUFBSSxLQUFLLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxFQUFFO0lBQ25DLG9CQUFvQixpQkFBaUIsQ0FBQyxFQUFFLENBQUMsQ0FBQztJQUMxQyxvQkFBb0IsU0FBUyxHQUFHLEdBQUcsQ0FBQyxNQUFNLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQztJQUN0RCxvQkFBb0IsRUFBRSxHQUFHLFVBQVUsQ0FBQyxFQUFFLENBQUMsR0FBRyxFQUFFLFNBQVMsQ0FBQyxDQUFDO0lBQ3ZELG9CQUFvQixLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsR0FBRyxDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDO0lBQzlELHdCQUF3QixHQUFHLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQztJQUM5QyxvQkFBb0IsTUFBTSxVQUFVLEdBQUcsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxFQUFFLEdBQUcsRUFBRSxLQUFLLElBQUksSUFBSSxFQUFFLEtBQUssS0FBSyxDQUFDLEdBQUcsS0FBSyxDQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksTUFBTSxJQUFJLElBQUksRUFBRSxLQUFLLEtBQUssQ0FBQyxHQUFHLEtBQUssQ0FBQyxHQUFHLEVBQUUsQ0FBQyxJQUFJLE1BQU0sSUFBSSxJQUFJLEVBQUUsS0FBSyxLQUFLLENBQUMsR0FBRyxLQUFLLENBQUMsR0FBRyxFQUFFLENBQUMsTUFBTSxDQUFDO0lBQ2pNLG9CQUFvQixJQUFJLEtBQUssQ0FBQyxVQUFVLENBQUMsRUFBRTtJQUMzQyx3QkFBd0IsVUFBVSxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQztJQUMzQyxxQkFBcUI7SUFDckIseUJBQXlCO0lBQ3pCLHdCQUF3QixFQUFFLEVBQUUsQ0FBQztJQUM3QixxQkFBcUI7SUFDckIsaUJBQWlCO0lBQ2pCLHFCQUFxQjtJQUNyQjtJQUNBLG9CQUFvQixHQUFHLENBQUMsV0FBVyxDQUFDLFNBQVMsRUFBRSxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDdkQsaUJBQWlCO0lBQ2pCLGFBQWE7SUFDYixTQUFTO0lBQ1QsS0FBSztJQUNMLElBQUksU0FBUyxjQUFjLENBQUMsU0FBUyxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsa0JBQWtCLEVBQUU7SUFDekUsUUFBUSxJQUFJLFdBQVcsR0FBRyxDQUFDLENBQUM7SUFDNUIsUUFBUSxJQUFJLFdBQVcsR0FBRyxDQUFDLENBQUM7SUFDNUIsUUFBUSxJQUFJLFNBQVMsR0FBRyxLQUFLLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQztJQUN6QyxRQUFRLElBQUksYUFBYSxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNyQyxRQUFRLElBQUksV0FBVyxHQUFHLEtBQUssQ0FBQyxTQUFTLENBQUMsQ0FBQztJQUMzQyxRQUFRLElBQUksU0FBUyxHQUFHLEtBQUssQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDO0lBQ3pDLFFBQVEsSUFBSSxhQUFhLEdBQUcsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3JDLFFBQVEsSUFBSSxXQUFXLEdBQUcsS0FBSyxDQUFDLFNBQVMsQ0FBQyxDQUFDO0lBQzNDLFFBQVEsSUFBSSxXQUFXLENBQUM7SUFDeEIsUUFBUSxJQUFJLFFBQVEsQ0FBQztJQUNyQixRQUFRLElBQUksU0FBUyxDQUFDO0lBQ3RCLFFBQVEsSUFBSSxNQUFNLENBQUM7SUFDbkIsUUFBUSxPQUFPLFdBQVcsSUFBSSxTQUFTLElBQUksV0FBVyxJQUFJLFNBQVMsRUFBRTtJQUNyRSxZQUFZLElBQUksYUFBYSxJQUFJLElBQUksRUFBRTtJQUN2QyxnQkFBZ0IsYUFBYSxHQUFHLEtBQUssQ0FBQyxFQUFFLFdBQVcsQ0FBQyxDQUFDO0lBQ3JELGFBQWE7SUFDYixpQkFBaUIsSUFBSSxXQUFXLElBQUksSUFBSSxFQUFFO0lBQzFDLGdCQUFnQixXQUFXLEdBQUcsS0FBSyxDQUFDLEVBQUUsU0FBUyxDQUFDLENBQUM7SUFDakQsYUFBYTtJQUNiLGlCQUFpQixJQUFJLGFBQWEsSUFBSSxJQUFJLEVBQUU7SUFDNUMsZ0JBQWdCLGFBQWEsR0FBRyxLQUFLLENBQUMsRUFBRSxXQUFXLENBQUMsQ0FBQztJQUNyRCxhQUFhO0lBQ2IsaUJBQWlCLElBQUksV0FBVyxJQUFJLElBQUksRUFBRTtJQUMxQyxnQkFBZ0IsV0FBVyxHQUFHLEtBQUssQ0FBQyxFQUFFLFNBQVMsQ0FBQyxDQUFDO0lBQ2pELGFBQWE7SUFDYixpQkFBaUIsSUFBSSxTQUFTLENBQUMsYUFBYSxFQUFFLGFBQWEsQ0FBQyxFQUFFO0lBQzlELGdCQUFnQixVQUFVLENBQUMsYUFBYSxFQUFFLGFBQWEsRUFBRSxrQkFBa0IsQ0FBQyxDQUFDO0lBQzdFLGdCQUFnQixhQUFhLEdBQUcsS0FBSyxDQUFDLEVBQUUsV0FBVyxDQUFDLENBQUM7SUFDckQsZ0JBQWdCLGFBQWEsR0FBRyxLQUFLLENBQUMsRUFBRSxXQUFXLENBQUMsQ0FBQztJQUNyRCxhQUFhO0lBQ2IsaUJBQWlCLElBQUksU0FBUyxDQUFDLFdBQVcsRUFBRSxXQUFXLENBQUMsRUFBRTtJQUMxRCxnQkFBZ0IsVUFBVSxDQUFDLFdBQVcsRUFBRSxXQUFXLEVBQUUsa0JBQWtCLENBQUMsQ0FBQztJQUN6RSxnQkFBZ0IsV0FBVyxHQUFHLEtBQUssQ0FBQyxFQUFFLFNBQVMsQ0FBQyxDQUFDO0lBQ2pELGdCQUFnQixXQUFXLEdBQUcsS0FBSyxDQUFDLEVBQUUsU0FBUyxDQUFDLENBQUM7SUFDakQsYUFBYTtJQUNiLGlCQUFpQixJQUFJLFNBQVMsQ0FBQyxhQUFhLEVBQUUsV0FBVyxDQUFDLEVBQUU7SUFDNUQ7SUFDQSxnQkFBZ0IsVUFBVSxDQUFDLGFBQWEsRUFBRSxXQUFXLEVBQUUsa0JBQWtCLENBQUMsQ0FBQztJQUMzRSxnQkFBZ0IsR0FBRyxDQUFDLFlBQVksQ0FBQyxTQUFTLEVBQUUsYUFBYSxDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO0lBQ2pHLGdCQUFnQixhQUFhLEdBQUcsS0FBSyxDQUFDLEVBQUUsV0FBVyxDQUFDLENBQUM7SUFDckQsZ0JBQWdCLFdBQVcsR0FBRyxLQUFLLENBQUMsRUFBRSxTQUFTLENBQUMsQ0FBQztJQUNqRCxhQUFhO0lBQ2IsaUJBQWlCLElBQUksU0FBUyxDQUFDLFdBQVcsRUFBRSxhQUFhLENBQUMsRUFBRTtJQUM1RDtJQUNBLGdCQUFnQixVQUFVLENBQUMsV0FBVyxFQUFFLGFBQWEsRUFBRSxrQkFBa0IsQ0FBQyxDQUFDO0lBQzNFLGdCQUFnQixHQUFHLENBQUMsWUFBWSxDQUFDLFNBQVMsRUFBRSxXQUFXLENBQUMsR0FBRyxFQUFFLGFBQWEsQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUNoRixnQkFBZ0IsV0FBVyxHQUFHLEtBQUssQ0FBQyxFQUFFLFNBQVMsQ0FBQyxDQUFDO0lBQ2pELGdCQUFnQixhQUFhLEdBQUcsS0FBSyxDQUFDLEVBQUUsV0FBVyxDQUFDLENBQUM7SUFDckQsYUFBYTtJQUNiLGlCQUFpQjtJQUNqQixnQkFBZ0IsSUFBSSxXQUFXLEtBQUssU0FBUyxFQUFFO0lBQy9DLG9CQUFvQixXQUFXLEdBQUcsaUJBQWlCLENBQUMsS0FBSyxFQUFFLFdBQVcsRUFBRSxTQUFTLENBQUMsQ0FBQztJQUNuRixpQkFBaUI7SUFDakIsZ0JBQWdCLFFBQVEsR0FBRyxXQUFXLENBQUMsYUFBYSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQzFELGdCQUFnQixJQUFJLE9BQU8sQ0FBQyxRQUFRLENBQUMsRUFBRTtJQUN2QztJQUNBLG9CQUFvQixHQUFHLENBQUMsWUFBWSxDQUFDLFNBQVMsRUFBRSxTQUFTLENBQUMsYUFBYSxFQUFFLGtCQUFrQixDQUFDLEVBQUUsYUFBYSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQ2pILGlCQUFpQjtJQUNqQixxQkFBcUI7SUFDckIsb0JBQW9CLFNBQVMsR0FBRyxLQUFLLENBQUMsUUFBUSxDQUFDLENBQUM7SUFDaEQsb0JBQW9CLElBQUksU0FBUyxDQUFDLEdBQUcsS0FBSyxhQUFhLENBQUMsR0FBRyxFQUFFO0lBQzdELHdCQUF3QixHQUFHLENBQUMsWUFBWSxDQUFDLFNBQVMsRUFBRSxTQUFTLENBQUMsYUFBYSxFQUFFLGtCQUFrQixDQUFDLEVBQUUsYUFBYSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQ3JILHFCQUFxQjtJQUNyQix5QkFBeUI7SUFDekIsd0JBQXdCLFVBQVUsQ0FBQyxTQUFTLEVBQUUsYUFBYSxFQUFFLGtCQUFrQixDQUFDLENBQUM7SUFDakYsd0JBQXdCLEtBQUssQ0FBQyxRQUFRLENBQUMsR0FBRyxTQUFTLENBQUM7SUFDcEQsd0JBQXdCLEdBQUcsQ0FBQyxZQUFZLENBQUMsU0FBUyxFQUFFLFNBQVMsQ0FBQyxHQUFHLEVBQUUsYUFBYSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQ3RGLHFCQUFxQjtJQUNyQixpQkFBaUI7SUFDakIsZ0JBQWdCLGFBQWEsR0FBRyxLQUFLLENBQUMsRUFBRSxXQUFXLENBQUMsQ0FBQztJQUNyRCxhQUFhO0lBQ2IsU0FBUztJQUNULFFBQVEsSUFBSSxXQUFXLElBQUksU0FBUyxJQUFJLFdBQVcsSUFBSSxTQUFTLEVBQUU7SUFDbEUsWUFBWSxJQUFJLFdBQVcsR0FBRyxTQUFTLEVBQUU7SUFDekMsZ0JBQWdCLE1BQU0sR0FBRyxLQUFLLENBQUMsU0FBUyxHQUFHLENBQUMsQ0FBQyxJQUFJLElBQUksR0FBRyxJQUFJLEdBQUcsS0FBSyxDQUFDLFNBQVMsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUM7SUFDeEYsZ0JBQWdCLFNBQVMsQ0FBQyxTQUFTLEVBQUUsTUFBTSxFQUFFLEtBQUssRUFBRSxXQUFXLEVBQUUsU0FBUyxFQUFFLGtCQUFrQixDQUFDLENBQUM7SUFDaEcsYUFBYTtJQUNiLGlCQUFpQjtJQUNqQixnQkFBZ0IsWUFBWSxDQUFDLFNBQVMsRUFBRSxLQUFLLEVBQUUsV0FBVyxFQUFFLFNBQVMsQ0FBQyxDQUFDO0lBQ3ZFLGFBQWE7SUFDYixTQUFTO0lBQ1QsS0FBSztJQUNMLElBQUksU0FBUyxVQUFVLENBQUMsUUFBUSxFQUFFLEtBQUssRUFBRSxrQkFBa0IsRUFBRTtJQUM3RCxRQUFRLElBQUksRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQztJQUMvQixRQUFRLE1BQU0sSUFBSSxHQUFHLENBQUMsRUFBRSxHQUFHLEtBQUssQ0FBQyxJQUFJLE1BQU0sSUFBSSxJQUFJLEVBQUUsS0FBSyxLQUFLLENBQUMsR0FBRyxLQUFLLENBQUMsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDO0lBQ3BGLFFBQVEsQ0FBQyxFQUFFLEdBQUcsSUFBSSxLQUFLLElBQUksSUFBSSxJQUFJLEtBQUssS0FBSyxDQUFDLEdBQUcsS0FBSyxDQUFDLEdBQUcsSUFBSSxDQUFDLFFBQVEsTUFBTSxJQUFJLElBQUksRUFBRSxLQUFLLEtBQUssQ0FBQyxHQUFHLEtBQUssQ0FBQyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLFFBQVEsRUFBRSxLQUFLLENBQUMsQ0FBQztJQUM3SSxRQUFRLE1BQU0sR0FBRyxJQUFJLEtBQUssQ0FBQyxHQUFHLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQy9DLFFBQVEsTUFBTSxLQUFLLEdBQUcsUUFBUSxDQUFDLFFBQVEsQ0FBQztJQUN4QyxRQUFRLE1BQU0sRUFBRSxHQUFHLEtBQUssQ0FBQyxRQUFRLENBQUM7SUFDbEMsUUFBUSxJQUFJLFFBQVEsS0FBSyxLQUFLO0lBQzlCLFlBQVksT0FBTztJQUNuQixRQUFRLElBQUksS0FBSyxDQUFDLElBQUksS0FBSyxTQUFTLEVBQUU7SUFDdEMsWUFBWSxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsR0FBRyxDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDO0lBQ3RELGdCQUFnQixHQUFHLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsRUFBRSxLQUFLLENBQUMsQ0FBQztJQUMvQyxZQUFZLENBQUMsRUFBRSxHQUFHLENBQUMsRUFBRSxHQUFHLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxNQUFNLElBQUksSUFBSSxFQUFFLEtBQUssS0FBSyxDQUFDLEdBQUcsS0FBSyxDQUFDLEdBQUcsRUFBRSxDQUFDLE1BQU0sTUFBTSxJQUFJLElBQUksRUFBRSxLQUFLLEtBQUssQ0FBQyxHQUFHLEtBQUssQ0FBQyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRSxFQUFFLFFBQVEsRUFBRSxLQUFLLENBQUMsQ0FBQztJQUMzSixTQUFTO0lBQ1QsUUFBUSxJQUFJLE9BQU8sQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLEVBQUU7SUFDakMsWUFBWSxJQUFJLEtBQUssQ0FBQyxLQUFLLENBQUMsSUFBSSxLQUFLLENBQUMsRUFBRSxDQUFDLEVBQUU7SUFDM0MsZ0JBQWdCLElBQUksS0FBSyxLQUFLLEVBQUU7SUFDaEMsb0JBQW9CLGNBQWMsQ0FBQyxHQUFHLEVBQUUsS0FBSyxFQUFFLEVBQUUsRUFBRSxrQkFBa0IsQ0FBQyxDQUFDO0lBQ3ZFLGFBQWE7SUFDYixpQkFBaUIsSUFBSSxLQUFLLENBQUMsRUFBRSxDQUFDLEVBQUU7SUFDaEMsZ0JBQWdCLElBQUksS0FBSyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUM7SUFDeEMsb0JBQW9CLEdBQUcsQ0FBQyxjQUFjLENBQUMsR0FBRyxFQUFFLEVBQUUsQ0FBQyxDQUFDO0lBQ2hELGdCQUFnQixTQUFTLENBQUMsR0FBRyxFQUFFLElBQUksRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLGtCQUFrQixDQUFDLENBQUM7SUFDL0UsYUFBYTtJQUNiLGlCQUFpQixJQUFJLEtBQUssQ0FBQyxLQUFLLENBQUMsRUFBRTtJQUNuQyxnQkFBZ0IsWUFBWSxDQUFDLEdBQUcsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLEtBQUssQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUM7SUFDOUQsYUFBYTtJQUNiLGlCQUFpQixJQUFJLEtBQUssQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEVBQUU7SUFDM0MsZ0JBQWdCLEdBQUcsQ0FBQyxjQUFjLENBQUMsR0FBRyxFQUFFLEVBQUUsQ0FBQyxDQUFDO0lBQzVDLGFBQWE7SUFDYixTQUFTO0lBQ1QsYUFBYSxJQUFJLFFBQVEsQ0FBQyxJQUFJLEtBQUssS0FBSyxDQUFDLElBQUksRUFBRTtJQUMvQyxZQUFZLElBQUksS0FBSyxDQUFDLEtBQUssQ0FBQyxFQUFFO0lBQzlCLGdCQUFnQixZQUFZLENBQUMsR0FBRyxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsS0FBSyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQztJQUM5RCxhQUFhO0lBQ2IsWUFBWSxHQUFHLENBQUMsY0FBYyxDQUFDLEdBQUcsRUFBRSxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDaEQsU0FBUztJQUNULFFBQVEsQ0FBQyxFQUFFLEdBQUcsSUFBSSxLQUFLLElBQUksSUFBSSxJQUFJLEtBQUssS0FBSyxDQUFDLEdBQUcsS0FBSyxDQUFDLEdBQUcsSUFBSSxDQUFDLFNBQVMsTUFBTSxJQUFJLElBQUksRUFBRSxLQUFLLEtBQUssQ0FBQyxHQUFHLEtBQUssQ0FBQyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLFFBQVEsRUFBRSxLQUFLLENBQUMsQ0FBQztJQUM5SSxLQUFLO0lBQ0wsSUFBSSxPQUFPLFNBQVMsS0FBSyxDQUFDLFFBQVEsRUFBRSxLQUFLLEVBQUU7SUFDM0MsUUFBUSxJQUFJLENBQUMsRUFBRSxHQUFHLEVBQUUsTUFBTSxDQUFDO0lBQzNCLFFBQVEsTUFBTSxrQkFBa0IsR0FBRyxFQUFFLENBQUM7SUFDdEMsUUFBUSxLQUFLLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxHQUFHLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQztJQUMzQyxZQUFZLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQztJQUN6QixRQUFRLElBQUksQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLEVBQUU7SUFDaEMsWUFBWSxRQUFRLEdBQUcsV0FBVyxDQUFDLFFBQVEsQ0FBQyxDQUFDO0lBQzdDLFNBQVM7SUFDVCxRQUFRLElBQUksU0FBUyxDQUFDLFFBQVEsRUFBRSxLQUFLLENBQUMsRUFBRTtJQUN4QyxZQUFZLFVBQVUsQ0FBQyxRQUFRLEVBQUUsS0FBSyxFQUFFLGtCQUFrQixDQUFDLENBQUM7SUFDNUQsU0FBUztJQUNULGFBQWE7SUFDYixZQUFZLEdBQUcsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDO0lBQy9CLFlBQVksTUFBTSxHQUFHLEdBQUcsQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDekMsWUFBWSxTQUFTLENBQUMsS0FBSyxFQUFFLGtCQUFrQixDQUFDLENBQUM7SUFDakQsWUFBWSxJQUFJLE1BQU0sS0FBSyxJQUFJLEVBQUU7SUFDakMsZ0JBQWdCLEdBQUcsQ0FBQyxZQUFZLENBQUMsTUFBTSxFQUFFLEtBQUssQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO0lBQzFFLGdCQUFnQixZQUFZLENBQUMsTUFBTSxFQUFFLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO0lBQ3ZELGFBQWE7SUFDYixTQUFTO0lBQ1QsUUFBUSxLQUFLLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLGtCQUFrQixDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUMsRUFBRTtJQUN4RCxZQUFZLGtCQUFrQixDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLGtCQUFrQixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDMUUsU0FBUztJQUNULFFBQVEsS0FBSyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxHQUFHLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUM7SUFDNUMsWUFBWSxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7SUFDMUIsUUFBUSxPQUFPLEtBQUssQ0FBQztJQUNyQixLQUFLLENBQUM7SUFDTjs7SUNwVkEsU0FBUyxXQUFXLENBQUMsUUFBUSxFQUFFLEtBQUssRUFBRTtJQUN0QyxJQUFJLElBQUksR0FBRyxDQUFDO0lBQ1osSUFBSSxJQUFJLElBQUksQ0FBQztJQUNiLElBQUksTUFBTSxHQUFHLEdBQUcsS0FBSyxDQUFDLEdBQUcsQ0FBQztJQUMxQixJQUFJLElBQUksUUFBUSxHQUFHLFFBQVEsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO0lBQ3ZDLElBQUksSUFBSSxLQUFLLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7SUFDakMsSUFBSSxJQUFJLENBQUMsUUFBUSxJQUFJLENBQUMsS0FBSztJQUMzQixRQUFRLE9BQU87SUFDZixJQUFJLElBQUksUUFBUSxLQUFLLEtBQUs7SUFDMUIsUUFBUSxPQUFPO0lBQ2YsSUFBSSxRQUFRLEdBQUcsUUFBUSxJQUFJLEVBQUUsQ0FBQztJQUM5QixJQUFJLEtBQUssR0FBRyxLQUFLLElBQUksRUFBRSxDQUFDO0lBQ3hCLElBQUksS0FBSyxJQUFJLElBQUksUUFBUSxFQUFFO0lBQzNCLFFBQVEsSUFBSSxRQUFRLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxFQUFFO0lBQ2xGO0lBQ0EsWUFBWSxHQUFHLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUN2QyxTQUFTO0lBQ1QsS0FBSztJQUNMLElBQUksS0FBSyxJQUFJLElBQUksS0FBSyxFQUFFO0lBQ3hCLFFBQVEsR0FBRyxHQUFHLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUMxQixRQUFRLElBQUksR0FBRyxLQUFLLFFBQVEsQ0FBQyxJQUFJLENBQUMsRUFBRTtJQUNwQyxZQUFZLEdBQUcsQ0FBQyxTQUFTLENBQUMsR0FBRyxHQUFHLEtBQUssR0FBRyxRQUFRLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUN4RCxTQUFTO0lBQ1QsS0FBSztJQUNMLENBQUM7SUFDTSxNQUFNLFdBQVcsR0FBRyxFQUFFLE1BQU0sRUFBRSxXQUFXLEVBQUUsTUFBTSxFQUFFLFdBQVcsRUFBRTs7SUN6QnZFLFNBQVMsV0FBVyxDQUFDLFFBQVEsRUFBRSxLQUFLLEVBQUU7SUFDdEMsSUFBSSxJQUFJLEdBQUcsQ0FBQztJQUNaLElBQUksSUFBSSxHQUFHLENBQUM7SUFDWixJQUFJLElBQUksR0FBRyxDQUFDO0lBQ1osSUFBSSxNQUFNLEdBQUcsR0FBRyxLQUFLLENBQUMsR0FBRyxDQUFDO0lBQzFCLElBQUksSUFBSSxRQUFRLEdBQUcsUUFBUSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7SUFDdkMsSUFBSSxJQUFJLEtBQUssR0FBRyxLQUFLLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQztJQUNqQyxJQUFJLElBQUksQ0FBQyxRQUFRLElBQUksQ0FBQyxLQUFLO0lBQzNCLFFBQVEsT0FBTztJQUNmLElBQUksSUFBSSxRQUFRLEtBQUssS0FBSztJQUMxQixRQUFRLE9BQU87SUFDZixJQUFJLFFBQVEsR0FBRyxRQUFRLElBQUksRUFBRSxDQUFDO0lBQzlCLElBQUksS0FBSyxHQUFHLEtBQUssSUFBSSxFQUFFLENBQUM7SUFDeEIsSUFBSSxLQUFLLEdBQUcsSUFBSSxLQUFLLEVBQUU7SUFDdkIsUUFBUSxHQUFHLEdBQUcsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQ3pCLFFBQVEsR0FBRyxHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUM1QixRQUFRLElBQUksR0FBRyxLQUFLLEdBQUcsS0FBSyxHQUFHLEtBQUssT0FBTyxJQUFJLEdBQUcsQ0FBQyxHQUFHLENBQUMsS0FBSyxHQUFHLENBQUMsRUFBRTtJQUNsRSxZQUFZLEdBQUcsQ0FBQyxHQUFHLENBQUMsR0FBRyxHQUFHLENBQUM7SUFDM0IsU0FBUztJQUNULEtBQUs7SUFDTCxDQUFDO0lBQ00sTUFBTSxXQUFXLEdBQUcsRUFBRSxNQUFNLEVBQUUsV0FBVyxFQUFFLE1BQU0sRUFBRSxXQUFXLEVBQUU7O0lDckJ2RTtJQUNBLE1BQU0sR0FBRyxHQUFHLENBQUMsT0FBTyxNQUFNLEtBQUssV0FBVztJQUMxQyxJQUFJLE1BQU0sQ0FBQyxxQkFBcUIsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDO0lBQzdDLElBQUksVUFBVSxDQUFDO0lBQ2YsTUFBTSxTQUFTLEdBQUcsVUFBVSxFQUFFLEVBQUU7SUFDaEMsSUFBSSxHQUFHLENBQUMsWUFBWTtJQUNwQixRQUFRLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQztJQUNoQixLQUFLLENBQUMsQ0FBQztJQUNQLENBQUMsQ0FBQztJQUNGLElBQUksWUFBWSxHQUFHLEtBQUssQ0FBQztJQUN6QixTQUFTLFlBQVksQ0FBQyxHQUFHLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBRTtJQUN0QyxJQUFJLFNBQVMsQ0FBQyxZQUFZO0lBQzFCLFFBQVEsR0FBRyxDQUFDLElBQUksQ0FBQyxHQUFHLEdBQUcsQ0FBQztJQUN4QixLQUFLLENBQUMsQ0FBQztJQUNQLENBQUM7SUFDRCxTQUFTLFdBQVcsQ0FBQyxRQUFRLEVBQUUsS0FBSyxFQUFFO0lBQ3RDLElBQUksSUFBSSxHQUFHLENBQUM7SUFDWixJQUFJLElBQUksSUFBSSxDQUFDO0lBQ2IsSUFBSSxNQUFNLEdBQUcsR0FBRyxLQUFLLENBQUMsR0FBRyxDQUFDO0lBQzFCLElBQUksSUFBSSxRQUFRLEdBQUcsUUFBUSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7SUFDdkMsSUFBSSxJQUFJLEtBQUssR0FBRyxLQUFLLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQztJQUNqQyxJQUFJLElBQUksQ0FBQyxRQUFRLElBQUksQ0FBQyxLQUFLO0lBQzNCLFFBQVEsT0FBTztJQUNmLElBQUksSUFBSSxRQUFRLEtBQUssS0FBSztJQUMxQixRQUFRLE9BQU87SUFDZixJQUFJLFFBQVEsR0FBRyxRQUFRLElBQUksRUFBRSxDQUFDO0lBQzlCLElBQUksS0FBSyxHQUFHLEtBQUssSUFBSSxFQUFFLENBQUM7SUFDeEIsSUFBSSxNQUFNLFNBQVMsR0FBRyxTQUFTLElBQUksUUFBUSxDQUFDO0lBQzVDLElBQUksS0FBSyxJQUFJLElBQUksUUFBUSxFQUFFO0lBQzNCLFFBQVEsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsRUFBRTtJQUMxQixZQUFZLElBQUksSUFBSSxDQUFDLENBQUMsQ0FBQyxLQUFLLEdBQUcsSUFBSSxJQUFJLENBQUMsQ0FBQyxDQUFDLEtBQUssR0FBRyxFQUFFO0lBQ3BELGdCQUFnQixHQUFHLENBQUMsS0FBSyxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUMvQyxhQUFhO0lBQ2IsaUJBQWlCO0lBQ2pCLGdCQUFnQixHQUFHLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQztJQUNyQyxhQUFhO0lBQ2IsU0FBUztJQUNULEtBQUs7SUFDTCxJQUFJLEtBQUssSUFBSSxJQUFJLEtBQUssRUFBRTtJQUN4QixRQUFRLEdBQUcsR0FBRyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDMUIsUUFBUSxJQUFJLElBQUksS0FBSyxTQUFTLElBQUksS0FBSyxDQUFDLE9BQU8sRUFBRTtJQUNqRCxZQUFZLEtBQUssTUFBTSxLQUFLLElBQUksS0FBSyxDQUFDLE9BQU8sRUFBRTtJQUMvQyxnQkFBZ0IsR0FBRyxHQUFHLEtBQUssQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDM0MsZ0JBQWdCLElBQUksQ0FBQyxTQUFTLElBQUksR0FBRyxLQUFLLFFBQVEsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLEVBQUU7SUFDbkUsb0JBQW9CLFlBQVksQ0FBQyxHQUFHLENBQUMsS0FBSyxFQUFFLEtBQUssRUFBRSxHQUFHLENBQUMsQ0FBQztJQUN4RCxpQkFBaUI7SUFDakIsYUFBYTtJQUNiLFNBQVM7SUFDVCxhQUFhLElBQUksSUFBSSxLQUFLLFFBQVEsSUFBSSxHQUFHLEtBQUssUUFBUSxDQUFDLElBQUksQ0FBQyxFQUFFO0lBQzlELFlBQVksSUFBSSxJQUFJLENBQUMsQ0FBQyxDQUFDLEtBQUssR0FBRyxJQUFJLElBQUksQ0FBQyxDQUFDLENBQUMsS0FBSyxHQUFHLEVBQUU7SUFDcEQsZ0JBQWdCLEdBQUcsQ0FBQyxLQUFLLENBQUMsV0FBVyxDQUFDLElBQUksRUFBRSxHQUFHLENBQUMsQ0FBQztJQUNqRCxhQUFhO0lBQ2IsaUJBQWlCO0lBQ2pCLGdCQUFnQixHQUFHLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxHQUFHLEdBQUcsQ0FBQztJQUN0QyxhQUFhO0lBQ2IsU0FBUztJQUNULEtBQUs7SUFDTCxDQUFDO0lBQ0QsU0FBUyxpQkFBaUIsQ0FBQyxLQUFLLEVBQUU7SUFDbEMsSUFBSSxJQUFJLEtBQUssQ0FBQztJQUNkLElBQUksSUFBSSxJQUFJLENBQUM7SUFDYixJQUFJLE1BQU0sR0FBRyxHQUFHLEtBQUssQ0FBQyxHQUFHLENBQUM7SUFDMUIsSUFBSSxNQUFNLENBQUMsR0FBRyxLQUFLLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQztJQUMvQixJQUFJLElBQUksQ0FBQyxDQUFDLElBQUksRUFBRSxLQUFLLEdBQUcsQ0FBQyxDQUFDLE9BQU8sQ0FBQztJQUNsQyxRQUFRLE9BQU87SUFDZixJQUFJLEtBQUssSUFBSSxJQUFJLEtBQUssRUFBRTtJQUN4QixRQUFRLEdBQUcsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ3RDLEtBQUs7SUFDTCxDQUFDO0lBQ0QsU0FBUyxnQkFBZ0IsQ0FBQyxLQUFLLEVBQUUsRUFBRSxFQUFFO0lBQ3JDLElBQUksTUFBTSxDQUFDLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7SUFDL0IsSUFBSSxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLE1BQU0sRUFBRTtJQUN6QixRQUFRLEVBQUUsRUFBRSxDQUFDO0lBQ2IsUUFBUSxPQUFPO0lBQ2YsS0FBSztJQUNMLElBQUksSUFBSSxDQUFDLFlBQVksRUFBRTtJQUN2QjtJQUNBLFFBQVEsS0FBSyxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUM7SUFDN0IsUUFBUSxZQUFZLEdBQUcsSUFBSSxDQUFDO0lBQzVCLEtBQUs7SUFDTCxJQUFJLElBQUksSUFBSSxDQUFDO0lBQ2IsSUFBSSxNQUFNLEdBQUcsR0FBRyxLQUFLLENBQUMsR0FBRyxDQUFDO0lBQzFCLElBQUksSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQ2QsSUFBSSxNQUFNLEtBQUssR0FBRyxDQUFDLENBQUMsTUFBTSxDQUFDO0lBQzNCLElBQUksSUFBSSxNQUFNLEdBQUcsQ0FBQyxDQUFDO0lBQ25CLElBQUksTUFBTSxPQUFPLEdBQUcsRUFBRSxDQUFDO0lBQ3ZCLElBQUksS0FBSyxJQUFJLElBQUksS0FBSyxFQUFFO0lBQ3hCLFFBQVEsT0FBTyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUMzQixRQUFRLEdBQUcsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ3RDLEtBQUs7SUFDTCxJQUFJLE1BQU0sU0FBUyxHQUFHLGdCQUFnQixDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQzVDLElBQUksTUFBTSxLQUFLLEdBQUcsU0FBUyxDQUFDLHFCQUFxQixDQUFDLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQy9ELElBQUksT0FBTyxDQUFDLEdBQUcsS0FBSyxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUMsRUFBRTtJQUNsQyxRQUFRLElBQUksT0FBTyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDNUMsWUFBWSxNQUFNLEVBQUUsQ0FBQztJQUNyQixLQUFLO0lBQ0wsSUFBSSxHQUFHLENBQUMsZ0JBQWdCLENBQUMsZUFBZSxFQUFFLFVBQVUsRUFBRSxFQUFFO0lBQ3hELFFBQVEsSUFBSSxFQUFFLENBQUMsTUFBTSxLQUFLLEdBQUc7SUFDN0IsWUFBWSxFQUFFLE1BQU0sQ0FBQztJQUNyQixRQUFRLElBQUksTUFBTSxLQUFLLENBQUM7SUFDeEIsWUFBWSxFQUFFLEVBQUUsQ0FBQztJQUNqQixLQUFLLENBQUMsQ0FBQztJQUNQLENBQUM7SUFDRCxTQUFTLFdBQVcsR0FBRztJQUN2QixJQUFJLFlBQVksR0FBRyxLQUFLLENBQUM7SUFDekIsQ0FBQztJQUNNLE1BQU0sV0FBVyxHQUFHO0lBQzNCLElBQUksR0FBRyxFQUFFLFdBQVc7SUFDcEIsSUFBSSxNQUFNLEVBQUUsV0FBVztJQUN2QixJQUFJLE1BQU0sRUFBRSxXQUFXO0lBQ3ZCLElBQUksT0FBTyxFQUFFLGlCQUFpQjtJQUM5QixJQUFJLE1BQU0sRUFBRSxnQkFBZ0I7SUFDNUIsQ0FBQzs7SUNoSEQsU0FBUyxhQUFhLENBQUMsT0FBTyxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUU7SUFDOUMsSUFBSSxJQUFJLE9BQU8sT0FBTyxLQUFLLFVBQVUsRUFBRTtJQUN2QztJQUNBLFFBQVEsT0FBTyxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDO0lBQzFDLEtBQUs7SUFDTCxTQUFTLElBQUksT0FBTyxPQUFPLEtBQUssUUFBUSxFQUFFO0lBQzFDO0lBQ0EsUUFBUSxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsT0FBTyxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtJQUNqRCxZQUFZLGFBQWEsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQUUsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDO0lBQ3BELFNBQVM7SUFDVCxLQUFLO0lBQ0wsQ0FBQztJQUNELFNBQVMsV0FBVyxDQUFDLEtBQUssRUFBRSxLQUFLLEVBQUU7SUFDbkMsSUFBSSxNQUFNLElBQUksR0FBRyxLQUFLLENBQUMsSUFBSSxDQUFDO0lBQzVCLElBQUksTUFBTSxFQUFFLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7SUFDN0I7SUFDQSxJQUFJLElBQUksRUFBRSxJQUFJLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRTtJQUN4QixRQUFRLGFBQWEsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUUsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDO0lBQzlDLEtBQUs7SUFDTCxDQUFDO0lBQ0QsU0FBUyxjQUFjLEdBQUc7SUFDMUIsSUFBSSxPQUFPLFNBQVMsT0FBTyxDQUFDLEtBQUssRUFBRTtJQUNuQyxRQUFRLFdBQVcsQ0FBQyxLQUFLLEVBQUUsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQzFDLEtBQUssQ0FBQztJQUNOLENBQUM7SUFDRCxTQUFTLG9CQUFvQixDQUFDLFFBQVEsRUFBRSxLQUFLLEVBQUU7SUFDL0MsSUFBSSxNQUFNLEtBQUssR0FBRyxRQUFRLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQztJQUNuQyxJQUFJLE1BQU0sV0FBVyxHQUFHLFFBQVEsQ0FBQyxRQUFRLENBQUM7SUFDMUMsSUFBSSxNQUFNLE1BQU0sR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDO0lBQ2hDLElBQUksTUFBTSxFQUFFLEdBQUcsS0FBSyxJQUFJLEtBQUssQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDO0lBQ3RDLElBQUksTUFBTSxHQUFHLElBQUksS0FBSyxJQUFJLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUNyQyxJQUFJLElBQUksSUFBSSxDQUFDO0lBQ2I7SUFDQSxJQUFJLElBQUksS0FBSyxLQUFLLEVBQUUsRUFBRTtJQUN0QixRQUFRLE9BQU87SUFDZixLQUFLO0lBQ0w7SUFDQSxJQUFJLElBQUksS0FBSyxJQUFJLFdBQVcsRUFBRTtJQUM5QjtJQUNBLFFBQVEsSUFBSSxDQUFDLEVBQUUsRUFBRTtJQUNqQixZQUFZLEtBQUssSUFBSSxJQUFJLEtBQUssRUFBRTtJQUNoQztJQUNBLGdCQUFnQixNQUFNLENBQUMsbUJBQW1CLENBQUMsSUFBSSxFQUFFLFdBQVcsRUFBRSxLQUFLLENBQUMsQ0FBQztJQUNyRSxhQUFhO0lBQ2IsU0FBUztJQUNULGFBQWE7SUFDYixZQUFZLEtBQUssSUFBSSxJQUFJLEtBQUssRUFBRTtJQUNoQztJQUNBLGdCQUFnQixJQUFJLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFO0lBQy9CLG9CQUFvQixNQUFNLENBQUMsbUJBQW1CLENBQUMsSUFBSSxFQUFFLFdBQVcsRUFBRSxLQUFLLENBQUMsQ0FBQztJQUN6RSxpQkFBaUI7SUFDakIsYUFBYTtJQUNiLFNBQVM7SUFDVCxLQUFLO0lBQ0w7SUFDQSxJQUFJLElBQUksRUFBRSxFQUFFO0lBQ1o7SUFDQSxRQUFRLE1BQU0sUUFBUSxJQUFJLEtBQUssQ0FBQyxRQUFRO0lBQ3hDLFlBQVksUUFBUSxDQUFDLFFBQVEsSUFBSSxjQUFjLEVBQUUsQ0FBQyxDQUFDO0lBQ25EO0lBQ0EsUUFBUSxRQUFRLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQztJQUMvQjtJQUNBLFFBQVEsSUFBSSxDQUFDLEtBQUssRUFBRTtJQUNwQixZQUFZLEtBQUssSUFBSSxJQUFJLEVBQUUsRUFBRTtJQUM3QjtJQUNBLGdCQUFnQixHQUFHLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxFQUFFLFFBQVEsRUFBRSxLQUFLLENBQUMsQ0FBQztJQUM1RCxhQUFhO0lBQ2IsU0FBUztJQUNULGFBQWE7SUFDYixZQUFZLEtBQUssSUFBSSxJQUFJLEVBQUUsRUFBRTtJQUM3QjtJQUNBLGdCQUFnQixJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxFQUFFO0lBQ2xDLG9CQUFvQixHQUFHLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxFQUFFLFFBQVEsRUFBRSxLQUFLLENBQUMsQ0FBQztJQUNoRSxpQkFBaUI7SUFDakIsYUFBYTtJQUNiLFNBQVM7SUFDVCxLQUFLO0lBQ0wsQ0FBQztJQUNNLE1BQU0sb0JBQW9CLEdBQUc7SUFDcEMsSUFBSSxNQUFNLEVBQUUsb0JBQW9CO0lBQ2hDLElBQUksTUFBTSxFQUFFLG9CQUFvQjtJQUNoQyxJQUFJLE9BQU8sRUFBRSxvQkFBb0I7SUFDakMsQ0FBQzs7SUNoRkQsU0FBUyxLQUFLLENBQUMsSUFBSSxFQUFFLFFBQVEsRUFBRSxHQUFHLEVBQUU7SUFDcEMsSUFBSSxJQUFJLENBQUMsRUFBRSxHQUFHLDRCQUE0QixDQUFDO0lBQzNDLElBQUksSUFBSSxHQUFHLEtBQUssZUFBZSxJQUFJLFFBQVEsS0FBSyxTQUFTLEVBQUU7SUFDM0QsUUFBUSxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsUUFBUSxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUMsRUFBRTtJQUNsRCxZQUFZLE1BQU0sU0FBUyxHQUFHLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7SUFDL0MsWUFBWSxJQUFJLFNBQVMsS0FBSyxTQUFTLEVBQUU7SUFDekMsZ0JBQWdCLEtBQUssQ0FBQyxTQUFTLEVBQUUsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsRUFBRSxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDeEUsYUFBYTtJQUNiLFNBQVM7SUFDVCxLQUFLO0lBQ0wsQ0FBQztJQUNNLFNBQVMsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFO0lBQzdCLElBQUksSUFBSSxJQUFJLEdBQUcsRUFBRSxDQUFDO0lBQ2xCLElBQUksSUFBSSxRQUFRLENBQUM7SUFDakIsSUFBSSxJQUFJLElBQUksQ0FBQztJQUNiLElBQUksSUFBSSxDQUFDLENBQUM7SUFDVixJQUFJLElBQUksQ0FBQyxLQUFLLFNBQVMsRUFBRTtJQUN6QixRQUFRLElBQUksQ0FBQyxLQUFLLElBQUksRUFBRTtJQUN4QixZQUFZLElBQUksR0FBRyxDQUFDLENBQUM7SUFDckIsU0FBUztJQUNULFFBQVEsSUFBSUQsS0FBUSxDQUFDLENBQUMsQ0FBQyxFQUFFO0lBQ3pCLFlBQVksUUFBUSxHQUFHLENBQUMsQ0FBQztJQUN6QixTQUFTO0lBQ1QsYUFBYSxJQUFJQyxTQUFZLENBQUMsQ0FBQyxDQUFDLEVBQUU7SUFDbEMsWUFBWSxJQUFJLEdBQUcsQ0FBQyxDQUFDO0lBQ3JCLFNBQVM7SUFDVCxhQUFhLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLEVBQUU7SUFDN0IsWUFBWSxRQUFRLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUMzQixTQUFTO0lBQ1QsS0FBSztJQUNMLFNBQVMsSUFBSSxDQUFDLEtBQUssU0FBUyxJQUFJLENBQUMsS0FBSyxJQUFJLEVBQUU7SUFDNUMsUUFBUSxJQUFJRCxLQUFRLENBQUMsQ0FBQyxDQUFDLEVBQUU7SUFDekIsWUFBWSxRQUFRLEdBQUcsQ0FBQyxDQUFDO0lBQ3pCLFNBQVM7SUFDVCxhQUFhLElBQUlDLFNBQVksQ0FBQyxDQUFDLENBQUMsRUFBRTtJQUNsQyxZQUFZLElBQUksR0FBRyxDQUFDLENBQUM7SUFDckIsU0FBUztJQUNULGFBQWEsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsRUFBRTtJQUM3QixZQUFZLFFBQVEsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQzNCLFNBQVM7SUFDVCxhQUFhO0lBQ2IsWUFBWSxJQUFJLEdBQUcsQ0FBQyxDQUFDO0lBQ3JCLFNBQVM7SUFDVCxLQUFLO0lBQ0wsSUFBSSxJQUFJLFFBQVEsS0FBSyxTQUFTLEVBQUU7SUFDaEMsUUFBUSxLQUFLLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFFBQVEsQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDLEVBQUU7SUFDOUMsWUFBWSxJQUFJQSxTQUFZLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3pDLGdCQUFnQixRQUFRLENBQUMsQ0FBQyxDQUFDLEdBQUcsS0FBSyxDQUFDLFNBQVMsRUFBRSxTQUFTLEVBQUUsU0FBUyxFQUFFLFFBQVEsQ0FBQyxDQUFDLENBQUMsRUFBRSxTQUFTLENBQUMsQ0FBQztJQUM3RixTQUFTO0lBQ1QsS0FBSztJQUNMLElBQUksSUFBSSxHQUFHLENBQUMsQ0FBQyxDQUFDLEtBQUssR0FBRztJQUN0QixRQUFRLEdBQUcsQ0FBQyxDQUFDLENBQUMsS0FBSyxHQUFHO0lBQ3RCLFFBQVEsR0FBRyxDQUFDLENBQUMsQ0FBQyxLQUFLLEdBQUc7SUFDdEIsU0FBUyxHQUFHLENBQUMsTUFBTSxLQUFLLENBQUMsSUFBSSxHQUFHLENBQUMsQ0FBQyxDQUFDLEtBQUssR0FBRyxJQUFJLEdBQUcsQ0FBQyxDQUFDLENBQUMsS0FBSyxHQUFHLENBQUMsRUFBRTtJQUNoRSxRQUFRLEtBQUssQ0FBQyxJQUFJLEVBQUUsUUFBUSxFQUFFLEdBQUcsQ0FBQyxDQUFDO0lBQ25DLEtBQUs7SUFDTCxJQUFJLE9BQU8sS0FBSyxDQUFDLEdBQUcsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBRSxTQUFTLENBQUMsQ0FBQztJQUN2RDs7SUMzREEsTUFBTSxVQUFVLEdBQUcsUUFBUSxDQUFDO0lBQzVCLFNBQVMsYUFBYSxDQUFDLFFBQVEsRUFBRSxLQUFLLEVBQUU7SUFDeEMsSUFBSSxNQUFNLEdBQUcsR0FBRyxLQUFLLENBQUMsR0FBRyxDQUFDO0lBQzFCLElBQUksSUFBSSxVQUFVLEdBQUcsUUFBUSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUM7SUFDM0MsSUFBSSxJQUFJLE9BQU8sR0FBRyxLQUFLLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQztJQUNyQyxJQUFJLElBQUksR0FBRyxDQUFDO0lBQ1osSUFBSSxJQUFJLENBQUMsVUFBVSxJQUFJLENBQUMsT0FBTztJQUMvQixRQUFRLE9BQU87SUFDZixJQUFJLElBQUksVUFBVSxLQUFLLE9BQU87SUFDOUIsUUFBUSxPQUFPO0lBQ2YsSUFBSSxVQUFVLEdBQUcsVUFBVSxJQUFJLEVBQUUsQ0FBQztJQUNsQyxJQUFJLE9BQU8sR0FBRyxPQUFPLElBQUksRUFBRSxDQUFDO0lBQzVCLElBQUksTUFBTSxDQUFDLEdBQUcsR0FBRyxDQUFDLE9BQU8sQ0FBQztJQUMxQixJQUFJLEtBQUssR0FBRyxJQUFJLFVBQVUsRUFBRTtJQUM1QixRQUFRLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEVBQUU7SUFDM0IsWUFBWSxJQUFJLENBQUMsRUFBRTtJQUNuQixnQkFBZ0IsSUFBSSxHQUFHLElBQUksQ0FBQyxFQUFFO0lBQzlCLG9CQUFvQixPQUFPLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUNsQyxpQkFBaUI7SUFDakIsYUFBYTtJQUNiLGlCQUFpQjtJQUNqQixnQkFBZ0IsR0FBRyxDQUFDLGVBQWUsQ0FBQyxPQUFPLEdBQUcsR0FBRyxDQUFDLE9BQU8sQ0FBQyxVQUFVLEVBQUUsS0FBSyxDQUFDLENBQUMsV0FBVyxFQUFFLENBQUMsQ0FBQztJQUM1RixhQUFhO0lBQ2IsU0FBUztJQUNULEtBQUs7SUFDTCxJQUFJLEtBQUssR0FBRyxJQUFJLE9BQU8sRUFBRTtJQUN6QixRQUFRLElBQUksVUFBVSxDQUFDLEdBQUcsQ0FBQyxLQUFLLE9BQU8sQ0FBQyxHQUFHLENBQUMsRUFBRTtJQUM5QyxZQUFZLElBQUksQ0FBQyxFQUFFO0lBQ25CLGdCQUFnQixDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQ3RDLGFBQWE7SUFDYixpQkFBaUI7SUFDakIsZ0JBQWdCLEdBQUcsQ0FBQyxZQUFZLENBQUMsT0FBTyxHQUFHLEdBQUcsQ0FBQyxPQUFPLENBQUMsVUFBVSxFQUFFLEtBQUssQ0FBQyxDQUFDLFdBQVcsRUFBRSxFQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO0lBQ3ZHLGFBQWE7SUFDYixTQUFTO0lBQ1QsS0FBSztJQUNMLENBQUM7SUFDTSxNQUFNLGFBQWEsR0FBRztJQUM3QixJQUFJLE1BQU0sRUFBRSxhQUFhO0lBQ3pCLElBQUksTUFBTSxFQUFFLGFBQWE7SUFDekIsQ0FBQzs7SUN2Q0QsTUFBTSxPQUFPLEdBQUcsOEJBQThCLENBQUM7SUFDL0MsTUFBTSxLQUFLLEdBQUcsc0NBQXNDLENBQUM7SUFDckQsTUFBTSxTQUFTLEdBQUcsRUFBRSxDQUFDO0lBQ3JCLE1BQU0sS0FBSyxHQUFHLEdBQUcsQ0FBQztJQUNsQixTQUFTLFdBQVcsQ0FBQyxRQUFRLEVBQUUsS0FBSyxFQUFFO0lBQ3RDLElBQUksSUFBSSxHQUFHLENBQUM7SUFDWixJQUFJLE1BQU0sR0FBRyxHQUFHLEtBQUssQ0FBQyxHQUFHLENBQUM7SUFDMUIsSUFBSSxJQUFJLFFBQVEsR0FBRyxRQUFRLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQztJQUN2QyxJQUFJLElBQUksS0FBSyxHQUFHLEtBQUssQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO0lBQ2pDLElBQUksSUFBSSxDQUFDLFFBQVEsSUFBSSxDQUFDLEtBQUs7SUFDM0IsUUFBUSxPQUFPO0lBQ2YsSUFBSSxJQUFJLFFBQVEsS0FBSyxLQUFLO0lBQzFCLFFBQVEsT0FBTztJQUNmLElBQUksUUFBUSxHQUFHLFFBQVEsSUFBSSxFQUFFLENBQUM7SUFDOUIsSUFBSSxLQUFLLEdBQUcsS0FBSyxJQUFJLEVBQUUsQ0FBQztJQUN4QjtJQUNBLElBQUksS0FBSyxHQUFHLElBQUksS0FBSyxFQUFFO0lBQ3ZCLFFBQVEsTUFBTSxHQUFHLEdBQUcsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQy9CLFFBQVEsTUFBTSxHQUFHLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQ2xDLFFBQVEsSUFBSSxHQUFHLEtBQUssR0FBRyxFQUFFO0lBQ3pCLFlBQVksSUFBSSxHQUFHLEtBQUssSUFBSSxFQUFFO0lBQzlCLGdCQUFnQixHQUFHLENBQUMsWUFBWSxDQUFDLEdBQUcsRUFBRSxFQUFFLENBQUMsQ0FBQztJQUMxQyxhQUFhO0lBQ2IsaUJBQWlCLElBQUksR0FBRyxLQUFLLEtBQUssRUFBRTtJQUNwQyxnQkFBZ0IsR0FBRyxDQUFDLGVBQWUsQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUN6QyxhQUFhO0lBQ2IsaUJBQWlCO0lBQ2pCLGdCQUFnQixJQUFJLEdBQUcsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLEtBQUssS0FBSyxFQUFFO0lBQ2pELG9CQUFvQixHQUFHLENBQUMsWUFBWSxDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUMsQ0FBQztJQUMvQyxpQkFBaUI7SUFDakIscUJBQXFCLElBQUksR0FBRyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsS0FBSyxTQUFTLEVBQUU7SUFDMUQ7SUFDQSxvQkFBb0IsR0FBRyxDQUFDLGNBQWMsQ0FBQyxLQUFLLEVBQUUsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFDO0lBQ3hELGlCQUFpQjtJQUNqQixxQkFBcUIsSUFBSSxHQUFHLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxLQUFLLFNBQVMsRUFBRTtJQUMxRDtJQUNBLG9CQUFvQixHQUFHLENBQUMsY0FBYyxDQUFDLE9BQU8sRUFBRSxHQUFHLEVBQUUsR0FBRyxDQUFDLENBQUM7SUFDMUQsaUJBQWlCO0lBQ2pCLHFCQUFxQjtJQUNyQixvQkFBb0IsR0FBRyxDQUFDLFlBQVksQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDLENBQUM7SUFDL0MsaUJBQWlCO0lBQ2pCLGFBQWE7SUFDYixTQUFTO0lBQ1QsS0FBSztJQUNMO0lBQ0E7SUFDQTtJQUNBLElBQUksS0FBSyxHQUFHLElBQUksUUFBUSxFQUFFO0lBQzFCLFFBQVEsSUFBSSxFQUFFLEdBQUcsSUFBSSxLQUFLLENBQUMsRUFBRTtJQUM3QixZQUFZLEdBQUcsQ0FBQyxlQUFlLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDckMsU0FBUztJQUNULEtBQUs7SUFDTCxDQUFDO0lBQ00sTUFBTSxnQkFBZ0IsR0FBRztJQUNoQyxJQUFJLE1BQU0sRUFBRSxXQUFXO0lBQ3ZCLElBQUksTUFBTSxFQUFFLFdBQVc7SUFDdkIsQ0FBQzs7SUMvQ0QsSUFBSUMsS0FBSyxHQUFHQyxJQUFJLENBQUM7SUFDYkMsV0FEYTtJQUViQyxXQUZhO0lBR2JDLFdBSGE7SUFJYkMsb0JBSmE7SUFLYkMsYUFMYSxFQU1iQyxnQkFOYSxDQUFELENBQWhCO0lBU0EsSUFBSUMsSUFBSSxHQUFHQyxDQUFDLENBQUMsVUFBRCxFQUFZLENBQ3BCQSxDQUFDLENBQUMsVUFBRCxFQUFZLENBQ1RBLENBQUMsQ0FBQyxLQUFELEVBQU87SUFBRUMsRUFBQUEsS0FBSyxFQUFFO0lBQUVDLElBQUFBLEdBQUcsRUFBQztJQUFOO0lBQVQsQ0FBUCxDQURRLEVBRVRGLENBQUMsQ0FBQyxXQUFELEVBQWEsQ0FDVkEsQ0FBQyxDQUFDLEdBQUQsRUFBSyxLQUFMLENBRFMsQ0FBYixDQUZRLENBQVosQ0FEbUIsRUFPcEJBLENBQUMsQ0FBQyxZQUFELEVBQWMsQ0FDWEEsQ0FBQyxDQUFDLFdBQUQsRUFBYTtJQUFDRyxFQUFBQSxLQUFLLEVBQUU7SUFDbEJDLElBQUFBLFNBQVMsRUFBRTtJQURPO0lBQVIsQ0FBYixFQUVFLENBQ0NKLENBQUMsQ0FBQyxLQUFELEVBQU8seUJBQVAsQ0FERixFQUVDQSxDQUFDLENBQUMsS0FBRCxFQUFPO0lBQUVDLEVBQUFBLEtBQUssRUFBRTtJQUFFQyxJQUFBQSxHQUFHLEVBQUM7SUFBTjtJQUFULENBQVAsQ0FGRixDQUZGLENBRFUsRUFPWEYsQ0FBQyxDQUFDLEdBQUQsRUFBSyxPQUFMLENBUFUsRUFRWEEsQ0FBQyxDQUFDLEdBQUQsRUFBSyxJQUFMLENBUlUsQ0FBZCxDQVBtQixFQWlCcEJBLENBQUMsQ0FBQyxXQUFELEVBQWEsQ0FDVkEsQ0FBQyxDQUFDLEtBQUQsRUFBTztJQUFFQyxFQUFBQSxLQUFLLEVBQUU7SUFBRUMsSUFBQUEsR0FBRyxFQUFDO0lBQU47SUFBVCxDQUFQLENBRFMsRUFFVkYsQ0FBQyxDQUFDLFdBQUQsRUFBYSxDQUNWQSxDQUFDLENBQUMsR0FBRCxFQUFLLEtBQUwsQ0FEUyxDQUFiLENBRlMsQ0FBYixDQWpCbUIsQ0FBWixDQUFaO0lBeUJBLElBQUlLLEdBQUcsR0FBR0MsUUFBUSxDQUFDQyxjQUFULENBQXdCLE1BQXhCLENBQVY7SUFDQWhCLEtBQUssQ0FBQ2MsR0FBRCxFQUFLTixJQUFMLENBQUw7SUFDQSxJQUFJUyxLQUFKO0lBQ0EsSUFBSUMsS0FBSyxHQUFHLENBQVo7SUFDQSxJQUFJQyxTQUFTLEdBQUcsQ0FBaEI7O0lBQ0EsSUFBSUMsTUFBTSxHQUFFTCxRQUFRLENBQUNNLHNCQUFULENBQWdDLFFBQWhDLENBQVo7SUFDQSxJQUFJQyxPQUFPLEdBQUc7SUFDVkMsRUFBQUEsUUFBUSxFQUFFUixRQUFRLENBQUNNLHNCQUFULENBQWdDLE1BQWhDLEVBQXdDLENBQXhDLEVBQTJDQSxzQkFBM0MsQ0FBa0UsT0FBbEUsRUFBMkUsQ0FBM0UsRUFBOEVHLG9CQUE5RSxDQUFtRyxHQUFuRyxFQUF3RyxDQUF4RyxDQURBO0lBRVZDLEVBQUFBLFlBQVksRUFBRUwsTUFBTSxDQUFDLENBQUQsQ0FBTixDQUFVSSxvQkFBVixDQUErQixHQUEvQixFQUFvQyxDQUFwQyxDQUZKO0lBR1ZFLEVBQUFBLEtBQUssRUFBRVgsUUFBUSxDQUFDQyxjQUFULENBQXdCLE9BQXhCO0lBSEcsQ0FBZDtJQUtBLElBQUlXLE1BQU0sR0FBRztJQUNUQyxFQUFBQSxTQUFTLEVBQUVDLFNBREY7SUFFVEMsRUFBQUEsV0FBVyxFQUFFLEVBRko7SUFHVEMsRUFBQUEsSUFBSSxFQUFHWCxNQUFNLENBQUMsQ0FBRCxDQUFOLENBQVVJLG9CQUFWLENBQStCLEdBQS9CLEVBQW9DLENBQXBDO0lBSEUsQ0FBYjtJQU1BLElBQUlRLElBQUksR0FBRztJQUNQQyxFQUFBQSxRQUFRLEVBQUNKLFNBREY7SUFFUEssRUFBQUEsSUFBSSxFQUFDLENBRUQ7SUFBQ0MsSUFBQUEsUUFBUSxFQUFDLE9BQVY7SUFBbUJDLElBQUFBLEdBQUcsRUFBRSxPQUF4QjtJQUFpQ0MsSUFBQUEsTUFBTSxFQUFDLENBQUM7SUFBQ0MsTUFBQUEsS0FBSyxFQUFFLFFBQVI7SUFBa0JGLE1BQUFBLEdBQUcsRUFBQztJQUF0QixLQUFELEVBQWtDO0lBQUNFLE1BQUFBLEtBQUssRUFBQyxPQUFQO0lBQWdCRixNQUFBQSxHQUFHLEVBQUM7SUFBcEIsS0FBbEMsRUFBZ0U7SUFBQ0UsTUFBQUEsS0FBSyxFQUFDLFFBQVA7SUFBZ0JGLE1BQUFBLEdBQUcsRUFBQztJQUFwQixLQUFoRSxFQUErRjtJQUFDRSxNQUFBQSxLQUFLLEVBQUMsS0FBUDtJQUFhRixNQUFBQSxHQUFHLEVBQUM7SUFBakIsS0FBL0Y7SUFBeEMsR0FGQyxFQUdEO0lBQUNELElBQUFBLFFBQVEsRUFBQyxTQUFWO0lBQXFCQyxJQUFBQSxHQUFHLEVBQUUsU0FBMUI7SUFBcUNDLElBQUFBLE1BQU0sRUFBQyxDQUFDO0lBQUNDLE1BQUFBLEtBQUssRUFBRSxTQUFSO0lBQW1CRixNQUFBQSxHQUFHLEVBQUM7SUFBdkIsS0FBRCxFQUFvQztJQUFDRSxNQUFBQSxLQUFLLEVBQUMsU0FBUDtJQUFrQkYsTUFBQUEsR0FBRyxFQUFDO0lBQXRCLEtBQXBDLEVBQXNFO0lBQUNFLE1BQUFBLEtBQUssRUFBQyxRQUFQO0lBQWdCRixNQUFBQSxHQUFHLEVBQUM7SUFBcEIsS0FBdEUsRUFBcUc7SUFBQ0UsTUFBQUEsS0FBSyxFQUFDLFVBQVA7SUFBa0JGLE1BQUFBLEdBQUcsRUFBQztJQUF0QixLQUFyRztJQUE1QyxHQUhDLEVBSUQ7SUFBQ0QsSUFBQUEsUUFBUSxFQUFDLFVBQVY7SUFBc0JDLElBQUFBLEdBQUcsRUFBRSxVQUEzQjtJQUF1Q0MsSUFBQUEsTUFBTSxFQUFDLENBQUM7SUFBQ0MsTUFBQUEsS0FBSyxFQUFFLE1BQVI7SUFBZ0JGLE1BQUFBLEdBQUcsRUFBQztJQUFwQixLQUFELEVBQThCO0lBQUNFLE1BQUFBLEtBQUssRUFBQyxVQUFQO0lBQW1CRixNQUFBQSxHQUFHLEVBQUM7SUFBdkIsS0FBOUIsRUFBa0U7SUFBQ0UsTUFBQUEsS0FBSyxFQUFDLEtBQVA7SUFBYUYsTUFBQUEsR0FBRyxFQUFDO0lBQWpCLEtBQWxFLEVBQTJGO0lBQUNFLE1BQUFBLEtBQUssRUFBQyxLQUFQO0lBQWFGLE1BQUFBLEdBQUcsRUFBQztJQUFqQixLQUEzRjtJQUE5QyxHQUpDLEVBS0Q7SUFBQ0QsSUFBQUEsUUFBUSxFQUFDLE1BQVY7SUFBa0JDLElBQUFBLEdBQUcsRUFBRSxNQUF2QjtJQUErQkMsSUFBQUEsTUFBTSxFQUFDLENBQUM7SUFBQ0MsTUFBQUEsS0FBSyxFQUFFLE1BQVI7SUFBZ0JGLE1BQUFBLEdBQUcsRUFBQztJQUFwQixLQUFELEVBQThCO0lBQUNFLE1BQUFBLEtBQUssRUFBQyxNQUFQO0lBQWVGLE1BQUFBLEdBQUcsRUFBQztJQUFuQixLQUE5QixFQUEwRDtJQUFDRSxNQUFBQSxLQUFLLEVBQUMsTUFBUDtJQUFjRixNQUFBQSxHQUFHLEVBQUM7SUFBbEIsS0FBMUQsRUFBcUY7SUFBQ0UsTUFBQUEsS0FBSyxFQUFDLFFBQVA7SUFBZ0JGLE1BQUFBLEdBQUcsRUFBQztJQUFwQixLQUFyRjtJQUF0QyxHQUxDLEVBTUQ7SUFBQ0QsSUFBQUEsUUFBUSxFQUFDLEtBQVY7SUFBaUJDLElBQUFBLEdBQUcsRUFBRSxLQUF0QjtJQUE2QkMsSUFBQUEsTUFBTSxFQUFDLENBQUM7SUFBQ0MsTUFBQUEsS0FBSyxFQUFFLFdBQVI7SUFBcUJGLE1BQUFBLEdBQUcsRUFBQztJQUF6QixLQUFELEVBQXdDO0lBQUNFLE1BQUFBLEtBQUssRUFBQyxPQUFQO0lBQWdCRixNQUFBQSxHQUFHLEVBQUM7SUFBcEIsS0FBeEMsRUFBc0U7SUFBQ0UsTUFBQUEsS0FBSyxFQUFDLEtBQVA7SUFBYUYsTUFBQUEsR0FBRyxFQUFDO0lBQWpCLEtBQXRFLEVBQStGO0lBQUNFLE1BQUFBLEtBQUssRUFBQyxLQUFQO0lBQWFGLE1BQUFBLEdBQUcsRUFBQztJQUFqQixLQUEvRjtJQUFwQyxHQU5DLEVBT0Q7SUFBQ0QsSUFBQUEsUUFBUSxFQUFDLEtBQVY7SUFBaUJDLElBQUFBLEdBQUcsRUFBRSxLQUF0QjtJQUE2QkMsSUFBQUEsTUFBTSxFQUFDLENBQUM7SUFBQ0MsTUFBQUEsS0FBSyxFQUFFLEtBQVI7SUFBZUYsTUFBQUEsR0FBRyxFQUFDO0lBQW5CLEtBQUQsRUFBNEI7SUFBQ0UsTUFBQUEsS0FBSyxFQUFDLFVBQVA7SUFBbUJGLE1BQUFBLEdBQUcsRUFBQztJQUF2QixLQUE1QixFQUFnRTtJQUFDRSxNQUFBQSxLQUFLLEVBQUMsUUFBUDtJQUFnQkYsTUFBQUEsR0FBRyxFQUFDO0lBQXBCLEtBQWhFLEVBQStGO0lBQUNFLE1BQUFBLEtBQUssRUFBQyxLQUFQO0lBQWFGLE1BQUFBLEdBQUcsRUFBQztJQUFqQixLQUEvRjtJQUFwQyxHQVBDLEVBUUQ7SUFBQ0QsSUFBQUEsUUFBUSxFQUFDLEtBQVY7SUFBaUJDLElBQUFBLEdBQUcsRUFBRSxLQUF0QjtJQUE2QkMsSUFBQUEsTUFBTSxFQUFDLENBQUM7SUFBQ0MsTUFBQUEsS0FBSyxFQUFFLFFBQVI7SUFBa0JGLE1BQUFBLEdBQUcsRUFBQztJQUF0QixLQUFELEVBQWtDO0lBQUNFLE1BQUFBLEtBQUssRUFBQyxLQUFQO0lBQWNGLE1BQUFBLEdBQUcsRUFBQztJQUFsQixLQUFsQyxFQUE0RDtJQUFDRSxNQUFBQSxLQUFLLEVBQUMsTUFBUDtJQUFjRixNQUFBQSxHQUFHLEVBQUM7SUFBbEIsS0FBNUQsRUFBdUY7SUFBQ0UsTUFBQUEsS0FBSyxFQUFDLE1BQVA7SUFBY0YsTUFBQUEsR0FBRyxFQUFDO0lBQWxCLEtBQXZGO0lBQXBDLEdBUkMsRUFTRDtJQUFDRCxJQUFBQSxRQUFRLEVBQUMsTUFBVjtJQUFrQkMsSUFBQUEsR0FBRyxFQUFFLE1BQXZCO0lBQStCQyxJQUFBQSxNQUFNLEVBQUMsQ0FBQztJQUFDQyxNQUFBQSxLQUFLLEVBQUUsUUFBUjtJQUFrQkYsTUFBQUEsR0FBRyxFQUFDO0lBQXRCLEtBQUQsRUFBa0M7SUFBQ0UsTUFBQUEsS0FBSyxFQUFDLE9BQVA7SUFBZ0JGLE1BQUFBLEdBQUcsRUFBQztJQUFwQixLQUFsQyxFQUFnRTtJQUFDRSxNQUFBQSxLQUFLLEVBQUMsTUFBUDtJQUFjRixNQUFBQSxHQUFHLEVBQUM7SUFBbEIsS0FBaEUsRUFBMkY7SUFBQ0UsTUFBQUEsS0FBSyxFQUFDLE9BQVA7SUFBZUYsTUFBQUEsR0FBRyxFQUFDO0lBQW5CLEtBQTNGO0lBQXRDLEdBVEMsRUFVRDtJQUFDRCxJQUFBQSxRQUFRLEVBQUMsUUFBVjtJQUFvQkMsSUFBQUEsR0FBRyxFQUFFLFFBQXpCO0lBQW1DQyxJQUFBQSxNQUFNLEVBQUMsQ0FBQztJQUFDQyxNQUFBQSxLQUFLLEVBQUUsTUFBUjtJQUFnQkYsTUFBQUEsR0FBRyxFQUFDO0lBQXBCLEtBQUQsRUFBOEI7SUFBQ0UsTUFBQUEsS0FBSyxFQUFDLE1BQVA7SUFBZUYsTUFBQUEsR0FBRyxFQUFDO0lBQW5CLEtBQTlCLEVBQTBEO0lBQUNFLE1BQUFBLEtBQUssRUFBQyxRQUFQO0lBQWdCRixNQUFBQSxHQUFHLEVBQUM7SUFBcEIsS0FBMUQsRUFBeUY7SUFBQ0UsTUFBQUEsS0FBSyxFQUFDLFFBQVA7SUFBZ0JGLE1BQUFBLEdBQUcsRUFBQztJQUFwQixLQUF6RjtJQUExQyxHQVZDLEVBV0Q7SUFBQ0QsSUFBQUEsUUFBUSxFQUFDLFFBQVY7SUFBb0JDLElBQUFBLEdBQUcsRUFBRSxRQUF6QjtJQUFtQ0MsSUFBQUEsTUFBTSxFQUFDLENBQUM7SUFBQ0MsTUFBQUEsS0FBSyxFQUFFLFFBQVI7SUFBa0JGLE1BQUFBLEdBQUcsRUFBQztJQUF0QixLQUFELEVBQWtDO0lBQUNFLE1BQUFBLEtBQUssRUFBQyxTQUFQO0lBQWtCRixNQUFBQSxHQUFHLEVBQUM7SUFBdEIsS0FBbEMsRUFBb0U7SUFBQ0UsTUFBQUEsS0FBSyxFQUFDLFVBQVA7SUFBa0JGLE1BQUFBLEdBQUcsRUFBQztJQUF0QixLQUFwRSxFQUF1RztJQUFDRSxNQUFBQSxLQUFLLEVBQUMsT0FBUDtJQUFlRixNQUFBQSxHQUFHLEVBQUM7SUFBbkIsS0FBdkc7SUFBMUMsR0FYQztJQUZFLENBQVg7O0lBb0JBLFNBQVNHLE9BQVQsQ0FBaUJDLE1BQWpCLEVBQXlCO0lBQ3JCLE1BQUl6QixRQUFRLENBQUN5QixNQUFiLEVBQXFCO0lBQ2pCLFFBQUlDLENBQUMsR0FBQyxFQUFOO0lBRUEsUUFBSUMsVUFBVSxHQUFHRixNQUFqQjtJQUNBRyxJQUFBQSxPQUFPLENBQUNDLEdBQVIsQ0FBWSx5QkFBdUJGLFVBQW5DOztJQUNBLFNBQUksSUFBSUcsQ0FBQyxHQUFDLENBQVYsRUFBYUEsQ0FBQyxJQUFFSCxVQUFVLENBQUNJLE1BQVgsR0FBa0IsQ0FBbEMsRUFBcUNELENBQUMsRUFBdEMsRUFBMEM7SUFDdEMsVUFBSUUsUUFBUSxHQUFHLElBQUlDLEtBQUosRUFBZjtJQUNBRCxNQUFBQSxRQUFRLENBQUNwQyxHQUFULEdBQWEseUJBQXVCK0IsVUFBVSxDQUFDRyxDQUFELENBQVYsQ0FBY1YsUUFBckMsR0FBOEMsTUFBM0Q7SUFDQVEsTUFBQUEsT0FBTyxDQUFDQyxHQUFSLENBQVksb0JBQWtCRixVQUFVLENBQUNHLENBQUQsQ0FBVixDQUFjVixRQUE1QztJQUNBUSxNQUFBQSxPQUFPLENBQUNDLEdBQVIsQ0FBWUcsUUFBWjtJQUNBTixNQUFBQSxDQUFDLENBQUNRLElBQUYsQ0FBT0osQ0FBUDtJQUNIOztJQUNERixJQUFBQSxPQUFPLENBQUNDLEdBQVIsQ0FBWUgsQ0FBWjtJQUNIO0lBQ0o7O0lBRUQsU0FBVVMsTUFBVixDQUFrQmxCLElBQWxCLEVBQXdCVCxRQUF4QixFQUFrQzRCLE9BQWxDLEVBQTJDQyxlQUEzQyxFQUE0RDtJQUN4RG5DLEVBQUFBLEtBQUssR0FBR2pCLEtBQUssQ0FBQ2lCLEtBQUQsRUFBUW9DLFlBQVksQ0FBQ2xDLFNBQUQsRUFBV2EsSUFBWCxFQUFnQlQsUUFBaEIsRUFBeUI0QixPQUF6QixDQUFaLENBQThDRyxJQUF0RCxDQUFiO0lBQ0EzQixFQUFBQSxNQUFNLENBQUNHLFdBQVAsR0FBcUIsRUFBckI7SUFDQXlCLEVBQUFBLE9BQU8sQ0FBQzVCLE1BQU0sQ0FBQ0ksSUFBUixFQUFhQyxJQUFiLENBQVA7SUFDQWIsRUFBQUEsU0FBUyxHQUFHQSxTQUFTLEdBQUMsQ0FBdEI7O0lBQ0EsTUFBSXFDLElBQUksR0FBRyxTQUFQQSxJQUFPLEdBQVc7SUFDbEJ2QyxJQUFBQSxLQUFLLEdBQUlqQixLQUFLLENBQUNpQixLQUFELEVBQVF3QyxRQUFRLENBQUN0QyxTQUFELEVBQVdhLElBQVgsRUFBZ0JULFFBQWhCLEVBQXlCNkIsZUFBekIsQ0FBUixDQUFrREUsSUFBMUQsQ0FBZDtJQUNILEdBRkQ7O0lBR0FJLEVBQUFBLFVBQVUsQ0FBQ0YsSUFBRCxFQUFNLEdBQU4sQ0FBVjtJQUNIOztJQUdELElBQUlELE9BQU8sR0FBRyxTQUFWQSxPQUFVLENBQVNJLFFBQVQsRUFBbUIzQixJQUFuQixFQUF5QjtJQUNuQ0wsRUFBQUEsTUFBTSxDQUFDQyxTQUFQLEdBQW9CZ0MsV0FBVyxDQUFDLFlBQVc7SUFBRUMsSUFBQUEsV0FBVyxDQUFDRixRQUFELEVBQVczQixJQUFYLENBQVg7SUFBOEIsR0FBNUMsRUFBNkMsSUFBN0MsQ0FBL0I7SUFDSCxDQUZEOztJQUlBLElBQUk2QixXQUFXLEdBQUcsU0FBZEEsV0FBYyxDQUFVRixRQUFWLEVBQW9CM0IsSUFBcEIsRUFBMEI7SUFDeENMLEVBQUFBLE1BQU0sQ0FBQ0csV0FBUDs7SUFDQSxNQUFJSCxNQUFNLENBQUNHLFdBQVAsSUFBc0IsQ0FBQyxDQUEzQixFQUE4QjtJQUMxQkgsSUFBQUEsTUFBTSxDQUFDRyxXQUFQLEdBQXFCLEVBQXJCO0lBQ0FnQyxJQUFBQSxZQUFZLENBQUNuQyxNQUFNLENBQUNDLFNBQVIsQ0FBWjtJQUNIOztJQUNELE1BQUdELE1BQU0sQ0FBQ0csV0FBUCxJQUFzQixFQUF6QixFQUE0QjtJQUN4QixRQUFJaUMsT0FBTyxHQUFHO0lBQ1ZDLE1BQUFBLEtBQUssRUFBRSxJQURHO0lBRVZDLE1BQUFBLEtBQUssRUFBRSxJQUZHO0lBR1ZDLE1BQUFBLEdBQUcsRUFBRUMsUUFBUSxDQUFDaEQsU0FBRCxFQUFZYSxJQUFaLENBQVIsQ0FBMEJJO0lBSHJCLEtBQWQ7SUFLQWMsSUFBQUEsTUFBTSxDQUFDbEIsSUFBRCxFQUFPVixPQUFPLENBQUNDLFFBQWYsRUFBeUJ3QyxPQUF6QixFQUFrQ3pDLE9BQU8sQ0FBQ0csWUFBMUMsQ0FBTjtJQUNIOztJQUNELE1BQUdOLFNBQVMsSUFBSSxFQUFoQixFQUFtQjtJQUNmMkMsSUFBQUEsWUFBWSxDQUFDbkMsTUFBTSxDQUFDQyxTQUFSLENBQVo7SUFDQXdDLElBQUFBLE1BQU0sQ0FBQ0MsS0FBUCxDQUFhLFVBQWI7SUFDQTtJQUNIOztJQUNEVixFQUFBQSxRQUFRLENBQUNXLFNBQVQsYUFBd0IzQyxNQUFNLENBQUNHLFdBQS9CO0lBQ0gsQ0FwQkQ7O0lBc0JBLFNBQVN5QyxtQkFBVCxDQUE4QkMsS0FBOUIsRUFBcUN0RCxLQUFyQyxFQUE0QztJQUN4QyxNQUFJdUQsWUFBWSxHQUFHRCxLQUFLLENBQUMxQixNQUF6QjtJQUFBLE1BQWlDNEIsY0FBakM7SUFBQSxNQUFpREMsV0FBakQ7O0lBQ0EsU0FBTyxNQUFNRixZQUFiLEVBQTJCO0lBQ3ZCRSxJQUFBQSxXQUFXLEdBQUdDLElBQUksQ0FBQ0MsS0FBTCxDQUFXRCxJQUFJLENBQUNFLE1BQUwsS0FBZ0JMLFlBQTNCLENBQWQ7SUFDQUEsSUFBQUEsWUFBWSxJQUFJLENBQWhCO0lBQ0FDLElBQUFBLGNBQWMsR0FBR0YsS0FBSyxDQUFDQyxZQUFELENBQXRCO0lBQ0FELElBQUFBLEtBQUssQ0FBQ0MsWUFBRCxDQUFMLEdBQXNCRCxLQUFLLENBQUNHLFdBQUQsQ0FBM0I7SUFDQUgsSUFBQUEsS0FBSyxDQUFDRyxXQUFELENBQUwsR0FBcUJELGNBQXJCO0lBQ0g7O0lBQ0R4RCxFQUFBQSxLQUFLLENBQUNvRCxTQUFOLEdBQWtCLENBQWxCO0lBQ0EsU0FBT0UsS0FBUDtJQUNIO0lBS0Q3QixPQUFPLENBQUNDLEdBQVIsQ0FBWVosSUFBWjtJQUNnQmpCLFFBQVEsQ0FBQ0MsY0FBVCxDQUF3QixVQUF4QjtJQUNMRCxRQUFRLENBQUNDLGNBQVQsQ0FBd0IsTUFBeEI7O0lBR1gsSUFBSXFDLFlBQVksR0FBRyxTQUFmQSxZQUFlLENBQVVsQyxTQUFWLEVBQXFCNEQsY0FBckIsRUFBb0N4RCxRQUFwQyxFQUE4Q3dDLE9BQTlDLEVBQXVEO0lBQ3RFLE1BQUlpQixFQUFFLEdBQUdiLFFBQVEsQ0FBQ2hELFNBQUQsRUFBWTRELGNBQVosQ0FBakI7SUFDQSxNQUFJNUMsUUFBUSxHQUFHNkMsRUFBRSxDQUFDN0MsUUFBbEI7SUFDQSxNQUFJM0IsSUFBSSxHQUFJLEVBQVo7SUFDQW1DLEVBQUFBLE9BQU8sQ0FBQ0MsR0FBUixDQUFZLGNBQVo7O0lBQ0EsT0FBSSxJQUFJQyxDQUFDLEdBQUUsQ0FBWCxFQUFjQSxDQUFDLEdBQUNtQyxFQUFFLENBQUNDLE9BQUgsQ0FBV25DLE1BQTNCLEVBQW1DRCxDQUFDLEVBQXBDLEVBQXVDO0lBQ25DRixJQUFBQSxPQUFPLENBQUNDLEdBQVIsQ0FBWSxtQkFBaUJtQixPQUFPLENBQUNtQixLQUFyQzs7SUFDQSxRQUFHckMsQ0FBQyxJQUFJa0IsT0FBTyxDQUFDRSxLQUFiLElBQXVCRixPQUFPLENBQUNHLEdBQVIsS0FBZ0JILE9BQU8sQ0FBQ0MsS0FBbEQsRUFBMkQ7SUFDdkR4RCxNQUFBQSxJQUFJLENBQUN5QyxJQUFMLENBQVV4QyxDQUFDLENBQUMsS0FBRCxFQUFPO0lBQUVHLFFBQUFBLEtBQUssRUFBRTtJQUFDdUUsVUFBQUEsVUFBVSxFQUFDO0lBQVo7SUFBVCxPQUFQLEVBQXdDSCxFQUFFLENBQUNDLE9BQUgsQ0FBV3BDLENBQVgsRUFBY1AsS0FBdEQsQ0FBWDtJQUNBcEIsTUFBQUEsS0FBSyxJQUFFLEVBQVA7SUFDQUssTUFBQUEsUUFBUSxDQUFDK0MsU0FBVCxHQUFtQnBELEtBQW5CO0lBQ0gsS0FKRCxNQUlNLElBQUc2QyxPQUFPLENBQUNHLEdBQVIsS0FBZ0JjLEVBQUUsQ0FBQ0MsT0FBSCxDQUFXcEMsQ0FBWCxFQUFjVCxHQUFqQyxFQUFxQztJQUN2QzVCLE1BQUFBLElBQUksQ0FBQ3lDLElBQUwsQ0FBVXhDLENBQUMsQ0FBQyxLQUFELEVBQU87SUFBRUcsUUFBQUEsS0FBSyxFQUFFO0lBQUN1RSxVQUFBQSxVQUFVLEVBQUM7SUFBWjtJQUFULE9BQVAsRUFBd0NILEVBQUUsQ0FBQ0MsT0FBSCxDQUFXcEMsQ0FBWCxFQUFjUCxLQUF0RCxDQUFYO0lBQ0gsS0FGSyxNQUVBLElBQUdPLENBQUMsSUFBSWtCLE9BQU8sQ0FBQ0UsS0FBYixJQUFzQixFQUFFRixPQUFPLENBQUNHLEdBQVIsS0FBZ0JILE9BQU8sQ0FBQ0MsS0FBMUIsQ0FBekIsRUFBMkQ7SUFDN0R4RCxNQUFBQSxJQUFJLENBQUN5QyxJQUFMLENBQVV4QyxDQUFDLENBQUMsS0FBRCxFQUFPO0lBQUVHLFFBQUFBLEtBQUssRUFBRTtJQUFHdUUsVUFBQUEsVUFBVSxFQUFFO0lBQWY7SUFBVCxPQUFQLEVBQTBDSCxFQUFFLENBQUNDLE9BQUgsQ0FBV3BDLENBQVgsRUFBY1AsS0FBeEQsQ0FBWDtJQUNILEtBRkssTUFFRDtJQUNEOUIsTUFBQUEsSUFBSSxDQUFDeUMsSUFBTCxDQUFVeEMsQ0FBQyxDQUFDLEtBQUQsRUFBUXVFLEVBQUUsQ0FBQ0MsT0FBSCxDQUFXcEMsQ0FBWCxFQUFjUCxLQUF0QixDQUFYO0lBQ0g7SUFDSjs7SUFDRCxTQUFNO0lBQ0ZnQixJQUFBQSxJQUFJLEVBQUU3QyxDQUFDLENBQUMsV0FBRCxFQUFhO0lBQUNHLE1BQUFBLEtBQUssRUFBQztJQUN2QkMsUUFBQUEsU0FBUyxFQUFFLGtCQURZO0lBRXZCO0lBQ0F1RSxRQUFBQSxPQUFPLEVBQUU7SUFBRXZFLFVBQUFBLFNBQVMsRUFBRSxrQkFBYjtJQUFpQ3dFLFVBQUFBLE9BQU8sRUFBRTtJQUExQztJQUhjO0lBQVAsS0FBYixFQUlKLENBQUM1RSxDQUFDLENBQUMsY0FBRCxFQUFnQixDQUNqQkEsQ0FBQyxDQUFDLGVBQUQsRUFBaUIsQ0FDZEEsQ0FBQyxDQUFDLEtBQUQsRUFBTztJQUFFQyxNQUFBQSxLQUFLLEVBQUU7SUFBRUMsUUFBQUEsR0FBRyxFQUFFLHlCQUF1QndCLFFBQXZCLEdBQWdDO0lBQXZDO0lBQVQsS0FBUCxDQURhLENBQWpCLENBRGdCLENBQWhCLENBQUYsRUFLSDFCLENBQUMsQ0FBQyxZQUFELEVBQ0dELElBREgsQ0FMRSxDQUpJO0lBREwsR0FBTjtJQWNILENBakNEOztJQW1DQSxJQUFJaUQsUUFBUSxHQUFJLFNBQVpBLFFBQVksQ0FBVXRDLFNBQVYsRUFBcUI0RCxjQUFyQixFQUFxQ3hELFFBQXJDLEVBQStDNkIsZUFBL0MsRUFBZ0U7SUFDNUVBLEVBQUFBLGVBQWUsQ0FBQ2tCLFNBQWhCLEdBQTZCbkQsU0FBUyxHQUFDLENBQVgsR0FBYyxHQUFkLEdBQWtCNEQsY0FBYyxDQUFDakMsTUFBN0Q7SUFDQSxNQUFJa0MsRUFBRSxHQUFHYixRQUFRLENBQUNoRCxTQUFELEVBQVk0RCxjQUFaLENBQWpCO0lBQ0EsTUFBSU8sR0FBRyxHQUFHcEUsS0FBVjtJQUNBLE1BQUlpQixRQUFRLEdBQUc2QyxFQUFFLENBQUM3QyxRQUFsQjtJQUNBLE1BQUk4QyxPQUFPLEdBQUdELEVBQUUsQ0FBQ0MsT0FBakI7SUFDQSxNQUFJN0MsR0FBRyxHQUFHNEMsRUFBRSxDQUFDNUMsR0FBYjtJQUNBLE1BQUlrQixJQUFJLEdBQUkyQixPQUFPLENBQUNNLEdBQVIsQ0FBWSxVQUFDakQsS0FBRCxFQUFRNEMsS0FBUjtJQUFBLFdBQ3BCekUsQ0FBQyxDQUFDLEtBQUQsRUFBTztJQUNKK0UsTUFBQUEsRUFBRSxFQUFFO0lBQ0FDLFFBQUFBLEtBQUssRUFBRSxlQUFTQyxDQUFULEVBQVc7SUFDZC9DLFVBQUFBLE9BQU8sQ0FBQ0MsR0FBUixDQUFZLGtDQUFnQ04sS0FBSyxDQUFDQSxLQUF0QyxHQUE0QyxHQUE1QyxHQUFpRDRDLEtBQTdEO0lBQ0EsVUFBVVEsQ0FBQyxDQUFDQztJQUNaLGNBQUk1QixPQUFPLEdBQUU7SUFDVEMsWUFBQUEsS0FBSyxFQUFFMUIsS0FBSyxDQUFDQSxLQURKO0lBRVQyQixZQUFBQSxLQUFLLEVBQUVpQixLQUZFO0lBR1RoQixZQUFBQSxHQUFHLEVBQUU5QjtJQUhJLFdBQWI7SUFLQTBCLFVBQUFBLFlBQVksQ0FBQ25DLE1BQU0sQ0FBQ0MsU0FBUixDQUFaO0lBQ0FzQixVQUFBQSxNQUFNLENBQUM2QixjQUFELEVBQWdCeEQsUUFBaEIsRUFBeUJ3QyxPQUF6QixFQUFpQ1gsZUFBakMsQ0FBTjtJQUNIO0lBWEQ7SUFEQSxLQUFQLEVBY0VkLEtBQUssQ0FBQ0EsS0FkUixDQURtQjtJQUFBLEdBQVosQ0FBWjtJQWlCQSxTQUFNO0lBQ0ZnQixJQUFBQSxJQUFJLEVBQUU3QyxDQUFDLENBQUMsV0FBRCxFQUFhO0lBQUVHLE1BQUFBLEtBQUssRUFBRTtJQUN6QkMsUUFBQUEsU0FBUyxFQUFFLGlCQURjO0lBRXpCO0lBQ0F1RSxRQUFBQSxPQUFPLEVBQUU7SUFBRXZFLFVBQUFBLFNBQVMsRUFBRTtJQUFiO0lBSGdCO0lBQVQsS0FBYixFQUlKLENBQUNKLENBQUMsQ0FBQyxjQUFELEVBQWdCLENBQ2pCQSxDQUFDLENBQUMsZUFBRCxFQUFpQixDQUNkQSxDQUFDLENBQUMsS0FBRCxFQUFPO0lBQUVDLE1BQUFBLEtBQUssRUFBRTtJQUFFQyxRQUFBQSxHQUFHLEVBQUUseUJBQXVCd0IsUUFBdkIsR0FBZ0M7SUFBdkM7SUFBVCxLQUFQLENBRGEsQ0FBakIsQ0FEZ0IsQ0FBaEIsQ0FBRixFQUtIMUIsQ0FBQyxDQUFDLFlBQUQsRUFDRzZDLElBREgsQ0FMRSxDQUpJLENBREw7SUFhRnNDLElBQUFBLEtBQUssRUFBR047SUFiTixHQUFOO0lBZUgsQ0F2Q0Q7O0lBeUNBLElBQUluQixRQUFRLEdBQUcsU0FBWEEsUUFBVyxDQUFVaEQsU0FBVixFQUFxQmEsSUFBckIsRUFBMkI7SUFDdEMsU0FBTztJQUNIRyxJQUFBQSxRQUFRLEVBQUVILElBQUksQ0FBQ2IsU0FBRCxDQUFKLENBQWdCZ0IsUUFEdkI7SUFFSDhDLElBQUFBLE9BQU8sRUFBR2pELElBQUksQ0FBQ2IsU0FBRCxDQUFKLENBQWdCa0IsTUFGdkI7SUFHSEQsSUFBQUEsR0FBRyxFQUFFSixJQUFJLENBQUNiLFNBQUQsQ0FBSixDQUFnQmlCO0lBSGxCLEdBQVA7SUFLSCxDQU5EOztJQVFBZ0MsTUFBTSxDQUFDeUIsZ0JBQVAsQ0FBd0Isa0JBQXhCLEVBQTRDLFlBQU07SUFDOUM7SUFDQSxNQUFJQyxjQUFjLEdBQUd2QixtQkFBbUIsQ0FBQ3ZDLElBQUksQ0FBQ0UsSUFBTixFQUFXWixPQUFPLENBQUNDLFFBQW5CLENBQXhDO0lBQ0FvQixFQUFBQSxPQUFPLENBQUNDLEdBQVIsQ0FBWSw2QkFBMkJrRCxjQUFjLENBQUMsQ0FBRCxDQUFkLENBQWtCM0QsUUFBekQ7SUFDQUksRUFBQUEsT0FBTyxDQUFDdUQsY0FBRCxDQUFQO0lBRUEsTUFBSUMsVUFBVSxHQUFHdEMsUUFBUSxDQUFDdEMsU0FBRCxFQUFXMkUsY0FBWCxFQUEwQnhFLE9BQU8sQ0FBQ0MsUUFBbEMsRUFBMkNELE9BQU8sQ0FBQ0csWUFBbkQsQ0FBekI7SUFDQVIsRUFBQUEsS0FBSyxHQUFHakIsS0FBSyxDQUFDc0IsT0FBTyxDQUFDSSxLQUFULEVBQWdCcUUsVUFBVSxDQUFDekMsSUFBM0IsQ0FBYjtJQUNBWCxFQUFBQSxPQUFPLENBQUNDLEdBQVIsQ0FBWTNCLEtBQVo7SUFDQXNDLEVBQUFBLE9BQU8sQ0FBQzVCLE1BQU0sQ0FBQ0ksSUFBUixFQUFhK0QsY0FBYixDQUFQO0lBRUgsQ0FYRDs7Ozs7OyJ9
