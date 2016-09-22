"use strict";

import * as d3 from "d3";

var D3Graph = {};

D3Graph.clear = function() {

  var canvas = document.getElementsByTagName("canvas")[0];
  var context = canvas.getContext("2d");

  context.setTransform(1, 0, 0, 1, 0, 0);
  context.clearRect(0, 0, canvas.width, canvas.height);
}

D3Graph.create = function(data) {

  var parseTime = d3.timeParse("%Y-%m-%d");
  var colors = d3.scaleOrdinal(d3.schemeCategory10);

  var currStockData = data[data.length - 1].dataset.data.map((day) => {
    return {
      date: parseTime(day[0]),
      price: day[4]
    }
  });

  currStockData.sort((a, b) => a.date - b.date );

  var margin = { top: 15, right: 15, bottom: 20, left: 30 };

  var canvas = document.getElementsByTagName("canvas")[0];
  var context = canvas.getContext("2d");

  var width = canvas.width - margin.right - margin.left;
  var height = canvas.height - margin.top - margin.bottom;

  var xScale = d3.scaleTime().range([0, width]);
  var yScale = d3.scaleLinear().range([height, 0]);

  context.translate(margin.left, margin.top);

  var allStockData = data.map((stock) => {
    return stock.dataset.data.map((day) => {
      return {
        date: parseTime(day[0]),
        price: day[4]
      };
    });
  });

  var flattenedArray = [].concat.apply([], allStockData);

  xScale.domain(d3.extent(flattenedArray, (d) => d.date ));
  yScale.domain(d3.extent(flattenedArray, (d) => d.price ));

  var tickCount = 10;
  var tickSize = 5;

  drawXAxis();
  drawYAxis();

  drawStockData(allStockData);

  canvas.addEventListener("mousemove", (e) => {
    var location = getMouseLocation(e);

    if (location.xPos > margin.left && location.xPos < width + margin.left) {

      context.clearRect(0, 0, canvas.width, canvas.height - margin.bottom - margin.top);
      drawStockData(allStockData);
      drawVerticalLine(location);
      showStockPrice(location);
    }
  });

  function getMouseLocation(e) {
    var rectangle = canvas.getBoundingClientRect();
    return {
      xPos: e.clientX - rectangle.left,
      yPos: e.clientY - rectangle.top
    };
  }

  var bisectDate = d3.bisector((d, x) => d.date - x ).left;
  var monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  var currencyFormat = d3.format(",.2f");

  function showStockPrice(location) {

    var approxDate = xScale.invert(location.xPos - margin.left);
    var dateIndex = bisectDate(currStockData, approxDate);

    var stockDate = currStockData[dateIndex].date;
    var dateMessage = `${ monthNames[stockDate.getMonth()] } ${ stockDate.getDate() }`;

    context.font = "20pt Calibri";
    context.textAlign="start";
    context.fillText(dateMessage, margin.left, margin.top);

    var stockPrice = currStockData[dateIndex].price;
    var stockMessage = `$${ currencyFormat(stockPrice) }`

    context.font = "20pt Calibri";
    context.textAlign="start";
    context.fillText(stockMessage, margin.left + 100, margin.top);
  }

  function drawVerticalLine(location) {

    context.beginPath();
    context.moveTo(location.xPos - margin.left, 0);
    context.lineTo(location.xPos - margin.left, height);
    context.strokeStyle = "#bdbdbd";
    context.lineWidth = 1;
    context.setLineDash([2, 5]);
    context.stroke();
  }

  function drawStockData(data) {

    data.forEach((stock, index) => {

      var lineData = d3.line()
        .x((d) => xScale(d.date))
        .y((d) => yScale(d.price))
        .context(context);

      context.beginPath();
      lineData(stock);
      context.strokeStyle = colors(index);
      context.lineWidth = 2;
      context.setLineDash([]);
      context.stroke();
    });
  }

  function drawXAxis() {
    var ticks = xScale.ticks(tickCount);
    var tickFormat = xScale.tickFormat();

    context.beginPath();
    ticks.forEach((t) => {
      context.moveTo(xScale(t), height);
      context.lineTo(xScale(t), height + tickSize);
    });
    context.font = "10pt Calibri";
    context.strokeStyle = "#616161";
    context.stroke();

    context.textAlign = "center";
    context.textBaseline = "top";
    context.fillStyle = "#616161"
    ticks.forEach((t) => {
      context.fillText(tickFormat(t).substr(0, 3), xScale(t), height + tickSize);
    });
  }

  function drawYAxis() {
    var tickPadding = 5;
    var ticks = yScale.ticks(tickCount);
    var tickFormat = yScale.tickFormat(tickCount);

    context.beginPath();
    ticks.forEach((t) => {
      context.moveTo(0, yScale(t));
      context.lineTo(-6, yScale(t));
    });
    context.font = "10pt Calibri";
    context.strokeStyle = "#616161";
    context.stroke();

    context.textAlign = "right";
    context.textBaseline = "middle";
    context.fillStyle = "#616161"
    ticks.forEach(function(d) {
      context.fillText(tickFormat(d), -tickSize - tickPadding, yScale(d));
    });
  }
}

export default D3Graph;
