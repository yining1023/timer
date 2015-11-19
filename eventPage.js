chrome.alarms.onAlarm.addListener(function(alarm) {
  // var message = document.getElementById('message').value;
  var x;
    if (confirm("Goodbye Netflix~! Let's do some amazing work:)!") == true) {
        x = "You pressed OK!";
        chrome.alarms.clear("myAlarm");
    } else {
        x = "You pressed Cancel!";
        chrome.alarms.clear("myAlarm");
    }
});