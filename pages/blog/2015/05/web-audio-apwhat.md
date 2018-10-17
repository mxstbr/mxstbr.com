export const frontmatter = {
  "published": false,
  "title": "WebAudio APwhat?",
  "tags": "JavaScript tech WebAudio"
};



Raise your hand if you’ve ever used an audio tag with dynamic sources to add audio to a web project. You just want to play some background music, a few feedback sounds, maybe add stereo sound - and suddenly, the possibilities of the audio tag are exceeded.

I stumbled upon this problem with the sound for my web game, [The Lost Sloth](http://sloth.animade.tv). It has about a dozen different sounds, some of which are background sounds and some of which are directional. (I.e. the volume changes based on cursor position) To make my life easier, I started using the WebAudio API, which turned out to be harder than I thought — mainly because of the lacklustre tutorials available. This guide is going to be the tutorial I wished I had when I tried to get started! Ready to dive in?

## Lets get going!
### Define Audio Context

Similar to the HTML5 `Canvas` element, we will work with the context variable — but first, we have to define it.

```JavaScript
window.AudioContext = window.AudioContext || window.webkitAudioContext;
var audioCtx = new AudioContext();
```

To ensure better cross-browser compatibility, this snippet uses the `webkit` prefixed version if the normal version is undefined. (Safari still needs it [^1] ) 

Now that we have the audio context in a variable, we can start getting sound on your page!

### Getting your first sound to play
The WebAudio API works very much like a physical audio setup. You connect the *source* (the sound) to the *destination* (the headphones) via as many *nodes* (some effects) as you like. 

![A basic WebAudioAPI setup](https://mdn.mozillademos.org/files/7893/web-audio-api-flowchart.png) [Source](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)

The first thing we will need is some audio to play.

#### Loading an audio file
The WebAudio API uses an ArrayBuffer to store audio files. This ArrayBuffer then needs to be decoded and saved to be played. 

The next snippet uses an `XMLHttpRequest` to download an audio file, but how you get the file does not matter. The important part is the decoding, where we use our previously defined `audioCtx` variable to decode and then pass the decoded AudioBuffer of the `miao.wav` file to the `PlaySound()` function.

```JavaScript
// Make a new XMLHttpRequest
var request = new XMLHttpRequest();

// Get the 'audio/miau.mp3' file as an array buffer
request.open('GET', 'audio/miao.wav', true);
request.responseType = 'arraybuffer';

request.onload = function() {
    // When the audio is loaded, decode the audio buffer
    audioCtx.decodeAudioData(request.response, function(buffer) {
        // and play the sound
        playSound(buffer); 
    // Don't forget to do something if the request fails!
    }, onError); 
}

request.send();
```

Now that we have loaded and decoded the audio file we want to play, we need to connect the different pieces together.

#### Playing the audio file

The easiest way to hear something is to simply connect the `source` to the `destination`, without any nodes in-between. We then add the decoded buffer audio to the `source`, so it knows what to play, before starting it. 

```JavaScript
function playSound(buffer) {
    // Create an audio source
    var source = context.createBufferSource();
    // Tell the source to play the buffer sound
    source.buffer = buffer; 
    // Connect the source to the destination (Speakers/Headphones)
    source.connect(context.destination);
    // Start playing the sound at the beginning
    source.start(0);
}
```

If you followed until now, your sound should now be playing! Lets go on and play around with effects.


### Nodes

To add a filter, change the volume or make the sound stereo you will need *nodes*. Our audio source connects to a node, the node does something with the audio input from the source, and then the node connects to the destination. First, lets change the loudness of a sound.

#### Volume Control

To change the volume of a sound, the WebAudio API gives you a `GainNode`. This `GainNode` has a 
#### Stereo Sound
????

## Tipps and Tricks
### Preloading Sounds
### 2D Directional Audio Algorithm


[^1]: http://caniuse.com/#feat=audio-api 