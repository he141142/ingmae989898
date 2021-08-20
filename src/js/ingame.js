
import { init } from 'snabbdom/build/init';
import { classModule } from 'snabbdom/build/modules/class';
import { propsModule } from 'snabbdom/build/modules/props';
import { styleModule } from 'snabbdom/build/modules/style';
import { eventListenersModule } from 'snabbdom/build/modules/eventlisteners';
import { h } from 'snabbdom/build/h';
import { datasetModule } from 'snabbdom/build/modules/dataset';
import { attributesModule } from 'snabbdom/build/modules/attributes';

var patch = init([ // Init patch function with chosen modules
    classModule, // makes it easy to toggle classes
    propsModule, // for setting properties on DOM elements
    styleModule, // handles styling on elements with support for animations
    eventListenersModule, // attaches event listeners
    datasetModule,
    attributesModule
]);


var Node = h('div#wrap',[
    h('div.left',[
        h('img',{ props: { src:'../—Pngtree—vector users icon_4144740.png' } }),
        h('div.score',[
            h('p','800')
        ])
    ]),
    h('div.middle',[
        h('div.popup',{style: {
            transform: 'translateY(-2em)'
        }},[
            h('div','Your answer is correct!'),
            h('img',{ props: { src:'../resource/greentick.png' } })
        ]),
        h('p','10/15'),
        h('p','15')
    ]),
    h('div.right',[
        h('img',{ props: { src:'../—Pngtree—vector users icon_4144740.png' } }),
        h('div.score',[
            h('p','800')
        ])
    ])
]);

var wrp = document.getElementById('wrap');
patch(wrp,Node);
var VNode;
var score = 0;
var gameIndex = 0;//cau hien tai dang choi
var middle= document.getElementsByClassName('middle');
var element = {
    scoreElm: document.getElementsByClassName('left')[0].getElementsByClassName('score')[0].getElementsByTagName('p')[0],
    questionNUmb: middle[0].getElementsByTagName('p')[0],
    quizz: document.getElementById('quizz')
};
var timmer = {
    timmerObj: undefined,
    timmerIndex: 15,
    time : middle[0].getElementsByTagName('p')[1]
};

var data = {
    selected:undefined,
    ques:[

        {question:'Table' ,key: 'Table' ,answer:[{value: 'Bitmap', key:'bitmap'}, {value:'Table', key:'Table'}, {value:'Raster',key:'raster'}, {value:'GIF',key:'gif'}]},
        {question:'Airport' ,key: 'Airport' ,answer:[{value: 'Airport', key:'Airport'}, {value:'Stadium', key:'Stadium'}, {value:'Museum',key:'Museum'}, {value:'Building',key:'Building'}]},
        {question:'Elephant' ,key: 'Elephant' ,answer:[{value: 'Lion', key:'Lion'}, {value:'Elephant', key:'Elephant'}, {value:'Cat',key:'Cat'}, {value:'Dog',key:'Dog'}]},
        {question:'Lion' ,key: 'Lion' ,answer:[{value: 'Bear', key:'Bear'}, {value:'Lion', key:'Lion'}, {value:'Bird',key:'Bird'}, {value:'Rabbit',key:'Rabbit'}]},
        {question:'Car' ,key: 'Car' ,answer:[{value: 'Air plane', key:'Air plane'}, {value:'Train', key:'Train'}, {value:'Bus',key:'Bus'}, {value:'Car',key:'Car'}]},
        {question:'Cat' ,key: 'Cat' ,answer:[{value: 'Dog', key:'Dog'}, {value:'Hedgehog', key:'Hedgehog'}, {value:'lizard',key:'lizard'}, {value:'Cat',key:'Cat'}]},
        {question:'Zoo' ,key: 'Zoo' ,answer:[{value: 'Museum', key:'Museum'}, {value:'Zoo', key:'Zoo'}, {value:'City',key:'City'}, {value:'Park',key:'Park'}]},
        {question:'Lamp' ,key: 'Lamp' ,answer:[{value: 'Laptop', key:'Laptop'}, {value:'Table', key:'Table'}, {value:'Lamp',key:'Lamp'}, {value:'Chair',key:'Chair'}]},
        {question:'Window' ,key: 'Window' ,answer:[{value: 'Door', key:'Door'}, {value:'Gate', key:'Gate'}, {value:'Window',key:'Window'}, {value:'Tunnel',key:'Tunnel'}]},
        {question:'Laptop' ,key: 'Laptop' ,answer:[{value: 'Laptop', key:'Laptop'}, {value:'Macbook', key:'Macbook'}, {value:'Computer',key:'Computer'}, {value:'Chair',key:'Chair'}]},
    ],
};




function preload(images) {
    if (document.images) {
        var a=[];

        var imageArray = images;
        console.log('\n\nImage array:\n\n'+imageArray);
        for(let i=0; i<=imageArray.length-1; i++) {
            var imageObj = new Image();
            imageObj.src='./resource/question/'+imageArray[i].question+'.png';
            console.log('Preload image: '+imageArray[i].question);
            console.log(imageObj);
            a.push(i);
        }
        console.log(a);
    }
}

