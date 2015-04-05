

// Load JSON study information for each study
function loadStudy(studyViewer, studyId) {

    // Get the JSON data for the selected studyId
    $.getJSON('studies/' + studyId, function(data) {

        var imageViewer = new ImageViewer(studyViewer);

        // setup the tool buttons
        setupButtons(studyViewer);


        // Load the first series into the viewport (?)
        //var stacks = [];
        //var currentStackIndex = 0;
        var seriesIndex = 0;

        // Create a stack object for each series
        data.seriesList.forEach(function(series) {
            var stack = {
                seriesDescription: series.seriesDescription,
                stackId: series.seriesNumber,
                imageIds: [],
                seriesIndex: seriesIndex,
                currentImageIdIndex: 0,
                frameRate: series.frameRate
            };


            // Populate imageIds array with the imageIds from each series
            // For series with frame information, get the image url's by requesting each frame
            if (series.numberOfFrames !== undefined) {
                var numberOfFrames = series.numberOfFrames;
                for (var i = 0; i < numberOfFrames; i++) {
                    var imageId = series.instanceList[0].imageId + "?frame=" + i;
                    if (imageId.substr(0, 4) !== 'http') {
                        imageId = "dicomweb://cornerstonetech.org/images/ClearCanvas/" + imageId;
                    }
                    stack.imageIds.push(imageId);
                }
                // Otherwise, get each instance url
            } else {
                series.instanceList.forEach(function(image) {
                    var imageId = image.imageId;

                    if (image.imageId.substr(0, 4) !== 'http') {
                        imageId = "dicomweb://cornerstonetech.org/images/ClearCanvas/" + image.imageId;
                    }
                    stack.imageIds.push(imageId);
                });
            }
            // Move to next series
            seriesIndex++;

            // Add the series stack to the stacks array
            imageViewer.stacks.push(stack);
        });

        // Resize the parent div of the viewport to fit the screen
        var imageViewerElement = $(studyViewer).find('.imageViewer')[0];
        var viewportWrapper = $(imageViewerElement).find('.viewportWrapper')[0];
        var parentDiv = $(studyViewer).find('.viewer')[0];

        viewportWrapper.style.width = (parentDiv.style.width - 10) + "px";
        viewportWrapper.style.height = (window.innerHeight - 150) + "px";

        var studyRow = $(studyViewer).find('.studyRow')[0];
        var width = $(studyRow).width();

        $(parentDiv).width(width - 170);
        viewportWrapper.style.width = (parentDiv.style.width - 10) + "px";
        viewportWrapper.style.height = (window.innerHeight - 150) + "px";

        // Get the viewport elements
        var element = $(studyViewer).find('.viewport')[0];

        // Get first imageID on the current stack
        var imageId = imageViewer.stacks[0].imageIds[0];

        // Image enable the dicomImage element
        cornerstone.enable(element);

        // Have cornerstone load and cache the image
        cornerstone.loadAndCacheImage(imageId).then(function(image) {

            setupViewport(element, imageViewer.stacks[0], image);

            setupViewportOverlays(element, data);


            // Get series list from the series thumbnails (?)
            var seriesList = $(studyViewer).find('.thumbnails')[0];

            imageViewer.stacks.forEach(function(stack, stackIndex) {

                // Create series thumbnail item
                var seriesEntry = '<a class="list-group-item" + ' +
                    'oncontextmenu="return false"' +
                    'unselectable="on"' +
                    'onselectstart="return false;"' +
                    'onmousedown="return false;">' +
                    '<div class="csthumbnail"' +
                    'oncontextmenu="return false"' +
                    'unselectable="on"' +
                    'onselectstart="return false;"' +
                    'onmousedown="return false;"></div>' +
                    "<div class='text-center small'>" + stack.seriesDescription + '</div></a>';

                // Add to series list
                var seriesElement = $(seriesEntry).appendTo(seriesList);

                // Find thumbnail
                var thumbnail = $(seriesElement).find('div')[0];

                // Enable cornerstone on the thumbnail
                cornerstone.enable(thumbnail);

                // Have cornerstone load the thumbnail image
                cornerstone.loadAndCacheImage(imageViewer.stacks[stack.seriesIndex].imageIds[0]).then(function(image) {
                    // Make the first thumbnail active
                    if (stack.seriesIndex === 0) {
                        $(seriesElement).addClass('active');
                    }
                    // Display the image
                    cornerstone.displayImage(thumbnail, image);
                });

                // Handle thumbnail click
                $(seriesElement).on('click touchstart', function() {
                        //currentStackIndex = stack.seriesIndex;
                    displayThumbnail(seriesList, seriesElement, element, stack);
                });
            });


            // Resize study viewer
            function resizeStudyViewer() {
                var studyRow = $(studyViewer).find('.studyRow')[0];
                var height = $(studyRow).height();
                var width = $(studyRow).width();
                $(seriesList).height(height - 40);
                $(parentDiv).width(width - 170);
                viewportWrapper.style.width = (parentDiv.style.width - 10) + "px";
                viewportWrapper.style.height = (window.innerHeight - 150) + "px";
                cornerstone.resize(element, true);
            }


            // Call resize viewer on window resize
            $(window).resize(function() {
                resizeStudyViewer();
            });

            resizeStudyViewer();

        });

    });
}
