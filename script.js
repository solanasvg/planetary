(function () {
  var canvas = document.getElementById("canvas");
  canvas.width = Math.min(window.innerWidth, window.innerHeight);
  canvas.height = canvas.width;
  var gl = canvas.getContext("webgl");
  canvas.addEventListener("click", function (ev) {
    generateOptions(false, Math.random() > .75); /*75% of the time, stick with a safer preset expression for numerator/denominator/etc, otherwise generate random combinator for these fields*/
  });
  var myoptions;
  var modes = ["multiply", "divide", "add", "subtract", "flip divide", "flip subtract"];/*colorMode*/
  var operators = ["none", "add", "subtract", "multiply", "divide"];/*colorOperator and motionOperator*/
  var functions = ["none", "sine", "tan"];
  var primaryColors = ["#000000", "#ffffff", "#ff0000", "#00ff00", "#0000ff", "#ff00ff", "#00ffff", "#ffff00", "#ff6600", "#7f00ff", "#808080", "#800000", "#808000", "#008000", "#800080", "#008080", "#000080"];
  var hueColors = primaryColors.filter(c => c != "#000000" && c != "#ffffff");
  var timeFunctions = ["none", "sine", "sine + cos"];
  var gui;
  var demoMode = false;
  var demoInterval = 7;
  var time = 0.0;
  /*safer combinations of the colors and shapes that don't produce lots of black screens (unlike the wholly randomly generated GLSL fragments, which do):*/
  var presets = [{
      numerator: "s1+s2/s4",
      denominator: "s4-s1-s2+s3"
    },
    {
      numerator: "s1+s2/s4",
      denominator: "s4-s1-col2+col3"
    },
    {
      numerator: "s2*col2-col3",
      denominator: "s4+s3*s1"
    },
    {
      numerator: "col2 + col1",
      denominator: "s4+s3*s1"
    }
  ];
  var panelExpressions = [
    "col1+col2+col3",
    "s1+s2+s3",
    "s1*col1+s2*col2+s3*col3"
  ];
 
  /*cool patterns. load one of these on first load*/
  var currentTheme;
  var themes = [
    {"name":"Generated"},
    {"name":"Eye of the Beholder","color1":"#4add49","color2":"#7caaf8","color3":"#bc0fcc","numerator":"s1+s2/s4","denominator":"s4-s1-col2+col3","numerator2":"s1","denominator2":"s1","panel":"s1*col1+s2*col2+s3*col3","colorMode":"flip subtract","colorOperator1":"none","colorOperator2":"none","time":0.0065,"timeFunc":"sine + cos","distanceModifier":0.4,"rotation":8,"rotFactor1":1,"rotFactor2":-1,"theta":9,"thetaFunc":"none","periodicMultiplier":10,"motionMultiplier":2,"motionIterations":2,"iterationMotion1":true,"iterationMotion2":true,"motionOperator1":"divide","motionOperator2":"multiply","pixelation":0,"useTwo":true,"innerRadius":0.4,"useDifferent":false},
    {"name":"Sinusoid","numerator":"col2 + col1","denominator":"s4+s3*s1","numerator2":"s1+s2/s4","denominator2":"s4-s1-s2+s3","panel":"col1+col2+col3","colorMode":"multiply","color1":"#8d14ee","color2":"#72e068","color3":"#000000","rotation":-1,"rotFactor1":1,"rotFactor2":-1,"theta":6,"time":-.01,"timeFunc":"none","distanceModifier":0.1,"periodicMultiplier":0,"motionIterations":2,"motionMultiplier":0.62,"iterationMotion1":false,"iterationMotion2":true,"colorOperator1":"add","colorOperator2":"none","motionOperator1":"divide","motionOperator2":"subtract","thetaFunc":"sine","pixelation":0,"useTwo":true,"useDifferent":false,"innerRadius":0.4},
    {"name":"Flor de Llama","numerator":"s1+s2/s4","denominator":"s4-s1-s2+s3","numerator2":"col2 + col1","denominator2":"s4+s3*s1","panel":"s1+s2+s3","colorMode":"divide","color1":"#1f607e","color2":"#f019c6","color3":"#a6343e","rotation":-9,"rotFactor1":1,"rotFactor2":-1,"theta":6,"time":-0.0070,"timeFunc":"sine + cos","distanceModifier":1.2673,"periodicMultiplier":6,"motionIterations":2,"motionMultiplier":1.2372,"iterationMotion1":true,"iterationMotion2":false,"colorOperator1":"none","colorOperator2":"none","motionOperator1":"add","motionOperator2":"subtract","thetaFunc":"sine","pixelation":0,"useTwo":true,"useDifferent":false,"innerRadius":0.4},
    {"name":"Cosmic Tomato","numerator":"s1+s2/s4","denominator":"s4-s1-col2+col3","numerator2":"s1+s2/s4","denominator2":"s4-s1-s2+s3","panel":"s1*col1+s2*col2+s3*col3","colorMode":"flip subtract","color1":"#9d32f5","color2":"#54760d","color3":"#f78596","rotation":0,"rotFactor1":-2,"rotFactor2":0,"theta":-2,"time":0.003,"timeFunc":"none","distanceModifier":0.156,"periodicMultiplier":9,"motionIterations":1,"motionMultiplier":0.375,"iterationMotion1":false,"iterationMotion2":true,"colorOperator1":"none","colorOperator2":"none","motionOperator1":"divide","motionOperator2":"multiply","thetaFunc":"sine","pixelation":0,"useTwo":false,"useDifferent":true,"innerRadius":0.189},
    {"name":"Prismatic Charm","numerator":"col2 + col1","denominator":"s4+s3*s1","numerator2":"s1+s2/s4","denominator2":"s4-s1-col2+col3","panel":"s1+s2+s3","colorMode":"subtract","color1":"#b05a18","color2":"#c46171","color3":"#ffffff","rotation":3,"rotFactor1":1,"rotFactor2":-1,"theta":-4,"time":-0.008,"timeFunc":"none","distanceModifier":0.58,"periodicMultiplier":2,"motionIterations":2,"motionMultiplier":0.74,"iterationMotion1":true,"iterationMotion2":false,"colorOperator1":"none","colorOperator2":"none","motionOperator1":"multiply","motionOperator2":"add","thetaFunc":"none","pixelation":158,"useTwo":true,"useDifferent":false,"innerRadius":0.4},
    {"name":"Orange Crush","numerator":"s2*col2-col3","denominator":"s4+s3*s1","numerator2":"s1+s2/s4","denominator2":"s4-s1-col2+col3","panel":"s1*col1+s2*col2+s3*col3","colorMode":"subtract","color1":"#691157","color2":"#ffff00","color3":"#177691","rotation":6,"rotFactor1":1,"rotFactor2":-1,"theta":-10,"time":0.003,"timeFunc":"sine","distanceModifier":-1.34,"periodicMultiplier":10,"motionIterations":1,"motionMultiplier":1.20,"iterationMotion1":true,"iterationMotion2":true,"colorOperator1":"none","colorOperator2":"none","motionOperator1":"subtract","motionOperator2":"multiply","thetaFunc":"sine","pixelation":0,"useTwo":true,"useDifferent":false,"innerRadius":0.4},
    {"name":"Cosmic Bloom","numerator":"s1+s2/s4","denominator":"s4-s1-s2+s3","numerator2":"s2*col2-col3","denominator2":"s4+s3*s1","panel":"s1+s2+s3","colorMode":"divide","color1":"#354ffa","color2":"#5fe483","color3":"#62be30","rotation":4,"rotFactor1":1,"rotFactor2":-1,"theta":-3,"time":0.003,"timeFunc":"none","distanceModifier":.17,"periodicMultiplier":6,"motionIterations":0,"motionMultiplier":1.9,"iterationMotion1":false,"iterationMotion2":false,"colorOperator1":"none","colorOperator2":"none","motionOperator1":"multiply","motionOperator2":"add","thetaFunc":"none","pixelation":0,"useTwo":true,"useDifferent":false,"innerRadius":0.4},
    {"name":"Virus","numerator":"s4 + dArg - col1 ","denominator":"s3 + surface","numerator2":"col3 - col1 * s2 ","denominator2":"col1","panel":"s1+s2+s3","colorMode":"add","color1":"#b7f48c","color2":"#d1720c","color3":"#000000","rotation":-1,"rotFactor1":1,"rotFactor2":-1,"theta":-4,"time":0.0078,"timeFunc":"none","distanceModifier":-0.0415,"periodicMultiplier":0,"motionIterations":0,"motionMultiplier":0.2892,"iterationMotion1":false,"iterationMotion2":false,"colorOperator1":"none","colorOperator2":"none","motionOperator1":"add","motionOperator2":"subtract","thetaFunc":"none","pixelation":0,"useTwo":true,"useDifferent":false,"innerRadius":0.4},/*"c3:#b46ce9"*/
   /* {"name":"Snowflake","numerator":"s1+s2/s4","denominator":"s4-s1-col2+col3","numerator2":"s1+s2/s4","denominator2":"s4-s1-col2+col3","panel":"col1+col2+col3","colorMode":"add","color1":"#dae216","color2":"#a6c12f","color3":"#eb8dd3","rotation":10,"rotFactor1":1,"rotFactor2":-1,"theta":-9,"time":-0.003,"timeFunc":"none","distanceModifier":-1.49,"periodicMultiplier":0,"motionIterations":0,"motionMultiplier":1.64,"iterationMotion1":true,"iterationMotion2":true,"colorOperator1":"none","colorOperator2":"none","motionOperator1":"divide","motionOperator2":"add","thetaFunc":"none","pixelation":0,"useTwo":true,"useDifferent":false,"innerRadius":0.4},*/
    {"name":"Pixie","numerator":"col2 + s3","denominator":"s3 - s4","numerator2":"s1 + col2 + dArg  / col2 ","denominator2":"col1 + s4 * s3  - col2 ","panel":"s1+s2+s3","colorMode":"multiply","color1":"#3b8aad","color2":"#94c7a9","color3":"#36efd1","rotation":0,"rotFactor1":-1,"rotFactor2":2,"theta":6,"time":0.0045,"timeFunc":"none","distanceModifier":-0.3959,"periodicMultiplier":8,"motionIterations":2,"motionMultiplier":1.2988,"iterationMotion1":true,"iterationMotion2":false,"colorOperator1":"none","colorOperator2":"none","motionOperator1":"divide","motionOperator2":"add","thetaFunc":"sine","pixelation":196,"useTwo":false,"useDifferent":false,"innerRadius":0.3590},
    {"name":"Tie-fighter","numerator":"s1+s2/s4","denominator":"s4-s1-s2+s3","numerator2":"s2*col2-col3","denominator2":"s4+s3*s1","panel":"s1*col1+s2*col2+s3*col3","colorMode":"flip subtract","color1":"#50e7e5","color2":"#ff00ff","color3":"#e287f1","rotation":0,"rotFactor1":1,"rotFactor2":-1,"theta":2,"time":-0.01,"timeFunc":"none","distanceModifier":-1.46,"periodicMultiplier":1,"motionIterations":1,"motionMultiplier":1.79,"iterationMotion1":true,"iterationMotion2":false,"colorOperator1":"none","colorOperator2":"none","motionOperator1":"divide","motionOperator2":"multiply","thetaFunc":"none","pixelation":0,"useTwo":true,"useDifferent":false,"innerRadius":0.4},
    {"name":"Carpet Ride","numerator":"s1+s2/s4","denominator":"s4-s1-col2+col3","numerator2":"col2 + col1","denominator2":"s4+s3*s1","panel":"col1+col2+col3","colorMode":"add","color1":"#be5557","color2":"#704df7","color3":"#81d820","rotation":2,"rotFactor1":1,"rotFactor2":-1,"theta":6,"time":-0.0108,"timeFunc":"none","distanceModifier":-1.5942,"periodicMultiplier":8,"motionIterations":1,"motionMultiplier":0.2714,"iterationMotion1":true,"iterationMotion2":true,"colorOperator1":"none","colorOperator2":"none","motionOperator1":"divide","motionOperator2":"add","thetaFunc":"none","pixelation":0,"useTwo":true,"useDifferent":false,"innerRadius":0.4},
    {"name":"Chlorophyll","numerator":"s1+s2/s4","denominator":"s4-s1-col2+col3","numerator2":"s1+s2/s4","denominator2":"s4-s1-s2+s3","panel":"col1+col2+col3","colorMode":"subtract","color1":"#c487cb","color2":"#00ff00","color3":"#1e1c80","rotation":-3,"rotFactor1":1,"rotFactor2":-1,"theta":9,"time":-0.0094,"timeFunc":"none","distanceModifier":0.1387,"periodicMultiplier":9,"motionIterations":2,"motionMultiplier":1.5999,"iterationMotion1":true,"iterationMotion2":true,"colorOperator1":"none","colorOperator2":"none","motionOperator1":"divide","motionOperator2":"subtract","thetaFunc":"none","pixelation":0,"useTwo":true,"useDifferent":false,"innerRadius":0.4},
    {"name":"Lace","numerator":"s1+s2/s4","denominator":"s4-s1-s2+s3","numerator2":"col2 + col1","denominator2":"s4+s3*s1","panel":"col1+col2+col3","colorMode":"multiply","color1":"#edde34","color2":"#e0f076","color3":"#faa0a8","rotation":-5,"rotFactor1":1,"rotFactor2":-1,"theta":5,"time":-0.0057,"timeFunc":"none","distanceModifier":-1.0695,"periodicMultiplier":10,"motionIterations":1,"motionMultiplier":0.349,"iterationMotion1":true,"iterationMotion2":true,"colorOperator1":"none","colorOperator2":"none","motionOperator1":"add","motionOperator2":"divide","thetaFunc":"none","pixelation":0,"useTwo":true,"useDifferent":false,"innerRadius":0.4},
    {"name":"Throwing Star","numerator":"s1+s2/s4","denominator":"s4-s1-s2+s3","numerator2":"s1+s2/s4","denominator2":"s4-s1-s2+s3","panel":"col1+col2+col3","colorMode":"flip divide","color1":"#1e50b5","color2":"#808000","color3":"#e4921f","rotation":-3,"rotFactor1":1,"rotFactor2":-1,"theta":5,"time":-0.0057,"timeFunc":"none","distanceModifier":0.297,"periodicMultiplier":0,"motionIterations":2,"motionMultiplier":1.7,"iterationMotion1":true,"iterationMotion2":true,"colorOperator1":"none","colorOperator2":"none","motionOperator1":"divide","motionOperator2":"subtract","thetaFunc":"none","pixelation":179,"useTwo":true,"useDifferent":false,"innerRadius":0.4},
    {"name":"Kaleidoscope","numerator":"s1+s2/s4","denominator":"s4-s1-col2+col3","numerator2":"t+s1+s2/s4","denominator2":"s4-s1-col2+col3","panel":"s1*col1+s2*col2+s3*col3","colorMode":"add","color1":"#c9a30c","color2":"#354a83","color3":"#0d90b9","rotation":4,"rotFactor1":1,"rotFactor2":-1,"theta":-12,"time":-0.0034,"timeFunc":"none","distanceModifier":0.6896,"periodicMultiplier":4,"motionIterations":1,"motionMultiplier":0.3291,"iterationMotion1":false,"iterationMotion2":false,"colorOperator1":"none","colorOperator2":"none","motionOperator1":"multiply","motionOperator2":"subtract","thetaFunc":"sine","pixelation":0,"useTwo":true,"useDifferent":false,"innerRadius":0.4},
    {"name":"Planet Plaid","numerator":"s1 + surface - s2  + s4  - col2 ","denominator":"s3 * s2 + s1  + s4 ","numerator2":"s4 / dArg + col2 ","denominator2":"col3 / s2 + surface  * col3  + s2 ","panel":"s1+s2+s3","colorMode":"divide","color1":"#5e22eb","color2":"#f4367d","color3":"#f95b56","rotation":4,"rotFactor1":1,"rotFactor2":-1,"theta":-6,"time":-0.0049,"timeFunc":"none","distanceModifier":-1.7720,"periodicMultiplier":7,"motionIterations":2,"motionMultiplier":1.8759,"iterationMotion1":false,"iterationMotion2":true,"colorOperator1":"none","colorOperator2":"none","motionOperator1":"multiply","motionOperator2":"divide","thetaFunc":"sine","pixelation":110,"useTwo":true,"useDifferent":false,"innerRadius":0.4},
    {"name":"Crystal Ball","numerator":"col2 + col1","denominator":"s4+s3*s1","numerator2":"s1+s2/s4","denominator2":"s4-s1-s2+s3","panel":"s1*col1+s2*col2+s3*col3","colorMode":"subtract","color1":"#71a8a0","color2":"#0c3eeb","color3":"#df7bdc","rotation":-7,"rotFactor1":1,"rotFactor2":-1,"theta":3,"time":0.0076,"timeFunc":"none","distanceModifier":-1.6879,"periodicMultiplier":2,"motionIterations":2,"motionMultiplier":0.5590,"iterationMotion1":true,"iterationMotion2":false,"colorOperator1":"none","colorOperator2":"none","motionOperator1":"divide","motionOperator2":"subtract","thetaFunc":"none","pixelation":0,"useTwo":true,"useDifferent":false,"innerRadius":0.4},
    {"name":"4-Leaf Clover","numerator":"s4 - col2 / dArg ","denominator":"s1 + col1 / surface  + col2  + s2 ","numerator2":"s1 + col3 / surface  + col2 ","denominator2":"surface - s1 - s4  + s1 ","panel":"s1*col1+s2*col2+s3*col3","colorMode":"divide","color1":"#2beb47","color2":"#06c3bc","color3":"#470f28","rotation":2,"rotFactor1":1,"rotFactor2":-1,"theta":2,"time":0.0039,"timeFunc":"none","distanceModifier":-0.3765,"periodicMultiplier":2,"motionIterations":1,"motionMultiplier":0.7453,"iterationMotion1":false,"iterationMotion2":false,"colorOperator1":"none","colorOperator2":"none","motionOperator1":"subtract","motionOperator2":"divide","thetaFunc":"none","pixelation":0,"useTwo":true,"useDifferent":false,"innerRadius":0.4},
    {"name":"White Christmas","numerator":"s2*col2-col3","denominator":"s4+s3*s1","numerator2":"s2*col2-col3","denominator2":"s4+s3*s1","panel":"s1+s2+s3","colorMode":"flip subtract","color1":"#16746e","color2":"#7cc3d2","color3":"#94de3b","rotation":9,"rotFactor1":1,"rotFactor2":-1,"theta":-12,"time":-0.0030,"timeFunc":"none","distanceModifier":0.4001,"periodicMultiplier":4,"motionIterations":2,"motionMultiplier":0.1668,"iterationMotion1":true,"iterationMotion2":true,"colorOperator1":"none","colorOperator2":"none","motionOperator1":"multiply","motionOperator2":"multiply","thetaFunc":"sine","pixelation":0,"useTwo":true,"useDifferent":false,"innerRadius":0.4},
    {"name":"Radioactive","numerator":"s1+s2/s4","denominator":"s4-s1-col2+col3","numerator2":"col2 + col1","denominator2":"s4+s3*s1","panel":"s1+s2+s3","colorMode":"add","color1":"#fa6d91","color2":"#e87e6b","color3":"#ffffff","rotation":-9,"rotFactor1":1,"rotFactor2":-1,"theta":3,"time":0.002,"timeFunc":"none","distanceModifier":0.1079,"periodicMultiplier":0,"motionIterations":1,"motionMultiplier":1.9417,"iterationMotion1":false,"iterationMotion2":true,"colorOperator1":"none","colorOperator2":"none","motionOperator1":"multiply","motionOperator2":"multiply","thetaFunc":"sine","pixelation":0,"useTwo":true,"useDifferent":false,"innerRadius":0.4},
    {"name":"Bloodshot","numerator":"col2 + col1","denominator":"s4+s3*s1","numerator2":"s1+s2/s4","denominator2":"s4-s1-s2+s3","panel":"s1+s2+s3","colorMode":"flip subtract","color1":"#cd70a9","color2":"#03e9c2","color3":"#c4acbd","rotation":4,"rotFactor1":1,"rotFactor2":-1,"theta":5,"time":-0.0002,"timeFunc":"none","distanceModifier":-0.2232,"periodicMultiplier":0,"motionIterations":0,"motionMultiplier":1.6077,"iterationMotion1":false,"iterationMotion2":false,"colorOperator1":"none","colorOperator2":"none","motionOperator1":"divide","motionOperator2":"divide","thetaFunc":"none","pixelation":136,"useTwo":true,"useDifferent":false,"innerRadius":0.4},
    {"name":"Ring of Power", "numerator":"s3 * col3","denominator":"s1 - col2","numerator2":"s4 - col1","denominator2":"col1 - tri4","panel":"col1+col2+col3","colorMode":"flip divide","color1":"#590e82","color2":"#73485b","color3":"#555122","rotation":1,"rotFactor1":1,"rotFactor2":-1,"theta":-3,"time":-0.0012,"timeFunc":"none","distanceModifier":1.2779,"periodicMultiplier":10,"motionIterations":2,"motionMultiplier":1.7584,"iterationMotion1":true,"iterationMotion2":false,"colorOperator1":"none","colorOperator2":"none","motionOperator1":"subtract","motionOperator2":"divide","thetaFunc":"none","pixelation":0,"useTwo":true,"useDifferent":false,"innerRadius":0.4},
    {"name":"Sundial","numerator":"s1+s2/s4","denominator":"s4-s1-s2+s3","numerator2":"s1+s2/s4","denominator2":"s4-s1-col2+col3","panel":"col1+col2+col3","colorMode":"divide","color1":"#c7532e","color2":"#eda4ca","color3":"#1559f5","rotation":3,"rotFactor1":1,"rotFactor2":-1,"theta":-7,"time":-0.0018,"timeFunc":"none","distanceModifier":0.8520,"periodicMultiplier":6,"motionIterations":0,"motionMultiplier":0.0434,"iterationMotion1":false,"iterationMotion2":true,"colorOperator1":"subtract","colorOperator2":"add","motionOperator1":"divide","motionOperator2":"none","thetaFunc":"tan","pixelation":0,"useTwo":true,"useDifferent":false,"innerRadius":0.4},
    {"name":"Amulet","numerator":"s1+s2/s4","denominator":"s4-s1-col2+col3","numerator2":"s1+s2/s4","denominator2":"s4-s1-col2+col3","panel":"s1+s2+s3","colorMode":"divide","color1":"#1be19f","color2":"#0e62a6","color3":"#5a31f3","rotation":4,"rotFactor1":1,"rotFactor2":-1,"theta":-8,"time":-0.0094,"timeFunc":"sine + cos","distanceModifier":-1.1319,"periodicMultiplier":0,"motionIterations":2,"motionMultiplier":1.4210,"iterationMotion1":false,"iterationMotion2":true,"colorOperator1":"none","colorOperator2":"add","motionOperator1":"subtract","motionOperator2":"multiply","thetaFunc":"sine","pixelation":292,"useTwo":true,"useDifferent":false,"innerRadius":0.4}
  ]

  /*INIT*/
  window.addEventListener("resize", onWindowResize, false);
  generateOptions(true, false);
  if(canvas.width<360) gui.close();
  draw();
  autoClick();
  /*END INIT*/

  function generateOptions(isDefault, isRandomMode, theme) {
    let defaults = new DefaultOptions();
    if(isDefault) { /*load a preset on first load*/
      let randoTheme = pick(themes.filter(th=>th.name!="Generated"));
      currentTheme = randoTheme.name;
      myoptions = Object.assign(randoTheme, defaults)
    } else if(theme && theme!="Generated") { /*or user picked a theme*/
      let t = themes.filter(th=>th.name==theme)[0];
      myoptions = Object.assign(t, defaults);
    } else { /*or it's random generation time. even then, sometimes use a preset*/
      if(Math.random()>.75){
        let randoTheme = pick(themes.filter(th=>th.name!="Generated"));
        currentTheme = randoTheme.name;
        myoptions = Object.assign(randoTheme, defaults)
      } else {
        currentTheme = "Generated";
        myoptions = new RandomOptions(isRandomMode)
      }
    }
    console.log(JSON.stringify(myoptions));
    generateWEBGL();
    genGui();
 
  }

  var timeoutID;
  function autoClick() {
    if (myoptions.demoMode) {
      generateOptions(false, Math.random() > .75);
    }
    if (timeoutID) window.clearInterval(timeoutID);
    timeoutID = setInterval(autoClick, myoptions.demoInterval * 1000);
  }

  function onWindowResize() {
    canvas.width = Math.min(window.innerHeight, window.innerWidth);
    canvas.height = canvas.width;

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform1f(widthHandle, canvas.width);
    gl.uniform1f(heightHandle, canvas.height);
  }
  
  function DefaultOptions(){

    this.theme = "Generated";
    this.demoMode = demoMode;
    this.demoInterval = demoInterval;
  }

  function RandomOptions(randomMode) {

    this.theme = "Generated";
    this.demoMode = demoMode;
    this.demoInterval = demoInterval;

    let preset = pick(presets);
    let preset2 = pick(presets);
    this.numerator = randomMode ? combinator(getRandomInt(1, 5)) : preset.numerator;
    this.denominator = randomMode ? combinator(getRandomInt(1, 5)) : preset.denominator;
    this.numerator2 = randomMode ? combinator(getRandomInt(1, 5)) : preset2.numerator;
    this.denominator2 = randomMode ? combinator(getRandomInt(1, 5)) : preset2.denominator;
    this.panel = pick(panelExpressions);

    this.colorMode = pick(modes);

    this.color1 = tinycolor.random().toHexString();
    /*(if we're using a randomly generated color expression, use only random colors (safer, less zeros)):*/
    this.color2 = !randomMode && Math.random() > 0.75 ? pick(hueColors) : tinycolor.random().toHexString();
    this.color3 = !randomMode && Math.random() > 0.75 ? pick(primaryColors) : tinycolor.random().toHexString();
    this.rotation = getRandomInt(-10, 10);
    this.rotFactor1 = getRandomInt(-2, 2);
    this.rotFactor2 = getRandomInt(-2, 2);

    this.theta = getRandomInt(-12, 12);
    this.time = Math.random() * 0.03 - 0.015;
    this.timeFunc = Math.random() > 0.33 ? "none" : pick(timeFunctions);
    this.distanceModifier = getRandomFloat(-2, 2);

    this.periodicMultiplier = Math.random() < 0.25 ? 0 : getRandomInt(0, 10);
    this.motionIterations = getRandomInt(0, 2);
    this.motionMultiplier = getRandomFloat(0, 2);
    this.iterationMotion1 = Math.random() > 0.5;
    this.iterationMotion2 = Math.random() > 0.5;

    this.colorOperator1 = pick(operators);
    this.colorOperator2 = pick(operators);

    this.motionOperator1 = pick(operators);
    this.motionOperator2 = pick(operators);

    this.thetaFunc = Math.random() > 0.25 ? pick(["none", "sine"]) : pick(functions); /*tangent only sometimes*/
    this.pixelation = Math.random() > 0.75 ? getRandomInt(10, 300) : 0;

    this.useTwo = Math.random() > .5;
    this.useDifferent = Math.random() > .66;
    this.innerRadius = getRandomFloat(.05, .4);

    //interlace mode: both positions are same size and they rotate opposite
    if (Math.random() > .5) {
      this.useTwo = true;
      this.useDifferent = false;
      this.innerRadius = .4;
      this.rotFactor1 = 1.0;
      this.rotFactor2 = (-1.0);
    }
  }

  var wasClosed;
  var advancedWasClosed;
  var f1;/*folder 1 (advanced folder)*/
  function genGui() {
    setValue();
    myoptions.theme = currentTheme || "Generated";
    wasClosed = gui && gui.closed;
    advancedWasClosed = f1 && f1.closed;
    gui && gui.destroy();
    gui = new dat.GUI();
    
    if (wasClosed) gui.close();
    
    gui.add(myoptions, "theme", themes.map(th=>th.name)).onChange(presetChange);
    gui.add(myoptions, "demoMode").onChange(demoModeChange);
    gui.add(myoptions, "demoInterval", 1, 30, 1).onChange(demoIntervalChange);
    f1 = gui.addFolder("advanced");
    if(advancedWasClosed===false) f1.open();
    
    f1.addColor(myoptions, "color1").onChange(setValue);
    f1.addColor(myoptions, "color2").onChange(setValue);
    f1.addColor(myoptions, "color3").onChange(setValue);

    f1.add(myoptions, "numerator").onFinishChange(numeratorChanged);
    f1.add(myoptions, "denominator").onFinishChange(numeratorChanged);
    f1.add(myoptions, "numerator2").onFinishChange(numeratorChanged);
    f1.add(myoptions, "denominator2").onFinishChange(numeratorChanged);
    f1.add(myoptions, "colorMode", modes).onChange(setValue);
    f1.add(myoptions, "panel").onFinishChange(setValue);

    f1.add(myoptions, "colorOperator1", operators).onChange(setValue);
    f1.add(myoptions, "colorOperator2", operators).onChange(setValue);

    f1.add(myoptions, "time", -0.015, 0.015).onChange(setValue);
    f1.add(myoptions, "timeFunc", timeFunctions).onChange(setValue);
    f1.add(myoptions, "distanceModifier", -2, 2).onChange(setValue);

    f1.add(myoptions, "rotation", -10, 10).onChange(setValue); /*overall rotation factor*/
    f1.add(myoptions, "rotFactor1", -2, 2, .5).onChange(setValue); /*per position rotation factors*/
    f1.add(myoptions, "rotFactor2", -2, 2, .5).onChange(setValue);

    f1.add(myoptions, "theta", -12, 12).onChange(setValue);
    f1.add(myoptions, "thetaFunc", functions).onChange(setValue);
    f1.add(myoptions, "periodicMultiplier", 0, 20).onChange(setValue);

    f1.add(myoptions, "motionMultiplier", 0.0, 2.0).onChange(setValue);
    f1.add(myoptions, "motionIterations", 0, 10).onChange(setValue);
    f1.add(myoptions, "iterationMotion1").onChange(setValue);
    f1.add(myoptions, "iterationMotion2").onChange(setValue);
    f1.add(myoptions, "motionOperator1", operators).onChange(setValue);
    f1.add(myoptions, "motionOperator2", operators).onChange(setValue);

    f1.add(myoptions, "pixelation", 0, 300).onChange(setValue);
    f1.add(myoptions, "useTwo").onChange(setValue);
    f1.add(myoptions, "innerRadius", 0, 1).onChange(setValue);
    f1.add(myoptions, "useDifferent").onChange(setValue);

    function demoIntervalChange() {
      demoInterval = myoptions.demoInterval;
    }

    function demoModeChange() {
      demoMode = myoptions.demoMode;
    }

    function numeratorChanged() {
      generateWEBGL();
      genGui();
    }

    function presetChange() {
      currentTheme = myoptions.theme;
      generateOptions(false, false, myoptions.theme);
    }
  }

  function setValue() {
    /*send the control panel values to webGL*/
    time = 0.0;
    var col1 = tinycolor(myoptions.color1);
    col1.red = col1._r / 255;
    col1.green = col1._g / 255;
    col1.blue = col1._b / 255;
    var col2 = tinycolor(myoptions.color2);
    col2.red = col2._r / 255;
    col2.green = col2._g / 255;
    col2.blue = col2._b / 255;
    var col3 = tinycolor(myoptions.color3);
    col3.red = col3._r / 255;
    col3.green = col3._g / 255;
    col3.blue = col3._b / 255;

    gl.uniform3f(getUniformLocation(program, "color1"), col1.red, col1.green, col1.blue);
    gl.uniform3f(getUniformLocation(program, "color2"), col2.red, col2.green, col2.blue);
    gl.uniform3f(getUniformLocation(program, "color3"), col3.red, col3.green, col3.blue);
    gl.uniform1i(getUniformLocation(program, "colorMode"), modes.indexOf(myoptions.colorMode));
    gl.uniform1i(getUniformLocation(program, "colorOperator1"), operators.indexOf(myoptions.colorOperator1));
    gl.uniform1i(getUniformLocation(program, "colorOperator2"), operators.indexOf(myoptions.colorOperator2));

    gl.uniform1f(getUniformLocation(program, "motionMultiplier"), myoptions.motionMultiplier);
    gl.uniform1f(getUniformLocation(program, "motionIterations"), myoptions.motionIterations);
    gl.uniform1f(getUniformLocation(program, "iterationMotion1"), myoptions.iterationMotion1);
    gl.uniform1f(getUniformLocation(program, "iterationMotion2"), myoptions.iterationMotion2);
    gl.uniform1i(getUniformLocation(program, "motionOperator1"), operators.indexOf(myoptions.motionOperator1));
    gl.uniform1i(getUniformLocation(program, "motionOperator2"), operators.indexOf(myoptions.motionOperator2));

    gl.uniform1f(getUniformLocation(program, "rotation"), myoptions.rotation);
    gl.uniform1f(getUniformLocation(program, "rotFactor1"), myoptions.rotFactor1);
    gl.uniform1f(getUniformLocation(program, "rotFactor2"), myoptions.rotFactor2);

    gl.uniform1f(getUniformLocation(program, "thetaM"), parseInt(myoptions.theta)); /*theta multiplier*/
    gl.uniform1i(getUniformLocation(program, "thetaFunc"), functions.indexOf(myoptions.thetaFunc));
    gl.uniform1f(getUniformLocation(program, "periodicMultiplier"), myoptions.periodicMultiplier);
    gl.uniform1i(getUniformLocation(program, "timeFunc"), timeFunctions.indexOf(myoptions.timeFunc));
    gl.uniform1f(getUniformLocation(program, "distanceModifier"), myoptions.distanceModifier);
    gl.uniform1f(getUniformLocation(program, "pixelation"), myoptions.pixelation);

    gl.uniform1f(getUniformLocation(program, "useTwo"), myoptions.useTwo);
    gl.uniform1f(getUniformLocation(program, "useDifferent"), myoptions.useDifferent);
    gl.uniform1f(getUniformLocation(program, "innerRadius"), myoptions.innerRadius);
  }

  //************** Shader sources **************
  function vertex() {
    return `
      attribute vec2 position;
      void main() {
        gl_Position = vec4(position, 0.0, 1.0);
      }
      `;
  }

  function fragment(numerator, denominator, numerator2, denominator2, panel) {
    var fragmentSource = `
    #define PI 3.1415
    precision highp float;
    
    uniform int colorMode;
    uniform vec3 color1;
    uniform vec3 color2;
    uniform vec3 color3;
    uniform float rotation;
    uniform float thetaM;
    uniform int thetaFunc;
    uniform float motionMultiplier;
    uniform float motionIterations;
    uniform bool iterationMotion1;
    uniform bool iterationMotion2;
    uniform int colorOperator1;
    uniform int colorOperator2;
    uniform int motionOperator1;
    uniform int motionOperator2;
    uniform float periodicMultiplier;
    uniform int timeFunc;
    uniform float distanceModifier;
    uniform float pixelation;
    uniform float rotFactor1;
    uniform float rotFactor2;
    
    uniform bool useTwo;
    uniform bool useDifferent;
    uniform float innerRadius;
    
    uniform float width;
    uniform float height;
    vec2 resolution = vec2(width, height);
    uniform float time;
    
    vec2 rotate(vec2 _st, float _angle) {
        _st -= 0.5;
        _st =  mat2(cos(_angle),-sin(_angle), sin(_angle),cos(_angle)) * _st;
        _st.y += 0.5;
        _st.x += .5;
        return _st;
    }
    
    vec4 generatePlanetoid(float radius, bool isDifferent, float clockwise, float x, float y){
    
      //set up positions and time
      vec2 uv = gl_FragCoord.xy/resolution.xy;
      float t = mod(time, 20.0);
      vec2 pos = uv;
      pos = vec2(x, y)-pos;
    
      if(pixelation>0.0){
        uv = fract(uv*pixelation);
      }
      //calculate distances and angles
      float d = length(pos)*1.0;/*distance from center*/
      float id = distanceModifier - d;/*inverse distance, greater near the center*/
      float theta = -(atan(pos.y, pos.x))*(clockwise);
      float rot = (clockwise * rotation) + (id+1.0);
    
      rot *= timeFunc == 0 ? t :
             timeFunc == 1 ? sin(t/4.0) :
             (.5*sin(t/3.0)+.5*cos(t/4.0));
    
      rot = thetaFunc == 0 ? rot + (thetaM*theta) :
            thetaFunc == 1 ? rot + sin(thetaM*theta) :
            rot +  tan(thetaM*theta);
       
      //rotate both positions
      pos = rotate(pos, rot);
      uv = rotate(uv, rot);
    
      vec3 col1 = color1;
      vec3 col2 = color2;
      vec3 col3 = color3;
    
    //motionIterations:  using color1+pos and color2+uv inside these loops
      float m = motionMultiplier;
      for(float i = 1.0; i < 30.0; i+=1.0){ 
          if(i<motionIterations){
            uv.x += m*col2.x*(cos(id*i)*uv.y*uv.x);
            if(iterationMotion1) {
                float firstArg = m/2.0*col2.y*(cos(col2.z)/d*i);
                uv  = motionOperator1 == 0 ? uv :
                  motionOperator1 == 1 ? uv + firstArg: 
                  motionOperator1 == 2 ? uv - firstArg : 
                  motionOperator1 == 3 ? uv * firstArg : 
                  uv / firstArg;
            }
            pos.y += m*col1.x*(sin(2.0*i));
            if(iterationMotion2) {
                float secondArg = (m/2.0*col1.y*col1.z*(1.0/d*i));
                pos = motionOperator2 == 0 ? pos : 
                  motionOperator2 == 1 ? pos + secondArg : 
                  motionOperator2 == 2 ? pos - secondArg : 
                  motionOperator2 == 3 ? pos * secondArg : 
                  pos / secondArg;
            }
          }  
       }
              
      //simple float shapes (used in generated webGL string expressions)
      float tri1 = step(pos.y, pos.x);
      float tri2 = step(1.0-pos.x, pos.y);
      float tri3 = step(pos.x, pos.y);
      float tri4 = step(1.0-pos.y, pos.x);

      //3-value shapes (calculated vec3)
      vec3 s1 = ((col1.z-col1.y))*col1.x*(cos(rot+id*abs(pos.xyx)/(col1)));
      vec3 s2 = (col2.x-col2.y)*col2.z*cos(id*abs(uv.xyx)/(col2));
      vec3 s3 = (col3.z-col3.x)*col3.y*sin(+d+rot+uv.xyx+pos.xyx);
      
      //divide by either the distance or the planet surface to get spherical shape
      float dArg = smoothstep(radius,0.0, clamp(d, 0.0, 1.0));
      float surface = smoothstep(radius, radius-.02, d);
      s1 = s1/surface;
      s2 = s2/surface;
      s3 /= surface;
      col1 /= surface;
      col2 /= surface;
      col3 /= dArg;

    //for shapes 1 and 2, combine with distance
    s1 = colorOperator1 == 0 ? s1 : 
    colorOperator1 == 1 ? s1+dArg :
    colorOperator1 == 2 ? s1-dArg :
    colorOperator1 == 3 ? s1*dArg :
        s1/dArg; 
    s2 = colorOperator2 == 0 ? s2 :
        colorOperator2 == 1 ? s2+dArg :
        colorOperator2 == 2 ? s2-dArg :
        colorOperator2 == 3 ? s2*dArg :
        s2/dArg;
    
      //calculate another shape, shape4, based on previous variables and shapes
      float arg = (d+rot+uv.x);
      vec3 s4 = mix(s1, s2, col3/cos(arg*periodicMultiplier));
      s4 /= dArg;
    
      //these strings will be using the above defined variables
      vec4 panel = vec4(((${panel})/3.0),1.0);
      vec4 thing = vec4((${numerator})/(${denominator}),1.0);
      vec4 different = vec4((${numerator2})/(${denominator2}),1.0);
      if(isDifferent) thing = different;
    
      vec4 rez = colorMode == 0 ? panel * thing : 
                     colorMode == 1 ? panel / thing : 
                     colorMode == 2 ? panel + thing :
                     colorMode == 3 ? panel - thing :
                     colorMode == 4 ? thing / panel :
                     thing - panel;
      return clamp(rez, 0.0, 1.0);
    }
    void main(){  
    
        vec4 rez1 = vec4(0.0);
        /*vec4 generatePlanetoid(float radius, bool isDifferent, float clockwise, float x, float y)*/
        /* note: the x and y positional parameters aren't used, per se (they're always .5,.5, exactly centered) */
        rez1 += 1.5*generatePlanetoid(.4, false, rotFactor1, .5,.5);
        vec4 rez2 = 1.5*generatePlanetoid(innerRadius, useDifferent, rotFactor2, .5,.5);
        
        //stripping out white
        if(rez2.x >= 1.0) rez2.x = 0.0;
        if(rez2.y >= 1.0) rez2.y = 0.0;
        if(rez2.z >= 1.0) rez2.z = 0.0;
        if(rez1.x >= 1.0) rez1.x = 0.0;
        if(rez1.y >= 1.0) rez1.y = 0.0;
        if(rez1.z >= 1.0) rez1.z = 0.0;
        
        vec4 result = rez1;
        if(useTwo) result += rez2;
        if(result.x >= 1.0) result.x = 0.0;
        if(result.y >= 1.0) result.y = 0.0;
        if(result.z >= 1.0) result.z = 0.0;
    
        gl_FragColor = result;
        //rez1-(rez1*rez2)
       }
    `;
    return fragmentSource;
  }

  var widthHandle, heightHandle, timeHandle, program;
  /*DRAW function*/
  function draw() {

    time += myoptions.time;
    gl.uniform1f(timeHandle, time);
    //Draw a triangle strip connecting vertices 0-4
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    requestAnimationFrame(draw);
  }

  /*generate WEBGL*/
  function generateWEBGL() {
    //Create vertex and fragment shaders
    var vertexShader = compileShader(vertex(), gl.VERTEX_SHADER);
    var fragmentShader = compileShader(
      fragment(myoptions.numerator, myoptions.denominator, myoptions.numerator2, myoptions.denominator2, myoptions.panel),
      gl.FRAGMENT_SHADER
    );

    //Create shader programs
    program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    gl.useProgram(program);

    //Set up rectangle covering entire canvas
    var vertexData = new Float32Array([
      -1.0,
      1.0, // top left
      -1.0,
      -1.0, // bottom left
      1.0,
      1.0, // top right
      1.0,
      -1.0 // bottom right
    ]);

    //Create vertex buffer
    var vertexDataBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexDataBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertexData, gl.STATIC_DRAW);

    // Layout of our data in the vertex buffer
    var positionHandle = getAttribLocation(program, "position");

    gl.enableVertexAttribArray(positionHandle);
    gl.vertexAttribPointer(
      positionHandle,
      2, // position is a vec2 (2 values per component)
      gl.FLOAT, // each component is a float
      false, // don't normalize values
      2 * 4, // two 4 byte float components per vertex (32 bit float is 4 bytes)
      0 // how many bytes inside the buffer to start from
    );

    //Set uniform handle
    timeHandle = getUniformLocation(program, "time");
    widthHandle = getUniformLocation(program, "width");
    heightHandle = getUniformLocation(program, "height");
    gl.uniform1f(widthHandle, canvas.width);
    gl.uniform1f(heightHandle, canvas.height);
  }

  /*HELPERS*/
  function compileShader(shaderSource, shaderType) {
    var shader = gl.createShader(shaderType);
    gl.shaderSource(shader, shaderSource);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      throw "Shader compile failed with: " + gl.getShaderInfoLog(shader);
    }
    return shader;
  }

  function getAttribLocation(program, name) {
    var attributeLocation = gl.getAttribLocation(program, name);
    if (attributeLocation === -1) {
      throw "Cannot find attribute " + name + ".";
    }
    return attributeLocation;
  }

  function getUniformLocation(program, name) {
    var attributeLocation = gl.getUniformLocation(program, name);
    if (attributeLocation === -1) {
      throw "Cannot find uniform " + name + ".";
    }
    return attributeLocation;
  }

  function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function getRandomFloat(min, max) {
    return Math.random() * (max - min) + min;
  }

  function combinator(isNumerator, numTerms) {
    /*fairly dumb string generator, returns string like: `col2*col3-s1`*/
    /*will not pick same operand twice in a row*/
    let shapes = ["s1", "s2", "s3", "s4", "col1", "col2", "col3"];/*vec3*/
    let floats = ["dArg", "surface", "tri1", "tri2", "tri3", "tri4"];
    let everything = [...shapes, ...floats];
    let ops = ["+", "-", "+", "+", "-", "*", "/"];/*would prefer more plusses than minuses in these strings*/
    var result, lastPick;
    if (numTerms == 1) {
      result = pick(shapes);
    } else {
      /*ensure at least one shape (can't be an all single value (float) expression, we need a vec3 as the result*/
      lastPick = isNumerator? pick(shapes) : pick(everything);
      result = lastPick + " " + pick(ops);
      lastPick = pick(everything.filter(o => o != lastPick));
      result += " " + lastPick;
      for (let i = 2; i < numTerms; i++) {
        lastPick = pick(everything.filter(o => o != lastPick));
        result += ` ${pick(ops)} ${lastPick} `;
      }
    }
    return result;
  }
})("sweaverD.com");