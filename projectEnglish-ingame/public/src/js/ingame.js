import { gsap } from "gsap";
import { TimelineLite, CSSPlugin, AttrPlugin,TweenMax,TimelineMax,TweenLite }  from "gsap/all";



export function animationPipeline(){
    var self = this
var questions = [
    'Elephant',
    'Lion',
    'Car',
    'Airport',
    'Cat',
    'Zoo',
    'Lamp',
    'Window',
    'Laptop',
    'Table'
   ],
   answers = [
    ['Lion', 'Elephant', 'Cat', 'Dog'],
    ['Bear', 'Lion', 'Bird', 'Rabbit'],
    ['Air plane', 'Train', 'Bus', 'Car'],
    ['Building', 'Stadium', 'Museum', 'Airport'],
    ['Dog', 'Hedgehog', 'lizard', 'Cat'],
    ['Museum', 'Zoo', 'City', 'Park'],
    ['Desk', 'Table', 'Lamp', 'Chair'],
    ['Door', 'Gate', 'Window', 'Tunnel'],
    ['Laptop', 'Macbook', 'Computer', 'Chair'],
    ['Bitmap', 'Table', 'Raster', 'GIF']
   ],
   middle = document.getElementsByClassName("middle"),
   time = middle[0].getElementsByTagName("p")[1],
   questionNUmb = middle[0].getElementsByTagName("p")[0],
   question = document.getElementsByClassName("big-image")[0].getElementsByTagName("img")[0],
   gameAns = [],
   buttonOne = document.getElementsByClassName('one')[0],
   buttonTwo = document.getElementsByClassName('two')[0],
   buttonThree = document.getElementsByClassName('three')[0],
   buttonFour = document.getElementsByClassName("four")[0],
   scoree = document.getElementsByClassName("left")[0].getElementsByClassName("score")[0].getElementsByTagName("p")[0],
   buttonArray = [buttonOne,buttonTwo,buttonThree,buttonFour],
   timerObject = undefined,
   gameQuestions = [],
   gameAnswers = [],
   score=0,
   correctQUan = 0,
   frag=true,
   gameIndex=0;
   var timmerIndex = 15;
   
   

   self.equalsIgnoringCase=function(text, other) {
    return text.localeCompare(other, undefined, { sensitivity: 'base' }) === 0; 
   }
   var correctAnswer= [];
   self.initCorrectAns=function(){
    for(let i = 0 ;i<answers.length;i++){
        for(let j =0;j<answers[i].length;j++){
            if(equalsIgnoringCase(answers[i][j],questions[i])){
                correctAnswer.push(j)
            }
        }
    }
   }
   self.initialize = function(){
       self.initCorrectAns();
       for (var i = 0; i < buttonArray.length; i++) {
        buttonArray[i].addEventListener('click', self.anwerClicked);
      }
   }
   
   self.anwerClicked = function(e) {

    clearTimeout(timerObject);
    var answerIndex = Number(e.target.getAttribute('data-index'));
    var answered = e.target.className;
    var yourAns = document.getElementsByClassName(answered)[0];
    console.log(yourAns)
    // Get the actual answer index 
    var actualCorrectAnswerIndex = gameAnswers[gameIndex];
    var corr = document.querySelectorAll(`[data-index="${actualCorrectAnswerIndex}"`)[0]
    
    // Correct answer
   
    

    if (actualCorrectAnswerIndex == answerIndex) {
    //   rightAnswer.play();
      score += 10;
      scoree.innerText = score;
      console.log(corr)

     gsap.to(yourAns,{duration: 0.3, 
        scale: 1.5, 
        rotationY: 45, 
        x: 10, 
        y: 0, 
        border:"5px solid green",
        opacity:0.7,
        background:"green",
        z: -200
        ,repeat:2});
    self.process(yourAns)
      correctQUan++;
    } else {
   gsap.to(yourAns,{
      duration:1,
      background: "red"
    })

  gsap.to(corr,{duration: 0.5, 
      scale: 1.5, 
      rotationY: 45, 
      x: 10, 
      y: 0, 
      border:"5px solid green",
      opacity:0.7,
      background:"green",
      
      z: -200
      ,repeat:3})
      // self.process();
      self.process([corr,yourAns])

    }
   };

   self.process = function(...x){
    frag = false;
    var timer = 2;
     function func(){
       if(timer==0){
        
        //  self.reset();
        // x.reverse(0);
        gameIndex++;
        timmerIndex=15;
        setTimeout(function(){
          for(var i =0;i<x.length;i++){
            gsap.set(x[i],{clearProps:"all"})
          }
        },0)
         self.setupUserInterfaceWithData();
         window.clearInterval(waitProc);
         self.runTimer();
       }
       console.log(timer)
       timer--;

     }
     var waitProc = window.setInterval(func,1000);
   }
  
   self.runTimer = function() {
    timerObject = window.setInterval(self.updateClock, 1000);
   };
   
   self.updateClock = function() {
    timmerIndex--;
    if (timmerIndex == -1) {
      timmerIndex = 15;
      gameIndex++;
    } 
    if(timmerIndex==15){
      self.setupUserInterfaceWithData();
    }
  
     time.innerText=`${timmerIndex}`;
   };
   
    self.generateGameIndexes = function() {
        var breakFlag = false;
        while (!breakFlag) {
          var randomNumber = Math.floor(Math.random() * 9);
          if (gameQuestions.indexOf(randomNumber) == -1) {
            gameQuestions.push(randomNumber);
            gameAnswers.push(correctAnswer[randomNumber]);
          }
          if (gameQuestions.length == 9) {
            breakFlag = true;
          }
        }
        scoree.innerText = score; 
       };

       self.setupUserInterfaceWithData = function() {
        // Add questions to buttons
        var ques = questions[gameQuestions[gameIndex]];
         question.src = "./redource/question"+ques+".png";
         questionNUmb.innerText = ""+correctQUan+"/"+questions.length
        // Add answers to buttons
        var ans = answers[gameQuestions[gameIndex]];
        for (var i = 0; i < ans.length; i++) {
          var a = ans[i];
          buttonArray[i].innerText = a;
          console.log(ans)
        }
       };
       self.initialize();
       self.generateGameIndexes();
       self.setupUserInterfaceWithData();
       self.runTimer();
}

export function gameEngine(){
    var interval = setInterval(function() {
        if(document.readyState === 'complete') {
          clearInterval(interval);
          var pipe = animationPipeline();
      
        //   window.onresize = function(event) {
        //     var pipe = animationPipeline()
        //   };
        }
       }, 100);
   }

   //0316332088
   //0316032088