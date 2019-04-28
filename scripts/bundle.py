import os

bundleCmd01 = 'browserify public/js/dashboard.js -o public/js/bundle.js'
bundleCmd01 = 'watchify   public/js/dashboard.js -o public/js/bundle.js'

os.system(bundleCmd01)
