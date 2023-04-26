//Global Variables to hold data before/after filtering
let globalData =[];
let data;
let characterChart, seasonTimeline, wordCloud, networkGraph,lineChart, treemap;
let lastCharacter = "";
let curSeason = [];
let curEpisode = [];
let networkGraphChar1 = "";
let networkGraphChar2 = "";
let lineChartWord = "";
let locationData = [];
let location = "";
//Read data
Promise.all([
  d3.csv('data/First_248_Episodes.csv'),
  d3.csv('data/simpsons_locations.csv')
])
  .then(function(files) {
    var loading = document.getElementById("loading"); 
    loading.classList.add("loading"); // Add loading message
    var blurContainer = document.getElementById("blur-container");
    blurContainer.classList.add("blur"); // Add blur to background
    setTimeout(function(){
      files[0].forEach(d => {
        globalData.push(d)
      });

      files[1].forEach(d => {
        locationData.push(d)
      });

      data = globalData;

    // get .svg-container height and width
    var svgContainer = document.getElementsByClassName("svg-container");
    var svgContainerHeight = svgContainer.item(0).clientHeight - 5;
    var svgContainerWidth = svgContainer.item(0).clientWidth - 5 - 50; // subtract card padding/margin width (also fine tuning)

    var svgContainer2 = document.getElementsByClassName("svg-container2");
    var svgContainerHeight2 = svgContainer2.item(0).clientHeight - 5;
    var svgContainerWidth2 = svgContainer2.item(0).clientWidth - 5 - 55 - 150; // subtract card padding/margin and #legend width

      //Create Character chart
    characterChart = new CharacterBrush({
      'parentElement': '#character',
      'containerHeight': svgContainerHeight,
      'containerWidth': svgContainerWidth * 0.2, // use ratios that add up to 1 (first row)
      }, getCharacter(data),(filterData) => {

        if(lastCharacter == ""){
          lastCharacter = filterData;
        }
        else{
          lastCharacter = ""
        }
        
        updateCharts();
    }); 

      //Create Character chart
    seasonTimeline = new SeasonTimeline({
      'parentElement': '#season',
      'containerHeight': svgContainerHeight,
      'containerWidth': svgContainerWidth * 0.55, // use ratios that add up to 1 (first row)
      }, getSeasonTimeline(data),(season,episode) => {
        var val = d3.select('#dropdown')._groups[0][0].value
        if(val == "season"){
          if(curEpisode != []){
            curEpisode = [];
          }
          if(curSeason.includes(parseInt(season))){
            curSeason = curSeason.filter(d => d != parseInt(season))
          }
          else{
            curSeason.push(parseInt(season))
          }
          
          
        }
        else{
          if(curSeason != []){
            curSeason = [];
          }
          if(curEpisode.includes(episode)){
            curEpisode = curEpisode.filter(d => d != episode)
          }
          else{
            curEpisode.push(episode)
          }
          
          
        }
        
        updateCharts();
    }); 

    //Create Character chart
    treemap = new Treemap({
      'parentElement': '#treemap',
      'containerHeight': svgContainerHeight,
      'containerWidth': svgContainerWidth * 0.25, // use ratios that add up to 1 (first row)
      }, getTreemapData(data), (filterData) => {
        // filter data based on location
        if(location != ""){
          location = ""
        }
        else{
          location = filterData;
        }
        updateCharts();
      }); 

    wordCloud = new WordCloud({
      'parentElement': '#wordCloud',
      'containerHeight': svgContainerHeight2,
      'containerWidth': svgContainerWidth2 * 0.3, // use ratios that add up to 1 (second row)
      }, getWordCloud(data),(filterData) => {
        // change line-input value to blank
        d3.select('#line-input')._groups[0][0].value = ""
        lineChartWord = filterData
        lineChart.word = filterData
        lineChart.data = getLineData(data);
        lineChart.updateVis();
    }); 

    networkGraph = new Network({
      'parentElement': '#network',
      'containerHeight': svgContainerHeight2,
      'containerWidth': (svgContainerWidth2 * 0.3), // use ratios that add up to 1 (second row)
      }, getNetwork(data), getNetworkMatrix(data),(type,name1,name2) => {

        //To Do
        if(type == "group"){
          lastCharacter = name1;
          networkGraphChar1 = "";
          networkGraphChar2 = "";
        }
        else{
          networkGraphChar1 = name1
          networkGraphChar2 = name2
          lastCharacter = ""
        }
        updateCharts();
    }); 

    //Create Line chart
    lineChart = new Line({
      'parentElement': '#line',
      'containerHeight': svgContainerHeight2,
      'containerWidth': svgContainerWidth2 * 0.4, // use ratios that add up to 1 (second row)
      }, getLineData(data),(filterDate1,filterDate2) => {
           //To-do???
        //we might not need to update anything here
    },lineChartWord);

    blurContainer.classList.remove("blur"); // Remove blur to background
    loading.classList.remove("loading"); // Remove loading message
   }, 120) // Use setTimeout to delay the loading message (prevent null classlist error)
})
.catch(error => console.error(error));

