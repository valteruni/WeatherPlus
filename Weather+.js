var express = require("express");
const port = 8080;
var app = express();
var code = "";
var token = "";
var client_id = ""; // fill-in
var client_secret = ""; // fill-in
var redirect_uri = "http://localhost:8080/post/code";
var token_uri = 'https://accounts.google.com/o/oauth2/token';
var scope="https://www.googleapis.com/auth/plus.stream.write";
var API_url ="https://www.googleapis.com/plusDomains/v1/people/me/activities";
var getCode = "https://accounts.google.com/o/oauth2/auth?client_id="+client_id+
"&scope="+scope+"&approval_prompt=force"+
"&redirect_uri="+redirect_uri+"&response_type=code";
//LT RABBITMQ
var amqp = require('amqplib/callback_api');
var q_name = 'Log_queue';
var log = 'SVlogger.log';
var imageURL ='http://www.055firenze.it/ridimensiona.html/cms/660/350/100/cms/custom/files/100005/ct50012_id136160_t1/cielonuvoloso.jpg';



function consume(){
    /*------------------SEMANTICA----------------
    la funz è attiva sin dall'attivazione del server
    ha il compito di prelevare i messaggi dalla coda
    e di trasferirli su un log_file dove è possibile leggere
    la cronologia delle ricerche
    ---------------------------------------------*/
    amqp.connect('amqp://localhost', function(err, conn) {
        conn.createChannel(function(err, ch) {
          ch.assertExchange(q_name, 'fanout', {durable: false});
          ch.assertQueue('', {exclusive: true}, function(err, q) {
            console.log("[consume_log]Waiting for messages in %s.", q.queue);//è una queue random
            ch.bindQueue(q.queue, q_name, '');
            ch.consume(q.queue, function(msg) {
                console.log("[conusume_log]consume..%s", msg.content.toString());
                //scrive su logger file come write_Log_queue Fx
                write_Log_queue(msg.content.toString());
            }, {noAck: true});
          });
        });
      });
  }

function write_Log_queue(msg){
        /*----------------SEMANTICA------------------
        la funx scrive  gli elementi consumati dalla coda
        sul file doc aperto in append
        la fnx è chiamata ogni volta che si consuma un elemento
        ---------------------------------------------*/
        var fs = require('fs');
        fs.appendFile(log, msg,'utf8',function(err){
          if(err) throw err;
          else{
            console.log("[write_log]scritto su log ...."+msg);
            }
          });
        }

function send_Log_queue(msg){
    amqp.connect('amqp://localhost', function(err,conn){
           /*----------------SEMANTICA------------------
           MSG  è una var def da   Fx AUTH.
           ogni volta che eseguo AUTH vado ad eseguire publish su una coda di RABBITMQ,
           dv il mess chiude sempre con "<br\>\n" .
          ------------------------------------------- */
          conn.createChannel(function(err,ch){
            ch.assertExchange(q_name, 'fanout', {durable: false});
                //pubblico mess sull'exchange ma non su una coda particolare
                ch.publish(q_name, '', new Buffer(msg+"<br/>\n"));
                console.log("[send_log]Sent to RABBITMQ %s", msg);
              });
            setTimeout(function() { conn.close();}, 500);
            });
    }


var msgGL="";
var objGET;
app.get("/get/:city",function(req,res){
  /*-------------SEMANTICA--------------
  data una città ritorna le info relative a
  località, skytext, temperatura , date, day    (nel json.data)
  da  JSON ---> stringa così da formare il msg da postare
  su google+.
  --------------------------------------*/
  var request = require("request");
  var url = 'http://weathers.co/api.php?city='+req.params.city;
  request.get({
    url:url
      }, function(error,response,body){
          console.log("[CM GET]doing get....to "+req.params.city);
          var obj = JSON.parse(body);
          if( obj.data.error != undefined ){
              console.log("[CM ERR]"+obj.data.error);
              res.send("error <br/> "+obj.data.error+"<br/> please retry...  <hr/><br/> <button onclick='window.location.href=\"/\"'> back </button>");
          }
          else{
          console.log("----CM RESPONSE-------");
          console.log(obj);
          console.log("----CM END------------");
          if(obj.data.skytext != 'Sky is Clear'){
            obj.data.skytext = "with "+obj.data.skytext+" in the sky...";
          }
          //------------------------
          objGET = obj;
          //postare
          msgGL= "today we have "+obj.data.temperature+" degrees in "+obj.data.location+" with a humidity rate of "+obj.data.humidity+"\n "+obj.data.skytext+" \n("+obj.data.day+"|"+obj.data.date+")";
          //visualizzare
          var msgGL_html = "today we have "+obj.data.temperature+" degrees in "+obj.data.location+" with a humidity rate of "+obj.data.humidity+"<br/> "+obj.data.skytext+" <br/>("+obj.data.day+"|"+obj.data.date+")";
          res.send(msgGL_html+"<hr/><button onclick='window.location.href=\""+getCode +"\"'>Posta su Google+ </button>");
        }
      });
  });

