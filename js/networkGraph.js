class Network {
  constructor(_config, _data,_matrix,_refresh) {
    this.config = {
      parentElement: _config.parentElement,
      containerWidth: _config.containerWidth || 500,
      containerHeight: _config.containerHeight || 140,
      margin: { top: 50, bottom: 10, right: 50, left: 60 },
    }
    this.data = _data; 
    this.matrix = _matrix; 
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

    vis.innerRadius = vis.height/2 - 20
    vis.outerRadius = vis.innerRadius + 10
    vis.updateVis();
  }

  updateVis() {
    let vis = this;
    vis.svg.selectAll('.plan').remove();

    vis.chart = vis.svg.append('g')
      .attr('class', 'plan')
      .attr('transform', `translate(0,${vis.config.margin.top})`);

    vis.title = vis.svg.append("text")
      .attr('class', 'plan')
         .attr('transform', `translate(${vis.width/2.0}, ${vis.config.margin.top -20 })`)
          .attr("text-anchor", "middle")
         .text("Most Frequent Character Interactions")
         .style("font-family", "Roboto")
          .style("color", "black")
          .style("font-size", "18px");

    if(vis.data.length == 0){
      vis.chart.append('text')
      .attr('class', 'no-data-text')
      .attr('transform', `translate(${vis.width / 1.95}, ${vis.height / 2})`)
      .attr('text-anchor', 'middle')
      .text('No Data to Display')
      .style("font-family", "Roboto")
      .style("color", "black")
      .style("font-size", "14px");
    }
    else{


    // 4 groups, so create a vector of 4 colors
    var colors = ["#1f77b4","#ff7f0e","#2ca02c","#d62728","#9467bd","#8c564b","#e377c2","#7f7f7f","#bcbd22","#17becf"]
    

    // give this matrix .to d3.chord(): it will calculates all the info we need to draw arc and ribbon
    var res = d3.chord()
        .padAngle(0.05)
        .sortSubgroups(d3.descending)
        (vis.matrix)

    // add the groups on the outer part of the circle
    vis.chart
      .datum(res)
      .append("g")
      .selectAll("g")
      .data(function(d) { return d.groups; })
      .enter()
      .append("g")
      .append("path")
        .attr('class', (function(d) {return "char" + (d.index + 1) }))
        .style("fill", function(d,i){ return colors[i] })
        .style("stroke", "black")
        // stroke width
        .style("stroke-width", "0.5px")
        .style("fill-opacity", ".7")
        .attr('transform', `translate(${vis.width / 2},${vis.height / 2})`)
        .attr("d", d3.arc()
          .innerRadius(vis.innerRadius)
          .outerRadius(vis.outerRadius)
        )
        .on("mouseover", function(d) {
          let object = d3.select(this)
          let index = object._groups[0][0].__data__.index
          var formattedName = vis.data[index][0].from
          if (formattedName === 'C. Montgomery Burns') {
            formattedName = "Charles Montgomery Burns";
          } else if (formattedName === 'Grampa Simpson') {
            formattedName = "Abe Simpson II";
          } else if (formattedName === 'Chief Wiggum') {
            formattedName = "Clancy Wiggum";
          } else if (formattedName === 'Waylon Smithers'){
            formattedName = "Waylon_Smithers,_Jr.";
          } else if (formattedName === 'Dr. Julius Hibbert'){
            formattedName = "Julius_Hibbert";
          } else if (formattedName === 'Rev. Timothy Lovejoy'){
            formattedName = "Timothy_Lovejoy";
          } else if (formattedName === 'Sideshow Bob'){
            formattedName = "Robert_Terwilliger";
          } else if (formattedName === 'Mayor Joe Quimby'){
            formattedName = "Joe_Quimby";
          } else if (formattedName === 'Martin Prince'){
            formattedName = "Martin_Prince,_Jr.";
          } else if (formattedName === 'HERB'){
            formattedName = "Herbert_Powell";
          } else if (formattedName === 'Miss Hoover'){
            formattedName = "Elizabeth_Hoover";
          } else if (formattedName === 'Dr. Nick Riviera'){
            formattedName = "Nick_Riviera";
          }
          // Make an API call to get the image URL
          const apiUrl = `https://simpsons.fandom.com/api.php?action=query&titles=${formattedName}&prop=pageimages&format=json&origin=*`;
          fetch(apiUrl, { mode: 'cors', cache: 'force-cache' })
            .then(response => response.json())
            .then(data => {
              const pages = data.query.pages;
              const pageId = Object.keys(pages)[0];
              const imageUrl = pages[pageId].thumbnail.source;
              const baseImageUrl = imageUrl.substring(0, imageUrl.lastIndexOf('.png') + 4); // remove url params to get the base image
              const tooltip = document.querySelector('#tooltip');
              tooltip.querySelector('img').src = baseImageUrl;
            })
            .catch(error => {
              console.error('Error fetching image:', error);
              tooltip.querySelector('img').src = "https://ca.slack-edge.com/T0266FRGM-U015ZPLDZKQ-gf3696467c28-512"; // default image
              tooltip.querySelector('img').style.borderRadius = "10px";
            });

            let totalLines = 0;
            for (let i = 0; i < vis.data[index].length; i++) {
              totalLines += vis.data[index][i].count;
            }

            d3.select('#tooltip')
            .attr('data-value',d.id)
            .style('display', 'block')
            .style('left', event.pageX + 10 + 'px')   
            .style('top', event.pageY + 'px')
            .style("fill-opacity", ".7")
            .html(`
            <div style="display: flex; align-items: center;">
                <img src="" style="width: 80px; height: 80px; margin-right: 10px; object-fit: contain;">
                <div style="flex: 1;">
                  <div style="text-align: center"><b>${vis.data[index][0].from}</b></div>
                  <div style="text-align: center">Total: ${totalLines}</div>
                </div>
              </div>
              
            `);
            d3.select(this)
            .transition()
            .duration(150)
            .style("fill-opacity", "1")
          })
        .on("mouseout", function(d) {
          d3.select('#tooltip').style('display', 'none');
          d3.select(this)
          .transition()
          .duration(150)
          .style("fill-opacity", ".7");
        })
        .on('click', (event, d) => {
          d3.select('#tooltip').style('display', 'none')
           vis.refresh("group",vis.data[d.index][0].from,"")
        })

    // Add the links between groups
    vis.chart
      .datum(res)
      .append("g")
      .selectAll("path")
      .data(function(d) { return d; })
      .enter()
      .append("path")
      .attr('class', (function(d) { return "char" + (d.source.index + 1) + " char" + (d.target.index + 1) }))
        .attr('transform', `translate(${vis.width / 2},${vis.height / 2})`)
        .attr("d", d3.ribbon()
          .radius(vis.innerRadius)
        )
        .style("fill", function(d){ return(colors[d.source.index]) }) // colors depend on the source group. Change to target otherwise.
        .style("stroke", "black")
        .style("stroke-width", "0.3px")
        .style("fill-opacity", ".7")
        .on("mouseover", function(d) {
        
          let object = d3.select(this)
          let indexFrom = object._groups[0][0].__data__.source.index
          let indexTo = object._groups[0][0].__data__.target.index
          var formattedName = vis.data[indexFrom][0].from
          var formattedName2 = vis.data[indexTo][0].from

          if (formattedName === 'C. Montgomery Burns') {
            formattedName = "Charles Montgomery Burns";
          } else if (formattedName === 'Grampa Simpson') {
            formattedName = "Abe Simpson II";
          } else if (formattedName === 'Chief Wiggum') {
            formattedName = "Clancy Wiggum";
          } else if (formattedName === 'Waylon Smithers'){
            formattedName = "Waylon_Smithers,_Jr.";
          } else if (formattedName === 'Dr. Julius Hibbert'){
            formattedName = "Julius_Hibbert";
          } else if (formattedName === 'Rev. Timothy Lovejoy'){
            formattedName = "Timothy_Lovejoy";
          } else if (formattedName === 'Sideshow Bob'){
            formattedName = "Robert_Terwilliger";
          } else if (formattedName === 'Mayor Joe Quimby'){
            formattedName = "Joe_Quimby";
          } else if (formattedName === 'Martin Prince'){
            formattedName = "Martin_Prince,_Jr.";
          } else if (formattedName === 'HERB'){
            formattedName = "Herbert_Powell";
          } else if (formattedName === 'Miss Hoover'){
            formattedName = "Elizabeth_Hoover";
          } else if (formattedName === 'Dr. Nick Riviera'){
            formattedName = "Nick_Riviera";
          }

          if (formattedName2 === 'C. Montgomery Burns') {
            formattedName2 = "Charles Montgomery Burns";
          } else if (formattedName2 === 'Grampa Simpson') {
            formattedName2 = "Abe Simpson II";
          } else if (formattedName2 === 'Chief Wiggum') {
            formattedName2 = "Clancy Wiggum";
          } else if (formattedName2 === 'Waylon Smithers'){
            formattedName2 = "Waylon_Smithers,_Jr.";
          } else if (formattedName2 === 'Dr. Julius Hibbert'){
            formattedName2 = "Julius_Hibbert";
          } else if (formattedName2 === 'Rev. Timothy Lovejoy'){
            formattedName2 = "Timothy_Lovejoy";
          } else if (formattedName2 === 'Sideshow Bob'){
            formattedName2 = "Robert_Terwilliger";
          } else if (formattedName2 === 'Mayor Joe Quimby'){
            formattedName2 = "Joe_Quimby";
          } else if (formattedName2 === 'Martin Prince'){
            formattedName2 = "Martin_Prince,_Jr.";
          } else if (formattedName2 === 'HERB'){
            formattedName2 = "Herbert_Powell";
          } else if (formattedName2 === 'Miss Hoover'){
            formattedName2 = "Elizabeth_Hoover";
          } else if (formattedName2 === 'Dr. Nick Riviera'){
            formattedName2 = "Nick_Riviera";
          }

          // Make an API call to get the image URL
          var apiUrl = `https://simpsons.fandom.com/api.php?action=query&titles=${formattedName}&prop=pageimages&format=json&origin=*`;
          fetch(apiUrl, { mode: 'cors', cache: 'force-cache' })
            .then(response => response.json())
            .then(data => {
              const pages = data.query.pages;
              const pageId = Object.keys(pages)[0];
              const imageUrl = pages[pageId].thumbnail.source;
              const baseImageUrl = imageUrl.substring(0, imageUrl.lastIndexOf('.png') + 4); // remove url params to get the base image
              const tooltip = document.querySelector('#tooltip');
              tooltip.querySelector('.img1').src = baseImageUrl;
            })
            .catch(error => {
              console.error('Error fetching image:', error);
              tooltip.querySelector('.img1').src = "https://ca.slack-edge.com/T0266FRGM-U015ZPLDZKQ-gf3696467c28-512"; // default image
              tooltip.querySelector('img').style.borderRadius = "10px";
            });

          // Make an API call to get the image URL
          apiUrl = `https://simpsons.fandom.com/api.php?action=query&titles=${formattedName2}&prop=pageimages&format=json&origin=*`;
          fetch(apiUrl, { mode: 'cors', cache: 'force-cache' })
            .then(response => response.json())
            .then(data => {
              const pages = data.query.pages;
              const pageId = Object.keys(pages)[0];
              const imageUrl = pages[pageId].thumbnail.source;
              const baseImageUrl = imageUrl.substring(0, imageUrl.lastIndexOf('.png') + 4); // remove url params to get the base image
              const tooltip = document.querySelector('#tooltip');
              // set img1 to the first character
              tooltip.querySelector('.img2').src = baseImageUrl;
            })
            .catch(error => {
              console.error('Error fetching image:', error);
              tooltip.querySelector('.img2').src = "https://ca.slack-edge.com/T0266FRGM-U015ZPLDZKQ-gf3696467c28-512"; // default image
            });

          let linesFrom = object._groups[0][0].__data__.source.value
          let linesTo = object._groups[0][0].__data__.target.value

          d3.select('#tooltip')
          .attr('data-value',d.id)
          .style('display', 'block')
          .style('left', event.pageX + 10 + 'px')   
          .style('top', event.pageY + 'px')
          .html(`
          <div style="display: flex; align-items: center;">
              <img class="img1" src="" style="width: 80px; height: 80px; margin-right: 10px; object-fit: contain;">
              <div style="flex: 1;">
                <div style="text-align: center"><b>${vis.data[indexFrom][0].from} & ${vis.data[indexTo][0].from}</b></div>
            <div style="text-align: center">${vis.data[indexFrom][0].from}: ${linesFrom} lines </div>
            <div style="text-align: center">${vis.data[indexTo][0].from}: ${linesTo} lines </div>
              </div>
              <img class="img2" src="" style="width: 80px; height: 80px; margin-right: 10px; object-fit: contain;">
            </div>
          `);
          d3.select(this)
          .transition()
          .duration(150)
          .style("fill-opacity", "1");
        })
        .on("mouseout", function(d) {
          d3.select('#tooltip').style('display', 'none');
          d3.select(this)
          .transition()
          .duration(150)
          .style("fill-opacity", ".7");
        })
        .on('click', (event, d) => {
          d3.select('#tooltip').style('display', 'none')
           vis.refresh("path",vis.data[d.source.index][0].from,vis.data[d.target.index][0].from)
        })
      }
    
  }

}