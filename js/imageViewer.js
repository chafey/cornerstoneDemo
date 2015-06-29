ImageViewer = function(root, viewport) {
    var self = this;

    self.root = root;
    self.stacks = [];
    self.viewports = [];
    self.layout = '1x1';
    self.viewportModel = viewport;

    self.setLayout = function(layout) {
        self.layout = layout;
        // TODO: create viewports
        var ab = self.getRowsCols(), a = ab[0], b = ab[1], numOfViewports = a * b,
            perWidth = 100 / b, perHeight = 100 / a;
        self.root.find('.imageViewer').html('');
        var i = 0;
        self.viewports = [];
        while (i < numOfViewports) {
          var elem = self.viewportModel.clone().css({
            width : perWidth + '%', height : perHeight + '%'
          }).appendTo(self.root.find('.imageViewer'));
          elem.find('.viewport').data('index', i).data('waiting', true);

          self.viewports.push(elem);
          i++;
        }
    }

    self.getRowsCols = function() {
      var s = self.layout.split(/x/);
      return [parseInt(s[0]), parseInt(s[1])];
    }

    self.isSingle = function() {
      return self.layout == '1x1';
    }

    self.getElement = function(item) {
      return self.viewports[item].find('.viewport')[0];
    }

    self.forEachElement = function(cb) {
      self.viewports.forEach(function(vp, i){
        cb.call(self, vp.find('.viewport')[0], vp, i);
      });
    }
}