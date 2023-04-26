class SeasonTimeline {
  constructor(_config, _data, _refresh) {
    this.config = {
      parentElement: _config.parentElement,
      containerWidth: _config.containerWidth || 500,
      containerHeight: _config.containerHeight || 140,
      margin: { top: 40, bottom: 60, right: 20, left: 60 },
      contextHeight: 40
    }
    this.data = _data; 
    this.refresh = _refresh;
    this.apiData = {};
    this.initVis();
  }
  /**
   * Define titles and lables, assign them to the SVG element
   */
  initVis() {
    let vis = this;
    vis.width = vis.config.containerWidth - vis.config.margin.right;
    vis.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom - vis.config.contextHeight;
        
        // Define size of SVG drawing area
    vis.svg = d3.select(vis.config.parentElement)
        .attr('width', vis.config.containerWidth)
        .attr('height', vis.config.containerHeight);

    //Title
    vis.svg.append("text")
       .attr('transform', `translate(${(vis.width)/2.25}, ${vis.config.margin.top - 10 })`)
       .text("Lines Spoken Per Episode")
       .style("font-family", "Roboto")
        .style("color", "black")
        .style("font-size", "18px");
    // X axis Label    
    vis.svg.append("text")
       .attr("transform", `translate(${(vis.width- vis.config.margin.right - vis.config.margin.left)/2 + vis.config.margin.left},${vis.height + vis.config.contextHeight + vis.config.margin.bottom + 35})`)
       .style("text-anchor", "middle")
       .text("Episode")
       .style("font-family", "Roboto")
        .style("color", "black")
        .style("font-size", "14px");
    vis.svg.append("text")
       .attr("transform", "rotate(-90)")
       .attr("x", -(vis.height/2) - vis.config.margin.top)
       .attr("y", 20)
       .style("text-anchor", "middle")
       .text("Number of Lines")
       .style("font-family", "Roboto")
        .style("color", "black")
        .style("font-size", "14px");
      vis.static = true;

      const apiUrl = `https://api.tvmaze.com/singlesearch/shows?q=The%20Simpsons&embed=episodes`;
      fetch(apiUrl, { mode: 'cors', cache: 'force-cache' })
        .then(response => response.json())
        .then(data => {
          vis.apiData = data;
        })
        .catch(error => {
          console.error('Error fetching episode data:', error);
        });

      vis.updateVis(); 
  }
  /**
   * Prepare the data, scales and render it.
   */
  updateVis() {
    let vis = this;
    vis.svg.selectAll('.no-data-text').remove();
    vis.svg.selectAll('.y-axis').remove();
    vis.svg.selectAll('.x-axis').remove();
    vis.svg.selectAll('.chart').remove();
    vis.svg.selectAll('.plan').remove();
    vis.svg.selectAll('.rects').remove();
    vis.svg.selectAll('.clipHist').remove();
    vis.svg.selectAll('.rectsdrawn').remove();
    vis.svg.selectAll('.tooltip').remove();
    vis.x = d3.scaleLinear()
      .domain([.5, 248.5])
      .range([vis.config.margin.left, vis.width])
    vis.xContext = d3.scaleLinear()
      .domain([.5,  248.5])
      .range([vis.config.margin.left, vis.width])

    vis.bins = vis.data

    let max = d3.max(vis.bins, function(d) { return d.lines; })
    if(max==0){
      max = 1
      // Add text in the center of the chart if there is no data
                vis.svg.append('text')
                  .attr('class', 'no-data-text')
                  .attr('transform', `translate(${(vis.width / 2)+15}, ${(vis.height / 2)+40})`)
                  .attr('text-anchor', 'middle')
                  .text('No Data to Display')
                  .style("font-family", "Roboto")
                    .style("color", "black")
                    .style("font-size", "14px");
    }
    // Y axis: scale and draw:
    vis.y = d3.scaleLinear()
      .range([vis.height, 0])
      .domain([0, max]);   // d3.hist has to be called before the Y axis obviously

    // Y axis: scale and draw:
    vis.yContext = d3.scaleLinear()
      .range([vis.height + vis.config.margin.bottom + vis.config.contextHeight, vis.height + vis.config.margin.bottom])
      .domain([0, max]);   // d3.hist has to be called before the Y axis obviously



    vis.contextRects = vis.svg.append('g').attr('class', 'rects');
    vis.rects = vis.svg.append('g').attr('class', 'rects')
        .attr('height', vis.height)
        .attr('clip-path', 'url(#clipHist)');

    // only show x axis ticks at season breaks
    vis.xAxis = d3.axisBottom(vis.x).tickValues([0.5, 13.5, 35.5, 59.5, 81.5, 103.5, 128.5, 153.5, 178.5, 203.5, 226.5])
    // custom labels
    vis.xAxis.tickFormat(function(d) {
      if(d == 0.5) return "Season 1";
      if(d == 13.5) return "Season 2";
      if(d == 35.5) return "Season 3";
      if(d == 59.5) return "Season 4";
      if(d == 81.5) return "Season 5";
      if(d == 103.5) return "Season 6";
      if(d == 128.5) return "Season 7";
      if(d == 153.5) return "Season 8";
      if(d == 178.5) return "Season 9";
      if(d == 203.5) return "Season 10";
      if(d == 226.5) return "Season 11";
    });
    vis.yAxis = d3.axisLeft(vis.y).ticks(5)
    vis.xAxisG = vis.svg.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0,${vis.height  + vis.config.margin.top})`)

    vis.svg.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0,${vis.height + vis.config.contextHeight + vis.config.margin.bottom})`)
      .call(d3.axisBottom(vis.xContext));

    vis.yAxisG = vis.svg.append('g')
      .attr('class', 'y-axis')
      .attr('transform', `translate(${vis.config.margin.left}, ${vis.config.margin.top})`)
      .call(vis.yAxis);


    vis.svg.append('defs').append('clipPath')
        .attr('id', 'clipHist')
        .attr('class', 'chart')
        .append('rect')
        .attr('x',  vis.config.margin.left)
        .attr('y',  vis.config.margin.top)
        .attr('width', vis.width-vis.config.margin.left)
        .attr('height', vis.height)

    vis.brush = d3.brushX()
      .extent([[vis.config.margin.left, vis.height + vis.config.margin.bottom ], [vis.width, vis.config.contextHeight + vis.height + vis.config.margin.bottom ]])
      .on('brush', function({selection}) {
          if (selection) vis.brushed(selection);
        })

    vis.contextRects.selectAll('rect')
      .data(vis.bins)
      .join('rect')
      .attr('class', 'plan')
      .attr("transform", function(d) { 
        let xVal = vis.x(d.x0);
        let yVal = vis.yContext(d.lines);
        return "translate(" + xVal + "," + yVal + ")"; })
      .attr("width", function(d) { return vis.x(d.x1) - vis.x(d.x0); })
      .attr('height', (d) => vis.config.contextHeight + vis.height  + vis.config.margin.bottom - vis.yContext(d.lines))
      .style("fill", "#d2d2d2")

    var numMax = vis.xContext.range()[1]
    var half = 0;
    if(numMax > 0){
        half = numMax/2
    }

    let defaultBrushSelection = [vis.xContext(0), numMax];

    if(vis.data.length>0){
      vis.svg.append('g')
        .attr('class', 'plan')
        .call(vis.brush) // initialize the brush
        .call(vis.brush.move, [vis.x(0.5),vis.x(248.5)])
        .selectAll('rect')
        .attr('y', vis.height + vis.config.contextHeight + vis.config.contextHeight/2)
        .attr('height', vis.config.contextHeight)

      vis.tooltipTrackingArea = vis.svg.append('rect')
        .attr('width', vis.width - vis.config.margin.left)
        .attr('height', vis.height)
        .attr('transform', `translate(${vis.config.margin.left}, ${vis.config.margin.top})`)
        .attr('fill', 'none')
        .attr('pointer-events', 'all');

      // Empty tooltip group (hidden by default)
      vis.tooltip = vis.svg.append('g')
        .attr('class', 'tooltip')
        .style('display', 'none')

      vis.tooltip.append('text');

      vis.tooltip.append('circle')
        .attr('r', 4)
        .attr('fill', '#444444');

      vis.tooltipTrackingArea
      .on('mouseenter', () => {
        vis.tooltip.style('display', 'block');
      })
      .on('mouseleave', () => {
        vis.tooltip.style('display', 'none');
        d3.select('#histo-tooltip').style('display', 'none');
      })
      .on('mousemove', function(event) {
        // Get date that corresponds to current mouse x-coordinate
        const xPos = d3.pointer(event, this)[0]; // First array element is x, second is y
        const distance = vis.x.domain()[0] + (((vis.x.domain()[1] - vis.x.domain()[0])*xPos)/(vis.width-vis.config.margin.left));
        var thisData = vis.bins
        var thisData1 = thisData.filter(d=>d.x0<distance)
        var thisData2 = thisData1.filter(d=>d.x1>distance)
        if(thisData2.length>0){
          var episode = vis.apiData._embedded.episodes.find(ep => ep.season == thisData2[0].seasonText && ep.number == thisData2[0].seasonEpisode); // find episode
          var median = (thisData2[0].x0 + thisData2[0].x1)/2
          if(median < vis.x.domain()[1] && median > vis.x.domain()[0]){
            var text = "Episode " + (thisData2[0].x0 +.5) + ": " + episode.name
            if((thisData2[0].x0 +.5)  < 220){
              var leftSize = (d3.select('#season')._groups[0][0].getBoundingClientRect().x + vis.x(median) + 5)
            }
            else{
              var leftSize = (d3.select('#season')._groups[0][0].getBoundingClientRect().x + vis.x(median) - 385)
            }

            d3.select('#histo-tooltip').style('display', 'block')
              .style('left', (leftSize) + 'px')   
              .style('top', (d3.select('#season')._groups[0][0].getBoundingClientRect().y + vis.y(thisData2[0].lines) - 10) + 'px')
              .html(`
              <div style="display: flex; align-items: center;">
                <img src="" style="height: 80px; margin-right: 10px; object-fit: contain; border-radius: 5px;"> 
                <div style="flex: 1;">
                  <div style="text-align: center"><b>${text}</b></div>
                  <div style="text-align: center">Season ${thisData2[0].seasonText}, Episode ${thisData2[0].seasonEpisode} </div>
                  <div style="text-align: center">${thisData2[0].lines + " lines spoken"}</div>
                </div>
              </div>
            `);
            const tooltip = document.querySelector('#histo-tooltip')
            tooltip.querySelector('img').src = episode.image.medium; // set image
            vis.tooltip.select('circle')
              .attr('transform', `translate(${vis.x(median)}, ${vis.y(thisData2[0].lines) + vis.config.margin.top})`)
            }
        }
      })
      .on('click', (event, d) => {
        // Get date that corresponds to current mouse x-coordinate
        const xPos = d3.pointer(event, this)[0] - d3.select('#season')._groups[0][0].getBoundingClientRect().x -vis.config.margin.left; // First array element is x, second is y
        const distance = vis.x.domain()[0] + (((vis.x.domain()[1] - vis.x.domain()[0])*xPos)/(vis.width-vis.config.margin.left));
        
        var thisData = vis.bins
        var thisData1 = thisData.filter(d=>d.x0<distance)
        var thisData2 = thisData1.filter(d=>d.x1>distance)
        if(thisData2.length>0){
          d3.select('#histo-tooltip')
            .style('display', 'none')
          vis.refresh(thisData2[0].seasonText, (thisData2[0].x0 + .5));
        }
      })  
    }
    vis.xAxisG.call(vis.xAxis)
  }
  /**
   * Define brush interaction
   */
  brushed(selection) {
    let vis = this;

    // Check if the brush is still active or if it has been removed
    if (selection) {
      // Convert given pixel coordinates (range: [x0,x1]) into a time period (domain: [Date, Date])
      vis.selectedDomain = selection.map(vis.xContext.invert, vis.xContext);
      // Update x-scale of the focus view accordingly
      vis.x.domain(vis.selectedDomain);
      
      //do the same for the range
      // Convert given pixel coordinates (range: [x0,x1]) into a time period (domain: [Date, Date])
      var yData = vis.bins
      var yMax = 1;
      var i =  Math.floor(vis.selectedDomain[0])
      var j = vis.selectedDomain[1]
      if(j>248){j = 248}
      if(i<0){i = 0}
      for(i; i < j; i++){
        if(yData[i].lines>yMax){
          yMax = yData[i].lines
        }
      } 

      vis.y.domain([0,yMax]);
      

    } else {
      // Reset x-scale of the focus view (full time period)
      vis.selectedDomain = vis.xContext.domain()
      vis.x.domain(vis.xContext.domain());

      vis.selectedRange = vis.yContext.domain()
      vis.y.domain(vis.xContext.domain());
    }
    vis.svg.selectAll('.rectsdrawn').remove();
    // Redraw line and update x-axis labels in focus view
    vis.mainRects = vis.rects.selectAll('rect')
      .data(vis.bins)
      .join('rect')
      .attr('class', 'rectsdrawn')
      .attr("transform", function(d) { 
                        let xVal = vis.x(d.x0);
                        let yVal =vis. y(d.lines) + vis.config.margin.top;
                    return "translate(" + xVal + "," + (vis.height + vis.config.margin.top) + ")"; })

      .attr("width", function(d) { return vis.x(d.x1) - vis.x(d.x0) ; })
      .attr('height', 0)
      .attr('fill', function(d) { return d.season })
      //.attr("stroke", "#000000")

      vis.mainRects.transition()
        .duration(1000)
        .attr('height', (d) => vis.height - vis.y(d.lines))
        .attr("transform", function(d) { 
                        let xVal = vis.x(d.x0);
                        let yVal =vis. y(d.lines) + vis.config.margin.top;
                    return "translate(" + xVal + "," + yVal + ")"; })
      //.attr('clip-path', 'url(#clipHist)')

    vis.xAxisG.call(vis.xAxis);
    vis.yAxisG.call(vis.yAxis);
  }
}