//Log Data
console.log("Here is the data: ", globalData);
d3.select("#button1").on("click", resetCharts);
//Always work with "data" object now, unless resetting to original data set (globalData)
data = globalData;

for(var i = 1; i<=10; i++){
  let classOrId = 'char' + i
  let legendItemButton = document.getElementById(classOrId);

  // Add the onmouseover function to the li element
  legendItemButton.onmouseover = function() {
    let networkElements = document.getElementsByClassName(classOrId)
    for(var obj in networkElements){
      if(networkElements[obj].style != null &&  networkElements[obj].style.cssText != null){
        let originalString = networkElements[obj].style.cssText

        // Replace fill-opacity: 0.7 with fill-opacity: 1
        networkElements[obj].style.cssText = originalString.replace('fill-opacity: 0.7', 'fill-opacity: 1');
      }
    }
  };

  // Add the onmouseover function to the li element
  legendItemButton.onmouseout = function() {
    let networkElements = document.getElementsByClassName(classOrId)
    for(var obj in networkElements){
      if(networkElements[obj].style != null && networkElements[obj].style.cssText != null){
        let originalString = networkElements[obj].style.cssText

        // Replace fill-opacity: 0.7 with fill-opacity: 1
        networkElements[obj].style.cssText = originalString.replace('fill-opacity: 1', 'fill-opacity: 0.7');
      }
    }
  };
}



function updateCharts(){
  var loading = document.getElementById("loading");
  loading.classList.add("loading");
  var blurContainer = document.getElementById("blur-container");
  blurContainer.classList.add("blur"); // Add blur to background
  // change line-input value to blank
  d3.select('#line-input')._groups[0][0].value = ""
  setTimeout(function() {
    data = globalData;
    if(lastCharacter != ""){
      data = data.filter(d => d.raw_character_text == lastCharacter)
    }
    var filterBy = null;
    if(curSeason.length > 0){
      filterBy = "season"
      data = data.filter(d => curSeason.includes(parseInt(d.season))) 
    }
    if(curEpisode.length > 0){
      filterBy = "episode"
      data = data.filter(d => curEpisode.includes(parseInt(d.episode_id))) 
    }
    if(networkGraphChar1 != ""){
      data = data.filter(d => (d.raw_character_text == networkGraphChar1 && d.next_speaker == networkGraphChar2) ||(d.raw_character_text == networkGraphChar2 && d.next_speaker == networkGraphChar1))
      //console.log(data)
    }
    if (location != "") {
      // match location name to name in locationData to get location id
      let locationId = locationData.filter(d => d.name == location)[0].id;
      data = data.filter(d => d.location_id == locationId);
      filterBy = "location";
    }
    characterChart.data = getCharacter(data,filterBy);
    characterChart.updateVis();
    seasonTimeline.data = getSeasonTimeline(data,filterBy);
    seasonTimeline.updateVis();
    wordCloud.data = getWordCloud(data,filterBy);
    wordCloud.updateVis(lastCharacter);
    lineChart.word = lineChartWord
        lineChart.data = getLineData(data);
        lineChart.updateVis();
    treemap.data = getTreemapData(data);
    treemap.updateVis();
    
    if(lastCharacter != ""){
      var networkData = globalData;
      if(curSeason.length > 0){
        networkData = networkData.filter(d => curSeason.includes(parseInt(d.season))) 
      }
      if(curEpisode.length > 0){
        networkData = networkData.filter(d => curEpisode.includes(parseInt(d.episode_id))) 
      }
      if(networkGraphChar1 != ""){
        networkData = networkData.filter(d => (d.raw_character_text == networkGraphChar1 && d.next_speaker == networkGraphChar2) ||(d.raw_character_text == networkGraphChar2 && d.next_speaker == networkGraphChar1))
      }
      networkData = networkData.filter(d => d.raw_character_text == lastCharacter || d.next_speaker == lastCharacter) 
      networkGraph.data = getNetwork(networkData);
      networkGraph.matrix = getNetworkMatrix(networkData);
      networkGraph.updateVis(); 
    }
    else{
      networkGraph.data = getNetwork(data);
      networkGraph.matrix = getNetworkMatrix(data);
      networkGraph.updateVis(); 
    }
    blurContainer.classList.remove("blur");
    loading.classList.remove("loading");
  }, 100);
}

