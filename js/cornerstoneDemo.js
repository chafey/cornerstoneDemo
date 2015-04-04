// Get study list from JSON manifest
$.getJSON('studyList.json', function(data) {
  data.studyList.forEach(function(study) {

    // Create one table row for each study in the manifest
    var studyRow = '<tr><td>' +
    study.patientName + '</td><td>' +
    study.patientId + '</td><td>' +
    study.studyDate + '</td><td>' +
    study.modality + '</td><td>' +
    study.studyDescription + '</td><td>' +
    study.numImages + '</td><td>' +
    '</tr>';

    // Append the row to the study list
    var studyRowElement = $(studyRow).appendTo('#studyListData');

    // On study list row click
    $(studyRowElement).click(function() {

      // Add new tab for this study and switch to it
      var studyTab = '<li><a href="#x' + study.patientId + '" data-toggle="tab">' + study.patientName + '</a></li>';
      $('#tabs').append(studyTab);

      // Add tab content by making a copy of the studyViewerTemplate element
      var studyViewerCopy = $('#studyViewerTemplate').clone();
      studyViewerCopy.attr("id", 'x' + study.patientId);
      // Make the viewer visible
      studyViewerCopy.removeClass('hidden');
      // Add section to the tab content
      studyViewerCopy.appendTo('#tabContent');

      // Show the new tab (which will be the last one since it was just added
      $('#tabs a:last').tab('show');

      // Toggle window resize (?)
      $('a[data-toggle="tab"]').on('shown.bs.tab', function(e) {
        $(window).trigger('resize');
      });

      // Now load the study.json
      loadStudyJson(studyViewerCopy, study.studyId + ".json");
    });
  });
});


// Load JSON study information for each study
function loadStudyJson(studyViewer, studyId) {

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
      // Display the image on the viewer element
      cornerstone.displayImage(element, image);

      // If it's a movie (has frames), then play the clip
      if (stacks[0].frameRate !== undefined) {
        cornerstone.playClip(element, stacks[0].frameRate);
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
      cornerstoneTools.addToolState(element, 'stack', stacks[0]);
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
        var frameRate = stacks[currentStackIndex].frameRate;

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

          // Deactivate other thumbnails
          var activeThumbnails = $(seriesList).find('a').each(function() {
            $(this).removeClass('active');
          });

          // Make this series visible

          // Make the selected thumbnail active
          $(seriesElement).addClass('active');

          // Stop clip from if playing on element 
          cornerstoneTools.stopClip(element);
          // Disable stack scrolling
          cornerstoneTools.stackScroll.disable(element);
          // Enable stackScroll on selected series
          cornerstoneTools.stackScroll.enable(element, stacks[stack.seriesIndex], 0);

          // Load the first image of the selected series stack
          cornerstone.loadAndCacheImage(stacks[stack.seriesIndex].imageIds[0]).then(function(image) {
            // Get the default viewport
            var defViewport = cornerstone.getDefaultViewport(element, image);
            // Get the current series stack index
            currentStackIndex = stack.seriesIndex;

            // Display the image
            cornerstone.displayImage(element, image, defViewport);
            // Fit the image to the viewport window
            cornerstone.fitToWindow(element);

            // Get the state of the stack tool
            var stackState = cornerstoneTools.getToolState(element, 'stack');
            stackState.data[0] = stacks[stack.seriesIndex];
            stackState.data[0].currentImageIdIndex = 0;

            // Prefetch the remaining images in the stack (?)
            cornerstoneTools.stackPrefetch.enable(element);

            // Set the # Images overlay text with the number of image ID's
            $(bottomLeft[1]).text("# Images: " + stacks[stack.seriesIndex].imageIds.length);

            // Play clip if stack is a movie (has framerate)
            if (stacks[stack.seriesIndex].frameRate !== undefined) {
              cornerstoneTools.playClip(element, stacks[stack.seriesIndex].frameRate);
            }
          });
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


// Show tabs on click
$('#tabs a').click (function(e) {
  e.preventDefault();
  $(this).tab('show');
});


// Help modal
$("#help").click(function() {
  $("#helpModal").modal();
});


// About modal
$("#about").click(function() {
  $("#aboutModal").modal();
});


// Resize main
function resizeMain() {
  var height = $(window).height();
  $('#main').height(height - 50);
  $('#tabContent').height(height - 50 - 42);
}


// Call resize main on window resize
$(window).resize(function() {
    resizeMain();
});
resizeMain();


// Prevent scrolling on iOS
document.body.addEventListener('touchmove', function(e) {
  e.preventDefault();
});
