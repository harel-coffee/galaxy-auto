define(["mvc/dataset/dataset-li","mvc/base-mvc","utils/localization"],function(a,b,c){"use strict";var d=a.DatasetListItemView,e=d.extend({className:d.prototype.className+" history-content",initialize:function(a,b){d.prototype.initialize.call(this,a,b)},toString:function(){var a=this.model?this.model+"":"(no model)";return"HDAListItemView("+a+")"}});return e.prototype.templates=function(){var a=b.wrapTemplate(['<div class="title-bar clear" tabindex="0">','<span class="state-icon"></span>','<div class="title">','<span class="hid"><%- dataset.hid %></span> ','<span class="name"><%- dataset.name %></span>',"</div>","</div>"],"dataset"),e=_.extend({},d.prototype.templates.warnings,{hidden:b.wrapTemplate(["<% if( !dataset.visible ){ %>",'<div class="hidden-msg warningmessagesmall">',c("This dataset has been hidden"),"</div>","<% } %>"],"dataset")});return _.extend({},d.prototype.templates,{titleBar:a,warnings:e})}(),{HDAListItemView:e}});
//# sourceMappingURL=../../../maps/mvc/history/hda-li.js.map