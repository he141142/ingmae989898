
import { init } from 'snabbdom/build/package/init'
import { classModule } from 'snabbdom/build/package/modules/class'
import { propsModule } from 'snabbdom/build/package/modules/props'
import { styleModule } from 'snabbdom/build/package/modules/style'
import { eventListenersModule } from 'snabbdom/build/package/modules/eventlisteners'
import { h } from 'snabbdom/build/package/h'
import { toVNode } from 'snabbdom/build/package/tovnode'
import { datasetModule } from 'snabbdom/build/package/modules/dataset'
import * as engine from './ingame'



var patch = init([ // Init patch function with chosen modules
  classModule, // makes it easy to toggle classes
  propsModule, // for setting properties on DOM elements
  styleModule, // handles styling on elements with support for animations
  eventListenersModule, // attaches event listeners
  datasetModule
])

// const data = [
//   {ques:'elephant',ans{}}
// ]


var container = document.getElementById("question");
var body = document.getElementById("wrap");
var Node = h('div#wrap',[
  h('div.left',[
    h('img',{ props: { src:"../—Pngtree—vector users icon_4144740.png" } }),
    h('div.score',[
      h('p',"800")
    ])
  ]),
  h('div.middle',[
    h('p',"10/15"),
    h('p',"15")
  ]),
  h('div.right',[
    h('img',{ props: { src:"../—Pngtree—vector users icon_4144740.png" } }),
    h('div.score',[
      h('p',"800")
    ])
  ])
])

var VNode = h('div#question',[
  h('div.big-image',[
    h('img',{ props: { src: "../resource/unnamed.png" } })
  ])
])

var NodeAnswer = h('div.answer',[
  h('div.one',{dataset: {index: 0}},"Elephant"),
  h('div.two',{ dataset: { index : 1 } },"Lion"),
  h('div.three',{ dataset: { index : 2 } },"Tiger"),
  h('div.four',{ dataset: { index : 3 } },"FIsh")
])


// var 

// function view(data){
//   var vnode= h('div',)

// }





window.addEventListener('DOMContentLoaded', () => {
  // var container = document.getElementById('container')
  // vnode = patch(container, view(data))
  // render()
  var wrp = document.getElementById("wrap")
  var ques = document.getElementById("question")
  var ans = document.getElementById("answer")
  patch(wrp,Node)
  patch(ques,VNode)
  patch(ans,NodeAnswer)
  engine.gameEngine();
})

