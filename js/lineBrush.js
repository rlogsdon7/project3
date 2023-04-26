class Line {

  constructor(_config, _data,_refresh,_word) {
    this.config = {
      parentElement: _config.parentElement,
      contextHeight: 40,
       margin: {top: 40, bottom: 110, right: 10, left: 80},
      contextMargin: {top: 20, bottom: 40, right: 10, left: 80},
      width: _config.containerWidth,
      height:  _config.containerHeight
    }

    this.data = _data;
    this.refresh = _refresh;
    this.word = _word;
    this.empty = false;
    this.apiData = {};
    // Call a class function
    this.initVis();
  }

  initVis() {
      
    let vis = this; //this is a keyword that can go out of scope, especially in callback functions, 
                    //so it is good to create a variable that is a reference to 'this' class instance

    //set up the width and height of the area where visualizations will go- factoring in margins               
    vis.width = vis.config.width - vis.config.margin.right - vis.config.margin.left;
    vis.height = vis.config.height - vis.config.margin.top - vis.config.margin.bottom;
    vis.containerHeight = vis.config.height + vis.config.margin.top + vis.config.margin.bottom;

// Define size of SVG drawing area
    vis.svg = d3.select(vis.config.parentElement)
        .attr('width', vis.config.width)
        .attr('height',  vis.config.height);

    // X axis Label    
    vis.svg.append("text")
       .attr("transform", `translate(${(vis.width)/1.6},${vis.height + vis.config.margin.bottom + 25})`)
       .style("text-anchor", "middle")
       .text("Episode")
       .style("font-family", "Roboto")
        .style("color", "black")
        .style("font-size", "14px");

    vis.svg.append("text")
       .attr("transform", "rotate(-90)")
       .attr("x", -(vis.height/2) - vis.config.margin.top -10)
       .attr("y", 45)
       .style("text-anchor", "middle")
       .text("Number of Times Spoken")
       .style("font-family", "Roboto")
        .style("color", "black")
        .style("font-size", "14px");

    vis.xAxisLine = vis.svg.append("line")
        .attr("x1", vis.config.margin.left)
        .attr("y1", vis.height + vis.config.margin.top)
        .attr("x2", vis.width + vis.config.margin.left)
        .attr("y2", vis.height + vis.config.margin.top)
        .attr("stroke", "black")
        .attr("stroke-width", 1);
        
    vis.yAxisLine = vis.svg.append("line")
        .attr("x1", vis.config.margin.left)
        .attr("y1", vis.config.margin.top)
        .attr("x2", vis.config.margin.left)
        .attr("y2", vis.height + vis.config.margin.top)
        .attr("stroke", "black")
        .attr("stroke-width", 1);
    vis.static = true;
    // Get data from API
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
  updateVis() { 
        let vis = this;
        vis.svg.selectAll('.no-data-text').remove();
        vis.svg.selectAll('.y-axis').remove();
        vis.svg.selectAll('.x-axis').remove();
        vis.svg.selectAll('.chart').remove();
        vis.svg.selectAll('.plan').remove();
        vis.xValue = d => parseFloat(d.episode); 
        vis.yValue = d => parseFloat(d.num);

        var text = vis.word.split(' ');

      // loop through each word in the array
      for (let i = 0; i < text.length; i++) {
        // get the first letter of the word and capitalize it
        let firstLetter = text[i].charAt(0).toUpperCase();

        // get the rest of the word and append it to the capitalized first letter
        let restOfWord = text[i].slice(1);

        // reassign the capitalized word back into the array
        text[i] = firstLetter + restOfWord;
      }

          // join the words back into a string and return it
          text = text.join(' ');

        //Title
        vis.svg.append("text")
            .attr('class', 'plan')
            .attr('transform', `translate(${(vis.width - vis.config.margin.left - vis.config.margin.right)/1.8}, ${vis.config.margin.top - 10 })`)
            .text("Use of '" + text + "' Over Time")
            .style("font-family", "Roboto")
            .style("color", "black")
            .style("font-size", "18px");

        vis.yScaleFocus = d3.scaleLinear()
            .range([vis.height, 0])
            .nice();

        let yMin = d3.min(vis.data, d => d.num)
        let yMax = d3.max(vis.data, d => d.num)
        
        if(yMin==null || yMax ==0){
            yMin = 0
            yMax = 1
            vis.empty = true;
            vis.svg.append('text')
                .attr('class', 'no-data-text')
                .attr('transform', `translate(${(vis.width / 2)+40}, ${(vis.height / 2)+40})`)
                .attr('text-anchor', 'middle')
                .text('No Data to Display')
                .style("font-family", "Roboto")
                .style("color", "black")
                .style("font-size", "14px");
            vis.yScaleFocus.domain([0,1]);
        }
        else{
            vis.empty = false;
            vis.yScaleFocus.domain(d3.extent(vis.data, vis.yValue));
        }

        vis.xScaleFocus = d3.scaleLinear()
            .domain([1,248])
            .range([0, vis.width]);

        vis.xScaleContext = d3.scaleLinear()
            .domain([1,248])
            .range([0, vis.width]);

        vis.yScaleContext = d3.scaleLinear()
            .range([vis.config.contextHeight, 0])
            .nice();

        // Initialize axes
        vis.xAxisFocus = d3.axisBottom(vis.xScaleFocus)
            .tickValues([13.5, 35.5, 59.5, 81.5, 103.5, 128.5, 153.5, 178.5, 203.5, 226.5])
            // custom labels
            .tickFormat(function(d) {
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
        vis.xAxisContext = d3.axisBottom(vis.xScaleContext)
            .ticks(6)
        vis.yAxisFocus = d3.axisLeft(vis.yScaleFocus).ticks(5);


         // Append focus group with x- and y-axes
        vis.focus = vis.svg.append('g')
            .attr('id', 'focus')
            .attr('class', 'chart')
            .attr('transform', `translate(${vis.config.margin.left},${vis.config.margin.top})`)

        vis.focus.append('defs').append('clipPath')
            .attr('id', 'clip')
            .attr('class', 'chart')
            .append('rect')
            .attr('width', vis.width)
            .attr('height', vis.height);
        
        vis.focusLinePath = vis.focus.append('path')
            .attr('class', 'chart');

        vis.focusAreaPath = vis.focus.append('path')
            .attr('class', 'chart');

        vis.xAxisFocusG = vis.focus.append('g')
            .attr('class', 'chart')
            .attr('transform', `translate(0,${vis.height})`);

        vis.yAxisFocusG = vis.focus.append('g')
            .attr('class', 'chart');

        vis.tooltipTrackingArea = vis.focus.append('rect')
            .attr('width', vis.width)
            .attr('height', vis.height)
            .attr('fill', 'none')
            .attr('pointer-events', 'all');

        // Empty tooltip group (hidden by default)
        vis.tooltip = vis.focus.append('g')
            .attr('class', 'tooltip')
            .style('display', 'none');

        vis.tooltip.append('circle')
            .attr('r', 4)
            .attr('fill', '#444444');

        vis.tooltip.append('text');


        // Append context group with x- and y-axes
        vis.context = vis.svg.append('g')
            .attr('id', 'context')
            .attr('class', 'chart')
            .attr('transform', `translate(${vis.config.contextMargin.left},${vis.height + vis.config.contextMargin.top +vis.config.contextHeight})`);

        vis.contextAreaPath = vis.context.append('path')
            .attr('class', 'chart');

        vis.xAxisContextG = vis.context.append('g')
            .attr('class', 'chart')
            .attr('transform', `translate(0,${vis.config.contextHeight})`);

        vis.brushG = vis.context.append('g')
            .attr('class', 'line-brush');


        // Initialize brush component
        vis.brush = d3.brushX()
            .extent([[0, 0], [vis.width, vis.config.contextHeight]])
            .on('brush', function({selection}) {
              if (selection) vis.brushed(selection);
            })
            .on('end', function({selection}) {

                
              if (!selection) 
                {
                vis.brushed(null)
              }

            });
        vis.lineBase = d3.line()
        .x(d => vis.xScaleFocus(vis.xValue(d)))
            .y(vis.height);

        // Initialize line and area generators
        vis.line = d3.line()
            .x(d => vis.xScaleFocus(vis.xValue(d)))
            .y(d => vis.yScaleFocus(vis.yValue(d)));

        vis.focusAreaBase = d3.area()
            .x(d => vis.xScaleFocus(vis.xValue(d)))
            .y1(vis.height)
            .y0(vis.height);

        vis.focusArea = d3.area()
            .x(d => vis.xScaleFocus(vis.xValue(d)))
            .y1(d => vis.yScaleFocus(vis.yValue(d)))
            .y0(vis.height);

        vis.area = d3.area()
            .x(d => vis.xScaleContext(d.episode))
            .y1(d => vis.yScaleContext(d.num))
            .y0(vis.config.contextHeight);


        vis.yScaleContext.domain(vis.yScaleFocus.domain());

        vis.bisectDate = d3.bisector(vis.xValue).left;

    if(!vis.empty){
        vis.focusLinePath
            .datum(vis.data)
            .attr('class','chart')
            .attr('stroke',  '#d1123f')
            .attr('stroke-width', 2)
            .attr('fill', 'none')
            .attr('d', vis.lineBase)
            .attr("clip-path", "url(#clip)")
    }
    else{
        vis.focusLinePath
        .datum(vis.data)
        .attr('class','chart')
        .attr('stroke',  'black')
        .attr('stroke-width', 0)
        .attr('fill', 'none')
        .attr('d', vis.lineBase)
        .attr("clip-path", "url(#clip)")
    }

    vis.focusLinePath.transition()
        .duration(1000)
        .attr('d', vis.line)

    vis.focusAreaPath
        .attr('class','chart')
        .datum(vis.data)
        .attr('class','chart')
        .attr('fill', '#ffa3b9')
        .attr('d', vis.focusAreaBase)
        .attr("clip-path", "url(#clip)")

    vis.focusAreaPath.transition()
        .duration(1000)
        .attr('d', vis.focusArea)

    vis.contextAreaPath
        .attr('class','chart')
        .datum(vis.data)
        .attr('class','chart')
        .attr('fill', '#d2d2d2')
        .attr('d', vis.area)
        .attr("clip-path", "url(#clip)")

    vis.tooltipTrackingArea
    .on('mouseenter', () => {
        if(vis.data.length > 0){
            vis.tooltip.style('display', 'block');
        }
    })
    .on('mouseleave', () => {
        vis.tooltip.style('display', 'none');
        d3.select('#tooltip').style('display', 'none');
    })
    .on('mousemove', function(event) {
        // Get date that corresponds to current mouse x-coordinate
        const xPos = d3.pointer(event, this)[0]; // First array element is x, second is y
        const episode = vis.xScaleFocus.invert(xPos);

        // Find nearest data point
        const index = vis.bisectDate(vis.data, episode, 1);
        const a = vis.data[index - 1];
        const b = vis.data[index];
        const d = b && (episode - a.episode > b.episode - episode) ? b : a; 
        var episodeData = vis.apiData._embedded.episodes.find(ep => ep.season == d.season && ep.number == d.episode_of_season);
        if(d != null){
        // Update tooltip
        d3.select('#tooltip')
            .style('display', 'block')
            .style('left', event.pageX + 5 + 'px')   
            .style('top', event.pageY + 5 + 'px')
            .html(`
            <div style="display: flex; align-items: center;">
                <img src="" style="height: 80px; margin-right: 10px; object-fit: contain; border-radius: 5px;">
                <div style="flex: 1;">
                    <div style="text-align: center"><b>Episode ${d.episode}: ${episodeData.name}</b></div>
                    <div style="text-align: center">Season ${d.season}, Episode ${d.episode_of_season} </div>
                    <div style="text-align: center">Times Spoken: ${d.num}</div>
                </div>
            </div>
            `);
            const tooltip = document.querySelector('#tooltip')
            tooltip.querySelector('img').src = episodeData.image.medium;
            vis.tooltip.select('circle')
            .attr('transform', `translate(${vis.xScaleFocus(parseFloat(d.episode))},${vis.yScaleFocus(d.num)})`);
        }
    });
    // Update the axes
    vis.xAxisFocusG.call(vis.xAxisFocus);
    vis.yAxisFocusG.call(vis.yAxisFocus);
    vis.xAxisContextG.call(vis.xAxisContext);
    var numMax = vis.xScaleContext.range()[1]
    var half = 0;
    if(numMax > 0){
        half = numMax/2
    }
    // Update the brush and define a default position
    const defaultBrushSelection = [vis.xScaleFocus(1), vis.xScaleFocus(248)];
    
    if(vis.data.length>0){
    vis.brushG
        .call(vis.brush)
        .call(vis.brush.move, defaultBrushSelection);
    }
  
  }

  brushed(selection) {
    let vis = this;

    // Check if the brush is still active or if it has been removed
    if (selection) {
      // Convert given pixel coordinates (range: [x0,x1]) into a time period (domain: [Date, Date])
      vis.selectedDomain = selection.map(vis.xScaleContext.invert, vis.xScaleContext);
      // Update x-scale of the focus view accordingly
      
      vis.xScaleFocus.domain(vis.selectedDomain);
      var yData = vis.data
      var yMax = 1;
      for(var i = Math.floor(vis.selectedDomain[0]); i < vis.selectedDomain[1]; i++){
        if(yData[i].num>yMax){
          yMax = yData[i].num
        }
      }
      if(vis.empty){
        d3.selectAll(".line-brush").remove();
        vis.yScaleFocus.domain([0,1]);
      } 
      else{
        vis.yScaleFocus.domain([0,yMax]);
      }
      

    } else {
      // Reset x-scale of the focus view (full time period)
        vis.selectedDomain = vis.xScaleContext.domain()
      vis.xScaleFocus.domain(vis.xScaleContext.domain());

      vis.selectedRange = vis.yContext.domain()
      vis.yScaleFocus.domain(vis.xContext.domain());
    }

    // Redraw line and update x-axis labels in focus view
    vis.focusLinePath.attr('d', vis.lineBase);
    vis.focusLinePath.transition()
        .duration(1000)
        .attr('d', vis.line)
    vis.focusAreaPath
        .attr('d', vis.focusAreaBase)

    vis.focusAreaPath.transition()
        .duration(1000)
        .attr('d', vis.focusArea)

    vis.xAxisFocusG.call(vis.xAxisFocus);
    vis.yAxisFocusG.call(vis.yAxisFocus);
  }
}