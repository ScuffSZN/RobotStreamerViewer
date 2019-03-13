/* If you're feeling fancy you can add interactivity 
    to your site with Javascript */

// prints "hi" in the browser's dev tools console
/*
  RobotStreamer Viewer API
  
  Get Video: http://api.robotstreamer.com:8080//v1/get_endpoint/enduser_jsmpeg_video_broadcast/<ROBOT ID>
  Get Audio: http://api.robotstreamer.com:8080//v1/get_endpoint/enduser_jsmpeg_audio_broadcast/<ROBOT ID>
  
*/
var foo = document.querySelector("body"),
    bar = document.querySelector(".video"),
    video,
    audio;
fit( bar, foo,{
  watch:true
});

var loadStreamer = (id) => {
  j = {
    "video":{
      "ip":null,
      "port":null
    },
    "audio":{
      "ip":null,
      "port":null
    }
  }
      fetch('http://api.robotstreamer.com:8080//v1/get_camera_id/'+id)
      .then(function(response) {
          return response.json();
        })
      .then(function(a){
        
          fetch('http://api.robotstreamer.com:8080//v1/get_endpoint/enduser_jsmpeg_video_broadcast/'+a.camera_id)
          .then(function(response) {
            return response.json();
          })
          .then(function(myJson) {

            j.video.ip = myJson.host;
            j.video.port = myJson.port;

            fetch('http://api.robotstreamer.com:8080//v1/get_endpoint/enduser_jsmpeg_audio_broadcast/'+a.camera_id)
            .then(function(response) {
              return response.json();
            })
            .then(function(myJson) {
              j.audio.ip = myJson.host;
              j.audio.port = myJson.port;
              console.log(j)
              startStream(j)
            });
          });
        
        });
    },
    startStream = (conf) => {
        video = new JSMpeg.Player("ws://"+conf.video.ip+":"+conf.video.port, {
          canvas: bar, 
          audio:false,
          disableGl:true,
          disableWebAssembly:true,
          onPlay:function(){
            setTimeout(()=>{fit( bar, foo)},1000);
          }
                                                              });
        audio = new JSMpeg.Player("ws://"+conf.audio.ip+":"+conf.audio.port, {
          video:false,
          disableGl:true,
          disableWebAssembly:true,
        });
    },
    getUrlVars = () => {
      var vars = {};
      var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
          vars[key] = value;
      });
      return vars;
    }
loadStreamer(getUrlVars()["id"]);

if (location.protocol !== "http:") {
  location.protocol = "http:";
}