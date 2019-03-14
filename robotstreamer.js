var getVideo = (id) => {
      return new Promise(resolve => {
        var j = {};        
        fetch(`http://api.robotstreamer.com:8080//v1/get_endpoint/enduser_jsmpeg_video_broadcast/${id}`)
        .then((res) => res.json())
        .then(function(json){
          j = json.host+":"+json.port;
          resolve(j);
        })
      });
    },
    getAudio = (id) => {
      return new Promise(resolve => {
        var j = {};        
        fetch(`http://api.robotstreamer.com:8080//v1/get_endpoint/enduser_jsmpeg_audio_broadcast/${id}`)
        .then((res) => res.json())
        .then(function(json){
          j = json.host+":"+json.port;
          resolve(j);
        })
      });
    },
    getServers = (id) => {
      return Promise.all([getVideo(id), getAudio(id)])
    },
    getOnline = (id) => {
      return new Promise(resolve => {
        
        var j = {};
        if(!isNaN(id)) {
          fetch(`http://api.robotstreamer.com:8080/v1/get_robot/${id}`)
          .then(function(res){
            return res.json();
          })
          .then(function(json){
            if(json.length != 0) {
              j.error = 0;
              if(json[0].status == "online")
                j.online = true
              else
                j.online = false
              
              j.camera_id = json[0].camera_id
              resolve(j);
            } else {
              j.error = 1;
              resolve(j);
            }
          })
          .catch(function(error) {
            j.error = 4;
            resolve(j);
          });
        } else {
          j.error = 2;
          resolve(j);
        }
      });
    },
    url = (i) => {
      var vars = {};
      var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
          vars[key] = value;
      });
      return vars[i];
    },
    errors = ["Robot exists and is online.", "No streamer found.", "Invalid ID, must be a number.", "Streamer is offline.", "Connection has been interupted, trying to reconnect."]
// initalize
var foo = document.querySelector("body"),
    bar = document.querySelector(".video"),
    message = document.querySelector(".message"),
    video,
    audio,
    init = () => {
      fit(bar, foo,{watch:true});
      fit(message, foo,{watch:true});
      startPlayer(url("id"));
    },
    offlineAttempts=0,
    playAttempts=0,
    lastTime,
    playerCheckup = new IntervalTimer(function () {
        if(lastTime == video.currentTime && video.isPlaying) {
          setError(4);
          message.style.opacity = "1";
          bar.style.opacity = "0.25"
          playAttempts++;
          console.log("attempting #"+playAttempts)
          if(playAttempts == 5) {
            detachPlayer();
            startPlayer(url("id"));
            console.log("resetting");
            playerCheckup.pause();
          }
        } else {
          playAttempts = 0;
          message.style.opacity = "0";
          bar.style.opacity = "1"
        }
        lastTime = video.currentTime;
    }, 1000);playerCheckup.pause();


var detachPlayer = () => {
  video.destroy();
  audio.destroy();
  },
  initPlayer = (v,a) => {
    video = new JSMpeg.Player("ws://"+v, {
          canvas: bar, 
          audio:false,
          disableGl:true,
          disableWebAssembly:true,
          onPlay:()=>{
            setTimeout(()=>{fit( bar, foo)},1000);
          },
          onEnd:()=>{
            setTimeout(()=>{fit( bar, foo)},1000);
            refreshPlayer();
            message.style.opacity = "1"
            bar.style.opacity = "0.25"
          },
          onSourceEstablished: () => {
            playerCheckup.resume();
            console.log("playing");
            message.style.opacity = "0"
            bar.style.opacity = "1"
          }
    });
    audio = new JSMpeg.Player("ws://"+a, {
          video:false,
          disableGl:true,
          disableWebAssembly:true,
    });
  },
    startPlayer = async (i) => {
      var robot = await getOnline(i);
      if(robot.error == 0 && robot.online) {
        await getServers(robot.camera_id)
        .then(([video, audio]) => {
          console.log("video server: "+video, "audio server: "+audio);
          initPlayer(video,audio);
        })
      } else if(robot.error == 0 && !robot.online) {
        setTimeout(()=>{refreshPlayer()},5000);
        setError(3)
      } else if(robot.error == 4){
        setError(4)
        setTimeout(()=>{refreshPlayer()},5000);
      } else if(robot.error != 0){
        console.log(errors[robot.error])
        setError(robot.error)
      }
    },
    refreshPlayer = () => {
      if(typeof(video) !== 'undefined')
        detachPlayer();
      startPlayer(url("id"));
    },
    setError = (e) => {
      document.querySelector(".message p").innerHTML = errors[e];
    }



function IntervalTimer(callback, interval) {
        var timerId, startTime, remaining = 0;
        var state = 0; //  0 = idle, 1 = running, 2 = paused, 3= resumed

        this.pause = function () {
            if (state != 1) return;

            remaining = interval - (new Date() - startTime);
            window.clearInterval(timerId);
            state = 2;
        };

        this.resume = function () {
            if (state != 2) return;

            state = 3;
            window.setTimeout(this.timeoutCallback, remaining);
        };

        this.timeoutCallback = function () {
            if (state != 3) return;

            callback();

            startTime = new Date();
            timerId = window.setInterval(callback, interval);
            state = 1;
        };

        startTime = new Date();
        timerId = window.setInterval(callback, interval);
        state = 1;
    }



init();