//function to reset charts to originl data
function resetCharts(){
    var loading = document.getElementById("loading");
    loading.classList.add("loading");
    var blurContainer = document.getElementById("blur-container");
    blurContainer.classList.add("blur"); // Add blur to background
    // change line-input value to blank
    d3.select('#line-input')._groups[0][0].value = ""
    setTimeout(function() {
      curSeason = [];
      curEpisode = [];
      lastCharacter = "";
      networkGraphChar1 = "";
      networkGraphChar2 = "";
      location = "";
      data = globalData
      characterChart.data = getCharacter(globalData);
      characterChart.updateVis();
      seasonTimeline.data = getSeasonTimeline(globalData);
      seasonTimeline.updateVis();
      wordCloud.data = getWordCloud(globalData);
      wordCloud.updateVis("");
      networkGraph.data = getNetwork(globalData);
      networkGraph.matrix = getNetworkMatrix(globalData);
      networkGraph.updateVis(); 
      lineChart.data = getLineData(data);
      lineChart.updateVis();
      treemap.data = getTreemapData(globalData);
      treemap.updateVis();

      blurContainer.classList.remove("blur");
      loading.classList.remove("loading");
    }, 100);
  }

// check if line-button is clicked
d3.select("#line-button").on("click", function(){
  var valid = false;
  // get value in line-input
  var lineInput = d3.select("#line-input").property("value");
  // check if line-input is empty or more than 1 word
  if(lineInput == "" ){
    // change line-error to "Please enter a word"
    d3.select("#line-error").text("Enter a word");
    d3.select("#line-error").style("opacity", "1");
  } else {
    // change line-error to ""
    d3.select("#line-error").text("");
    d3.select("#line-error").style("opacity", "0");
    valid = true;
  }
  // hide line-error after 3 seconds 
  setTimeout(function(){
    // change line-error to ""
    d3.select("#line-error").text("");
    d3.select("#line-error").style("opacity", "0");
  }, 3000);
  // if line-input is valid
  if(valid){
    //console.log(lineInput)
    lineChartWord = lineInput;
    lineChart.word = lineInput;
    lineChart.data = getLineData(data);
    lineChart.updateVis();
  }
});


function getCharacter(thisData,filterType){
  let returnData =[];

  let limit = 0;
  if(filterType == null){
    limit = 40;
  }
  if(filterType == "season"){
    limit = 10;
  }
  if(filterType == "episode"){
    limit = 0;
  }
  if(filterType == "location"){
    limit = 0;
  }
  //get array of unique Characters
 const groupedData = d3.group(thisData, d => d.raw_character_text);
 let uniqueCharacters = Array.from(groupedData);
 let newArray = uniqueCharacters.map(([name, lines]) => ({ name, lines: lines.length }));
 newArray = newArray.sort((a, b) => d3.descending(a.lines, b.lines));
 newArray = newArray.filter(d => d.lines >= limit);
 returnData = newArray.map((d, i) => ({ ...d, id: i }));
 return returnData
}

