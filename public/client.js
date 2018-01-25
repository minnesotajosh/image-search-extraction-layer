// client-side js
// run by the browser each time your view template is loaded

// by default, you've got jQuery,
// add other scripts at the bottom of index.html
$(document).ready(function() {
  $.get('/api/latest', function(data) {
    $('.output').html(JSON.stringify(data, undefined, 2));
    console.log(data);
  });
});