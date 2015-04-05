function forEachViewport(callback) {
    var elements = $('.viewport');
    $.each(elements, function(index, value) {
        var element = value;
        try {
            callback(element);
        }
        catch(e) {

        }
    });
}