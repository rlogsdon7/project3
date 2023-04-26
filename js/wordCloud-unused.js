class WordCloud{
    /**
     * Class constructor with basic configuration
     * @param {Object}
     * @param {Array}
     */
    constructor(_config, _data, _infoText) {
      this.config = {
        parentElement: _config.parentElement,
        containerWidth: _config.containerWidth || 400,
        containerHeight: _config.containerHeight || 400,
        margin: _config.margin || {top: 30, right: 30, bottom: 30, left: 30}
      }
      this.data = _data;
      this.stop_words = [];
      this.initVis();
    }
  
    initVis(){
        let vis = this;
        // Read stop words
        d3.csv('../data/stop_words.csv', word => vis.stop_words.push(word.words))
        vis.width = vis.config.containerWidth + vis.config.margin.left + vis.config.margin.right;
        vis.height = vis.config.containerHeight + vis.config.margin.top + vis.config.margin.bottom;

        vis.sizeScale = d3.scaleLinear()
            .range([20, 52])     

        // Define size of SVG drawing area
        vis.svg = d3.select(vis.config.parentElement)
            .attr('width', vis.config.containerWidth)
            .attr('height', vis.config.containerHeight)
            .append('g')
            .attr('transform', `translate(${vis.config.margin.left}, ${vis.config.margin.top})`);

        vis.updateVis();
    }
  
    updateVis(){
      let vis = this;
      console.log(vis.stop_words)
      vis.freqMap = {}
      vis.data.forEach(d => {
        let words = d.normalized_text.toLowerCase().split(/\s/gm).filter(string => string);
          words.forEach(w => {
            if (!vis.freqMap[w] && !vis.stop_words.includes(w.toLowerCase())) {
              vis.freqMap[w] = 1;
            }
            else if (!vis.stop_words.includes(w)){
              vis.freqMap[w] += 1;
            }
        })
      })
      vis.data = Object.entries(vis.freqMap).map((e) => ( { word:e[0], size:e[1] } ))
      vis.data.sort((a,b) => b.size - a.size)
      vis.data = vis.data.slice(0, 50)

      // remove stop words
    vis.data = vis.data.filter(d => !vis.stop_words.includes(d.word))
  
      vis.sizeValue = d => d.size;
      vis.sizeScale.domain(d3.extent(vis.data, vis.sizeValue))
  
      // Constructs a new cloud layout instance. It run an algorithm to find the position of words that suits your requirements
      // Wordcloud features that are different from one word to the other must be here
      vis.layout = d3.layout.cloud()
        .size([vis.width, vis.height])
        .words(vis.data.map(function(d) { return {text: d.word, size:vis.sizeScale(vis.sizeValue(d))}; }))
        .padding(5)        //space between words
        .rotate(function() { return ~~(Math.random() * 2) * 90; })
        .fontSize(function(d) { return d.size; })      // font size of words
        .on("end", draw);
      vis.layout.start();
  
      // This function takes the output of 'layout' above and draw the words
      // Wordcloud features that are THE SAME from one word to the other can be here
      function draw(words) {
        vis.svg
          .join("g")
            .attr("transform", "translate(" + vis.layout.size()[0] / 2 + "," + vis.layout.size()[1] / 2 + ")")
            .selectAll("text")
              .data(words)
            .join("text")
              .style("font-size", function(d) { return d.size; })
              .style("font-family", "Roboto")
              .style("fill", "#77aac6")
              .attr("text-anchor", "middle")
              .attr("transform", function(d) {
                return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
              })
              .text(function(d) { return d.text; })
              // user-events none
              .style("user-select", "none")
            .on("mouseover", function(d) {
            d3.select(this)
                .transition()
                .duration(100)
                .style("font-size", function(d) { return d.size + 10; })
                .style("fill", "#34647d")
            })
            .on("mouseout", function(d) {
                d3.select(this)
                    .transition()
                    .duration(100)
                    .style("font-size", function(d) { return d.size; })
                    .style("fill", "#77aac6")
            })
            .on("click", function(d) {
                console.log("clicked!")
            })
      }
    }
  }