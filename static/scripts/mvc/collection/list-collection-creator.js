define(["mvc/history/hdca-model","mvc/dataset/states","mvc/base-mvc","mvc/ui/ui-modal","utils/natural-sort","utils/localization","ui/hoverhighlight"],function(a,b,c,d,e,f){"use strict";function g(a){var b=a.toJSON(),c=l(b,{creationFn:function(b,c){return b=b.map(function(a){return{id:a.id,name:a.name,src:"dataset"===a.history_content_type?"hda":"hdca"}}),a.createHDCA(b,"list",c)}});return c}var h="collections",i=Backbone.View.extend(c.LoggableMixin).extend({_logNamespace:h,tagName:"li",className:"collection-element",initialize:function(a){this.element=a.element||{},this.selected=a.selected||!1},render:function(){return this.$el.attr("data-element-id",this.element.id).attr("draggable",!0).html(this.template({element:this.element})),this.selected&&this.$el.addClass("selected"),this},template:_.template(['<a class="name" title="',f("Click to rename"),'" href="javascript:void(0)">',"<%- element.name %>","</a>",'<button class="discard btn btn-sm" title="',f("Remove this dataset from the list"),'">',f("Discard"),"</button>"].join("")),select:function(a){this.$el.toggleClass("selected",a),this.trigger("select",{source:this,selected:this.$el.hasClass("selected")})},discard:function(){var a=this,b=this.$el.parent().width();this.$el.animate({"margin-right":b},"fast",function(){a.trigger("discard",{source:a}),a.destroy()})},destroy:function(){this.off(),this.$el.remove()},events:{click:"_click","click .name":"_clickName","click .discard":"_clickDiscard",dragstart:"_dragstart",dragend:"_dragend",dragover:"_sendToParent",drop:"_sendToParent"},_click:function(a){a.stopPropagation(),this.select(a)},_clickName:function(a){a.stopPropagation(),a.preventDefault();var b=([f("Enter a new name for the element"),":\n(",f("Note that changing the name here will not rename the dataset"),")"].join(""),prompt(f("Enter a new name for the element")+":",this.element.name));b&&(this.element.name=b,this.render())},_clickDiscard:function(a){a.stopPropagation(),this.discard()},_dragstart:function(a){a.originalEvent&&(a=a.originalEvent),a.dataTransfer.effectAllowed="move",a.dataTransfer.setData("text/plain",JSON.stringify(this.element)),this.$el.addClass("dragging"),this.$el.parent().trigger("collection-element.dragstart",[this])},_dragend:function(){this.$el.removeClass("dragging"),this.$el.parent().trigger("collection-element.dragend",[this])},_sendToParent:function(a){this.$el.parent().trigger(a)},toString:function(){return"DatasetCollectionElementView()"}}),j=Backbone.View.extend(c.LoggableMixin).extend({_logNamespace:h,elementViewClass:i,collectionClass:a.HistoryListDatasetCollection,className:"list-collection-creator collection-creator flex-row-container",minElements:1,defaultAttributes:{creationFn:function(){throw new TypeError("no creation fn for creator")},oncreate:function(){},oncancel:function(){},autoscrollDist:24,highlightClr:"rgba( 64, 255, 255, 1.0 )"},initialize:function(a){this.metric("ListCollectionCreator.initialize",a);var b=this;_.each(this.defaultAttributes,function(c,d){c=a[d]||c,b[d]=c}),b.initialElements=a.elements||[],this._instanceSetUp(),this._elementsSetUp(),this._setUpBehaviors()},_instanceSetUp:function(){this.selectedIds={},this.$dragging=null,this.blocking=!1},_elementsSetUp:function(){this.invalidElements=[],this.workingElements=[],this.elementViews=[],this.workingElements=this.initialElements.slice(0),this._ensureElementIds(),this._validateElements(),this._mangleDuplicateNames(),this._sortElements()},_ensureElementIds:function(){return this.workingElements.forEach(function(a){a.hasOwnProperty("id")||(a.id=_.uniqueId())}),this.workingElements},_validateElements:function(){var a=this;return a.invalidElements=[],this.workingElements=this.workingElements.filter(function(b){var c=a._isElementInvalid(b);return c&&a.invalidElements.push({element:b,text:c}),!c}),this.workingElements},_isElementInvalid:function(a){return"dataset"!==a.history_content_type?f("is not a dataset"):a.state!==b.OK?f(_.contains(b.NOT_READY_STATES,a.state)?"hasn't finished running yet":"has errored, is paused, or is not accessible"):a.deleted||a.purged?f("has been deleted or purged"):null},_mangleDuplicateNames:function(){var a=900,b=1,c={};this.workingElements.forEach(function(d){for(var e=d.name;c.hasOwnProperty(e);)if(e=d.name+" ("+b+")",b+=1,b>=a)throw new Error("Safety hit in while loop - thats impressive");d.name=e,c[d.name]=!0})},_sortElements:function(){},render:function(a,b){return this.workingElements.length<this.minElements?this._renderInvalid(a,b):(this.$el.empty().html(this.templates.main()),this._renderHeader(a),this._renderMiddle(a),this._renderFooter(a),this._addPluginComponents(),this.$(".collection-name").focus(),this.trigger("rendered",this),this)},_renderInvalid:function(){return this.$el.empty().html(this.templates.invalidInitial({problems:this.invalidElements,elements:this.workingElements})),"function"==typeof this.oncancel&&this.$(".cancel-create.btn").show(),this.trigger("rendered",this),this},_renderHeader:function(){var a=this.$(".header").empty().html(this.templates.header()).find(".help-content").prepend($(this.templates.helpContent()));return this.invalidElements.length&&this._invalidElementsAlert(),a},_renderMiddle:function(a){var b=this.$(".middle").empty().html(this.templates.middle());return this._renderList(a),b},_renderFooter:function(){var a=this.$(".footer").empty().html(this.templates.footer());return"function"==typeof this.oncancel&&this.$(".cancel-create.btn").show(),a},_addPluginComponents:function(){this.$(".help-content i").hoverhighlight(".collection-creator",this.highlightClr)},_invalidElementsAlert:function(){this._showAlert(this.templates.invalidElements({problems:this.invalidElements}),"alert-warning")},_validationWarning:function(a,b){var c="validation-warning";"name"===a&&(a=this.$(".collection-name").add(this.$(".collection-name-prompt")),this.$(".collection-name").focus().select()),b?(a=a||this.$("."+c),a.removeClass(c)):a.addClass(c)},_disableNameAndCreate:function(a){a=_.isUndefined(a)?!0:a,a&&(this.$(".collection-name").prop("disabled",!0),this.$(".create-collection").toggleClass("disabled",!0))},$list:function(){return this.$(".collection-elements")},_renderClearSelected:function(){_.size(this.selectedIds)?this.$(".collection-elements-controls > .clear-selected").show():this.$(".collection-elements-controls > .clear-selected").hide()},_renderList:function(){var a=this,b=jQuery("<div/>"),c=a.$list();_.each(this.elementViews,function(b){b.destroy(),a.removeElementView(b)}),a.workingElements.forEach(function(c){var d=a._createElementView(c);b.append(d.$el)}),a._renderClearSelected(),c.empty().append(b.children()),_.invoke(a.elementViews,"render"),c.height()>c.css("max-height")?c.css("border-width","1px 0px 1px 0px"):c.css("border-width","0px")},_createElementView:function(a){var b=new this.elementViewClass({element:a,selected:_.has(this.selectedIds,a.id)});return this.elementViews.push(b),this._listenToElementView(b),b},_listenToElementView:function(a){var b=this;b.listenTo(a,{select:function(a){var c=a.source.element;a.selected?b.selectedIds[c.id]=!0:delete b.selectedIds[c.id],b.trigger("elements:select",a)},discard:function(a){b.trigger("elements:discard",a)}})},addElementView:function(){},removeElementView:function(a){delete this.selectedIds[a.element.id],this._renderClearSelected(),this.elementViews=_.without(this.elementViews,a),this.stopListening(a)},_renderNoElementsLeft:function(){this._disableNameAndCreate(!0),this.$(".collection-elements").append(this.templates.noElementsLeft())},_elementToJSON:function(a){return a},createList:function(a){if(!this.workingElements.length){var b=f("No valid elements for final list")+". ";return b+='<a class="cancel-create" href="javascript:void(0);">'+f("Cancel")+"</a> ",b+=f("or"),b+=' <a class="reset" href="javascript:void(0);">'+f("start over")+"</a>.",void this._showAlert(b)}var c=this,d=this.workingElements.map(function(a){return c._elementToJSON(a)});return c.blocking=!0,c.creationFn(d,a).always(function(){c.blocking=!1}).fail(function(a,b){c.trigger("error",{xhr:a,status:b,message:f("An error occurred while creating this collection")})}).done(function(a,b,d){c.trigger("collection:created",a,b,d),c.metric("collection:created",a),"function"==typeof c.oncreate&&c.oncreate.call(this,a,b,d)})},_setUpBehaviors:function(){return this.on("error",this._errorHandler),this.once("rendered",function(){this.trigger("rendered:initial",this)}),this.on("elements:select",function(){this._renderClearSelected()}),this.on("elements:discard",function(a){var b=a.source.element;this.removeElementView(a.source),this.workingElements=_.without(this.workingElements,b),this.workingElements.length||this._renderNoElementsLeft()}),this},_errorHandler:function(a){this.error(a);var b=this;if(content=a.message||f("An error occurred"),a.xhr){var c=a.xhr,d=a.message;content+=0===c.readyState&&0===c.status?": "+f("Galaxy could not be reached and may be updating.")+f(" Try again in a few minutes."):c.responseJSON?":<br /><pre>"+JSON.stringify(c.responseJSON)+"</pre>":": "+d}b._showAlert(content,"alert-danger")},events:{"click .more-help":"_clickMoreHelp","click .less-help":"_clickLessHelp","click .main-help":"_toggleHelp","click .header .alert button":"_hideAlert","click .reset":"reset","click .clear-selected":"clearSelectedElements","click .collection-elements":"clearSelectedElements","dragover .collection-elements":"_dragoverElements","drop .collection-elements":"_dropElements","collection-element.dragstart .collection-elements":"_elementDragstart","collection-element.dragend   .collection-elements":"_elementDragend","change .collection-name":"_changeName","keydown .collection-name":"_nameCheckForEnter","click .cancel-create":function(){"function"==typeof this.oncancel&&this.oncancel.call(this)},"click .create-collection":"_clickCreate"},_clickMoreHelp:function(a){a.stopPropagation(),this.$(".main-help").addClass("expanded"),this.$(".more-help").hide()},_clickLessHelp:function(a){a.stopPropagation(),this.$(".main-help").removeClass("expanded"),this.$(".more-help").show()},_toggleHelp:function(a){a.stopPropagation(),this.$(".main-help").toggleClass("expanded"),this.$(".more-help").toggle()},_showAlert:function(a,b){b=b||"alert-danger",this.$(".main-help").hide(),this.$(".header .alert").attr("class","alert alert-dismissable").addClass(b).show().find(".alert-message").html(a)},_hideAlert:function(){this.$(".main-help").show(),this.$(".header .alert").hide()},reset:function(){this._instanceSetUp(),this._elementsSetUp(),this.render()},clearSelectedElements:function(){this.$(".collection-elements .collection-element").removeClass("selected"),this.$(".collection-elements-controls > .clear-selected").hide()},_dragoverElements:function(a){a.preventDefault();var b=this.$list();this._checkForAutoscroll(b,a.originalEvent.clientY);var c=this._getNearestElement(a.originalEvent.clientY);this.$(".element-drop-placeholder").remove();var d=$('<div class="element-drop-placeholder"></div>');c.size()?c.before(d):b.append(d)},_checkForAutoscroll:function(a,b){var c=2,d=a.offset(),e=a.scrollTop(),f=b-d.top,g=d.top+a.outerHeight()-b;f>=0&&f<this.autoscrollDist?a.scrollTop(e-c):g>=0&&g<this.autoscrollDist&&a.scrollTop(e+c)},_getNearestElement:function(a){for(var b=4,c=this.$(".collection-elements li.collection-element").toArray(),d=0;d<c.length;d++){var e=$(c[d]),f=e.offset().top,g=Math.floor(e.outerHeight()/2)+b;if(f+g>a&&a>f-g)return e}return $()},_dropElements:function(a){a.originalEvent&&(a=a.originalEvent),a.preventDefault(),a.dataTransfer.dropEffect="move";var b=this._getNearestElement(a.clientY);return b.size()?this.$dragging.insertBefore(b):this.$dragging.insertAfter(this.$(".collection-elements .collection-element").last()),this._syncOrderToDom(),!1},_syncOrderToDom:function(){var a=this,b=[];this.$(".collection-elements .collection-element").each(function(){var c=$(this).attr("data-element-id"),d=_.findWhere(a.workingElements,{id:c});d?b.push(d):console.error("missing element: ",c)}),this.workingElements=b,this._renderList()},_elementDragstart:function(a,b){b.select(!0),this.$dragging=this.$(".collection-elements .collection-element.selected")},_elementDragend:function(){$(".element-drop-placeholder").remove(),this.$dragging=null},_changeName:function(){this._validationWarning("name",!!this._getName())},_nameCheckForEnter:function(a){13!==a.keyCode||this.blocking||this._clickCreate()},_getName:function(){return _.escape(this.$(".collection-name").val())},_clickCreate:function(){var a=this._getName();a?this.blocking||this.createList(a):this._validationWarning("name")},templates:{main:_.template(['<div class="header flex-row no-flex"></div>','<div class="middle flex-row flex-row-container"></div>','<div class="footer flex-row no-flex"></div>'].join("")),header:_.template(['<div class="main-help well clear">','<a class="more-help" href="javascript:void(0);">',f("More help"),"</a>",'<div class="help-content">','<a class="less-help" href="javascript:void(0);">',f("Less"),"</a>","</div>","</div>",'<div class="alert alert-dismissable">','<button type="button" class="close" data-dismiss="alert" ','title="',f("Close and show more help"),'" aria-hidden="true">&times;</button>','<span class="alert-message"></span>',"</div>"].join("")),middle:_.template(['<div class="collection-elements-controls">','<a class="reset" href="javascript:void(0);" ','title="',f("Undo all reordering and discards"),'">',f("Start over"),"</a>",'<a class="clear-selected" href="javascript:void(0);" ','title="',f("De-select all selected datasets"),'">',f("Clear selected"),"</a>","</div>",'<div class="collection-elements scroll-container flex-row">',"</div>"].join("")),footer:_.template(['<div class="attributes clear">','<div class="clear">','<input class="collection-name form-control pull-right" ','placeholder="',f("Enter a name for your new collection"),'" />','<div class="collection-name-prompt pull-right">',f("Name"),":</div>","</div>","</div>",'<div class="actions clear vertically-spaced">','<div class="other-options pull-left">','<button class="cancel-create btn" tabindex="-1">',f("Cancel"),"</button>",'<div class="create-other btn-group dropup">','<button class="btn btn-default dropdown-toggle" data-toggle="dropdown">',f("Create a different kind of collection"),' <span class="caret"></span>',"</button>",'<ul class="dropdown-menu" role="menu">','<li><a href="#">',f("Create a <i>single</i> pair"),"</a></li>",'<li><a href="#">',f("Create a list of <i>unpaired</i> datasets"),"</a></li>","</ul>","</div>","</div>",'<div class="main-options pull-right">','<button class="create-collection btn btn-primary">',f("Create list"),"</button>","</div>","</div>"].join("")),helpContent:_.template(["<p>",f(["Collections of datasets are permanent, ordered lists of datasets that can be passed to tools and ","workflows in order to have analyses done on each member of the entire group. This interface allows ","you to create a collection and re-order the final collection."].join("")),"</p>","<ul>","<li>",f(["Rename elements in the list by clicking on ",'<i data-target=".collection-element .name">the existing name</i>.'].join("")),"</li>","<li>",f(["Discard elements from the final created list by clicking on the ",'<i data-target=".collection-element .discard">"Discard"</i> button.'].join("")),"</li>","<li>",f(["Reorder the list by clicking and dragging elements. Select multiple elements by clicking on ",'<i data-target=".collection-element">them</i> and you can then move those selected by dragging the ',"entire group. Deselect them by clicking them again or by clicking the ",'the <i data-target=".clear-selected">"Clear selected"</i> link.'].join("")),"</li>","<li>",f(['Click the <i data-target=".reset">"Start over"</i> link to begin again as if you had just opened ',"the interface."].join("")),"</li>","<li>",f(['Click the <i data-target=".cancel-create">"Cancel"</i> button to exit the interface.'].join("")),"</li>","</ul><br />","<p>",f(['Once your collection is complete, enter a <i data-target=".collection-name">name</i> and ','click <i data-target=".create-collection">"Create list"</i>.'].join("")),"</p>"].join("")),invalidElements:_.template([f("The following selections could not be included due to problems:"),"<ul><% _.each( problems, function( problem ){ %>","<li><b><%- problem.element.name %></b>: <%- problem.text %></li>","<% }); %></ul>"].join("")),noElementsLeft:_.template(['<li class="no-elements-left-message">',f("No elements left! "),f("Would you like to "),'<a class="reset" href="javascript:void(0)">',f("start over"),"</a>?","</li>"].join("")),invalidInitial:_.template(['<div class="header flex-row no-flex">','<div class="alert alert-warning" style="display: block">','<span class="alert-message">',"<% if( _.size( problems ) ){ %>",f("The following selections could not be included due to problems"),":","<ul><% _.each( problems, function( problem ){ %>","<li><b><%- problem.element.name %></b>: <%- problem.text %></li>","<% }); %></ul>","<% } else if( _.size( elements ) < 1 ){ %>",f("No datasets were selected"),".","<% } %>","<br />",f("At least one element is needed for the collection"),". ",f("You may need to "),'<a class="cancel-create" href="javascript:void(0)">',f("cancel"),"</a> ",f("and reselect new elements"),".","</span>","</div>","</div>",'<div class="footer flex-row no-flex">','<div class="actions clear vertically-spaced">','<div class="other-options pull-left">','<button class="cancel-create btn" tabindex="-1">',f("Cancel"),"</button>","</div>","</div>","</div>"].join(""))},toString:function(){return"ListCollectionCreator"}}),k=function(a,b,c){var e,g=jQuery.Deferred(),h=Galaxy.modal||new d.View;return b=_.defaults(b||{},{elements:a,oncancel:function(){h.hide(),g.reject("cancelled")},oncreate:function(a,b){h.hide(),g.resolve(b)}}),e=new c(b),h.show({title:b.title||f("Create a collection"),body:e.$el,width:"80%",height:"100%",closing_events:!0}),e.render(),window._collectionCreator=e,g},l=function(a,b){return b=b||{},b.title=f("Create a collection from a list of datasets"),k(a,b,j)};return{DatasetCollectionElementView:i,ListCollectionCreator:j,collectionCreatorModal:k,listCollectionCreatorModal:l,createListCollection:g}});
//# sourceMappingURL=../../../maps/mvc/collection/list-collection-creator.js.map