app.get('/post/code', function (req, res) {
    /*---------------SEMANTICA----------------------
    la funzione prende msgGL + scope + client_id/client_secret
    per richiedere sia il code che il token necessari a postare un messaggio
    con informazioni riguardanti il meteo di una città
    ------------------------------------------------*/
      code = req.query.code;
      var url = token_uri;
  	   var headers = {'Content-Type': 'application/x-www-form-urlencoded'};
  	   var body ="code="+code+"&client_id="+client_id+
        "&client_secret="+client_secret+
        "&redirect_uri="+redirect_uri+"&grant_type=authorization_code";
        //GET code
        var request = require('request');
  	     request.post({
  		       headers: headers,
  		         url: url,
  		           body: body
  		           }, function(error, response, body){
  			              console.log("[POST] code recived..\n"+body);
                      my_obj=JSON.parse(body);
                      token = my_obj.access_token;
  			              console.log("[POST]The token is: "+token);

                        //POST google+
                          var request = require("request");

                          var options = { method: 'POST',
                                          url: API_url,
                                          headers:
                                          { 'content-type': 'application/json',
                                          'Connection' :  'Keep-Alive',
                                          authorization: 'Bearer '+token },
                                          body:
                                          { object: { originalContent: msgGL },
                                          access: { items: [ { type: 'domain' } ], domainRestricted: true } },
                                          json: true };
                                          msgGL="";

                                          request(options, function (error, response, body) {
                                            if (error) {
                                              console.log("[POST]error"+error);
                                              res.send("errore POST"+error);
                                              throw new Error(error);
                                            }else{

                                              var rs = JSON.stringify(response);
                                              var bd = JSON.stringify(body);

                                              //CALL RABBITMQ-send_log
                                              var mss = "["+objGET.data.location+"] ["+objGET.data.day+"|"+objGET.data.date+"] ["+objGET.data.temperature+"]";
                                              send_Log_queue(mss);

                                              console.log("[POST]response-statusCode=>"+JSON.parse(rs).statusCode);
                                              console.log("[POST]msgGL posted=>"+JSON.parse(bd).title);
                                              res.send("il messaggio <"+JSON.parse(bd).title+"> è stato postato con successo! per visualizzarlo vai <a href=\""+JSON.parse(bd).url+"\" target=\"_blank\">questa pagina di Google+</a><br/><hr> <button onclick='window.location.href=\"/\"'>return to home</button>");
                                            }
                                          });
                                  });
});


app.get('/log',function(req,res){
  /*---------------SEMANTICA-------------------
  la funz è eseguita quando il client intende ricevere il logger file,
  la funzione legge il file .log creato dalla funzione CONSUME
  e ritorna tutte le ricerche  , se va in crash la cronologia si salva
  ---------------------------------------------*/
  //sola lettura
  var fs = require('fs');
  fs.readFile(log,'utf8',function(err,data){
    if(err){
      console.log("[READ_log]"+err);
      res.send("<html> logger vuoto!!<br/> <button onclick='window.location.href=\"/\"'>return to home</button>");
    }else{
      console.log("[READ_log]send logger to client");
      var htm = "<!DOCTYPE html> <html> <head> <title>WeatherPlus</title> <style type=\"text/css\"> #header{font-family:verdana;color:skyblue;background-image:url(\""+imageURL+"\");background-repeat: no-repeat;background-size:100%;text-align:center;}</style></head><body ><div id=\"header\" ><h2 >Cronologia delle ricerche effettuate.</h2><br/><br/><br/><button onclick=\"window.location='index.html'\">Indietro</button><button onclick=\"window.location='/log'\">Aggiorna</button><br/><br/><br/></div><hr></hr><div id=\"data\">"+data+"</div></body></html>";
      res.send(htm);
    }
    });
});


app.use(express.static('public'));
app.listen(port, function(){
  console.log("[MAIN]Start WeatherPlus Server on %s",port);
  consume();//avvio consumer
});