function getSeasonTimeline(thisData,filterType){
  let returnData =[];
  //{x0: episode -1, x1: episode, lines:lines, season:seasonColor}
  let seasonColor = ["#2ad6a0","#01abac","#00b4f4","#0099ff","#0072ff","#9557e2","#c733b8","#df0088","#e20058","#d62a2a","#e65120"]
  let baseSeasonColor = ["#808080","#808080","#808080","#808080","#808080","#808080","#808080","#808080","#808080","#808080","#808080"]
  if(filterType == "episode"){
    for(var i = 0; i < 248; i++){
      var color = "#808080"
      if(curEpisode.includes(i+1)){
        color = seasonColor[globalData.filter(d => parseInt(d.episode_id) === i+1)[0].season - 1]
      }
      var thisEpisode = thisData.filter(d => parseInt(d.episode_id) === i+1)
      if(thisEpisode.length == 0){
         returnData.push({x0: i +.5, x1: i+1.5, lines:thisEpisode.length, seasonText: globalData.filter(d => parseInt(d.episode_id) === i+1)[0].season, season: color, title:globalData.filter(d => parseInt(d.episode_id) === i+1)[0].episode_title, seasonEpisode: globalData.filter(d => parseInt(d.episode_id) === i+1)[0].episode_of_season})
      }
      else{
        returnData.push({x0: i +.5, x1: i+1.5, lines:thisEpisode.length, seasonText: thisEpisode[0].season, season: color, title:thisEpisode[0].episode_title, seasonEpisode: thisEpisode[0].episode_of_season})
      }
    }
  }
  else if(filterType == "season"){
    for(var i = 0; i < 248; i++){
      var color = "#808080"
      var thisSeason = globalData.filter(d => parseInt(d.episode_id) === i+1)[0].season
      if(curSeason.includes(parseInt(thisSeason))){
        color = seasonColor[thisSeason- 1]
      }
      var thisEpisode = thisData.filter(d => parseInt(d.episode_id) === i+1)
      if(thisEpisode.length == 0){
         returnData.push({x0: i +.5, x1: i+1.5, lines:thisEpisode.length, seasonText: globalData.filter(d => parseInt(d.episode_id) === i+1)[0].season, season: color, title:globalData.filter(d => parseInt(d.episode_id) === i+1)[0].episode_title, seasonEpisode: globalData.filter(d => parseInt(d.episode_id) === i+1)[0].episode_of_season})
      }
      else{
        returnData.push({x0: i +.5, x1: i+1.5, lines:thisEpisode.length, seasonText: thisEpisode[0].season, season: color, title:thisEpisode[0].episode_title, seasonEpisode: thisEpisode[0].episode_of_season})
      }
    }
  }
  else{
    for(var i = 0; i < 248; i++){
      var thisEpisode = thisData.filter(d => parseInt(d.episode_id) === i+1)
      if(thisEpisode.length == 0){
         returnData.push({x0: i +.5, x1: i+1.5, lines:thisEpisode.length, seasonText: globalData.filter(d => parseInt(d.episode_id) === i+1)[0].season, season: "#808080", title:globalData.filter(d => parseInt(d.episode_id) === i+1)[0].episode_title, seasonEpisode: globalData.filter(d => parseInt(d.episode_id) === i+1)[0].episode_of_season})
      }
      else{
        returnData.push({x0: i +.5, x1: i+1.5, lines:thisEpisode.length, seasonText: thisEpisode[0].season, season: seasonColor[thisEpisode[0].season - 1], title:thisEpisode[0].episode_title, seasonEpisode: thisEpisode[0].episode_of_season})
      }
    }
  }
  return returnData
}

