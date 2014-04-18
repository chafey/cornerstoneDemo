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
                    'bower_components/cornerstone/dist/cornerstone.min.js',
                    'bower_components/cornerstoneTools/dist/cornerstoneTools.min.js',
                    'bower_components/cornerstoneWADOImageLoader/dist/cornerstoneWADOImageLoader.min.js',
                    'bower_components/cornerstoneWebImageLoader/dist/cornerstoneWebImageLoader.min.js',
                    'bower_components/dicomParser/dist/dicomParser.min.js'
                ],
                dest: '',
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