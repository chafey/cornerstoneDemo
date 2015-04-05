loadTemplate("templates/help.html", function(element) {
    $('body').append(element);
    $("#help").click(function() {
        $("#helpModal").modal();
    });
});
