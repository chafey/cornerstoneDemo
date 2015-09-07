function displayThumbnail(seriesList, seriesElement, element, stack, loaded) {
    // Deactivate other thumbnails
    $(seriesList).find('a').each(function() {
        $(this).removeClass('active');
    });

    // Make this series visible

    // Make the selected thumbnail active
    $(seriesElement).addClass('active');

    var enabledImage = cornerstone.getEnabledElement(element);
    if (enabledImage.image) {
        // Stop clip from if playing on element
        cornerstoneTools.stopClip(element);
        // Disable stack scrolling
        cornerstoneTools.stackScroll.disable(element);
        // Enable stackScroll on selected series
        cornerstoneTools.stackScroll.enable(element);
    }

    // Load the first image of the selected series stack
    cornerstone.loadAndCacheImage(stack.imageIds[0]).then(function(image) {
        if (loaded) {
            loaded.call(image, element, stack);
        }

        // Get the state of the stack tool
        var stackState = cornerstoneTools.getToolState(element, 'stack');
        stackState.data[0] = stack;
        stackState.data[0].currentImageIdIndex = 0;

        // Get the default viewport
        var defViewport = cornerstone.getDefaultViewport(element, image);
        // Get the current series stack index
        // Display the image
        cornerstone.displayImage(element, image, defViewport);
        // Fit the image to the viewport window
        cornerstone.fitToWindow(element);

        // Prefetch the remaining images in the stack (?)
        cornerstoneTools.stackPrefetch.enable(element);

        // Play clip if stack is a movie (has framerate)
        if (stack.frameRate !== undefined) {
            cornerstoneTools.playClip(element, stack.frameRate);
        }
    });
};