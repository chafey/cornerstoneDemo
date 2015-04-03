$('#tabs a').click(function (e) {
  e.preventDefault()
  $(this).tab('show')
})

function loadStudyJson(studyViewer, studyId)
{
  $.getJSON('studies/' + studyId, function(data) {
              // Load the first series into the viewport
              $('#wadoURL').val();

              var stacks = [];
              var currentStackIndex = 0;
              var seriesIndex = 0;
              data.seriesList.forEach(function(series) {
                var stack = {
                  seriesDescription: series.seriesDescription,
                  stackId : series.seriesNumber,
                  imageIds: [],
                  seriesIndex : seriesIndex,
                  currentImageIdIndex: 0,
                  frameRate: series.frameRate
                }
                if(series.numberOfFrames !== undefined) {
                  var numberOfFrames = series.numberOfFrames;
                  for(var i=0; i < numberOfFrames; i++) {
                    var imageId = series.instanceList[0].imageId + "?frame=" + i;
                    if(imageId.substr(0, 4) !== 'http') {
                      imageId = "dicomweb://cornerstonetech.org/images/ClearCanvas/" + imageId;
                    }
                    stack.imageIds.push(imageId);
                  }
                } else {
                  series.instanceList.forEach(function(image) {
                    var imageId = image.imageId;
                    if(image.imageId.substr(0, 4) !== 'http') {
                      imageId = "dicomweb://cornerstonetech.org/images/ClearCanvas/" + image.imageId;
                    }
                    stack.imageIds.push(imageId);
                  });

                }
                seriesIndex++;
                stacks.push(stack);
              });

              // resize the parent div of the viewport to fit the screen
              var imageViewer = $(studyViewer).find('.imageViewer')[0];
              var viewportWrapper = $(imageViewer).find('.viewportWrapper')[0];
              var parentDiv = $(studyViewer).find('.viewer')[0];
              viewportWrapper.style.width = (parentDiv.style.width - 10) + "px";
              viewportWrapper.style.height= (window.innerHeight - 150) + "px";

              var studyRow = $(studyViewer).find('.studyRow')[0];
              var width = $(studyRow).width();
              $(parentDiv).width(width - 170);
              viewportWrapper.style.width = (parentDiv.style.width - 10) + "px";
              viewportWrapper.style.height= (window.innerHeight - 150) + "px";

              // image enable the dicomImage element and activate a few tools
              var element = $(studyViewer).find('.viewport')[0];
              var parent = $(element).parent();
              var childDivs = $(parent).find('.overlay');
              var topLeft = $(childDivs[0]).find('div');
              $(topLeft[0]).text(data.patientName);
              $(topLeft[1]).text(data.patientId);
              var topRight= $(childDivs[1]).find('div');
              $(topRight[0]).text(data.studyDescription);
              $(topRight[1]).text(data.studyDate);
              var bottomLeft = $(childDivs[2]).find('div');
              var bottomRight = $(childDivs[3]).find('div');

              function onNewImage(e) {
                  // if we are currently playing a clip then update the FPS
                  var playClipToolData = cornerstoneTools.getToolState(element, 'playClip');
                  if(playClipToolData !== undefined && playClipToolData.data.length > 0 && playClipToolData.data[0].intervalId !== undefined && e.detail.frameRate !== undefined) {
                    $(bottomLeft[0]).text("FPS: " + Math.round(e.detail.frameRate));
                      //console.log('frameRate: ' + e.detail.frameRate);
                    } else {
                      if($(bottomLeft[0]).text().length > 0) {
                        $(bottomLeft[0]).text("");
                      }
                    }
                    $(bottomLeft[2]).text("Image #" + (stacks[currentStackIndex].currentImageIdIndex + 1) + "/" + stacks[currentStackIndex].imageIds.length);
                  }
                  element.addEventListener("CornerstoneNewImage", onNewImage, false);

                  function onImageRendered(e) {
                    $(bottomRight[0]).text("Zoom:" + e.detail.viewport.scale.toFixed(2));
                    $(bottomRight[1]).text("WW/WL:" + Math.round(e.detail.viewport.voi.windowWidth) + "/" + Math.round(e.detail.viewport.voi.windowCenter));
                    $(bottomLeft[1]).text("Render Time:" + e.detail.renderTimeInMs + " ms");
                  }
                  element.addEventListener("CornerstoneImageRendered", onImageRendered, false);


                  var imageId = stacks[currentStackIndex].imageIds[0];

              // image enable the dicomImage element
              cornerstone.enable(element);
              cornerstone.loadAndCacheImage(imageId).then(function(image) {
                cornerstone.displayImage(element, image);
                if(stacks[0].frameRate !== undefined) {
                  cornerstone.playClip(element, stacks[0].frameRate);
                }

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


                  // stack tools
                  cornerstoneTools.addStackStateManager(element, ['playClip']);
                  cornerstoneTools.addToolState(element, 'stack', stacks[0]);
                  cornerstoneTools.stackScrollWheel.activate(element);
                  cornerstoneTools.stackPrefetch.enable(element);


                  function disableAllTools()
                  {
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

                    var buttons = $(studyViewer).find('button');
                  // Tool button event handlers that set the new active tool
                  $(buttons[0]).on('click touchstart',function() {
                    disableAllTools();
                    cornerstoneTools.wwwc.activate(element, 1);
                    cornerstoneTools.wwwcTouchDrag.activate(element);
                  });
                  $(buttons[1]).on('click touchstart',function() {
                    disableAllTools();
                    var viewport = cornerstone.getViewport(element);
                    if(viewport.invert === true) {
                      viewport.invert = false;
                    }
                    else {
                      viewport.invert = true;
                    }
                    cornerstone.setViewport(element, viewport);
                  });
                  $(buttons[2]).on('click touchstart',function() {
                    disableAllTools();
                      cornerstoneTools.zoom.activate(element, 5); // 5 is right mouse button and left mouse button
                      cornerstoneTools.zoomTouchDrag.activate(element);
                    });
                  $(buttons[3]).on('click touchstart',function() {
                    disableAllTools();
                      cornerstoneTools.pan.activate(element, 3); // 3 is middle mouse button and left mouse button
                      cornerstoneTools.panTouchDrag.activate(element);
                    });
                  $(buttons[4]).on('click touchstart',function() {
                    disableAllTools();
                    cornerstoneTools.stackScroll.activate(element, 1);
                    cornerstoneTools.stackScrollTouchDrag.activate(element);
                  });
                  $(buttons[5]).on('click touchstart',function() {
                    disableAllTools();
                    cornerstoneTools.length.activate(element, 1);
                  });
                  $(buttons[6]).on('click touchstart',function() {
                    disableAllTools();
                    cornerstoneTools.angle.activate(element, 1);
                  });
                  $(buttons[7]).on('click touchstart',function() {
                    disableAllTools();
                    cornerstoneTools.probe.activate(element, 1);
                  });
                  $(buttons[8]).on('click touchstart',function() {
                    disableAllTools();
                    cornerstoneTools.ellipticalRoi.activate(element, 1);
                  });
                  $(buttons[9]).on('click touchstart',function() {
                    disableAllTools();
                    cornerstoneTools.rectangleRoi.activate(element, 1);
                  });
                  $(buttons[10]).on('click touchstart',function() {
                    var frameRate = stacks[currentStackIndex].frameRate;
                    if(frameRate === undefined) {
                      frameRate = 10;
                    }
                    cornerstoneTools.playClip(element, 31);
                  });
                  $(buttons[11]).on('click touchstart',function() {
                    cornerstoneTools.stopClip(element);
                  });

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

                  var seriesList = $(studyViewer).find('.thumbnails')[0];
                  stacks.forEach(function(stack) {
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
                    var seriesElement = $(seriesEntry).appendTo(seriesList);
                    var thumbnail = $(seriesElement).find('div')[0];
                    cornerstone.enable(thumbnail);
                    cornerstone.loadAndCacheImage(stacks[stack.seriesIndex].imageIds[0]).then(function(image) {
                      if(stack.seriesIndex === 0) {
                        $(seriesElement).addClass('active');
                      }
                      cornerstone.displayImage(thumbnail, image);

                    });
                    $(seriesElement).on('click touchstart', function () {
                          // make this series visible
                          var activeThumbnails = $(seriesList).find('a').each(function() {
                            $(this).removeClass('active');
                          });
                          $(seriesElement).addClass('active');

                          cornerstoneTools.stopClip(element);
                          cornerstoneTools.stackScroll.disable(element);
                          cornerstoneTools.stackScroll.enable(element, stacks[stack.seriesIndex], 0);
                          cornerstone.loadAndCacheImage(stacks[stack.seriesIndex].imageIds[0]).then(function(image) {
                            var defViewport = cornerstone.getDefaultViewport(element, image);
                            currentStackIndex = stack.seriesIndex;
                            cornerstone.displayImage(element, image, defViewport);
                            cornerstone.fitToWindow(element);
                            var stackState = cornerstoneTools.getToolState(element, 'stack');
                            stackState.data[0] = stacks[stack.seriesIndex];
                            stackState.data[0].currentImageIdIndex = 0;
                            cornerstoneTools.stackPrefetch.enable(element);
                            $(bottomLeft[1]).text("# Images: " + stacks[stack.seriesIndex].imageIds.length);

                            if(stacks[stack.seriesIndex].frameRate !== undefined) {
                              cornerstoneTools.playClip(element, stacks[stack.seriesIndex].frameRate);
                            }
                          });
});


});

function resizeStudyViewer() {
var studyRow = $(studyViewer).find('.studyRow')[0];
var height = $(studyRow).height();
var width = $(studyRow).width();
$(seriesList).height(height - 40);
$(parentDiv).width(width - 170);
viewportWrapper.style.width = (parentDiv.style.width - 10) + "px";
viewportWrapper.style.height= (window.innerHeight - 150) + "px";
cornerstone.resize(element, true);
}

$(window).resize(function() {
resizeStudyViewer();
});
resizeStudyViewer();

});

});
}

function resizeMain() {
var height = $(window).height();
$('#main').height(height - 50);
$('#tabContent').height(height - 50 -42);
}

$(window).resize(function() {
resizeMain();
});
resizeMain();


$.getJSON('studyList.json', function(data)
{
data.studyList.forEach(function(study) {
  var studyRow = '<tr><td>' +
  study.patientName + '</td><td>' +
  study.patientId + '</td><td>' +
  study.studyDate + '</td><td>' +
  study.modality + '</td><td>' +
  study.studyDescription + '</td><td>' +
  study.numImages + '</td><td>' +
  '</tr>';
  var studyRowElement = $(studyRow).appendTo('#studyListData');
  $(studyRowElement).click(function() {
                  // Add new tab for this study and switch to it
                  var studyTab = '<li><a href="#x' + study.patientId + '" data-toggle="tab">' + study.patientName + '</a></li>';
                  $('#tabs').append(studyTab);

                  // add tab content by making a copy of the studyViewerTemplate element
                  var studyViewerCopy = $('#studyViewerTemplate').clone();
                  studyViewerCopy.attr("id", 'x' + study.patientId);
                  studyViewerCopy.removeClass('hidden');
                  studyViewerCopy.appendTo('#tabContent');

                  // show the new tab (which will be the last one since it was just added
                    $('#tabs a:last').tab('show');

                    $('a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
                      $(window).trigger('resize');
                    });

                  // Now load the study.json
                  loadStudyJson(studyViewerCopy, study.studyId + ".json");
                });
});



});

$("#help").click(function() {
$("#helpModal").modal();
});

$("#about").click(function() {
$("#aboutModal").modal();
});


// prevent scrolling on ios
document.body.addEventListener('touchmove', function(e){ e.preventDefault(); });