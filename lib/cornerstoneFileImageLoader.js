/*! cornerstone-file-image-loader - v0.5.1 - 2015-04-04 | (c) 2014 Chris Hafey | https://github.com/chafey/cornerstoneFileImageLoader */
//
// This is a cornerstone image loader for DICOM P10 files.  It currently does not support compressed
// transfer syntaxes or big endian transfer syntaxes.  It will support implicit little endian transfer
// syntaxes but explicit little endian is strongly preferred to avoid any parsing issues related
// to SQ elements.
//

var cornerstoneFileImageLoader = (function ($, cornerstone, cornerstoneFileImageLoader) {

    "use strict";

    if(cornerstoneFileImageLoader === undefined) {
        cornerstoneFileImageLoader = {};
    }



    function isColorImage(photoMetricInterpretation)
    {
        if(photoMetricInterpretation === "RGB" ||
            photoMetricInterpretation === "PALETTE COLOR" ||
            photoMetricInterpretation === "YBR_FULL" ||
            photoMetricInterpretation === "YBR_FULL_422" ||
            photoMetricInterpretation === "YBR_PARTIAL_422" ||
            photoMetricInterpretation === "YBR_PARTIAL_420" ||
            photoMetricInterpretation === "YBR_RCT")
        {
            return true;
        }
        else
        {
            return false;
        }
    }

    function createImageObject(dataSet, imageId, frame)
    {
        if(frame === undefined) {
            frame = 0;
        }

        // make the image based on whether it is color or not
        var photometricInterpretation = dataSet.string('x00280004');
        var isColor = isColorImage(photometricInterpretation);
        if(isColor === false) {
            return cornerstoneWADOImageLoader.makeGrayscaleImage(imageId, dataSet, dataSet.byteArray, photometricInterpretation, frame);
        } else {
            return cornerstoneWADOImageLoader.makeColorImage(imageId, dataSet, dataSet.byteArray, photometricInterpretation, frame);
        }
    }

    var multiFrameCacheHack = {};

    // Loads an image given an imageId
    // wado url example:
    // http://localhost:3333/wado?requestType=WADO&studyUID=1.3.6.1.4.1.25403.166563008443.5076.20120418075541.1&seriesUID=1.3.6.1.4.1.25403.166563008443.5076.20120418075541.2&objectUID=1.3.6.1.4.1.25403.166563008443.5076.20120418075557.1&contentType=application%2Fdicom&transferSyntax=1.2.840.10008.1.2.1
    // NOTE: supposedly the instance will be returned in Explicit Little Endian transfer syntax if you don't
    // specify a transferSyntax but Osirix doesn't do this and seems to return it with the transfer syntax it is
    // stored as.
    function loadImage(imageId) {
        // create a deferred object
        // TODO: Consider not using jquery for deferred - maybe cujo's when library
        var deferred = $.Deferred();

        // build a url by parsing out the url scheme and frame index from the imageId
        var url = imageId;
        url = url.substring(12);
        var frameIndex = url.indexOf('frame=');
        var frame;
        if(frameIndex !== -1) {
            var frameStr = url.substr(frameIndex + 6);
            frame = parseInt(frameStr);
            url = url.substr(0, frameIndex-1);
        }

        // if multiframe and cached, use the cached data set to extract the frame
        if(frame !== undefined &&
            multiFrameCacheHack.hasOwnProperty(url))
        {
            var dataSet = multiFrameCacheHack[url];
            var imagePromise = createImageObject(dataSet, imageId, frame);
            imagePromise.then(function(image) {
                deferred.resolve(image);
            }, function() {
                deferred.reject();
            });
            return deferred;
        }

        var fileIndex = parseInt(url);
        var file = cornerstoneFileImageLoader.getFile(fileIndex);
        if(file === undefined) {
            deferred.reject('unknown file index ' + url);
            return deferred;
        }

        // Read the DICOM Data
        var fileReader = new FileReader();
        fileReader.onload = function(e) {
            // Parse the DICOM File
            var dicomPart10AsArrayBuffer = e.target.result;
            var byteArray = new Uint8Array(dicomPart10AsArrayBuffer);
            var dataSet = dicomParser.parseDicom(byteArray);

            // if multiframe, cache the parsed data set to speed up subsequent
            // requests for the other frames
            if(frame !== undefined) {
                multiFrameCacheHack[url] = dataSet;
            }

            var imagePromise = createImageObject(dataSet, imageId, frame);
            imagePromise.then(function(image) {
                deferred.resolve(image);
            }, function() {
                deferred.reject();
            });
        };
        fileReader.readAsArrayBuffer(file);

        return deferred;
    }

    // steam the http and https prefixes so we can use wado URL's directly
    cornerstone.registerImageLoader('dicomfile', loadImage);

    return cornerstoneFileImageLoader;
}($, cornerstone, cornerstoneFileImageLoader));
/**
 */
var cornerstoneFileImageLoader = (function (cornerstoneFileImageLoader) {

    "use strict";

    if(cornerstoneFileImageLoader === undefined) {
        cornerstoneFileImageLoader = {};
    }

    var files = [];

    function addFile(file) {
        var fileIndex =  files.push(file);
        return fileIndex - 1;
    }

    function getFile(index) {
        return files[index];
    }

    function purge() {
        files = [];
    }

    // module exports
    cornerstoneFileImageLoader.addFile = addFile;
    cornerstoneFileImageLoader.getFile = getFile;
    cornerstoneFileImageLoader.purge = purge;

    return cornerstoneFileImageLoader;
}(cornerstoneFileImageLoader));