function  render (data, scoreElm, yourAns, questionNUmbElm) {
    VNode = patch(VNode, selectPharse(gameIndex,data,scoreElm,yourAns).node);
    timmer.timmerIndex = 15;
    runtime(timmer.time,data);
    gameIndex = gameIndex+1;
    var func = function() { 
        VNode =  patch(VNode, viewQUes(gameIndex,data,scoreElm,questionNUmbElm).node);
    };
    setTimeout(func,800);
}


var runtime = function(clockELm, data) {
    timmer.timmerObj =  setInterval(function() { updateClock(clockELm, data); },1000);
};

var updateClock = function (clockELm, data) {
    timmer.timmerIndex--;
    if (timmer.timmerIndex == -1) {
        timmer.timmerIndex = 15;
        clearTimeout(timmer.timmerObj);
    } 
    if(timmer.timmerIndex == 15){
        var yourANs = {
            Value: null,
            Index: null,
            Key: generate(gameIndex, data).key
        };
        render(data, element.scoreElm, yourANs, element.questionNUmb);
    }
    if(gameIndex == 10){
        clearTimeout(timmer.timmerObj);
        window.alert('end game');
        return;
    }
    clockELm.innerText = `${timmer.timmerIndex}`;
};

function generateGameIndexes (array, score) {
    var currentIndex = array.length, temporaryValue, randomIndex;
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

const fadeInOutStyle = {
    opacity: '0', delayed: { opacity: '1' }, remove: { opacity: '0' }
};
console.log(data);
var container = document.getElementById('question');
var body = document.getElementById('wrap');
// var VNode;

var selectPharse = function (gameIndex, questionIngame,scoreElm, yourANs) {
    var qa = generate(gameIndex, questionIngame);
    var question = qa.question;
    var Node =  [];
    console.log('rendering...');
    for(let i =0; i<qa.answers.length; i++){
        console.log('ANSWER INDEX: '+yourANs.index );
        console.log('reloaded');

        if(i == yourANs.Index && (yourANs.Key === yourANs.Value)  ){
            Node.push(h('div',{ style: {background:'green'} }, qa.answers[i].value));
            score+=10;
            scoreElm.innerText=score;
        }else if(yourANs.Key === qa.answers[i].key){
            Node.push(h('div',{ style: {background:'green'} }, qa.answers[i].value));
        }else if(i == yourANs.Index && !(yourANs.Key === yourANs.Value) ){
            Node.push(h('div',{ style: {  background: 'red' } }, qa.answers[i].value));
        }else{
            Node.push(h('div', qa.answers[i].value));
        }
    }
    return{
        node: h('div.quizz',{style:{
            transform: 'translateY(-2em)',
            // delayed: { transform: 'translate(1)', opacity: '0' },
            destroy: { transform: 'translateY(-2em)', opacity: '0' }
        }},[h('div#question',[
            h('div.big-image',[
                h('img',{ props: { src: './resource/question/'+question+'.png' } })
            ])
        ]),
        h('div.answer', 
            Node
        )])
    };
};

var viewQUes =  function (gameIndex, questionIngame, scoreElm, questionNUmbElm) {
    questionNUmbElm.innerText = (gameIndex+1)+'/'+questionIngame.length;
    var qa = generate(gameIndex, questionIngame);
    var tmp = score;
    var question = qa.question;
    var answers = qa.answers;
    var key = qa.key;
    var node =  answers.map((value, index) => 
        h('div',{ 
            on: {
                click: function(e){ 
                    console.log('value and index you clicked: '+value.value+':'+ index);
                    let elm = e.target;
                    var yourANs= {
                        Value: value.value,
                        Index: index,
                        Key: key
                    };
                    clearTimeout(timmer.timmerObj);
                    render(questionIngame,scoreElm,yourANs,questionNUmbElm);
                }
            } 
        }, value.value)
    );
    return{
        node: h('div.quizz',{ style: {
            transform: 'translateY(2em)',
            // delayed: { transform: 'translate(0)', opacity: '1' },
            destroy: { transform: 'translateY(2em)' }
        }},[h('div#question',[
            h('div.big-image',[
                h('img',{ props: { src: './resource/question/'+question+'.png' } })
            ])
        ]),
        h('div.answer', 
            node
        )]),
        Score : tmp
    };
};

var generate = function (gameIndex, data) {
    return {
        question: data[gameIndex].question,
        answers:  data[gameIndex].answer,
        key: data[gameIndex].key
    };
};

window.addEventListener('DOMContentLoaded', () => {
    //khoi tao tro choi
    let questionInGame = generateGameIndexes(data.ques,element.scoreElm);
    console.log('questionInGame.question '+questionInGame[0].question);
    preload(questionInGame);

    var updateView = viewQUes(gameIndex,questionInGame,element.scoreElm,element.questionNUmb);
    VNode = patch(element.quizz, updateView.node);
    console.log(VNode);
    runtime(timmer.time,questionInGame);


});