function getWordCloud(thisData, filterType) {
  var returnData = [];
  
   if(thisData.length > 0){
    // Group data by character text
    const groupedData = d3.group(thisData, d => d.raw_character_text);

    var stopwordsString = "--,able,about,above,hey,abroad,according,accordingly,across,actually,adj,after,afterwards,again,against,ago,ahead,aint,ive,dont,lot,uh,huh,heh,yeah,,all,allow,allows,almost,alone,along,alongside,already,also,although,always,am,amid,amidst,among,amongst,an,and,another,any,anybody,anyhow,anyone,anything,anyway,anyways,anywhere,apart,appear,appreciate,appropriate,are,aren't,around,as,a's,aside,ask,asking,associated,at,available,away,awfully,back,backward,backwards,be,became,because,become,becomes,becoming,been,before,beforehand,begin,behind,being,believe,below,beside,besides,best,better,between,beyond,both,brief,but,by,came,can,cannot,cant,can't,caption,cause,causes,certain,certainly,changes,clearly,c'mon,co,co.,com,come,comes,concerning,consequently,consider,considering,contain,containing,contains,corresponding,could,couldn't,course,c's,currently,dare,daren't,definitely,described,despite,did,didn't,different,directly,do,does,doesn't,doing,done,don't,down,downwards,during,each,edu,eg,eight,eighty,either,else,elsewhere,end,ending,enough,entirely,especially,et,etc,even,ever,evermore,every,everybody,everyone,everything,everywhere,ex,exactly,example,except,fairly,far,farther,few,fewer,fifth,first,five,followed,following,follows,for,forever,former,formerly,forth,forward,found,four,from,further,furthermore,get,gets,getting,given,gives,go,goes,going,gone,got,gotten,greetings,had,hadn't,half,happens,hardly,has,hasn't,have,haven't,having,he,he'd,he'll,hello,help,hence,her,here,hereafter,hereby,herein,here's,hereupon,hers,herself,he's,hi,him,himself,his,hither,hopefully,how,howbeit,however,hundred,i'd,ie,if,ignored,i'll,i'm,immediate,in,inasmuch,inc,inc.,indeed,indicate,indicated,indicates,inner,inside,insofar,instead,into,inward,is,isn't,it,it'd,it'll,its,it's,itself,i've,just,k,keep,keeps,kept,know,known,knows,last,lately,later,latter,latterly,least,less,lest,let,let's,like,liked,likely,likewise,little,look,looking,looks,low,lower,ltd,made,mainly,make,makes,many,may,maybe,mayn't,me,mean,meantime,meanwhile,merely,might,mightn't,mine,minus,miss,more,moreover,most,mostly,mr,mrs,much,must,mustn't,my,myself,name,namely,nd,near,nearly,necessary,need,needn't,needs,neither,never,neverf,neverless,nevertheless,new,next,nine,ninety,no,nobody,non,none,nonetheless,noone,no-one,nor,normally,not,nothing,notwithstanding,novel,now,nowhere,obviously,of,off,often,oh,ok,okay,old,on,once,one,ones,one's,only,onto,opposite,or,other,others,otherwise,ought,oughtn't,our,ours,ourselves,out,outside,over,overall,own,particular,particularly,past,per,perhaps,placed,please,plus,possible,presumably,probably,provided,provides,que,quite,qv,rather,rd,re,really,reasonably,recent,recently,regarding,regardless,regards,relatively,respectively,right,round,said,same,saw,say,saying,says,second,secondly,see,seeing,seem,seemed,seeming,seems,seen,self,selves,sensible,sent,serious,seriously,seven,several,shall,shan't,she,she'd,she'll,she's,should,shouldn't,since,six,so,some,somebody,someday,somehow,someone,something,sometime,sometimes,somewhat,somewhere,soon,sorry,specified,specify,specifying,still,sub,such,sup,sure,take,taken,taking,tell,tends,th,than,thank,thanks,thanx,that,that'll,thats,that's,that've,the,their,theirs,them,themselves,then,thence,there,thereafter,thereby,there'd,therefore,therein,there'll,there're,theres,there's,thereupon,there've,these,they,they'd,they'll,they're,they've,thing,things,think,third,thirty,this,thorough,thoroughly,those,though,three,through,throughout,thru,thus,till,to,together,too,took,toward,towards,tried,tries,truly,try,trying,t's,twice,two,un,under,underneath,undoing,unfortunately,unless,unlike,unlikely,until,unto,up,upon,upwards,us,use,used,useful,uses,using,usually,v,value,various,versus,very,via,viz,vs,want,wants,was,wasn't,way,we,we'd,welcome,well,we'll,went,were,we're,weren't,we've,what,whatever,what'll,what's,what've,when,whence,whenever,where,whereafter,whereas,whereby,wherein,where's,whereupon,wherever,whether,which,whichever,while,whilst,whither,who,who'd,whoever,whole,who'll,whom,whomever,who's,whose,why,will,willing,wish,with,within,without,wonder,won't,would,wouldn't,yes,yet,you,you'd,you'll,your,you're,yours,yourself,yourselves,you've,zero,a,how's,i,when's,why's,b,c,d,e,f,g,h,j,l,m,n,o,p,q,r,s,t,u,uucp,w,x,y,z,I,www,amount,bill,bottom,call,computer,con,couldnt,cry,de,describe,detail,due,eleven,empty,fifteen,fifty,fill,find,fire,forty,front,full,give,hasnt,herse,himse,interest,itse”,mill,move,myse”,part,put,show,side,sincere,sixty,system,ten,thick,thin,top,twelve,twenty,abst,accordance,act,added,adopted,affected,affecting,affects,ah,announce,anymore,apparently,approximately,aren,arent,arise,auth,beginning,beginnings,begins,biol,briefly,ca,date,ed,effect,et-al,ff,fix,gave,giving,heres,hes,hid,home,id,im,immediately,importance,important,index,information,invention,itd,keys,kg,km,largely,lets,line,'ll,means,mg,million,ml,mug,na,nay,necessarily,nos,noted,obtain,obtained,omitted,ord,owing,page,pages,poorly,possibly,potentially,pp,predominantly,present,previously,primarily,promptly,proud,quickly,ran,readily,ref,refs,related,research,resulted,resulting,results,run,sec,section,shed,shes,showed,shown,showns,shows,significant,significantly,similar,similarly,slightly,somethan,specifically,state,states,stop,strongly,substantially,successfully,sufficiently,suggest,thered,thereof,therere,thereto,theyd,theyre,thou,thoughh,thousand,throug,til,tip,ts,ups,usefully,usefulness,'ve,vol,vols,wed,whats,wheres,whim,whod,whos,widely,words,world,youd,youre,i,me,my,myself,we,us,our,ours,ourselves,you,your,yours,yourself,yourselves,he,him,his,himself,she,her,hers,herself,it,its,itself,they,them,their,theirs,themselves,what,which,who,whom,whose,this,that,these,those,am,is,are,was,were,be,been,being,have,has,had,having,do,does,did,doing,will,would,should,can,could,ought,i'm,you're,he's,she's,it's,we're,they're,i've,you've,we've,they've,i'd,you'd,he'd,she'd,we'd,they'd,i'll,you'll,he'll,she'll,we'll,they'll,isn't,aren't,wasn't,weren't,hasn't,haven't,hadn't,doesn't,don't,didn't,won't,wouldn't,shan't,shouldn't,can't,cannot,couldn't,mustn't,let's,that's,who's,what's,here's,there's,when's,where's,why's,how's,a,an,the,and,but,if,or,because,as,until,while,of,at,by,for,with,about,against,between,into,through,during,before,after,above,below,to,from,up,upon,down,in,out,on,off,over,under,again,further,then,once,here,there,when,where,why,how,all,any,both,each,few,more,most,other,some,such,no,nor,not,only,own,same,so,than,too,very,say,says,said,shall"
    var contractions = "aint,arent,cant,couldve,couldnt,darent,didnt,doesnt,dont,hasnt,havent,hed,hell,hes,howd,howll,hows,Id,Idve,Im,Ive,isnt,its,lets,maam,mightve,mightnt,mustve,mustnt,neednt,oclock,ol,oughtnt,shant,she'd,she'll,she's,shouldve,shouldnt,somebody's,someone's,someones,somethings,thatll,thats,thered,theres,theyd,theyll,theyre,theyve,tove,wanna,wannabe,wasnt,we'd,we'll,we're,we've,wed,were,wont,wouldve,wouldnt,yall,youd,youll,youre,youve"
    var stopwords = stopwordsString.split(",") + contractions.split(",");

    if (groupedData.size > 1) {
      var currCharacter = "";
      var charWords = thisData.map(obj => obj.normalized_text.split(" ")).flat();
      
      charWords = charWords.filter(d => !stopwords.includes(d));
      
      // Count frequency of each word
      var wordCountArray = d3.rollup(
        charWords,
        (v) => v.length,
        (d) => d
      );
      
      // Sort and limit to top 50 words
      returnData = Array.from(wordCountArray, ([word, count]) => ({ word, count }));
      returnData = returnData.sort((a, b) => d3.descending(a.count, b.count));
      returnData = returnData.slice(0, 50);

      // Add opacity value to each word
      returnData = returnData.map((d, i) => ({
        word: d.word,
        count: d.count,
        opacity: `${100 - i}%`
      }));
      lineChartWord = returnData[0].word

    } else {
      var currCharacter = thisData[0].raw_character_text;
      var charWords = thisData.map(obj => obj.normalized_text.split(" ")).flat();

      charWords = charWords.filter(d => !stopwords.includes(d));
      
      // Count frequency of each word
      var wordCountArray = d3.rollup(
        charWords,
        (v) => v.length,
        (d) => d
      );
      
      // Sort and limit to top 50 words
      returnData = Array.from(wordCountArray, ([word, count]) => ({ word, count }));
      returnData = returnData.sort((a, b) => d3.descending(a.count, b.count));
      returnData = returnData.slice(0, 50);
      
      // Add opacity value to each word
      returnData = returnData.map((d, i) => ({
        word: d.word,
        count: d.count,
        opacity: `${100 - i}%`
      }));
      lineChartWord = returnData[0].word
    }
  }

  return returnData;
}

