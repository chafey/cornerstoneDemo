ImageViewer = function(root) {
    var self = this;

    self.root = root;
    self.stacks = [];
    //self.viewports = [];
    //self.layout = '1x1';

    self.setLayout = function(layout) {
        self.layout = layout;
        // TODO: create viewports
    }
}