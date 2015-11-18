chrome.alarms.onAlarm.addListener(function(alarm) {
  // confirm("Goodbye~ The time is up:)");
var x;
    if (confirm("Goodbye~ The time is up:)") == true) {
        x = "You pressed OK!";
        chrome.alarms.clear("myAlarm");
    } else {
        x = "You pressed Cancel!";
        // chrome.alarms.clear("myAlarm");
    }
// document.getElementById("demo").innerHTML = x;

});