function getNetwork(thisData){
  let returnData =[];

  var legend = document.getElementById("legend");
  legend.style.display = "inline-block"

  for(var i = 1; i<11; i++){
    var id = "char" + i
    var legendItem = document.getElementById(id);
    legendItem.style.display = "none"
  }
  //get array of unique Characters
 const groupedData = d3.group(thisData, d => d.raw_character_text);
 let uniqueCharacters = Array.from(groupedData);
 let newArray = uniqueCharacters.map(([name, lines]) => ({ name, lines: lines.length }));
 newArray = newArray.sort((a, b) => d3.descending(a.lines, b.lines));
 newArray = newArray.slice(0,10)

  for(var i = 0; i < newArray.length; i++){
    returnData.push([])
    var id = "char" + (i + 1)
    var legendItem = document.getElementById(id);

    // Get a reference to the span element inside the li element
    var spanElement = legendItem.querySelector(".legend-symbol");
    legendItem.textContent  ="";
    // Update the text content of the li element without affecting the span element

    legendItem.appendChild(spanElement);
    legendItem.appendChild(document.createTextNode(newArray[i].name));
    legendItem.style.display = "flex"
    
    for(var j = 0; j < newArray.length; j++){
      if(i == j){
        returnData[i].push({from:newArray[i].name, to:newArray[j].name, count: 0})
      }else{
        var thisCount = thisData.filter(d => d.raw_character_text == newArray[i].name && d.next_speaker == newArray[j].name).length
        returnData[i].push({from:newArray[i].name, to:newArray[j].name, count: thisCount})
      }
      
    }
  }
  return returnData
}

