//change the progress bar
var netflix = false;
var barTimerSt = false

var i = 100;
// var time = 15;

// Extract the domain from the url
// e.g. http://google.com/ -> google.com
function extractDomain(url) {
  var re = /:\/\/(www\.)?(.+?)\//;
  return url.match(re)[2];
}

function getCurrentTabUrl(callback) {
  var queryInfo = {
    active: true,
    currentWindow: true
  };
  chrome.tabs.query(queryInfo, function(tabs) {
    var tab = tabs[0];
    var url = tab.url;
    var domain = extractDomain(url);
    document.getElementById('cureent_tab').innerHTML += domain;
      if(url.indexOf("netflix") > -1){
        netflix = true;
      }
      else{
        netflix = false;
      }
   });
}

var alarmClock = {
        onHandler : function(e) {
          console.log("netflix: " + netflix);
          // if(netflix){
            // chrome.alarms.create("myAlarm", {delayInMinutes: 0.25, periodInMinutes: 0.25} );}
                    // window.close();
                    // console.log("alarm is on now!");
        },

        offHandler : function(e) {
            chrome.alarms.clear("myAlarm");
                    window.close();
        }
};

// var counterBack = setInterval(function(){
//   console.log(netflix);
//   if(netflix){
//     i-=100/time;
//     if(i>0){
//      $('.progress-bar').css('width', i+'%');
//      } else if (i===0){
//       clearTimeout(counterBack);
//     } 
//  }
// }, 1000);

var bg = chrome.extension.getBackgroundPage();

// Load the Visualization API and the piechart package.
// google.load('visualization', '1.0', {'packages':['corechart', 'table']});
// google.load('visualization', '1.1', {'packages':["bar"]});
google.load("visualization", "1", {packages:["corechart"]});
// google.setOnLoadCallback(drawBasic);
// Set a callback to run when the Google Visualization API is loaded.
if (top === self) {
  google.setOnLoadCallback(function() { show(bg.TYPE.today); });
} else {
  // For screenshot: if in iframe, load the most recently viewed mode
  google.setOnLoadCallback(function () {
    if (bg.mode === bg.TYPE.today) {
      show(bg.TYPE.today);
    } else if (bg.mode === bg.TYPE.average) {
      show(bg.TYPE.average);
    } else if (bg.mode === bg.TYPE.all) {
      show(bg.TYPE.all);
    } else {
      console.error("No such type: " + bg.mode);
    }
  });
}

// Show options in a new tab
function showOptions() {
  chrome.tabs.create({
    url: 'options.html'
  });
}

// Converts duration to String
function timeString(numSeconds) {
  if (numSeconds === 0) {
    return "0 seconds";
  }
  var remainder = numSeconds;
  var timeStr = "";
  var timeTerms = {
    hour: 3600,
    minute: 60,
    second: 1
  };
  // Don't show seconds if time is more than one hour
  if (remainder >= timeTerms.hour) {
    remainder = remainder - (remainder % timeTerms.minute);
    delete timeTerms.second;
  }
  // Construct the time string
  for (var term in timeTerms) {
    var divisor = timeTerms[term];
    if (remainder >= divisor) {
      var numUnits = Math.floor(remainder / divisor);
      timeStr += numUnits + " " + term;
      // Make it plural
      if (numUnits > 1) {
        timeStr += "s";
      }
      remainder = remainder % divisor;
      if (remainder) {
        timeStr += " and ";
      }
    }
  }
  return timeStr;
}

