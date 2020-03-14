(function () {
    // The width and height of the captured photo. We will set the
    // width to the value defined here, but the height will be
    // calculated based on the aspect ratio of the input stream.

    let width = 320;    // We will scale the photo width to this
    let height = 0;     // This will be computed based on the input stream

    // |streaming| indicates whether or not we're currently streaming
    // video from the camera. Obviously, we start at false.

    let streaming = false;

    // The various HTML elements we need to configure or control. These
    // will be set by the startup() function.

    let video;
    let canvas;
    let prediction;
    let url;
    let targetLabel;
    let interval;
    let audio;
    
    function startup() {
        video       = document.getElementById('video');
        canvas      = document.getElementById('canvas');
        prediction  = document.getElementById('prediction');
        url         = document.getElementById('url');
        targetLabel = document.getElementById('targetLabel');
        interval    = document.getElementById('interval');
        start       = document.getElementById('start');

        audio       = new Audio('donttouch.m4a');

        url.value = localStorage.getItem('url');
        targetLabel.value = localStorage.getItem('targetLabel');
        interval.value = localStorage.getItem('interval');

        navigator.mediaDevices.getUserMedia({ video: true, audio: false })
            .then(function (stream) {
                video.srcObject = stream;
                video.play();
            })
            .catch(function (err) {
                console.log("An error occurred: " + err);
            });

        video.addEventListener('canplay', ev => {
            if (!streaming) {
                height = video.videoHeight / (video.videoWidth / width);

                // Firefox currently has a bug where the height can't be read from
                // the video, so we will make assumptions if this happens.

                if (isNaN(height)) {
                    height = width / (4 / 3);
                }

                video.setAttribute('width', width);
                video.setAttribute('height', height);
                canvas.setAttribute('width', width);
                canvas.setAttribute('height', height);
                streaming = true;
            }
        }, false);

        function predict() {
            let context = canvas.getContext('2d');
            if (width && height) {
                canvas.width = width;
                canvas.height = height;
                context.drawImage(video, 0, 0, width, height);

                let data = canvas.toDataURL('image/jpeg');

                if (url.value) {
                    fetch(url.value, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            inputs: {
                                Image: data.substring(data.indexOf(",") + 1),
                            },
                            key: "d6f63a1e-05ea-436f-8401-f22cfb873beb",
                        }),
                    })
                        .then(result => result.json())
                        .then(result => {
                            const _prediction = result.outputs.Prediction;
                            console.log("prediction", result.outputs.Prediction);
                            prediction.innerHTML = _prediction;
                            if (_prediction == targetLabel.value) {
                                audio.play();
                            }
                        })
                        .catch(err => {
                            prediction.innerHTML = err;
                        });
                } else {
                    prediction.innerHTML = "Please supply a valid URL"
                }
            } else {
                console.log("couldn't get frame");
            }
        }

        let intervalID;

        function updateInterval() {
            console.log("interval", interval.value);
            let _interval = parseInt(interval.value);
            if (!isNaN(_interval) && _interval >= 100) {
                if (intervalID) {
                    clearInterval(intervalID);
                }
                intervalID = setInterval(predict, _interval);
            }
        }

        updateInterval();

        url.addEventListener('input', ev => {
            console.log("url", ev);
            localStorage.setItem('url', ev.target.value);
        }, false);

        targetLabel.addEventListener('input', ev => {
            console.log(ev);
            localStorage.setItem('targetLabel', ev.target.value);
        }, false);

        interval.addEventListener('input', ev => {
            console.log(ev);
            localStorage.setItem('interval', ev.target.value);
            updateInterval();
        }, false);

        function initAudio(){
            var audio = new Audio('baa.mp3');
            var self = this;
            //not sure if you need this, but it's better to be safe
            self.audio = audio;
            var startAudio = function(){
                self.audio.play();
                document.removeEventListener("touchstart", self.startAudio, false);
            }
            self.startAudio = startAudio;
        
            var pauseAudio = function(){
                self.audio.pause();
                self.audio.removeEventListener("play", self.pauseAudio, false);
            }
            self.pauseAudio = pauseAudio;
        
            document.addEventListener("touchstart", self.startAudio, false);
            self.audio.addEventListener("play", self.pauseAudio, false);
        }
    }

    // Set up our event listener to run the startup process
    // once loading is complete.
    window.addEventListener('load', startup, false);
})();