function getNetworkMatrix(thisData){
  let returnData =[];

  //get array of unique Characters
 const groupedData = d3.group(thisData, d => d.raw_character_text);
 let uniqueCharacters = Array.from(groupedData);
 let newArray = uniqueCharacters.map(([name, lines]) => ({ name, lines: lines.length }));
 newArray = newArray.sort((a, b) => d3.descending(a.lines, b.lines));
 newArray = newArray.slice(0,10)

  for(var i = 0; i < newArray.length; i++){
    returnData.push([])
    for(var j = 0; j < newArray.length; j++){
      if(i == j){
        returnData[i].push(0)
      }else{
        var thisCount = thisData.filter(d => d.raw_character_text == newArray[i].name && d.next_speaker == newArray[j].name).length
        returnData[i].push(thisCount)
      }
      
    }
  }
  return returnData
}

function getLineData(thisData){
    ////console.log(data)
    //lets compute costs per year for the line chart
    //console.log("line chart data!")
    let requestsPerDay = [];
    let total = 0;
    for(var i = 1; i <= 248; i++){
      var thisEpisode = thisData.filter(d => parseInt(d.episode_id) === i)
      let regex = new RegExp('\\b' + lineChartWord + '\\b', 'g');
      let count = thisEpisode.filter(d => regex.test(d.normalized_text)).length;
      if(thisEpisode.length > 0){
        requestsPerDay.push( {"episode": i, "num":count, "season":thisEpisode[0].season, "episode_of_season":thisEpisode[0].episode_of_season, "title":thisEpisode[0].episode_title});
      }
      else{
        var thisEpisode = globalData.filter(d => parseInt(d.episode_id) === i)
        requestsPerDay.push( {"episode": i, "num":count, "season":thisEpisode[0].season, "episode_of_season":thisEpisode[0].episode_of_season, "title":thisEpisode[0].episode_title});
      }
      total += count
    }

    return requestsPerDay
}

// getTreemapData, shou;d return array of objects with {name, value} with value being the number of lines spoken. First check top 50 location_id in the data, then match the locations "name" using id in simpsons_locations.csv.
function getTreemapData(thisData){
  let returnData =[];
  // get top 50 location_id based on number of appearances in the data
  const groupedData = d3.group(thisData, d => d.location_id);
  let uniqueLocations = Array.from(groupedData);
  let newArray = uniqueLocations.map(([location_id, lines]) => ({ location_id, lines: lines.length }));
  newArray = newArray.filter(({ location_id }) => location_id !== "5");
  newArray = newArray.sort((a, b) => d3.descending(a.lines, b.lines));
  newArray = newArray.slice(0,10)

  // match location_id with id from locationData array. push to returnData array with {name, value}, name coming from locationData array and value coming from newArray array (number of lines spoken)
  for(var i = 0; i < newArray.length; i++){
    var thisLocation = locationData.filter(d => d.id == newArray[i].location_id) // cant be location
    // if length is 0, skip
    if(thisLocation.length == 0){
      continue
    }
    returnData.push({name:thisLocation[0].name, value:newArray[i].lines})
  }
  console.log(returnData)
  return returnData
  
}

// d3 on hover of histo-info element, show tooltip explaining what the histogram is
d3.select("#histo-info").on("mouseover", function(d) {
  d3.select('#tooltip')
    .attr('data-value',d.id)
    .style('display', 'block')
    .style('left', event.pageX + 10 + 'px')   
    .style('top', event.pageY + 10 + 'px')
    .html(`
    <div style="align-items: center; line-height: 5px; margin-top: 5px;">
        <p style="margin: 0; padding: 0; font-weight: bold">Histogram</p>
        <p><i>Displays number of lines spoken in each episode of the show, colored by season.</i></p>
        <ul style="line-height: 15px;">
          <li>Hover over a bar to see the episode number, season, title, and number of lines.</li>
          <li>Click on a bar to filter the page and only show selected episodes or seasons.</li>
        </ul>
      </div>
    `);
})
.on("mouseout", function(d) {
  d3.select('#tooltip')
    .style('display', 'none')
    .style('left', 0 + 'px')
    .style('top', 0 + 'px')
    .html(``);
});

// d3 on hover of bar-info element, explain bar chart shows number of lines spoken by each character
d3.select("#bar-info").on("mouseover", function(d) {
  d3.select('#tooltip')
    .attr('data-value',d.id)
    .style('display', 'block')
    .style('left', event.pageX + 10 + 'px')   
    .style('top', event.pageY + 10 + 'px')
    .html(`
    <div style="align-items: center; line-height: 5px; margin-top: 5px;">
        <p style="margin: 0; padding: 0; font-weight: bold">Character Bar-Chart</p>
        <p><i>Displays number of lines spoken by each character.</i></p>
        <ul style="line-height: 15px;">
          <li>Hover over a bar to see the character's name and number of lines.</li>
          <li>Click on a bar to filter the page and only show selected characters.</li>
        </ul>
      </div>
    `);
})
.on("mouseout", function(d) {
  d3.select('#tooltip')
    .style('display', 'none')
    .style('left', 0 + 'px')
    .style('top', 0 + 'px')
    .html(``);
});