// Show the data for the time period indicated by addon
function displayData(type) {
  // Get the domain data
  var domains = JSON.parse(localStorage["domains"]);
  var chart_data = [];
  for (var domain in domains) {
    var domain_data = JSON.parse(localStorage[domain]);
    var numSeconds = 0;
    if (type === bg.TYPE.today) {
      numSeconds = domain_data.today;
    } else if (type === bg.TYPE.average) {
      numSeconds = Math.floor(domain_data.all / parseInt(localStorage["num_days"], 10));
    } else if (type === bg.TYPE.all) {
      numSeconds = domain_data.all;
    } else {
      console.error("No such type: " + type);
    }
    if (numSeconds > 0) {
      chart_data.push([domain, {
        v: numSeconds,
        f: timeString(numSeconds),
        p: {
          style: "color: red; text-align: left; white-space: normal;"
        }
      }]);
    }
  }

  // Display help message if no data
  if (chart_data.length === 0) {
    document.getElementById("nodata").style.display = "inline";
  } else {
    document.getElementById("nodata").style.display = "none";
  }

  // Sort data by descending duration
  chart_data.sort(function (a, b) {
    return b[1].v - a[1].v;
  });

  // Limit chart data
  var limited_data = [];
  var total_data = [];
  var chart_limit;
  // For screenshot: if in iframe, image should always have 9 items
  if (top == self) {
    chart_limit = parseInt(localStorage["chart_limit"], 10);
  } else {
    chart_limit = 9;
  }
  for (var i = 0; i < chart_limit && i < chart_data.length; i++) {
    limited_data.push(chart_data[i]);
  }
  var sum = 0;
  for (var i = chart_limit; i < chart_data.length; i++) {
    sum += chart_data[i][1].v;
  }
  // Add time in "other" category for total and average
  var other = JSON.parse(localStorage["other"]);
  if (type === bg.TYPE.average) {
    sum += Math.floor(other.all / parseInt(localStorage["num_days"], 10));
  } else if (type === bg.TYPE.all) {
    sum += other.all;
  }
  if (sum > 0) {
    limited_data.push(["Other", {
      v: sum,
      f: timeString(sum),
      p: {
        style: "text-align: left; white-space: normal;"
      }
    }]);
  }

  // Draw the chart
  // drawChart(limited_data);
  drawBasic(limited_data);
  // Add total time
  var total = JSON.parse(localStorage["total"]);
  var numSeconds = 0;
  if (type === bg.TYPE.today) {
    numSeconds = total.today;
  } else if (type === bg.TYPE.average) {
    numSeconds = Math.floor(total.all / parseInt(localStorage["num_days"], 10));
  } else if (type === bg.TYPE.all) {
    numSeconds = total.all;
  } else {
    console.error("No such type: " + type);
  }

  total_data.push([{
    // v: "Total",
  //   p: {
  //     style: "font-weight: bold;"
  //   }
  // }, {
    v: numSeconds,
    f: timeString(numSeconds),
    p: {
      style: "text-align: left; white-space: normal; font-weight: bold;"
    }
  }]);


  limited_data.push([{
    v: "Total",
    p: {
      style: "font-weight: bold;"
    }
  }, {
    v: numSeconds,
    f: timeString(numSeconds),
    p: {
      style: "text-align: left; white-space: normal; font-weight: bold;"
    }
  }]);

  // Draw the table
  drawTable(total_data, type);
}

function updateNav(type) {
  document.getElementById('today').className = '';
  document.getElementById('average').className = '';
  document.getElementById('all').className = '';
  document.getElementById(type).className = 'active';
}

function show(mode) {
  bg.mode = mode;
  displayData(mode);
  updateNav(mode);
}

// Callback that creates and populates a data table,
// instantiates the pie chart, passes in the data and
// draws it.
function drawChart(chart_data) {
// Create the data table.
  console.log(chart_data);
  var data = new google.visualization.DataTable();
  data.addColumn('string', 'Domain');
  data.addColumn('number', 'Time');
  data.addRows(chart_data);
  console.log(data);
  // Set chart options
  var options = {
    tooltip: {
      text: 'percentage'
    },
    chartArea: {
      width: 400,
      height: 180
    }
  };

  // Instantiate and draw our chart, passing in some options.
  var chart = new google.visualization.PieChart(document.getElementById('chart_div'));
  chart.draw(data, options);
}

function drawBasic(chart_data){
  // console.log(chart_data);
  var bardata = new google.visualization.DataTable();
  bardata.addColumn('string', 'Domain');
  bardata.addColumn('number', 'Time');
  // bardata.addColumn('string', 'role:\'style\'');
  bardata.addRows(chart_data);
  // console.log(bardata);

  var view = new google.visualization.DataView(bardata);
      view.setColumns([0, 1,
                       { calc: "stringify",
                         sourceColumn: 1,
                         type: "string",
                         role: "annotation" }
                       ]);
  // console.log(view);

  var options = {
    title: 'Time you spent on the most visited Websites',
    width: 700,
    legend: { position: 'none' },
        chartArea: {width: '50%'},
        bars: 'horizontal',
        axes: {
            x: {
              0: { side: 'top', label: 'Time'} // Top x-axis.
            }
          },
          bar: { groupWidth: "95%" }
      };

  // Instantiate and draw our chart, passing in some options.
  var barchart = new google.visualization.BarChart(document.getElementById('barchart_div'));
  barchart.draw(view, options);

}

