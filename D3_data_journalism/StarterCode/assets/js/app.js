//set the svg size, "canvas size"
var svgWidth = 800;
var svgHeight = 500;

//set margin
var margin = {
  top: 20,
  right: 40,
  bottom: 80,
  left: 100
};

//set variables for width and height. 
var width = svgWidth - margin.left - margin.right;
var height = svgHeight - margin.top - margin.bottom;

//create an svg wrapper, append an svg group that will hold our chart
// and shift the latter by the left and top margins

var svg = d3
  .select("#scatter")
  .append("svg")
  .attr("width", svgWidth)
  .attr("height", svgHeight);

  // Append an SVG group
var chartGroup = svg
		.append("g")
  		.attr("transform", `translate(${margin.left}, ${margin.top})`);


// Initial Params
var chosenXAxis="poverty";
var chosenYAxis="healthcare";


// function used for updating x-scale var upon click on axis label
function xScale(censusData, chosenXAxis) {
  // create scales
  var xLinearScale = d3.scaleLinear()
    .domain([d3.min(censusData, d => d[chosenXAxis]) * 0.8,
      d3.max(censusData, d => d[chosenXAxis]) * 1.2
    ])
    .range([0, width]);

  return xLinearScale;

}

// function used for updating y-scale var upon click on axis label
function yScale(censusData, chosenYAxis) {
  // create scales
  var yLinearScale = d3.scaleLinear()
    .domain([d3.min(censusData, d => d[chosenYAxis]) * 0.8,
      d3.max(censusData, d => d[chosenYAxis]) * 1.2
    ])
    .range([0, width]);

  return yLinearScale;

}

// function used for updating xAxis var upon click on axis label
function renderAxes(newXScale, xAxis) {
  var bottomAxis = d3.axisBottom(newXScale);

  xAxis.transition()
    .duration(1000)
    .call(bottomAxis);

  return xAxis;
}

// function used for updating circles group with a transition to
// new circles
function renderCircles(circlesGroup, newXScale, chosenXAxis) {

  circlesGroup.transition()
    .duration(1000)
    .attr("cx", d => newXScale(d[chosenXAxis]));

  return circlesGroup;
}

function renderText(stateAbbr, newXScale, chosenXAxis) {
  stateAbbr.transition()
    .duration(1000)
    .attr("x", d => newXScale(d[chosenXAxis]));

  return stateAbbr;
}


// // function used for updating circles group with new tooltip
function updateToolTip(chosenXAxis, circlesGroup) {

  var label;

  if (chosenXAxis === "poverty") {
    label = "% in Poverty:";
  }
  else if (chosenXAxis === "age") {
    label = "Median Age:";
  } 
  else {
  	label = "Median Income:";
  }

  var toolTip = d3.tip()
    .attr("class", "tooltip")
    .offset([40, 80])
    .html(function(d) {
      return (`${d.state}<br>${label} ${d[chosenXAxis]}`);
    });

  circlesGroup.call(toolTip);

  circlesGroup.on("mouseover", function(data) {
    toolTip.show(data,this);
  })
    // onmouseout event
    .on("mouseout", function(data, index) {
      toolTip.hide(data);
    });

  return circlesGroup;
}

