

// Load JSON study information for each study
function loadStudy(studyViewer, studyId) {

    // Get the JSON data for the selected studyId
    $.getJSON('studies/' + studyId, function(data) {

        // Load the first series into the viewport (?)
        $('#wadoURL').val();

        var stacks = [];
        var currentStackIndex = 0;
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
            stacks.push(stack);
        });

        // Resize the parent div of the viewport to fit the screen
        var imageViewer = $(studyViewer).find('.imageViewer')[0];
        var viewportWrapper = $(imageViewer).find('.viewportWrapper')[0];
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
        var parent = $(element).parent();

        // Get the overlays
        var childDivs = $(parent).find('.overlay');
        var topLeft = $(childDivs[0]).find('div');
        var topRight = $(childDivs[1]).find('div');
        var bottomLeft = $(childDivs[2]).find('div');
        var bottomRight = $(childDivs[3]).find('div');

        // Set the overlay text
        $(topLeft[0]).text(data.patientName);
        $(topLeft[1]).text(data.patientId);
        $(topRight[0]).text(data.studyDescription);
        $(topRight[1]).text(data.studyDate);


        // On new image (displayed?)
        function onNewImage(e) {
            // If we are currently playing a clip then update the FPS
            // Get the state of the 'playClip tool'
            var playClipToolData = cornerstoneTools.getToolState(element, 'playClip');

            // If playing a clip ...
            if (playClipToolData !== undefined && playClipToolData.data.length > 0 && playClipToolData.data[0].intervalId !== undefined && e.detail.frameRate !== undefined) {

                // Update FPS
                $(bottomLeft[0]).text("FPS: " + Math.round(e.detail.frameRate));
                //console.log('frameRate: ' + e.detail.frameRate);

            } else {
                // Set FPS empty if not playing a clip
                if ($(bottomLeft[0]).text().length > 0) {
                    $(bottomLeft[0]).text("");
                }
            }
            // Update Image number overlay
            $(bottomLeft[2]).text("Image #" + (stacks[currentStackIndex].currentImageIdIndex + 1) + "/" + stacks[currentStackIndex].imageIds.length);
        }
        // Add a CornerstoneNewImage event listener on the 'element' (viewer) (?)
        element.addEventListener("CornerstoneNewImage", onNewImage, false);


        // On image rendered
        function onImageRendered(e) {
            // Set zoom overlay text
            $(bottomRight[0]).text("Zoom:" + e.detail.viewport.scale.toFixed(2));
            // Set WW/WL overlay text
            $(bottomRight[1]).text("WW/WL:" + Math.round(e.detail.viewport.voi.windowWidth) + "/" + Math.round(e.detail.viewport.voi.windowCenter));
            // Set render time overlay text
            $(bottomLeft[1]).text("Render Time:" + e.detail.renderTimeInMs + " ms");
        }
        // Add a CornerstoneImageRendered event listener on the 'element' (viewer) (?)
        element.addEventListener("CornerstoneImageRendered", onImageRendered, false);

        // Get first imageID on the current stack
        var imageId = stacks[currentStackIndex].imageIds[0];

        // Image enable the dicomImage element
        cornerstone.enable(element);

        // Have cornerstone load and cache the image
        cornerstone.loadAndCacheImage(imageId).then(function(image) {

            setupViewport(studyViewer, element, stacks[0], image);

            // Get series list from the series thumbnails (?)
            var seriesList = $(studyViewer).find('.thumbnails')[0];

            stacks.forEach(function(stack) {

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
                cornerstone.loadAndCacheImage(stacks[stack.seriesIndex].imageIds[0]).then(function(image) {
                    // Make the first thumbnail active
                    if (stack.seriesIndex === 0) {
                        $(seriesElement).addClass('active');
                    }
                    // Display the image
                    cornerstone.displayImage(thumbnail, image);
                });

                // Handle thumbnail click
                $(seriesElement).on('click touchstart', function() {
                        currentStackIndex = stack.seriesIndex;
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