function drawTable(table_data, type) {
  // var data = new google.visualization.DataTable();
  // data.addColumn('string', 'Domain');
  var timeDesc;
  if (type === bg.TYPE.today) {
    timeDesc = "Today";
  } else if (type === bg.TYPE.average) {
    timeDesc = "Daily Average";
  } else if (type === bg.TYPE.all) {
    timeDesc = "Over " + localStorage["num_days"] + " Days";
  } else {
    console.error("No such type: " + type);
  }

  // data.addColumn('number', "Total Time Spent (" + timeDesc + "): ");
  // data.addColumn('string', table_data[0][0].f);

  document.getElementById('total_time').innerHTML = "Total Time Spent (" + timeDesc + "): ";
  document.getElementById('total_time').innerHTML += table_data[0][0].f;

  // var options = {
  //   allowHtml: true,
  //   sort: 'disable'
  // };
  // var table = new google.visualization.Table(document.getElementById('table_div'));
  // table.draw(data, options);
}

function share() {
  chrome.tabs.create({
    url: 'share.html'
  });
}

  document.addEventListener('DOMContentLoaded', function () {
    getCurrentTabUrl(function(url) {
      console.log("url: "+url);
    });
    // document.getElementById('alarmOff').addEventListener('click', alarmClock.offHandler);
    document.querySelector('#today').addEventListener('click', function() { show(bg.TYPE.today); });
    document.querySelector('#average').addEventListener('click', function() { show(bg.TYPE.average); });
    document.querySelector('#all').addEventListener('click', function() { show(bg.TYPE.all); });
    document.querySelector('#options').addEventListener('click', showOptions);
    document.querySelector('#start').addEventListener('click', countdownTimer);
    document.querySelector('#start').addEventListener('click', alarm);

  // document.querySelector('#share').addEventListener('click', share);
});
    /* Function to display a Countdown timer with starting time from a form */
    // sets variables for minutes and seconds
var ctmnts = 0;
var ctsecs = 0;
var startchr = 0;// used to control when to read data from form

function alarm(){
  var time = ctmnts+ctsecs/60;
  console.log("created an alarm");
  chrome.alarms.create("myAlarm", {delayInMinutes: time, periodInMinutes: time});
}

function countdownTimer() {
  // http://coursesweb.net/javascript/
  // if $startchr is 0, and form fields exists, gets data for minutes and seconds, and sets $startchr to 1
  if(startchr == 0 && document.getElementById('mns') && document.getElementById('scs')) {
    // makes sure the script uses integer numbers
    ctmnts = parseInt(document.getElementById('mns').value) + 0;
    ctsecs = parseInt(document.getElementById('scs').value) * 1;

    // if data not a number, sets the value to 0
    if(isNaN(ctmnts)) ctmnts = 0;
    if(isNaN(ctsecs)) ctsecs = 0;

    // rewrite data in form fields to be sure that the fields for minutes and seconds contain integer number
    document.getElementById('mns').value = ctmnts;
    document.getElementById('scs').value = ctsecs;
    startchr = 1;
    document.getElementById('start').setAttribute("disabled", "disabled");     // disable the button
  }

  // if minutes and seconds are 0, sets $startchr to 0, and return false
  if(ctmnts==0 && ctsecs==0) {
    startchr = 0;
    document.getElementById('start').removeAttribute('disabled');     // remove "disabled" to enable the button

    /* HERE YOU CAN ADD TO EXECUTE A JavaScript FUNCTION WHEN COUNTDOWN TIMER REACH TO 0 */
    return false;
  }
  else {
    // decrease seconds, and decrease minutes if seconds reach to 0
    ctsecs--;
    if(ctsecs < 0) {
      if(ctmnts > 0) {
        ctsecs = 59;
        ctmnts--;
      }
      else {
        ctsecs = 0;
        ctmnts = 0;

      }
    }
  }

  // display the time in page, and auto-calls this function after 1 seccond
  document.getElementById('showmns').innerHTML = ctmnts;
  document.getElementById('showscs').innerHTML = ctsecs;
  setTimeout('countdownTimer()', 1000);
}