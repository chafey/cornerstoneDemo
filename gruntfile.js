module.exports = function(grunt) {

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        clean: {
            default: {
                src: [
                    'dist',
                    'docs',
                    'build'
                ]
            }
        },
        copy : {
            bower: {
                src: [
                    'bower_components/cornerstone/dist/cornerstone.min.css',
                    'bower_components/cornerstone/dist/cornerstone.js',
                    'bower_components/cornerstoneTools/dist/cornerstoneTools.js',
                    'bower_components/cornerstoneWADOImageLoader/dist/cornerstoneWADOImageLoader.js',
                    'bower_components/cornerstoneWebImageLoader/dist/cornerstoneWebImageLoader.js',
                    'bower_components/cornerstoneMath/dist/cornerstoneMath.js',
                    'bower_components/cornerstone-file-image-loader/dist/cornerstoneFileImageLoader.js',
                    'bower_components/image-jpeg2000/dist/jpx.js',
                    'bower_components/dicomParser/dist/dicomParser.js',
                    'bower_components/bootstrap/dist/js/bootstrap.min.js',
                    'bower_components/hammerjs/hammer.min.js',
                    'bower_components/jquery/dist/jquery.js',
                    'bower_components/jquery/dist/jquery.min.js',
                    'bower_components/jquery/dist/jquery.min.map',
                    'bower_components/bootstrap/dist/css/bootstrap.min.css'
                ],
                dest: 'lib',
                expand: true,
                flatten: true
            }

        }
    });

    require('load-grunt-tasks')(grunt);

    grunt.registerTask('buildAll', ['clean']);
    grunt.registerTask('default', ['buildAll']);
};

// Release process:
//  1) Update version numbers
//  2) do a build (needed to update dist versions with correct build number)
//  3) commit changes
//      git commit -am "Changes...."
//  4) tag the commit
//      git tag -a 0.1.0 -m "Version 0.1.0"
//  5) push to github
//      git push origin master --tags