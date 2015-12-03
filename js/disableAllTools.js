// Disable all tools
function disableAllTools() {
    forEachViewport(function(element) {
        cornerstoneTools.wwwc.disable(element);
        cornerstoneTools.pan.deactivate(element, 2); // 2 is middle mouse button
        cornerstoneTools.zoom.deactivate(element, 4); // 4 is right mouse button
        cornerstoneTools.probe.deactivate(element, 1);
        cornerstoneTools.length.deactivate(element, 1);
        cornerstoneTools.angle.deactivate(element, 1);
		cornerstoneTools.mpr.deactivate(element);
        cornerstoneTools.ellipticalRoi.deactivate(element, 1);
        cornerstoneTools.rectangleRoi.deactivate(element, 1);
        cornerstoneTools.stackScroll.deactivate(element, 1);
        cornerstoneTools.wwwcTouchDrag.deactivate(element);
        cornerstoneTools.zoomTouchDrag.deactivate(element);
        cornerstoneTools.panTouchDrag.deactivate(element);
        cornerstoneTools.stackScrollTouchDrag.deactivate(element);
    });
}