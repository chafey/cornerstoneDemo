function setupViewport(studyViewer, element, stack, image) {
    // Display the image on the viewer element
    cornerstone.displayImage(element, image);

    // If it's a movie (has frames), then play the clip
    if (stack.frameRate !== undefined) {
        cornerstone.playClip(element, stack.frameRate);
    }

    // Activate mouse clicks, mouse wheel and touch
    cornerstoneTools.mouseInput.enable(element);
    cornerstoneTools.mouseWheelInput.enable(element);
    cornerstoneTools.touchInput.enable(element);

    // Enable all tools we want to use with this element
    cornerstoneTools.wwwc.activate(element, 1); // ww/wc is the default tool for left mouse button
    cornerstoneTools.pan.activate(element, 2); // pan is the default tool for middle mouse button
    cornerstoneTools.zoom.activate(element, 4); // zoom is the default tool for right mouse button
    cornerstoneTools.probe.enable(element);
    cornerstoneTools.length.enable(element);
    cornerstoneTools.ellipticalRoi.enable(element);
    cornerstoneTools.rectangleRoi.enable(element);
    cornerstoneTools.wwwcTouchDrag.activate(element);
    cornerstoneTools.zoomTouchPinch.activate(element);

    // Stack tools
    cornerstoneTools.addStackStateManager(element, ['playClip']);
    cornerstoneTools.addToolState(element, 'stack', stack);
    cornerstoneTools.stackScrollWheel.activate(element);
    cornerstoneTools.stackPrefetch.enable(element);

    // Disable all tools
    function disableAllTools() {
        cornerstoneTools.wwwc.disable(element);
        cornerstoneTools.pan.activate(element, 2); // 2 is middle mouse button
        cornerstoneTools.zoom.activate(element, 4); // 4 is right mouse button
        cornerstoneTools.probe.deactivate(element, 1);
        cornerstoneTools.length.deactivate(element, 1);
        cornerstoneTools.angle.deactivate(element, 1);
        cornerstoneTools.ellipticalRoi.deactivate(element, 1);
        cornerstoneTools.rectangleRoi.deactivate(element, 1);
        cornerstoneTools.stackScroll.deactivate(element, 1);
        cornerstoneTools.wwwcTouchDrag.deactivate(element);
        cornerstoneTools.zoomTouchDrag.deactivate(element);
        cornerstoneTools.panTouchDrag.deactivate(element);
        cornerstoneTools.stackScrollTouchDrag.deactivate(element);
    }

    // Get the button elements
    var buttons = $(studyViewer).find('button');

    // Tool button event handlers that set the new active tool

    // WW/WL
    $(buttons[0]).on('click touchstart', function() {
        disableAllTools();
        cornerstoneTools.wwwc.activate(element, 1);
        cornerstoneTools.wwwcTouchDrag.activate(element);
    });

    // Invert
    $(buttons[1]).on('click touchstart', function() {
        disableAllTools();
        var viewport = cornerstone.getViewport(element);

        // Toggle invert
        if (viewport.invert === true) {
            viewport.invert = false;
        } else {
            viewport.invert = true;
        }
        cornerstone.setViewport(element, viewport);
    });

    // Zoom
    $(buttons[2]).on('click touchstart', function() {
        disableAllTools();
        cornerstoneTools.zoom.activate(element, 5); // 5 is right mouse button and left mouse button
        cornerstoneTools.zoomTouchDrag.activate(element);
    });

    // Pan
    $(buttons[3]).on('click touchstart', function() {
        disableAllTools();
        cornerstoneTools.pan.activate(element, 3); // 3 is middle mouse button and left mouse button
        cornerstoneTools.panTouchDrag.activate(element);
    });

    // Stack scroll
    $(buttons[4]).on('click touchstart', function() {
        disableAllTools();
        cornerstoneTools.stackScroll.activate(element, 1);
        cornerstoneTools.stackScrollTouchDrag.activate(element);
    });

    // Length measurement
    $(buttons[5]).on('click touchstart', function() {
        disableAllTools();
        cornerstoneTools.length.activate(element, 1);
    });

    // Angle measurement
    $(buttons[6]).on('click touchstart', function() {
        disableAllTools();
        cornerstoneTools.angle.activate(element, 1);
    });

    // Pixel probe
    $(buttons[7]).on('click touchstart', function() {
        disableAllTools();
        cornerstoneTools.probe.activate(element, 1);
    });

    // Elliptical ROI
    $(buttons[8]).on('click touchstart', function() {
        disableAllTools();
        cornerstoneTools.ellipticalRoi.activate(element, 1);
    });

    // Rectangle ROI
    $(buttons[9]).on('click touchstart', function() {
        disableAllTools();
        cornerstoneTools.rectangleRoi.activate(element, 1);
    });

    // Play clip
    $(buttons[10]).on('click touchstart', function() {
        var frameRate = stack.frameRate;

        // Play at a default 10 FPS if the framerate is not specified
        if (frameRate === undefined) {
            frameRate = 10;
        }
        cornerstoneTools.playClip(element, 31);
    });

    // Stop clip
    $(buttons[11]).on('click touchstart', function() {
        cornerstoneTools.stopClip(element);
    });

    // Tooltips
    $(buttons[0]).tooltip();
    $(buttons[1]).tooltip();
    $(buttons[2]).tooltip();
    $(buttons[3]).tooltip();
    $(buttons[4]).tooltip();
    $(buttons[5]).tooltip();
    $(buttons[6]).tooltip();
    $(buttons[7]).tooltip();
    $(buttons[8]).tooltip();
    $(buttons[9]).tooltip();
    $(buttons[10]).tooltip();
    $(buttons[11]).tooltip();

}
