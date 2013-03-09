# This shell script concats the JS files into a single file (well, sort of; a
# pipe is used, so no actual file is created), then runs it through "yuglify",
# a JavaScript and CSS minifier, to "compress" it. It then runs the CSS file
# through the same minimizer.
#
# For more info on yuglify, see https://github.com/yui/yuglify

cat underscore/underscore.js jquery/jquery-1.9.1.js backbone/backbone.js backbone.localstorage/backbone.localStorage.js 2p.js | yuglify --terminal --type js --output 2p-min.js
yuglify 2p.css
