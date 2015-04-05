function loadTemplate(url, callback) {
    $.get(url, function(data) {
        var parsed = $.parseHTML(data);
        $.each(parsed, function(index, ele) {
            if(ele.nodeName === 'DIV')
            {
                var element = $(ele);
                callback(element);
            }
        });
    });

}