// d3 on hover of line-info element, explain line chart shows use of a word over time
d3.select("#line-info").on("mouseover", function(d) {
  d3.select('#tooltip')
    .attr('data-value',d.id)
    .style('display', 'block')
    .style('left', event.pageX + 10 + 'px')   
    .style('top', event.pageY + 10 + 'px')
    .html(`
    <div style="align-items: center; line-height: 5px; margin-top: 5px;">
        <p style="margin: 0; padding: 0; font-weight: bold">Line Chart</p>
        <p><i>Displays number of times a word is used in each episode of the show.</i></p>
        <ul style="line-height: 15px;">
          <li>Defaults to largest word in word cloud.</li>
          <li>Hover over the line to see each episode's number, season, title, and number of times the word is used.</li>
          <li>Use the input box to enter a specific word or phrase.</li>
        </ul>
      </div>
    `);
})
.on("mouseout", function(d) {
  d3.select('#tooltip')
    .style('display', 'none')
    .style('left', 0 + 'px')
    .style('top', 0 + 'px')
    .html(``);
});

// d3 on hover of chord-info element, explain chord diagram shows relationships and interactions between characters
d3.select("#chord-info").on("mouseover", function(d) {
  d3.select('#tooltip')
    .attr('data-value',d.id)
    .style('display', 'block')
    .style('left', event.pageX + 10 + 'px')   
    .style('top', event.pageY + 10 + 'px')
    .html(`
    <div style="align-items: center; line-height: 5px; margin-top: 5px; z-index: 300;">
        <p style="margin: 0; padding: 0; font-weight: bold">Chord Diagram</p>
        <p><i>Displays the relationships and interactions between characters.</i></p>
        <ul style="line-height: 15px;">
          <li>Hover over a chord to see the characters involved and the number of times they spoke to each other.</li>
          <li>Click on a chord to filter the page and only show the selected characters.</li>
        </ul>
      </div>
    `);
})
.on("mouseout", function(d) {
  d3.select('#tooltip')
    .style('display', 'none')
    .style('left', 0 + 'px')
    .style('top', 0 + 'px')
    .html(``);
});

// d3 on hover of cloud-info element, explain word cloud shows most frequently used words for either the entire show or the current filter
d3.select("#cloud-info").on("mouseover", function(d) {
  d3.select('#tooltip')
    .attr('data-value',d.id)
    .style('display', 'block')
    .style('left', event.pageX + 10 + 'px')   
    .style('top', event.pageY + 10 + 'px')
    .html(`
    <div style="align-items: center; line-height: 5px; margin-top: 5px;">
        <p style="margin: 0; padding: 0; font-weight: bold">Word Cloud</p>
        <p><i>Displays the most frequently used words for either the entire show or the current filter.</i></p>
        <ul style="line-height: 15px;">
          <li>Hover over a word to see the word and the number of times it is used.</li>
          <li>Click on a word to update the line chart and show the number of times the word is used in each episode.</li>
        </ul>
      </div>
    `);
})
.on("mouseout", function(d) {
  d3.select('#tooltip')
    .style('display', 'none')
    .style('left', 0 + 'px')
    .style('top', 0 + 'px')
    .html(``);
});

// d3 on hover of tree-info element, explain tree diagram msot frequent locations for either the entire show or the current filter
d3.select("#tree-info").on("mouseover", function(d) {
  d3.select('#tooltip')
    .attr('data-value',d.id)
    .style('display', 'block')
    .style('left', event.pageX + 10 + 'px')   
    .style('top', event.pageY + 10 + 'px')
    .html(`
    <div style="align-items: center; line-height: 5px; margin-top: 5px;">
        <p style="margin: 0; padding: 0; font-weight: bold">Tree Map</p>
        <p><i>Displays the most frequent locations for either the entire show or the current filter.</i></p>
        <ul style="line-height: 15px;">
          <li style="color: darkred">Excludes "Simpson's Home", since it is always the largest by far.</li>
          <li>Hover over a location to see the location and the number of times it is used.</li>
          <li>Click on a location to filter the page on the current location.</li>
        </ul>
      </div>
    `);
})
.on("mouseout", function(d) {
  d3.select('#tooltip')
    .style('display', 'none')
    .style('left', 0 + 'px')
    .style('top', 0 + 'px')
    .html(``);
});