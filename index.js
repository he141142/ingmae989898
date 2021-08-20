var express = require("express");
var  app  =  express ( ) ;
// app.set('view engine','ejs');
app.set('view engine','ejs');

const host='0.0.0.0';
var path = require('path');

const port = process.env.PORT || 3000;
// app.use(express.static(__dirname + '/views'));
app.use(express.static(path.join(__dirname, '/views')));
app.use(express.static(path.join(__dirname, '/public')));

app.set('views', __dirname + '/views');


app.get('/',function(req,res){
   res.render('ingame');
});
app.listen(port, host,function(){
   console.log('start sever success!');
   console.log("host: "+host+"  port:"+port)
});