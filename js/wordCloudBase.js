class WordCloud {
  constructor(_config, _data,_refresh) {
    this.config = {
      parentElement: _config.parentElement,
      containerWidth: _config.containerWidth || 500,
      containerHeight: _config.containerHeight || 140,
      margin: { top: 50, bottom: 10, right: 50, left: 60 },
    }
    this.data = _data; 
    this.refresh = _refresh
    this.initVis();
  }

  initVis() {
    let vis = this;
    vis.width = vis.config.containerWidth;
    vis.height = vis.config.containerHeight - vis.config.margin.bottom - vis.config.margin.top;
    
    // Define size of SVG drawing area
    vis.svg = d3.select(vis.config.parentElement)
        .attr('width', vis.config.containerWidth)
        .attr('height', vis.config.containerHeight);

    vis.chart = vis.svg.append('g')
      .attr('transform', `translate(0,${vis.config.margin.top})`);

    vis.updateVis("");
  }

  updateVis(filtered) {
    let vis = this;

    vis.opacity = 100;
    vis.svg.selectAll('.plan').remove();

    vis.chart = vis.svg.append('g')
      .attr('class', 'plan')
      .attr('transform', `translate(0,${vis.config.margin.top})`);

    vis.chart.append("rect")
      .attr("width", vis.width)
      .attr("height", vis.height)

      .style("fill", "none")


    vis.scale = d3.scaleLinear()
      .domain([d3.min(vis.data, d => d.count),d3.max(vis.data, d => d.count)])
      .range([20, 80])

    if (vis.title){
      vis.title.remove();
    }
    //Title
    if (filtered != "" && vis.data.length > 0){
      var thisText = "Word Cloud -- " + filtered;
      vis.title = vis.svg.append("text")
      .attr('class', 'plan')
         .attr('transform', `translate(${vis.width/1.95}, ${vis.config.margin.top -20 })`)
          .attr("text-anchor", "middle")
         .text(thisText)
         .style("font-family", "Roboto")
          .style("color", "black")
          .style("font-size", "18px");
    } else {
      vis.title = vis.svg.append("text")
      .attr('class', 'plan')
         .attr('transform', `translate(${vis.width/1.95}, ${vis.config.margin.top -20 })`)
          .attr("text-anchor", "middle")
         .text("Word Cloud")
         .style("font-family", "Roboto")
          .style("color", "black")
          .style("font-size", "18px");
    }
    if(vis.data.length == 0){
      // Add text in the center of the chart if there is no data
    vis.chart.append('text')
      .attr('class', 'no-data-text')
      .attr('transform', `translate(${vis.width / 1.95}, ${vis.height / 2})`)
      .attr('text-anchor', 'middle')
      .text('No Data to Display')
      .style("font-family", "Roboto")
      .style("color", "black")
      .style("font-size", "14px");
    }else{
      vis.layout = d3.layout.cloud()
        .size([vis.width, vis.height])
        .words(vis.data.map(function(d) { return {text: d.word, count:d.count, sizezz:vis.scale(d.count), opacity: d.opacity}; }))
        .padding(10)        //space between words
        .rotate(function() { return (Math.floor(Math.random() * 3 )- 1) * 90;})
        .fontSize(function(d) { return d.sizezz; })
        .on("end", function(words) {
          vis.draw(words);
        });
        

      vis.layout.start();
    }
  }

  

  draw(words) {
    let vis = this;
    vis.opacity = vis.opacity - 1;
    vis.color = d3.scaleOrdinal().range(d3.schemeCategory10);
  vis.chart
    .append("g")
      .attr("transform", "translate(" + vis.layout.size()[0] / 2 + "," + vis.layout.size()[1] / 2 + ")")
      .attr("transform", `translate(${vis.width / 2}, ${vis.height / 2})`)
      .selectAll("text")
        .data(words)
      .join("text")
        .style("font-size", function(d) { return d.sizezz; })
        // random color from  vis.color = d3.scaleOrdinal().range(d3.schemeCategory10);
        .style("fill", function(d) { return vis.color(d.text); })
        .attr("text-anchor", "middle")
        .style("font-family", "Roboto")
        .style("opacity", function(d) { return d.opacity; })
        .style('user-select', 'none')
        .attr("transform", function(d) {
          return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
        })
        .text(function(d) { return d.text; })
        .on("mouseover", function(d) {
          let wordObject = d3.select(this)
          let word = wordObject._groups[0][0].innerHTML
          d3.select('#tooltip')
          .attr('data-value',d.id)
          .style('display', 'block')
          .style('left', event.pageX + 10 + 'px')   
          .style('top', event.pageY + 'px')
          .html(`
            <div style="text-align: center"><b>${word}</b></div>
            <div style="text-align: center">Times Spoken: ${vis.data.filter(d=>d.word == word)[0].count}</div>
          `);
          d3.select(this)
          .transition()
          .duration(150)
          .style("filter", "brightness(0.7)");
        })
        .on("mouseout", function(d) {
          d3.select('#tooltip').style('display', 'none');
          d3.select(this)
          .transition()
          .duration(150)
          .style("filter", "brightness(1)");
        })
        .on("click", function(d) {
          let wordObject = d3.select(this)
          let word = wordObject._groups[0][0].innerHTML
          vis.refresh(word)
        });
  }
}