// // Retrieve data from the CSV file and execute everything below
d3.csv("assets/data/data.csv").then(function(censusData, err) {
  if (err) throw err;

//   // parse data
  censusData.forEach(function(data) {
    data.poverty = +data.poverty;
    data.age = +data.age;
    data.income = +data.income;
    data.healthcare = +data.healthcare;
    data.obesity = +data.obesity;
    data.smokes = +data.smokes;
  });

//   // xLinearScale function above csv import
  var xLinearScale = xScale(censusData, chosenXAxis);

//   // Create y scale function
  var yLinearScale = d3.scaleLinear()
    .domain([0, d3.max(censusData, d => d.healthcare)])
    .range([height, 0]);

//   // Create initial axis functions
  var bottomAxis = d3.axisBottom(xLinearScale);
  var leftAxis = d3.axisLeft(yLinearScale);

//   // append x axis
  var xAxis = chartGroup.append("g")
    .classed("x-axis", true)
    .attr("transform", `translate(0, ${height})`)
    .call(bottomAxis);

//   // append y axis
  chartGroup.append("g")
    .call(leftAxis);

//   // append initial circles
  var circlesGroup = chartGroup.selectAll("circle")
    .data(censusData)
    .enter()
    .append("circle")
    .attr("cx", d => xLinearScale(d[chosenXAxis]))
    .attr("cy", d => yLinearScale(d.healthcare))
    .attr("r", 20)
    .attr("fill", "lime")
    .attr("opacity", ".5");

  //variable to append state abbr to circles  
  var stateAbbr=chartGroup.selectAll(null)
	  			.data(censusData)
	  			.enter()
	  			.append('text');

	  		stateAbbr
				.attr('x', function (d){
					return xLinearScale(d[chosenXAxis])
				})
				.attr('y', function (d){
					return yLinearScale(d.healthcare)
				})
				.text(function (d){
					return d.abbr;
				})
				.attr('font-size','10px')


  // Create group for two x-axis labels
  var labelsGroup = chartGroup.append("g")
    .attr("transform", `translate(${width / 2}, ${height + 20})`);

  var povertyLabel = labelsGroup.append("text")
    .attr("x", 0)
    .attr("y", 20)
    .attr("value", "poverty") // value to grab for event listener
    .classed("active", true)
    .text("% in Poverty");

  var ageLabel = labelsGroup.append("text")
    .attr("x", 0)
    .attr("y", 40)
    .attr("value", "age") // value to grab for event listener
    .classed("inactive", true)
    .text("Median Age");

  var incomeLabel = labelsGroup.append("text")
    .attr("x", 0)
    .attr("y", 60)
    .attr("value", "income") // value to grab for event listener
    .classed("inactive", true)
    .text("Median Income");


  // append y axis
  chartGroup.append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", 0 - margin.left)
    .attr("x", 0 - (height / 1.8))
    .attr("dy", "1em")
    .classed("axis-text", true)
    .text("Uncovered Healthcare %");

//   // updateToolTip function above csv import
  var circlesGroup = updateToolTip(chosenXAxis, circlesGroup);

//   // x axis labels event listener
  labelsGroup.selectAll("text")
    .on("click", function() {
      // get value of selection
      var value = d3.select(this).attr("value");
      if (value !== chosenXAxis) {

        // replaces chosenXAxis with value
        chosenXAxis = value;

        // console.log(chosenXAxis)

        // functions here found above csv import
        // updates x scale for new data
        xLinearScale = xScale(censusData, chosenXAxis);

        // updates x axis with transition
        xAxis = renderAxes(xLinearScale, xAxis);

        // updates circles with new x values
        circlesGroup = renderCircles(circlesGroup, xLinearScale, chosenXAxis);

        //state abbr
        stateAbbr=renderText(stateAbbr,xLinearScale, chosenXAxis);

        // updates tooltips with new info
        circlesGroup = updateToolTip(stateAbbr, circlesGroup);


        // changes classes to change bold text
        if (chosenXAxis === "poverty") {
          povertyLabel
            .classed("active", true)
            .classed("inactive", false);
          ageLabel
            .classed("active", false)
            .classed("inactive", true);
          incomeLabel
            .classed("active", false)
            .classed("inactive", true);
        }
        else if (chosenXAxis === "age"){
          povertyLabel
            .classed("active", false)
            .classed("inactive", true);
          ageLabel
            .classed("active", true)
            .classed("inactive", false);
          incomeLabel
            .classed("active", false)
            .classed("inactive", true);
          console.log(chosenXAxis)
        }
        else {
          povertyLabel
            .classed("active", false)
            .classed("inactive", true);
          ageLabel
            .classed("active", false)
            .classed("inactive", true);
          incomeLabel
            .classed("active", true)
            .classed("inactive", false);
        }
      }
    });
}).catch(function(error) {
  console.log(error);
});



// ** Notes from study session **
// function yScaleBuilder(some_data){
// 	var yScaleBuilt=d3.scaleLinear()
// 				 .domain(d3.extent(some_data))
// 				 .range([0,height])
// 		return yScaleBuilt
// }

//read in csv file
// d3.csv('assets/data/data.csv').then(function(data){
// 	//create scale for age
// 	var xScale=d3.scaleLinear()
// 			 .domain(d3.extent(data.map(state=>state['age'])))//d3.extent returns [min,max]
// 			 .range([0, width])

// 	//create y scale for obesity
// 	var yScale=yScaleBuilder(data.map(state=>state['obesity']))

//   chartGroup.selectAll('circle')
// 			.data(data)
// 			.enter()
// 			.append('circle')
// 			.attr('cx', datum=>xScale(datum['age']))
// 			.attr('cy',datum=>yScale(datum['obesity']))
// 			.attr('r',20)
// 			.attr("fill","lime")
// 			.attr("opacity",".5")


// 	console.log(data)
// })