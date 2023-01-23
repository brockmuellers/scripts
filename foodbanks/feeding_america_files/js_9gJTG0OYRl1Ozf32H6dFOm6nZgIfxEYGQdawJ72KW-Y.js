/*! fancyBox v2.1.5 fancyapps.com | fancyapps.com/fancybox/#license */
(function(r,G,f,v){var J=f("html"),n=f(r),p=f(G),b=f.fancybox=function(){b.open.apply(this,arguments)},I=navigator.userAgent.match(/msie/i),B=null,s=G.createTouch!==v,t=function(a){return a&&a.hasOwnProperty&&a instanceof f},q=function(a){return a&&"string"===f.type(a)},E=function(a){return q(a)&&0<a.indexOf("%")},l=function(a,d){var e=parseInt(a,10)||0;d&&E(a)&&(e*=b.getViewport()[d]/100);return Math.ceil(e)},w=function(a,b){return l(a,b)+"px"};f.extend(b,{version:"2.1.5",defaults:{padding:15,margin:20,
width:800,height:600,minWidth:100,minHeight:100,maxWidth:9999,maxHeight:9999,pixelRatio:1,autoSize:!0,autoHeight:!1,autoWidth:!1,autoResize:!0,autoCenter:!s,fitToView:!0,aspectRatio:!1,topRatio:0.5,leftRatio:0.5,scrolling:"auto",wrapCSS:"",arrows:!0,closeBtn:!0,closeClick:!1,nextClick:!1,mouseWheel:!0,autoPlay:!1,playSpeed:3E3,preload:3,modal:!1,loop:!0,ajax:{dataType:"html",headers:{"X-fancyBox":!0}},iframe:{scrolling:"auto",preload:!0},swf:{wmode:"transparent",allowfullscreen:"true",allowscriptaccess:"always"},
keys:{next:{13:"left",34:"up",39:"left",40:"up"},prev:{8:"right",33:"down",37:"right",38:"down"},close:[27],play:[32],toggle:[70]},direction:{next:"left",prev:"right"},scrollOutside:!0,index:0,type:null,href:null,content:null,title:null,tpl:{wrap:'<div class="fancybox-wrap" tabIndex="-1"><div class="fancybox-skin"><div class="fancybox-outer"><div class="fancybox-inner"></div></div></div></div>',image:'<img class="fancybox-image" src="{href}" alt="" />',iframe:'<iframe id="fancybox-frame{rnd}" name="fancybox-frame{rnd}" class="fancybox-iframe" frameborder="0" vspace="0" hspace="0" webkitAllowFullScreen mozallowfullscreen allowFullScreen'+
(I?' allowtransparency="true"':"")+"></iframe>",error:'<p class="fancybox-error">The requested content cannot be loaded.<br/>Please try again later.</p>',closeBtn:'<a title="Close" class="fancybox-item fancybox-close" href="javascript:;"></a>',next:'<a title="Next" class="fancybox-nav fancybox-next" href="javascript:;"><span></span></a>',prev:'<a title="Previous" class="fancybox-nav fancybox-prev" href="javascript:;"><span></span></a>'},openEffect:"fade",openSpeed:250,openEasing:"swing",openOpacity:!0,
openMethod:"zoomIn",closeEffect:"fade",closeSpeed:250,closeEasing:"swing",closeOpacity:!0,closeMethod:"zoomOut",nextEffect:"elastic",nextSpeed:250,nextEasing:"swing",nextMethod:"changeIn",prevEffect:"elastic",prevSpeed:250,prevEasing:"swing",prevMethod:"changeOut",helpers:{overlay:!0,title:!0},onCancel:f.noop,beforeLoad:f.noop,afterLoad:f.noop,beforeShow:f.noop,afterShow:f.noop,beforeChange:f.noop,beforeClose:f.noop,afterClose:f.noop},group:{},opts:{},previous:null,coming:null,current:null,isActive:!1,
isOpen:!1,isOpened:!1,wrap:null,skin:null,outer:null,inner:null,player:{timer:null,isActive:!1},ajaxLoad:null,imgPreload:null,transitions:{},helpers:{},open:function(a,d){if(a&&(f.isPlainObject(d)||(d={}),!1!==b.close(!0)))return f.isArray(a)||(a=t(a)?f(a).get():[a]),f.each(a,function(e,c){var k={},g,h,j,m,l;"object"===f.type(c)&&(c.nodeType&&(c=f(c)),t(c)?(k={href:c.data("fancybox-href")||c.attr("href"),title:c.data("fancybox-title")||c.attr("title"),isDom:!0,element:c},f.metadata&&f.extend(!0,k,
c.metadata())):k=c);g=d.href||k.href||(q(c)?c:null);h=d.title!==v?d.title:k.title||"";m=(j=d.content||k.content)?"html":d.type||k.type;!m&&k.isDom&&(m=c.data("fancybox-type"),m||(m=(m=c.prop("class").match(/fancybox\.(\w+)/))?m[1]:null));q(g)&&(m||(b.isImage(g)?m="image":b.isSWF(g)?m="swf":"#"===g.charAt(0)?m="inline":q(c)&&(m="html",j=c)),"ajax"===m&&(l=g.split(/\s+/,2),g=l.shift(),l=l.shift()));j||("inline"===m?g?j=f(q(g)?g.replace(/.*(?=#[^\s]+$)/,""):g):k.isDom&&(j=c):"html"===m?j=g:!m&&(!g&&
k.isDom)&&(m="inline",j=c));f.extend(k,{href:g,type:m,content:j,title:h,selector:l});a[e]=k}),b.opts=f.extend(!0,{},b.defaults,d),d.keys!==v&&(b.opts.keys=d.keys?f.extend({},b.defaults.keys,d.keys):!1),b.group=a,b._start(b.opts.index)},cancel:function(){var a=b.coming;a&&!1!==b.trigger("onCancel")&&(b.hideLoading(),b.ajaxLoad&&b.ajaxLoad.abort(),b.ajaxLoad=null,b.imgPreload&&(b.imgPreload.onload=b.imgPreload.onerror=null),a.wrap&&a.wrap.stop(!0,!0).trigger("onReset").remove(),b.coming=null,b.current||
b._afterZoomOut(a))},close:function(a){b.cancel();!1!==b.trigger("beforeClose")&&(b.unbindEvents(),b.isActive&&(!b.isOpen||!0===a?(f(".fancybox-wrap").stop(!0).trigger("onReset").remove(),b._afterZoomOut()):(b.isOpen=b.isOpened=!1,b.isClosing=!0,f(".fancybox-item, .fancybox-nav").remove(),b.wrap.stop(!0,!0).removeClass("fancybox-opened"),b.transitions[b.current.closeMethod]())))},play:function(a){var d=function(){clearTimeout(b.player.timer)},e=function(){d();b.current&&b.player.isActive&&(b.player.timer=
setTimeout(b.next,b.current.playSpeed))},c=function(){d();p.unbind(".player");b.player.isActive=!1;b.trigger("onPlayEnd")};if(!0===a||!b.player.isActive&&!1!==a){if(b.current&&(b.current.loop||b.current.index<b.group.length-1))b.player.isActive=!0,p.bind({"onCancel.player beforeClose.player":c,"onUpdate.player":e,"beforeLoad.player":d}),e(),b.trigger("onPlayStart")}else c()},next:function(a){var d=b.current;d&&(q(a)||(a=d.direction.next),b.jumpto(d.index+1,a,"next"))},prev:function(a){var d=b.current;
d&&(q(a)||(a=d.direction.prev),b.jumpto(d.index-1,a,"prev"))},jumpto:function(a,d,e){var c=b.current;c&&(a=l(a),b.direction=d||c.direction[a>=c.index?"next":"prev"],b.router=e||"jumpto",c.loop&&(0>a&&(a=c.group.length+a%c.group.length),a%=c.group.length),c.group[a]!==v&&(b.cancel(),b._start(a)))},reposition:function(a,d){var e=b.current,c=e?e.wrap:null,k;c&&(k=b._getPosition(d),a&&"scroll"===a.type?(delete k.position,c.stop(!0,!0).animate(k,200)):(c.css(k),e.pos=f.extend({},e.dim,k)))},update:function(a){var d=
a&&a.type,e=!d||"orientationchange"===d;e&&(clearTimeout(B),B=null);b.isOpen&&!B&&(B=setTimeout(function(){var c=b.current;c&&!b.isClosing&&(b.wrap.removeClass("fancybox-tmp"),(e||"load"===d||"resize"===d&&c.autoResize)&&b._setDimension(),"scroll"===d&&c.canShrink||b.reposition(a),b.trigger("onUpdate"),B=null)},e&&!s?0:300))},toggle:function(a){b.isOpen&&(b.current.fitToView="boolean"===f.type(a)?a:!b.current.fitToView,s&&(b.wrap.removeAttr("style").addClass("fancybox-tmp"),b.trigger("onUpdate")),
b.update())},hideLoading:function(){p.unbind(".loading");f("#fancybox-loading").remove()},showLoading:function(){var a,d;b.hideLoading();a=f('<div id="fancybox-loading"><div></div></div>').click(b.cancel).appendTo("body");p.bind("keydown.loading",function(a){if(27===(a.which||a.keyCode))a.preventDefault(),b.cancel()});b.defaults.fixed||(d=b.getViewport(),a.css({position:"absolute",top:0.5*d.h+d.y,left:0.5*d.w+d.x}))},getViewport:function(){var a=b.current&&b.current.locked||!1,d={x:n.scrollLeft(),
y:n.scrollTop()};a?(d.w=a[0].clientWidth,d.h=a[0].clientHeight):(d.w=s&&r.innerWidth?r.innerWidth:n.width(),d.h=s&&r.innerHeight?r.innerHeight:n.height());return d},unbindEvents:function(){b.wrap&&t(b.wrap)&&b.wrap.unbind(".fb");p.unbind(".fb");n.unbind(".fb")},bindEvents:function(){var a=b.current,d;a&&(n.bind("orientationchange.fb"+(s?"":" resize.fb")+(a.autoCenter&&!a.locked?" scroll.fb":""),b.update),(d=a.keys)&&p.bind("keydown.fb",function(e){var c=e.which||e.keyCode,k=e.target||e.srcElement;
if(27===c&&b.coming)return!1;!e.ctrlKey&&(!e.altKey&&!e.shiftKey&&!e.metaKey&&(!k||!k.type&&!f(k).is("[contenteditable]")))&&f.each(d,function(d,k){if(1<a.group.length&&k[c]!==v)return b[d](k[c]),e.preventDefault(),!1;if(-1<f.inArray(c,k))return b[d](),e.preventDefault(),!1})}),f.fn.mousewheel&&a.mouseWheel&&b.wrap.bind("mousewheel.fb",function(d,c,k,g){for(var h=f(d.target||null),j=!1;h.length&&!j&&!h.is(".fancybox-skin")&&!h.is(".fancybox-wrap");)j=h[0]&&!(h[0].style.overflow&&"hidden"===h[0].style.overflow)&&
(h[0].clientWidth&&h[0].scrollWidth>h[0].clientWidth||h[0].clientHeight&&h[0].scrollHeight>h[0].clientHeight),h=f(h).parent();if(0!==c&&!j&&1<b.group.length&&!a.canShrink){if(0<g||0<k)b.prev(0<g?"down":"left");else if(0>g||0>k)b.next(0>g?"up":"right");d.preventDefault()}}))},trigger:function(a,d){var e,c=d||b.coming||b.current;if(c){f.isFunction(c[a])&&(e=c[a].apply(c,Array.prototype.slice.call(arguments,1)));if(!1===e)return!1;c.helpers&&f.each(c.helpers,function(d,e){if(e&&b.helpers[d]&&f.isFunction(b.helpers[d][a]))b.helpers[d][a](f.extend(!0,
{},b.helpers[d].defaults,e),c)});p.trigger(a)}},isImage:function(a){return q(a)&&a.match(/(^data:image\/.*,)|(\.(jp(e|g|eg)|gif|png|bmp|webp|svg)((\?|#).*)?$)/i)},isSWF:function(a){return q(a)&&a.match(/\.(swf)((\?|#).*)?$/i)},_start:function(a){var d={},e,c;a=l(a);e=b.group[a]||null;if(!e)return!1;d=f.extend(!0,{},b.opts,e);e=d.margin;c=d.padding;"number"===f.type(e)&&(d.margin=[e,e,e,e]);"number"===f.type(c)&&(d.padding=[c,c,c,c]);d.modal&&f.extend(!0,d,{closeBtn:!1,closeClick:!1,nextClick:!1,arrows:!1,
mouseWheel:!1,keys:null,helpers:{overlay:{closeClick:!1}}});d.autoSize&&(d.autoWidth=d.autoHeight=!0);"auto"===d.width&&(d.autoWidth=!0);"auto"===d.height&&(d.autoHeight=!0);d.group=b.group;d.index=a;b.coming=d;if(!1===b.trigger("beforeLoad"))b.coming=null;else{c=d.type;e=d.href;if(!c)return b.coming=null,b.current&&b.router&&"jumpto"!==b.router?(b.current.index=a,b[b.router](b.direction)):!1;b.isActive=!0;if("image"===c||"swf"===c)d.autoHeight=d.autoWidth=!1,d.scrolling="visible";"image"===c&&(d.aspectRatio=
!0);"iframe"===c&&s&&(d.scrolling="scroll");d.wrap=f(d.tpl.wrap).addClass("fancybox-"+(s?"mobile":"desktop")+" fancybox-type-"+c+" fancybox-tmp "+d.wrapCSS).appendTo(d.parent||"body");f.extend(d,{skin:f(".fancybox-skin",d.wrap),outer:f(".fancybox-outer",d.wrap),inner:f(".fancybox-inner",d.wrap)});f.each(["Top","Right","Bottom","Left"],function(a,b){d.skin.css("padding"+b,w(d.padding[a]))});b.trigger("onReady");if("inline"===c||"html"===c){if(!d.content||!d.content.length)return b._error("content")}else if(!e)return b._error("href");
"image"===c?b._loadImage():"ajax"===c?b._loadAjax():"iframe"===c?b._loadIframe():b._afterLoad()}},_error:function(a){f.extend(b.coming,{type:"html",autoWidth:!0,autoHeight:!0,minWidth:0,minHeight:0,scrolling:"no",hasError:a,content:b.coming.tpl.error});b._afterLoad()},_loadImage:function(){var a=b.imgPreload=new Image;a.onload=function(){this.onload=this.onerror=null;b.coming.width=this.width/b.opts.pixelRatio;b.coming.height=this.height/b.opts.pixelRatio;b._afterLoad()};a.onerror=function(){this.onload=
this.onerror=null;b._error("image")};a.src=b.coming.href;!0!==a.complete&&b.showLoading()},_loadAjax:function(){var a=b.coming;b.showLoading();b.ajaxLoad=f.ajax(f.extend({},a.ajax,{url:a.href,error:function(a,e){b.coming&&"abort"!==e?b._error("ajax",a):b.hideLoading()},success:function(d,e){"success"===e&&(a.content=d,b._afterLoad())}}))},_loadIframe:function(){var a=b.coming,d=f(a.tpl.iframe.replace(/\{rnd\}/g,(new Date).getTime())).attr("scrolling",s?"auto":a.iframe.scrolling).attr("src",a.href);
f(a.wrap).bind("onReset",function(){try{f(this).find("iframe").hide().attr("src","//about:blank").end().empty()}catch(a){}});a.iframe.preload&&(b.showLoading(),d.one("load",function(){f(this).data("ready",1);s||f(this).bind("load.fb",b.update);f(this).parents(".fancybox-wrap").width("100%").removeClass("fancybox-tmp").show();b._afterLoad()}));a.content=d.appendTo(a.inner);a.iframe.preload||b._afterLoad()},_preloadImages:function(){var a=b.group,d=b.current,e=a.length,c=d.preload?Math.min(d.preload,
e-1):0,f,g;for(g=1;g<=c;g+=1)f=a[(d.index+g)%e],"image"===f.type&&f.href&&((new Image).src=f.href)},_afterLoad:function(){var a=b.coming,d=b.current,e,c,k,g,h;b.hideLoading();if(a&&!1!==b.isActive)if(!1===b.trigger("afterLoad",a,d))a.wrap.stop(!0).trigger("onReset").remove(),b.coming=null;else{d&&(b.trigger("beforeChange",d),d.wrap.stop(!0).removeClass("fancybox-opened").find(".fancybox-item, .fancybox-nav").remove());b.unbindEvents();e=a.content;c=a.type;k=a.scrolling;f.extend(b,{wrap:a.wrap,skin:a.skin,
outer:a.outer,inner:a.inner,current:a,previous:d});g=a.href;switch(c){case "inline":case "ajax":case "html":a.selector?e=f("<div>").html(e).find(a.selector):t(e)&&(e.data("fancybox-placeholder")||e.data("fancybox-placeholder",f('<div class="fancybox-placeholder"></div>').insertAfter(e).hide()),e=e.show().detach(),a.wrap.bind("onReset",function(){f(this).find(e).length&&e.hide().replaceAll(e.data("fancybox-placeholder")).data("fancybox-placeholder",!1)}));break;case "image":e=a.tpl.image.replace("{href}",
g);break;case "swf":e='<object id="fancybox-swf" classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000" width="100%" height="100%"><param name="movie" value="'+g+'"></param>',h="",f.each(a.swf,function(a,b){e+='<param name="'+a+'" value="'+b+'"></param>';h+=" "+a+'="'+b+'"'}),e+='<embed src="'+g+'" type="application/x-shockwave-flash" width="100%" height="100%"'+h+"></embed></object>"}(!t(e)||!e.parent().is(a.inner))&&a.inner.append(e);b.trigger("beforeShow");a.inner.css("overflow","yes"===k?"scroll":
"no"===k?"hidden":k);b._setDimension();b.reposition();b.isOpen=!1;b.coming=null;b.bindEvents();if(b.isOpened){if(d.prevMethod)b.transitions[d.prevMethod]()}else f(".fancybox-wrap").not(a.wrap).stop(!0).trigger("onReset").remove();b.transitions[b.isOpened?a.nextMethod:a.openMethod]();b._preloadImages()}},_setDimension:function(){var a=b.getViewport(),d=0,e=!1,c=!1,e=b.wrap,k=b.skin,g=b.inner,h=b.current,c=h.width,j=h.height,m=h.minWidth,u=h.minHeight,n=h.maxWidth,p=h.maxHeight,s=h.scrolling,q=h.scrollOutside?
h.scrollbarWidth:0,x=h.margin,y=l(x[1]+x[3]),r=l(x[0]+x[2]),v,z,t,C,A,F,B,D,H;e.add(k).add(g).width("auto").height("auto").removeClass("fancybox-tmp");x=l(k.outerWidth(!0)-k.width());v=l(k.outerHeight(!0)-k.height());z=y+x;t=r+v;C=E(c)?(a.w-z)*l(c)/100:c;A=E(j)?(a.h-t)*l(j)/100:j;if("iframe"===h.type){if(H=h.content,h.autoHeight&&1===H.data("ready"))try{H[0].contentWindow.document.location&&(g.width(C).height(9999),F=H.contents().find("body"),q&&F.css("overflow-x","hidden"),A=F.outerHeight(!0))}catch(G){}}else if(h.autoWidth||
h.autoHeight)g.addClass("fancybox-tmp"),h.autoWidth||g.width(C),h.autoHeight||g.height(A),h.autoWidth&&(C=g.width()),h.autoHeight&&(A=g.height()),g.removeClass("fancybox-tmp");c=l(C);j=l(A);D=C/A;m=l(E(m)?l(m,"w")-z:m);n=l(E(n)?l(n,"w")-z:n);u=l(E(u)?l(u,"h")-t:u);p=l(E(p)?l(p,"h")-t:p);F=n;B=p;h.fitToView&&(n=Math.min(a.w-z,n),p=Math.min(a.h-t,p));z=a.w-y;r=a.h-r;h.aspectRatio?(c>n&&(c=n,j=l(c/D)),j>p&&(j=p,c=l(j*D)),c<m&&(c=m,j=l(c/D)),j<u&&(j=u,c=l(j*D))):(c=Math.max(m,Math.min(c,n)),h.autoHeight&&
"iframe"!==h.type&&(g.width(c),j=g.height()),j=Math.max(u,Math.min(j,p)));if(h.fitToView)if(g.width(c).height(j),e.width(c+x),a=e.width(),y=e.height(),h.aspectRatio)for(;(a>z||y>r)&&(c>m&&j>u)&&!(19<d++);)j=Math.max(u,Math.min(p,j-10)),c=l(j*D),c<m&&(c=m,j=l(c/D)),c>n&&(c=n,j=l(c/D)),g.width(c).height(j),e.width(c+x),a=e.width(),y=e.height();else c=Math.max(m,Math.min(c,c-(a-z))),j=Math.max(u,Math.min(j,j-(y-r)));q&&("auto"===s&&j<A&&c+x+q<z)&&(c+=q);g.width(c).height(j);e.width(c+x);a=e.width();
y=e.height();e=(a>z||y>r)&&c>m&&j>u;c=h.aspectRatio?c<F&&j<B&&c<C&&j<A:(c<F||j<B)&&(c<C||j<A);f.extend(h,{dim:{width:w(a),height:w(y)},origWidth:C,origHeight:A,canShrink:e,canExpand:c,wPadding:x,hPadding:v,wrapSpace:y-k.outerHeight(!0),skinSpace:k.height()-j});!H&&(h.autoHeight&&j>u&&j<p&&!c)&&g.height("auto")},_getPosition:function(a){var d=b.current,e=b.getViewport(),c=d.margin,f=b.wrap.width()+c[1]+c[3],g=b.wrap.height()+c[0]+c[2],c={position:"absolute",top:c[0],left:c[3]};d.autoCenter&&d.fixed&&
!a&&g<=e.h&&f<=e.w?c.position="fixed":d.locked||(c.top+=e.y,c.left+=e.x);c.top=w(Math.max(c.top,c.top+(e.h-g)*d.topRatio));c.left=w(Math.max(c.left,c.left+(e.w-f)*d.leftRatio));return c},_afterZoomIn:function(){var a=b.current;a&&(b.isOpen=b.isOpened=!0,b.wrap.css("overflow","visible").addClass("fancybox-opened"),b.update(),(a.closeClick||a.nextClick&&1<b.group.length)&&b.inner.css("cursor","pointer").bind("click.fb",function(d){!f(d.target).is("a")&&!f(d.target).parent().is("a")&&(d.preventDefault(),
b[a.closeClick?"close":"next"]())}),a.closeBtn&&f(a.tpl.closeBtn).appendTo(b.skin).bind("click.fb",function(a){a.preventDefault();b.close()}),a.arrows&&1<b.group.length&&((a.loop||0<a.index)&&f(a.tpl.prev).appendTo(b.outer).bind("click.fb",b.prev),(a.loop||a.index<b.group.length-1)&&f(a.tpl.next).appendTo(b.outer).bind("click.fb",b.next)),b.trigger("afterShow"),!a.loop&&a.index===a.group.length-1?b.play(!1):b.opts.autoPlay&&!b.player.isActive&&(b.opts.autoPlay=!1,b.play()))},_afterZoomOut:function(a){a=
a||b.current;f(".fancybox-wrap").trigger("onReset").remove();f.extend(b,{group:{},opts:{},router:!1,current:null,isActive:!1,isOpened:!1,isOpen:!1,isClosing:!1,wrap:null,skin:null,outer:null,inner:null});b.trigger("afterClose",a)}});b.transitions={getOrigPosition:function(){var a=b.current,d=a.element,e=a.orig,c={},f=50,g=50,h=a.hPadding,j=a.wPadding,m=b.getViewport();!e&&(a.isDom&&d.is(":visible"))&&(e=d.find("img:first"),e.length||(e=d));t(e)?(c=e.offset(),e.is("img")&&(f=e.outerWidth(),g=e.outerHeight())):
(c.top=m.y+(m.h-g)*a.topRatio,c.left=m.x+(m.w-f)*a.leftRatio);if("fixed"===b.wrap.css("position")||a.locked)c.top-=m.y,c.left-=m.x;return c={top:w(c.top-h*a.topRatio),left:w(c.left-j*a.leftRatio),width:w(f+j),height:w(g+h)}},step:function(a,d){var e,c,f=d.prop;c=b.current;var g=c.wrapSpace,h=c.skinSpace;if("width"===f||"height"===f)e=d.end===d.start?1:(a-d.start)/(d.end-d.start),b.isClosing&&(e=1-e),c="width"===f?c.wPadding:c.hPadding,c=a-c,b.skin[f](l("width"===f?c:c-g*e)),b.inner[f](l("width"===
f?c:c-g*e-h*e))},zoomIn:function(){var a=b.current,d=a.pos,e=a.openEffect,c="elastic"===e,k=f.extend({opacity:1},d);delete k.position;c?(d=this.getOrigPosition(),a.openOpacity&&(d.opacity=0.1)):"fade"===e&&(d.opacity=0.1);b.wrap.css(d).animate(k,{duration:"none"===e?0:a.openSpeed,easing:a.openEasing,step:c?this.step:null,complete:b._afterZoomIn})},zoomOut:function(){var a=b.current,d=a.closeEffect,e="elastic"===d,c={opacity:0.1};e&&(c=this.getOrigPosition(),a.closeOpacity&&(c.opacity=0.1));b.wrap.animate(c,
{duration:"none"===d?0:a.closeSpeed,easing:a.closeEasing,step:e?this.step:null,complete:b._afterZoomOut})},changeIn:function(){var a=b.current,d=a.nextEffect,e=a.pos,c={opacity:1},f=b.direction,g;e.opacity=0.1;"elastic"===d&&(g="down"===f||"up"===f?"top":"left","down"===f||"right"===f?(e[g]=w(l(e[g])-200),c[g]="+=200px"):(e[g]=w(l(e[g])+200),c[g]="-=200px"));"none"===d?b._afterZoomIn():b.wrap.css(e).animate(c,{duration:a.nextSpeed,easing:a.nextEasing,complete:b._afterZoomIn})},changeOut:function(){var a=
b.previous,d=a.prevEffect,e={opacity:0.1},c=b.direction;"elastic"===d&&(e["down"===c||"up"===c?"top":"left"]=("up"===c||"left"===c?"-":"+")+"=200px");a.wrap.animate(e,{duration:"none"===d?0:a.prevSpeed,easing:a.prevEasing,complete:function(){f(this).trigger("onReset").remove()}})}};b.helpers.overlay={defaults:{closeClick:!0,speedOut:200,showEarly:!0,css:{},locked:!s,fixed:!0},overlay:null,fixed:!1,el:f("html"),create:function(a){a=f.extend({},this.defaults,a);this.overlay&&this.close();this.overlay=
f('<div class="fancybox-overlay"></div>').appendTo(b.coming?b.coming.parent:a.parent);this.fixed=!1;a.fixed&&b.defaults.fixed&&(this.overlay.addClass("fancybox-overlay-fixed"),this.fixed=!0)},open:function(a){var d=this;a=f.extend({},this.defaults,a);this.overlay?this.overlay.unbind(".overlay").width("auto").height("auto"):this.create(a);this.fixed||(n.bind("resize.overlay",f.proxy(this.update,this)),this.update());a.closeClick&&this.overlay.bind("click.overlay",function(a){if(f(a.target).hasClass("fancybox-overlay"))return b.isActive?
b.close():d.close(),!1});this.overlay.css(a.css).show()},close:function(){var a,b;n.unbind("resize.overlay");this.el.hasClass("fancybox-lock")&&(f(".fancybox-margin").removeClass("fancybox-margin"),a=n.scrollTop(),b=n.scrollLeft(),this.el.removeClass("fancybox-lock"),n.scrollTop(a).scrollLeft(b));f(".fancybox-overlay").remove().hide();f.extend(this,{overlay:null,fixed:!1})},update:function(){var a="100%",b;this.overlay.width(a).height("100%");I?(b=Math.max(G.documentElement.offsetWidth,G.body.offsetWidth),
p.width()>b&&(a=p.width())):p.width()>n.width()&&(a=p.width());this.overlay.width(a).height(p.height())},onReady:function(a,b){var e=this.overlay;f(".fancybox-overlay").stop(!0,!0);e||this.create(a);a.locked&&(this.fixed&&b.fixed)&&(e||(this.margin=p.height()>n.height()?f("html").css("margin-right").replace("px",""):!1),b.locked=this.overlay.append(b.wrap),b.fixed=!1);!0===a.showEarly&&this.beforeShow.apply(this,arguments)},beforeShow:function(a,b){var e,c;b.locked&&(!1!==this.margin&&(f("*").filter(function(){return"fixed"===
f(this).css("position")&&!f(this).hasClass("fancybox-overlay")&&!f(this).hasClass("fancybox-wrap")}).addClass("fancybox-margin"),this.el.addClass("fancybox-margin")),e=n.scrollTop(),c=n.scrollLeft(),this.el.addClass("fancybox-lock"),n.scrollTop(e).scrollLeft(c));this.open(a)},onUpdate:function(){this.fixed||this.update()},afterClose:function(a){this.overlay&&!b.coming&&this.overlay.fadeOut(a.speedOut,f.proxy(this.close,this))}};b.helpers.title={defaults:{type:"float",position:"bottom"},beforeShow:function(a){var d=
b.current,e=d.title,c=a.type;f.isFunction(e)&&(e=e.call(d.element,d));if(q(e)&&""!==f.trim(e)){d=f('<div class="fancybox-title fancybox-title-'+c+'-wrap">'+e+"</div>");switch(c){case "inside":c=b.skin;break;case "outside":c=b.wrap;break;case "over":c=b.inner;break;default:c=b.skin,d.appendTo("body"),I&&d.width(d.width()),d.wrapInner('<span class="child"></span>'),b.current.margin[2]+=Math.abs(l(d.css("margin-bottom")))}d["top"===a.position?"prependTo":"appendTo"](c)}}};f.fn.fancybox=function(a){var d,
e=f(this),c=this.selector||"",k=function(g){var h=f(this).blur(),j=d,k,l;!g.ctrlKey&&(!g.altKey&&!g.shiftKey&&!g.metaKey)&&!h.is(".fancybox-wrap")&&(k=a.groupAttr||"data-fancybox-group",l=h.attr(k),l||(k="rel",l=h.get(0)[k]),l&&(""!==l&&"nofollow"!==l)&&(h=c.length?f(c):e,h=h.filter("["+k+'="'+l+'"]'),j=h.index(this)),a.index=j,!1!==b.open(h,a)&&g.preventDefault())};a=a||{};d=a.index||0;!c||!1===a.live?e.unbind("click.fb-start").bind("click.fb-start",k):p.undelegate(c,"click.fb-start").delegate(c+
":not('.fancybox-item, .fancybox-nav')","click.fb-start",k);this.filter("[data-fancybox-start=1]").trigger("click");return this};p.ready(function(){var a,d;f.scrollbarWidth===v&&(f.scrollbarWidth=function(){var a=f('<div style="width:50px;height:50px;overflow:auto"><div/></div>').appendTo("body"),b=a.children(),b=b.innerWidth()-b.height(99).innerWidth();a.remove();return b});if(f.support.fixedPosition===v){a=f.support;d=f('<div style="position:fixed;top:20px;"></div>').appendTo("body");var e=20===
d[0].offsetTop||15===d[0].offsetTop;d.remove();a.fixedPosition=e}f.extend(b.defaults,{scrollbarWidth:f.scrollbarWidth(),fixed:f.support.fixedPosition,parent:f("body")});a=f(r).width();J.addClass("fancybox-lock-test");d=f(r).width();J.removeClass("fancybox-lock-test");f("<style type='text/css'>.fancybox-margin{margin-right:"+(d-a)+"px;}</style>").appendTo("head")})})(window,document,jQuery);;
/*! TinySort
* Copyright (c) 2008-2013 Ron Valstar http://tinysort.sjeiti.com/
*
* Dual licensed under the MIT and GPL licenses:
*   http://www.opensource.org/licenses/mit-license.php
*   http://www.gnu.org/licenses/gpl.html
*//*
* Description:
*   A jQuery plugin to sort child nodes by (sub) contents or attributes.
*
* Contributors:
*	brian.gibson@gmail.com
*	michael.thornberry@gmail.com
*
* Usage:
*   $("ul#people>li").tsort();
*   $("ul#people>li").tsort("span.surname");
*   $("ul#people>li").tsort("span.surname",{order:"desc"});
*   $("ul#people>li").tsort({place:"end"});
*   $("ul#people>li").tsort("span.surname",{order:"desc"},span.name");
*
* Change default like so:
*   $.tinysort.defaults.order = "desc";
*
*/
;(function($,undefined) {
	'use strict';
	// private vars
	var fls = !1							// minify placeholder
		,nll = null							// minify placeholder
		,prsflt = parseFloat				// minify placeholder
		,mathmn = Math.min					// minify placeholder
		,rxLastNr = /(-?\d+\.?\d*)$/g		// regex for testing strings ending on numbers
		,rxLastNrNoDash = /(\d+\.?\d*)$/g	// regex for testing strings ending on numbers ignoring dashes
		,aPluginPrepare = []
		,aPluginSort = []
		,isString = function(o){return typeof o=='string';}
		,loop = function(array,func){
            var l = array.length
                ,i = l
                ,j;
            while (i--) {
                j = l-i-1;
                func(array[j],j);
            }
		}
		// Array.prototype.indexOf for IE (issue #26) (local variable to prevent unwanted prototype pollution)
		,fnIndexOf = Array.prototype.indexOf||function(elm) {
			var len = this.length
				,from = Number(arguments[1])||0;
			from = from<0?Math.ceil(from):Math.floor(from);
			if (from<0) from += len;
			for (;from<len;from++){
				if (from in this && this[from]===elm) return from;
			}
			return -1;
		}
	;
	//
	// init plugin
	$.tinysort = {
		 id: 'TinySort'
		,version: '1.5.6'
		,copyright: 'Copyright (c) 2008-2013 Ron Valstar'
		,uri: 'http://tinysort.sjeiti.com/'
		,licensed: {
			MIT: 'http://www.opensource.org/licenses/mit-license.php'
			,GPL: 'http://www.gnu.org/licenses/gpl.html'
		}
		,plugin: (function(){
			var fn = function(prepare,sort){
				aPluginPrepare.push(prepare);	// function(settings){doStuff();}
				aPluginSort.push(sort);			// function(valuesAreNumeric,sA,sB,iReturn){doStuff();return iReturn;}
			};
			// expose stuff to plugins
			fn.indexOf = fnIndexOf;
			return fn;
		})()
		,defaults: { // default settings

			 order: 'asc'			// order: asc, desc or rand

			,attr: nll				// order by attribute value
			,data: nll				// use the data attribute for sorting
			,useVal: fls			// use element value instead of text

			,place: 'start'			// place ordered elements at position: start, end, org (original position), first
			,returns: fls			// return all elements or only the sorted ones (true/false)

			,cases: fls				// a case sensitive sort orders [aB,aa,ab,bb]
			,forceStrings:fls		// if false the string '2' will sort with the value 2, not the string '2'

			,ignoreDashes:fls		// ignores dashes when looking for numerals

			,sortFunction: nll		// override the default sort function
		}
	};
	$.fn.extend({
		tinysort: function() {
			var i,j,l
				,oThis = this
				,aNewOrder = []
				// sortable- and non-sortable list per parent
				,aElements = []
				,aElementsParent = [] // index reference for parent to aElements
				// multiple sort criteria (sort===0?iCriteria++:iCriteria=0)
				,aCriteria = []
				,iCriteria = 0
				,iCriteriaMax
				//
				,aFind = []
				,aSettings = []
				//
				,fnPluginPrepare = function(_settings){
					loop(aPluginPrepare,function(fn){
						fn.call(fn,_settings);
					});
				}
				//
				,fnPrepareSortElement = function(settings,element){
					if (typeof element=='string') {
						// if !settings.cases
						if (!settings.cases) element = toLowerCase(element);
						element = element.replace(/^\s*(.*?)\s*$/i, '$1');
					}
					return element;
				}
				//
				,fnSort = function(a,b) {
					var iReturn = 0;
					if (iCriteria!==0) iCriteria = 0;
					while (iReturn===0&&iCriteria<iCriteriaMax) {
						var oPoint = aCriteria[iCriteria]
							,oSett = oPoint.oSettings
							,rxLast = oSett.ignoreDashes?rxLastNrNoDash:rxLastNr
						;
						//
						fnPluginPrepare(oSett);
						//
						if (oSett.sortFunction) { // custom sort
							iReturn = oSett.sortFunction(a,b);
						} else if (oSett.order=='rand') { // random sort
							iReturn = Math.random()<0.5?1:-1;
						} else { // regular sort
							var bNumeric = fls
								// prepare sort elements
								,sA = fnPrepareSortElement(oSett,a.s[iCriteria])
								,sB = fnPrepareSortElement(oSett,b.s[iCriteria])
							;
							// maybe force Strings
							if (!oSett.forceStrings) {
								// maybe mixed
								var  aAnum = isString(sA)?sA&&sA.match(rxLast):fls
									,aBnum = isString(sB)?sB&&sB.match(rxLast):fls;
								if (aAnum&&aBnum) {
									var  sAprv = sA.substr(0,sA.length-aAnum[0].length)
										,sBprv = sB.substr(0,sB.length-aBnum[0].length);
									if (sAprv==sBprv) {
										bNumeric = !fls;
										sA = prsflt(aAnum[0]);
										sB = prsflt(aBnum[0]);
									}
								}
							}
							iReturn = oPoint.iAsc*(sA<sB?-1:(sA>sB?1:0));
						}

						loop(aPluginSort,function(fn){
							iReturn = fn.call(fn,bNumeric,sA,sB,iReturn);
						});

						if (iReturn===0) iCriteria++;
					}

					return iReturn;
				}
			;
			// fill aFind and aSettings but keep length pairing up
			for (i=0,l=arguments.length;i<l;i++){
				var o = arguments[i];
				if (isString(o))	{
					if (aFind.push(o)-1>aSettings.length) aSettings.length = aFind.length-1;
				} else {
					if (aSettings.push(o)>aFind.length) aFind.length = aSettings.length;
				}
			}
			if (aFind.length>aSettings.length) aSettings.length = aFind.length; // todo: and other way around?

			// fill aFind and aSettings for arguments.length===0
			iCriteriaMax = aFind.length;
			if (iCriteriaMax===0) {
				iCriteriaMax = aFind.length = 1;
				aSettings.push({});
			}

			for (i=0,l=iCriteriaMax;i<l;i++) {
				var sFind = aFind[i]
					,oSettings = $.extend({}, $.tinysort.defaults, aSettings[i])
					// has find, attr or data
					,bFind = !(!sFind||sFind==='')
					// since jQuery's filter within each works on array index and not actual index we have to create the filter in advance
					,bFilter = bFind&&sFind[0]===':'
				;
				aCriteria.push({ // todo: only used locally, find a way to minify properties
					 sFind: sFind
					,oSettings: oSettings
					// has find, attr or data
					,bFind: bFind
					,bAttr: !(oSettings.attr===nll||oSettings.attr==='')
					,bData: oSettings.data!==nll
					// filter
					,bFilter: bFilter
					,$Filter: bFilter?oThis.filter(sFind):oThis
					,fnSort: oSettings.sortFunction
					,iAsc: oSettings.order=='asc'?1:-1
				});
			}
			//
			// prepare oElements for sorting
			oThis.each(function(i,el) {
				var $Elm = $(el)
					,mParent = $Elm.parent().get(0)
					,mFirstElmOrSub // we still need to distinguish between sortable and non-sortable elements (might have unexpected results for multiple criteria)
					,aSort = []
				;
				for (j=0;j<iCriteriaMax;j++) {
					var oPoint = aCriteria[j]
						// element or sub selection
						,mElmOrSub = oPoint.bFind?(oPoint.bFilter?oPoint.$Filter.filter(el):$Elm.find(oPoint.sFind)):$Elm;
					// text or attribute value
					aSort.push(oPoint.bData?mElmOrSub.data(oPoint.oSettings.data):(oPoint.bAttr?mElmOrSub.attr(oPoint.oSettings.attr):(oPoint.oSettings.useVal?mElmOrSub.val():mElmOrSub.text())));
					if (mFirstElmOrSub===undefined) mFirstElmOrSub = mElmOrSub;
				}
				// to sort or not to sort
				var iElmIndex = fnIndexOf.call(aElementsParent,mParent);
				if (iElmIndex<0) {
					iElmIndex = aElementsParent.push(mParent) - 1;
					aElements[iElmIndex] = {s:[],n:[]};	// s: sort, n: not sort
				}
				if (mFirstElmOrSub.length>0)	aElements[iElmIndex].s.push({s:aSort,e:$Elm,n:i}); // s:string/pointer, e:element, n:number
				else							aElements[iElmIndex].n.push({e:$Elm,n:i});
			});
			//
			// sort
			loop(aElements, function(oParent) { oParent.s.sort(fnSort); });
			//
			// order elements and fill new order
			loop(aElements, function(oParent) {
				var aSorted = oParent.s
                    ,aUnsorted = oParent.n
                    ,iSorted = aSorted.length
                    ,iUnsorted = aUnsorted.length
                    ,iNumElm = iSorted+iUnsorted
					,aOriginal = [] // list for original position
					,iLow = iNumElm
					,aCount = [0,0] // count how much we've sorted for retrieval from either the sort list or the non-sort list (oParent.s/oParent.n)
				;
				switch (oSettings.place) {
					case 'first':	loop(aSorted,function(obj) { iLow = mathmn(iLow,obj.n); }); break;
					case 'org':		loop(aSorted,function(obj) { aOriginal.push(obj.n); }); break;
					case 'end':		iLow = iUnsorted; break;
					default:		iLow = 0;
				}
				for (i=0;i<iNumElm;i++) {
					var bFromSortList = contains(aOriginal,i)?!fls:i>=iLow&&i<iLow+iSorted
                        ,iCountIndex = bFromSortList?0:1
						,mEl = (bFromSortList?aSorted:aUnsorted)[aCount[iCountIndex]].e;
					mEl.parent().append(mEl);
					if (bFromSortList||!oSettings.returns) aNewOrder.push(mEl.get(0));
					aCount[iCountIndex]++;
				}
			});
			oThis.length = 0;
			Array.prototype.push.apply(oThis,aNewOrder);
			return oThis;
		}
	});
	// toLowerCase // todo: dismantle, used only once
	function toLowerCase(s) {
		return s&&s.toLowerCase?s.toLowerCase():s;
	}
	// array contains
	function contains(a,n) {
		for (var i=0,l=a.length;i<l;i++) if (a[i]==n) return !fls;
		return fls;
	}
	// set functions
	$.fn.TinySort = $.fn.Tinysort = $.fn.tsort = $.fn.tinysort;
})(jQuery);
;
/*!
 * Simple jQuery Equal Heights
 *
 * Copyright (c) 2013 Matt Banks
 * Dual licensed under the MIT and GPL licenses.
 * Uses the same license as jQuery, see:
 * http://docs.jquery.com/License
 *
 * @version 1.5.1
 */
!function(a){a.fn.equalHeights=function(){var b=0,c=a(this);return c.each(function(){var c=a(this).innerHeight();c>b&&(b=c)}),c.css("height",b)},a("[data-equal]").each(function(){var b=a(this),c=b.data("equal");b.find(c).equalHeights()})}(jQuery);;
// Sitewide Custom JS (legacy host/CMS).
(function ($) {
	Drupal.behaviors.tsFancybox = {
		attach: function(context, settings) {
      $(".lightbox", context).fancybox({
        maxWidth: 680,
        scrolling: 'visible',
        padding: 10,
        openEffect: 'none',
        closeEffect: 'none',
        nextEffect: 'none',
        prevEffect: 'none',
        autoCenter: true,
        aspectRatio: true,
        margin: [20, 60, 20, 60],
        helpers: {
          media: true,
          overlay: {
            closeClick: true,
            locked: true
          }
        }
      });

      if (context == document && !faGetCookie('FA-Promo')) {
        var lightboxPromo = $('.lightbox-promo');
        var imgSrc = lightboxPromo.find('img').attr('src');

        function lightboxPromoOpen() {
          $.fancybox.open(lightboxPromo, {
            maxWidth: 680,
            scrolling: 'visible',
            padding: 10,
            openEffect: 'none',
            closeEffect: 'none',
            nextEffect: 'none',
            prevEffect: 'none',
            autoCenter: true,
            aspectRatio: true,
            margin: [20, 60, 20, 60],
            afterClose: function() {
              faSetCookie('FA-Promo', true, 1);
            }
          });
        }

        if (imgSrc) {
          var preloadImg = new Image();
          preloadImg.onload = lightboxPromoOpen;
          preloadImg.src = imgSrc;
        } else {
          lightboxPromoOpen();
        }
      }

      $(".lightbox2", context).fancybox({
        maxWidth: 680,
        scrolling: 'visible',
        padding: 20,
        openEffect: 'none',
        closeEffect: 'none',
        nextEffect: 'none',
        prevEffect: 'none',
        autoCenter: true,
        fitToView: false,
//        margin      : [20, 60, 20, 60],
        helpers: {
          overlay: {
            locked: true
          }
        }
      });
		} // attach
	}; // tsFeedingAmerica
})(jQuery, Drupal, window);

;
if (typeof FA == 'undefined') { // Make sure FA namespace is initialized
    var FA = {};
}

// Homepage dynamic web service driven elements
jQuery(document).ready(function() {
    if (FA.ws) {
        // --- Find Your Local Food Bank ---
        function findYourLocalFoodBank(zip, doState) {
            var results = jQuery('#homepage_zip_search_results');
            results.empty().hide(); // Clear the display

            // Validate zip
            var dZip = zip.replace(/\D/g,'');
            if (dZip.length != 5 || dZip != zip) {
                results.append('This is an invalid zip. Please try a valid U.S. zip').show();
                return;
            }

            // Do the request
            if (zip != '') {
                results.append('<div class="loading-white"></div>').show(); // Loading...
                faSetCookie('cms_cons_zip', zip, 365);

                FA.ws.request('GetOrganizationsByZip', { zip: zip }, 'Organization', function(data) {
                    var counter = 0;
                    results.empty();
                    for (var key in data) {
                        counter++;
                        if (counter > 2) { return; } // Display only first two results

                        var org = data[key];
                        var profileUrlName = (org.FullName.replace(/ - /g, '-')).replace(/ /g, '-').toLowerCase();
                        var profileUrl = '/find-your-local-foodbank/' + (profileUrlName.replace(/[&]/g, 'and')).replace(/[^a-zA-Z0-9-]/g, '');

                        results.append([
                            '<div class="find_local_food_bank_result" aria-live="polite">',
                            '<a href="', profileUrl, '">', org.FullName, '</a> &nbsp;&bull;&nbsp; ', org.MailAddress.City, ', ', org.MailAddress.State,
                            '</div>'
                        ].join(''));
                    }

                    if (counter == 0) { // No results
                        results.append('This is an invalid zip. Please try a valid U.S. zip');
                    }

                }, function(response) { // Error
                    results.html('Our online search is not working at this time. To find out your food bank, please call us at 800.771.2303');
                });

                if (doState) {
                    stateHungerMeterByZip(zip);
                }
            }
        }

        function stateHungerMeterByZip(zip) {
            if (zip != '') { // Do the request
                FA.ws.request('GetStateStatisticsByZip', { zip: zip }, '/', function(data) {
                    if (data && data.StateID && data.Name) {
//                        displayHungerMeterResults(data.Name, data.StateID, data.Name, data.StateStats.FoodInsecurityRate);
                        displayHungerMeterResults(data.Name, data.StateID, data.Name, data.StateStats.MMG_FI_FULL_POP_RATE);

                        jQuery('#homepage_ending_select').val(data.StateID);
                        faSetCookie('cms_cons_state', data.StateID, 365);

                        return;
                    }
                    // No results
                    // ...
                }, function(response) { // Error
                    // No results behaviour
                });
            }
        }

        // Homepage: Find Your Local Food Bank
        jQuery('#homepage_zip_search_form button[type="submit"]').once().click(function(e) {
            e.preventDefault();
            jQuery('#homepage_zip_search_form input[name="zip"]')
                .attr('value',jQuery('#homepage_zip_search_form input[name="zip"]').val());
            findYourLocalFoodBank(jQuery('#homepage_zip_search_form input[name="zip"]').val(), true);
        });

        var cms_cons_zip = faGetCookie('cms_cons_zip'); // Get zip from cookies
        if (cms_cons_zip && cms_cons_zip == '') {
            cms_cons_zip = jQuery('#cms_cons_zip').val(); // Get zip from user's record
        }
        if (cms_cons_zip && cms_cons_zip != '') { // We already have the user's zip
            jQuery('#homepage_zip_search_form input[name="zip"]')
                .val(cms_cons_zip)
                .attr('value',cms_cons_zip);
            findYourLocalFoodBank(cms_cons_zip, true);
        }

        // --- Hunger Meter ---
        // Homepage: State hunger meter
        jQuery('#homepage_ending_select').change(function(e) {
            e.preventDefault();
            var id = jQuery(this).val();
            switch (id) {
                case 'US' :
                    nationHungerMeter();
                    break;
                default :
                    if (id != '') {
                        faSetCookie('cms_cons_state', id, 365);
                        stateHungerMeter(id);
                    }
                    break;
            }
        });

        if (cms_cons_zip && cms_cons_zip != '') { // We already have the user's zip
            // Do nothing
        } else {
            var cms_cons_state = faGetCookie('cms_cons_state'); // Get state from cookies
            if (cms_cons_state && cms_cons_state == '') {
                cms_cons_state = jQuery('#cms_cons_state').val(); // Get state from user's record
            }
            if (cms_cons_state && cms_cons_state != '') { // We already have the user's state
                jQuery('#homepage_ending_select').val(cms_cons_state);
                faSetCookie('cms_cons_state', cms_cons_state, 365);
                stateHungerMeter(cms_cons_state);
            } else { // Nationwide
                nationHungerMeter();
            }
        }
    }
});
;
if (typeof FA == 'undefined') { // Make sure FA namespace is initialized
	var FA = {};
}

// Constants
FA.howweareending = {
	nationwide: {
		food_insecurity_rate: 0.118
	},
	stat: {
		img_src: '/themes/custom/ts_feeding_america/images/howweareending_1in[count].png'
	},
	state: {
		img_src: '/themes/custom/ts_feeding_america/images/state-icons/howweareending_[id].png',
		link: '/hunger-in-america/impact-of-hunger/states/'
	},
	map_link: {
		//link: 'http://map.feedingamerica.org/county/2014/overall/'
		link: '/hunger-in-america/'
		//link: 'http://www.feedingamerica.org/hunger-in-america/the-united-states/'
	},
	rate: function(num) {
		if (isNaN(num) || num == 0) {
			return false;
		}
        num = 1/num;
        num = Math.round(num);
        num = Math.min(1000, num);
        num = Math.max(1, num);
        return num;
	}
}
let faHowWeAreEnding = FA.howweareending;

// Hunger Meter
function displayHungerMeterResults(loc, id, name, rate) {
	var msg = 'in ';
	var link = faHowWeAreEnding.state.link + name.replace(/ /g, '-').toLowerCase();
	var count = faHowWeAreEnding.rate(rate);
    var count_image = Math.min(13, count);
    count_image = Math.max(2, count_image);
	var hungerImg = (faHowWeAreEnding.stat.img_src).replace('[count]', count_image);
	var map_link = faHowWeAreEnding.map_link.link + name.replace(/ /g, '-').toLowerCase();
	var learn_more = 'Learn more about hunger ';

	switch (id) {
		case 'DC' :
			msg = 'In the ';
			break;
	}
	if (count === false) {
		msg = '<a href="' + map_link + '">' + learn_more + msg + loc + '</a>' + '.';
		alt = 'Graphic showing 1 in 9 people face hunger.';
	}
	else {
		//msg += "<a href='" + map_link + "'>" + loc + "</a>" + ', 1 in ' + count.toString() + ' people';
		msg += '<span class="state">' + loc + '</span>' + ', 1 in ' + count.toString() + ' people face hunger. ' + '<a href="' + map_link + '">' + learn_more + msg + loc + '</a>' + '.';
		alt = 'Graphic showing 1 in ' + count.toString() + ' people face hunger.';
	}

	jQuery('#howweareending_stat_msg').html(msg);
	if (count === false) {
		jQuery('#howweareending_stat_img').hide();
	}
	else {
		jQuery('#howweareending_stat_img').attr('src', hungerImg).attr('alt', alt);
		jQuery('#howweareending_stat_img').show();
	}
	jQuery('#howweareending_state_img').attr('src', (faHowWeAreEnding.state.img_src).replace('[id]', id.toLowerCase())).attr('alt', loc);
	jQuery('#howweareending_social_icons').attr('addthis:url', link).attr('addthis:title', 'Hunger in ' + id);
	jQuery('#howweareending_state_img').wrap("<a href='" + map_link + "'></a>");

}

function stateHungerMeter(state) {
	if (state != '') { // Do the request
		FA.ws.request('GetStateStatisticsByState', { state: state }, '/', function(data) {
			if (data && data.StateID) {
				displayHungerMeterResults(data.Name, data.StateID, data.Name, data.StateStats.FoodInsecurityRate);
				return;
			}
			// No results
			// ...
		}, function(response) { // Error
			// No results behaviour
		});
	}
}

function nationHungerMeter() {
	displayHungerMeterResults('the United States', 'US', 'United States', faHowWeAreEnding.nationwide.food_insecurity_rate);
}
;
/*
Modified version of: http://www.fyneworks.com/jquery/xml-to-json/
*/
// Avoid collisions
;if(window.jQuery) (function($){
 
 // Add function to jQuery namespace
 $.extend({
  
  // converts xml documents and xml text to json object
  xml2json: function(xml, extended) {
   if(!xml) return {}; // quick fail
   
   //### PARSER LIBRARY
   // Core function
   function parseXML(node, simple){
    if(!node) return null;
    var txt = '', obj = null, att = null;
    var nt = node.nodeType, nn = jsVar(node.localName || node.nodeName);
    var nv = node.text || node.nodeValue || '';
    /*DBG*/ //if(window.console) console.log(['x2j',nn,nt,nv.length+' bytes']);
    if(node.childNodes){
     if(node.childNodes.length>0){
      var children = node.childNodes;
      if (children.length==1) {
       children = [node.firstChild];
      }
      /*DBG*/ //if(window.console) console.log(['x2j',nn,'CHILDREN',node.childNodes]);
      $.each(children, function(n,cn){
       var cnt = cn.nodeType, cnn = jsVar(cn.localName || cn.nodeName);
       var cnv = cn.text || cn.nodeValue || '';
       /*DBG*/ //if(window.console) console.log(['x2j',nn,'node>a',cnn,cnt,cnv]);
       if(cnt == 8){
        /*DBG*/ //if(window.console) console.log(['x2j',nn,'node>b',cnn,'COMMENT (ignore)']);
        return; // ignore comment node
       }
       else if(cnt == 3 || cnt == 4 || !cnn){
        // ignore white-space in between tags
        if(cnv.match(/^\s+$/)){
         /*DBG*/ //if(window.console) console.log(['x2j',nn,'node>c',cnn,'WHITE-SPACE (ignore)']);
         return;
        };
        /*DBG*/ //if(window.console) console.log(['x2j',nn,'node>d',cnn,'TEXT']);
        txt += cnv.replace(/^\s+/,'').replace(/\s+$/,'');
								// make sure we ditch trailing spaces from markup
       }
       else{
        /*DBG*/ //if(window.console) console.log(['x2j',nn,'node>e',cnn,'OBJECT']);
        obj = obj || {};
        if(obj[cnn]){
         /*DBG*/ //if(window.console) console.log(['x2j',nn,'node>f',cnn,'ARRAY']);
         
									// http://forum.jquery.com/topic/jquery-jquery-xml2json-problems-when-siblings-of-the-same-tagname-only-have-a-textnode-as-a-child
									if(!obj[cnn].length) obj[cnn] = myArr(obj[cnn]);
									obj[cnn] = myArr(obj[cnn]);
         
									obj[cnn][ obj[cnn].length ] = parseXML(cn, true/* simple */);
         obj[cnn].length = obj[cnn].length;
        }
        else{
         /*DBG*/ //if(window.console) console.log(['x2j',nn,'node>g',cnn,'dig deeper...']);
         obj[cnn] = parseXML(cn);
        };
       };
      });
     };//node.childNodes.length>0
    };//node.childNodes
    if(node.attributes){
     if(node.attributes.length>0){
      /*DBG*/ //if(window.console) console.log(['x2j',nn,'ATTRIBUTES',node.attributes])
      att = {}; obj = obj || {};
      $.each(node.attributes, function(a,at){
       var atn = jsVar(at.name), atv = at.value;
       att[atn] = atv;
       if(obj[atn]){
        /*DBG*/ //if(window.console) console.log(['x2j',nn,'attr>',atn,'ARRAY']);
        
								// http://forum.jquery.com/topic/jquery-jquery-xml2json-problems-when-siblings-of-the-same-tagname-only-have-a-textnode-as-a-child
								//if(!obj[atn].length) obj[atn] = myArr(obj[atn]);//[ obj[ atn ] ];
        obj[cnn] = myArr(obj[cnn]);
								
								obj[atn][ obj[atn].length ] = atv;
        obj[atn].length = obj[atn].length;
       }
       else{
        /*DBG*/ //if(window.console) console.log(['x2j',nn,'attr>',atn,'TEXT']);
        obj[atn] = atv;
       };
      });
      //obj['attributes'] = att;
     };//node.attributes.length>0
    };//node.attributes
    if(obj){
     obj = $.extend( (txt!='' ? new String(txt) : {}),/* {text:txt},*/ obj || {}/*, att || {}*/);
     //txt = (obj.text) ? (typeof(obj.text)=='object' ? obj.text : [obj.text || '']).concat([txt]) : txt;
     txt = (obj.text) ? ([obj.text || '']).concat([txt]) : txt;
     if(txt) obj.text = txt;
     txt = '';
    };
    var out = obj || txt;
    //console.log([extended, simple, out]);
    if(extended){
     if(txt) out = {};//new String(out);
     txt = out.text || txt || '';
     if(txt) out.text = txt;
     if(!simple) out = myArr(out);
    };
    return out;
   };// parseXML
   // Core Function End
   // Utility functions
   var jsVar = function(s){ return String(s || '').replace(/-/g,"_"); };
   
			// NEW isNum function: 01/09/2010
			// Thanks to Emile Grau, GigaTecnologies S.L., www.gigatransfer.com, www.mygigamail.com
			function isNum(s){
				// based on utility function isNum from xml2json plugin (http://www.fyneworks.com/ - diego@fyneworks.com)
				// few bugs corrected from original function :
				// - syntax error : regexp.test(string) instead of string.test(reg)
				// - regexp modified to accept  comma as decimal mark (latin syntax : 25,24 )
				// - regexp modified to reject if no number before decimal mark  : ".7" is not accepted
				// - string is "trimmed", allowing to accept space at the beginning and end of string
				var regexp=/^((-)?([0-9]+)(([\.\,]{0,1})([0-9]+))?$)/
				return (typeof s == "number") || regexp.test(String((s && typeof s == "string") ? jQuery.trim(s) : ''));
			};
			// OLD isNum function: (for reference only)
			//var isNum = function(s){ return (typeof s == "number") || String((s && typeof s == "string") ? s : '').test(/^((-)?([0-9]*)((\.{0,1})([0-9]+))?$)/); };
																
   var myArr = function(o){
    
				// http://forum.jquery.com/topic/jquery-jquery-xml2json-problems-when-siblings-of-the-same-tagname-only-have-a-textnode-as-a-child
				//if(!o.length) o = [ o ]; o.length=o.length;
    if(!$.isArray(o)) o = [ o ]; o.length=o.length;
				
				// here is where you can attach additional functionality, such as searching and sorting...
    return o;
   };
   // Utility functions End
   //### PARSER LIBRARY END
   
   // Convert plain text to xml
   if(typeof xml=='string') xml = $.text2xml(xml);
   
   // Quick fail if not xml (or if this is a node)
   if(!xml.nodeType) return;
   if(xml.nodeType == 3 || xml.nodeType == 4) return xml.nodeValue;
   
   // Find xml root node
   var root = (xml.nodeType == 9) ? xml.documentElement : xml;
   
   // Convert xml to json
   var out = parseXML(root, true /* simple */);
   
   // Clean-up memory
   xml = null; root = null;
   
   // Send output
   return out;
  },
  
  // Convert text to XML DOM
  text2xml: function(str) {
   // NOTE: I'd like to use jQuery for this, but jQuery makes all tags uppercase
   //return $(xml)[0];
   
   /* prior to jquery 1.9 */
   /*
   var out;
   try{
    var xml = ((!$.support.opacity && !$.support.style))?new ActiveXObject("Microsoft.XMLDOM"):new DOMParser();
    xml.async = false;
   }catch(e){ throw new Error("XML Parser could not be instantiated") };
   try{
    if((!$.support.opacity && !$.support.style)) out = (xml.loadXML(str))?xml:false;
    else out = xml.parseFromString(str, "text/xml");
   }catch(e){ throw new Error("Error parsing XML string") };
   return out;
   */

   /* jquery 1.9+ */
   return $.parseXML(str);
  }
		
 }); // extend $

})(jQuery);
;
/*!
 * jQuery-ajaxTransport-XDomainRequest - v1.0.3 - 2014-06-06
 * https://github.com/MoonScript/jQuery-ajaxTransport-XDomainRequest
 * Copyright (c) 2014 Jason Moon (@JSONMOON)
 * Licensed MIT (/blob/master/LICENSE.txt)
 */
(function(factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as anonymous module.
    define(['jquery'], factory);
  } else if (typeof exports === 'object') {
    // CommonJS
    module.exports = factory(require('jquery'));
  } else {
    // Browser globals.
    factory(jQuery);
  }
}(function($) {

// Only continue if we're on IE8/IE9 with jQuery 1.5+ (contains the ajaxTransport function)
if ($.support.cors || !$.ajaxTransport || !window.XDomainRequest) {
  return;
}

var httpRegEx = /^https?:\/\//i;
var getOrPostRegEx = /^get|post$/i;
var sameSchemeRegEx = new RegExp('^'+location.protocol, 'i');

// ajaxTransport exists in jQuery 1.5+
$.ajaxTransport('* text html xml json', function(options, userOptions, jqXHR) {
  
  // Only continue if the request is: asynchronous, uses GET or POST method, has HTTP or HTTPS protocol, and has the same scheme as the calling page
  if (!options.crossDomain || !options.async || !getOrPostRegEx.test(options.type) || !httpRegEx.test(options.url) || !sameSchemeRegEx.test(options.url)) {
    return;
  }

  var xdr = null;

  return {
    send: function(headers, complete) {
      var postData = '';
      var userType = (userOptions.dataType || '').toLowerCase();

      xdr = new XDomainRequest();
      if (/^\d+$/.test(userOptions.timeout)) {
        xdr.timeout = userOptions.timeout;
      }

      xdr.ontimeout = function() {
        complete(500, 'timeout');
      };

      xdr.onload = function() {
        var allResponseHeaders = 'Content-Length: ' + xdr.responseText.length + '\r\nContent-Type: ' + xdr.contentType;
        var status = {
          code: 200,
          message: 'success'
        };
        var responses = {
          text: xdr.responseText
        };
        try {
          if (userType === 'html' || /text\/html/i.test(xdr.contentType)) {
            responses.html = xdr.responseText;
          } else if (userType === 'json' || (userType !== 'text' && /\/json/i.test(xdr.contentType))) {
            try {
              responses.json = $.parseJSON(xdr.responseText);
            } catch(e) {
              status.code = 500;
              status.message = 'parseerror';
              //throw 'Invalid JSON: ' + xdr.responseText;
            }
          } else if (userType === 'xml' || (userType !== 'text' && /\/xml/i.test(xdr.contentType))) {
            var doc = new ActiveXObject('Microsoft.XMLDOM');
            doc.async = false;
            try {
              doc.loadXML(xdr.responseText);
            } catch(e) {
              doc = undefined;
            }
            if (!doc || !doc.documentElement || doc.getElementsByTagName('parsererror').length) {
              status.code = 500;
              status.message = 'parseerror';
              throw 'Invalid XML: ' + xdr.responseText;
            }
            responses.xml = doc;
          }
        } catch(parseMessage) {
          throw parseMessage;
        } finally {
          complete(status.code, status.message, responses, allResponseHeaders);
        }
      };

      // set an empty handler for 'onprogress' so requests don't get aborted
      xdr.onprogress = function(){};
      xdr.onerror = function() {
        complete(500, 'error', {
          text: xdr.responseText
        });
      };

      if (userOptions.data) {
        postData = ($.type(userOptions.data) === 'string') ? userOptions.data : $.param(userOptions.data);
      }
      xdr.open(options.type, options.url);
      xdr.send(postData);
    },
    abort: function() {
      if (xdr) {
        xdr.abort();
      }
    }
  };
});

}));
;
jQuery(document).ready(function(jQuery){

    //jQuery('#map_states option.the-united-states').remove();

    jQuery('#map_states').on('change', function() {
      window.location.href = jQuery('#map_states option:selected').val();
    });

    FA.howweareending = {
      rate: function(num) {
        if (isNaN(num) || num == 0) {
          return false;
        }
        num = 1/num;
        num = Math.round(num);
        num = Math.min(1000, num);
        num = Math.max(1, num);
        return num;
      }
    }

    var statesFullToAbbr = {
      "Alabama": "AL",
      "Alaska": "AK",
      "American Samoa": "AS",
      "Arizona": "AZ",
      "Arkansas": "AR",
      "California": "CA",
      "Colorado": "CO",
      "Connecticut": "CT",
      "Delaware": "DE",
      "District Of Columbia": "DC",
      "Federated States Of Micronesia": "FM",
      "Florida": "FL",
      "Georgia": "GA",
      "Guam": "GU",
      "Hawaii": "HI",
      "Idaho": "ID",
      "Illinois": "IL",
      "Indiana": "IN",
      "Iowa": "IA",
      "Kansas": "KS",
      "Kentucky": "KY",
      "Louisiana": "LA",
      "Maine": "ME",
      "Marshall Islands": "MH",
      "Maryland": "MD",
      "Massachusetts": "MA",
      "Michigan": "MI",
      "Minnesota": "MN",
      "Mississippi": "MS",
      "Missouri": "MO",
      "Montana": "MT",
      "Nebraska": "NE",
      "Nevada": "NV",
      "New Hampshire": "NH",
      "New Jersey": "NJ",
      "New Mexico": "NM",
      "New York": "NY",
      "North Carolina": "NC",
      "North Dakota": "ND",
      "Northern Mariana Islands": "MP",
      "Ohio": "OH",
      "Oklahoma": "OK",
      "Oregon": "OR",
      "Palau": "PW",
      "Puerto Rico": "PR",
      "Pennsylvania": "PA",
      "Rhode Island": "RI",
      "South Carolina": "SC",
      "South Dakota": "SD",
      "Tennessee": "TN",
      "Texas": "TX",
      "The United States": "US",
      "Utah": "UT",
      "Vermont": "VT",
      "Virgin Islands": "VI",
      "Virginia": "VA",
      "Washington": "WA",
      "West Virginia": "WV",
      "Wisconsin": "WI",
      "Wyoming": "WY"
    };

    jQuery('#mlp_map_states').on('change', function() {

      var this_select = document.getElementById('mlp_map_states');
      var mlpStateTitle = this_select.options[this_select.selectedIndex].text;
      var mlpStateName = statesFullToAbbr[mlpStateTitle];
      var mlpStateRateText = document.getElementById("state_hunger_rate_text");

      if (mlpStateName != '' && mlpStateRateText) {
        FA.ws.request('GetStateStatisticsByState', {
          state: mlpStateName
        }, '/', function(data) {
          var foodInsecure = FA.howweareending.rate(data.StateStats.FoodInsecurityRate);
          if (mlpStateName == 'US' || mlpStateName == 'PR') {
            foodInsecure = '9';
          }
          var mlpStateRateTextString = ' ';
          if (foodInsecure) {
            mlpStateRateTextString = 'where 1 in '+foodInsecure+' people struggle with hunger.';
          }
          jQuery(mlpStateRateText).text(mlpStateRateTextString);
          Drupal.announce(
            Drupal.t("I live in " + mlpStateTitle + " " + mlpStateRateTextString)
          );
        }, function(response) { // Error
          jQuery(mlpStateRateText).text(' ');
        });
      }
    });

    var stateTitle = jQuery('#stateTitleID').text().trim();
    var stateName = statesFullToAbbr[stateTitle];
    if (typeof stateName === 'undefined') {
      return;
    }
    var stateNameLower = stateName.toLowerCase();

    jQuery('.state_img').attr('src', '/themes/custom/ts_feeding_america/images/state-icons/howweareending_' + stateNameLower + '.png');

    var multiplier = jQuery('.economic-activity .orange strong').text().replace(/\,/g, '');
    var parseMultiplier = parseInt(multiplier);
    var roundMultiplier = Math.round(multiplier);
    var commaMultiplier = Number(roundMultiplier).toLocaleString('en');
    jQuery('.economic-activity .orange strong').html('$' + commaMultiplier);
    if (stateTitle != 'The United States') {
      jQuery('.stateTitle').html(stateTitle);
    }
    else {
      jQuery('.stateTitle').html('the United States');
    }

    if (stateTitle == 'The United States') {

      var orgProperties = {
        'OrganizationID': 1,
        'FullName': 1,
        'Phone': 1,
        'URL': 1,
        'AgencyURL': 1,
        'VolunteerURL': 1,
        'MailAddress': { 'Latitude': 1, 'Longitude': 1, 'Address1': 1, 'Address2': 1, 'City': 1, 'State': 1, 'Zip': 1 },
        'LogoUrls': { 'FoodBankLocator': 1 },
        'ListPDOs': 'list_PDO',
        'list_PDO': { 'Title': 1, 'Address': 1, 'City': 1, 'State': 1, 'ZipCode': 1, 'Phone': 1, 'Website': 1 }
      };

      var nodeValue = function(node) {
        var nv = '';
        switch (node.nodeType) {
          case 1: // ELEMENT_NODE
          nv = node.textContent || node.innerText || node.text;
          break;
        }
        return nv;
      };

      function orgXmlListToJson(node, id) {
        var list = new Array(),
        data = FA.ws.getArrayOfChildren(node);
        attr = orgProperties[id];
        for (var i = 0; i < data.length; i++) {
          var node = data[i];
          list.push(orgXmlToJson(node, attr));
        }
        return list;
      }

      function orgXmlToJson(node, attr) {
        var item = {},
        data = FA.ws.getArrayOfChildren(node);
        for (var i = 0; i < data.length; i++) {
          var node = data[i],
          nn = node.localName || node.nodeName,
          match = attr[nn];
          if (match) {
            if (match === 1) {
              item[nn] = nodeValue(node);
            } else if (typeof match == 'string' && match.substring(0, 5) == 'list_') {
              item[nn] = orgXmlListToJson(node, match);
            } else {
              item[nn] = orgXmlToJson(node, match);
            }
          }
        }
        return item;
      }
    }


    function stateHungerMeter(state) {
      if (state != '') {
        FA.ws.request('GetStateStatisticsByState', {
          state: state
        }, '/', function(data) {
          var childFoodCount = FA.howweareending.rate(data.StateStats.CHILD_FI_PCT);
          var foodInsecure = FA.howweareending.rate(data.StateStats.FoodInsecurityRate);
          var peopleHunger = Number(data.StateStats.MMG_FI_INDV_POP_COUNT).toLocaleString('en');
          var childHunger = Number(data.StateStats.CHILD_FI_COUNT).toLocaleString('en');
          var annualDollars = Number(data.StateStats.WT_ANNUAL_DOLLARS).toLocaleString('en');
          if (state == 'US') {
              childFoodCount = '6';
              foodInsecure = '8';
              peopleHunger = '38,287,000';
              childHunger = '11,722,000';
              annualDollars = '20,033,673,000';
              data.StateStats.COST_PER_MEAL = '3.25';
          }
          else if (state == 'PR') {
              jQuery('.state-content h2').first().hide();
              jQuery('.state-data').hide();
          }

          jQuery('.child_count').html('1 in ' + childFoodCount);
          jQuery('.people_count').html('1 in ' + foodInsecure);
          var food_insecure_image = Math.min(14, foodInsecure);
          food_insecure_image = Math.max(2, food_insecure_image);
          jQuery('.stat_img').attr('src', '/themes/custom/ts_feeding_america/images/profile_1in' + food_insecure_image + '.png');
          jQuery('.peopleHunger').html(peopleHunger);
          jQuery('.childHunger').html(childHunger);
          jQuery('.cost-per-meal').html('$' + data.StateStats.COST_PER_MEAL);
          jQuery('.wt-annual-dollars').html('$' + annualDollars);

        }, function(response) { // Error
        });
      }
    }
    stateHungerMeter(stateName);

    function stateFoodBanks(state) {
      if (state != '') {

        if (stateTitle == 'The United States') {
          mapAllOrgs(null);
          return;
        }
        FA.ws.request('GetOrganizationsByState', {
          state: state
        }, 'Organization',
        function(data) {
          if (data !== null) {
            var resultsWrapper = jQuery('#find-fb-search-results');

            for (var key in data) { // build our HTML for each item
              var org = data[key];
              jQuery('#find-fb-search-results').append(buildFAOrgResultBox(org));
            }
            buildFAOrgsSummaryBox(data, resultsWrapper, name);
          }
        },
        function(response) { // Error
        });
      }
    }
    stateFoodBanks(stateName);

    function mapAllOrgs(execSearch) {
      var xml, resultsWrapper = jQuery('#find-fb-search-results');
      resultsWrapper.empty();
      FA.ws.request('GetAllOrganizations', {}, null,
        function(data) {
          xml = FA.ws.getArrayOfChildren(data.documentElement);
          returnFAResults(xml, 'the United States', execSearch);
        },
        function(response) { // Error
          hideResultBoxes();
          resultsWrapper.append('<p id="errorMessage">Our online search is not working at this time. To find your food bank, please call us at 800.771.2303.</p>');
          resultsWrapper.show();
        });
    }

    function buildFAOrgResultBox(org) {
      var resultsBox = jQuery('<div class="results-box" data-orgid="' + org.OrganizationID + '">'),
      profileUrlName = (org.FullName.replace(/ - /g, '-')).replace(/ /g, '-').toLowerCase(),
      profileUrl = '/find-your-local-foodbank/' + (profileUrlName.replace(/[&]/g, 'and')).replace(/[^a-zA-Z0-9-]/g, ''),
      orgImage = '<a href="' + profileUrl + '"><img width="230" height="" loading="lazy" border="0" alt="' + org.FullName + '" src="' + org.LogoUrls.FoodBankLocator + '"></a>',
      orgName = '<p class="name"><a href="' + profileUrl + '">' + org.FullName + '</a></p>',
      addressString = (org.MailAddress.Address2) ? org.MailAddress.Address1 + '<br>' + org.MailAddress.Address2 + '<br>' : org.MailAddress.Address1 + '<br>',
      orgAddress = '<p>' + addressString + org.MailAddress.City + ', ' + org.MailAddress.State + ' ' + org.MailAddress.Zip + '<br>' + org.Phone + '</p>',
      orgUrl = '<p class="url"><a href="//' + org.URL + '">' + org.URL + '</a></p>',
      orgAgencyButton = '',
      orgVolunteerURL = '';

      resultsBox.append(orgImage + orgName + orgAddress + orgUrl);


      if (org.AgencyURL !== '' || org.VolunteerURL !== '') {
        if (org.AgencyURL !== '') { // TODO: temp style, put in CSStemp style, put in CSS
          orgAgencyButton = '<a href="' + org.AgencyURL + '" class="green button" style="padding: 11px 10px"> Find Food </a>&nbsp;&nbsp;';
        }
        if (org.VolunteerURL !== '') {
          orgVolunteerURL = '<a href="' + org.VolunteerURL + '" class="green button" style="padding: 11px 10px"> Volunteer </a>&nbsp;&nbsp;';
        }
        resultsBox.append('<div class="buttonWrapper">' + orgAgencyButton + orgVolunteerURL + '</div>');
      }

      if (org.ListPDOs !== '' && org.ListPDOs.length) {
        // console.log('PDO is not null');
        var listPDOs = org.ListPDOs,
        pdoWrapper = jQuery('<div class="partner-orgs"/>'),
        pdoListWrapper = jQuery('<ul />');
        pdoWrapper.append('Partner Distribution Organizations:');
        for (var i = 0; i < listPDOs.length; i++) {
          var pdo = listPDOs[i];
          pdoListWrapper.append('<li>' + pdo.Title + '<br>' + pdo.Address + '<br>' + pdo.City + ', ' + pdo.State + ' ' + (pdo.ZipCode ? pdo.ZipCode : '') + '<br>' + pdo.Phone + '<br>' + (pdo.Website ? ('<a href="' + pdo.Website + '">' + pdo.Website + '</a>') : ''));
        }
        pdoWrapper.append(pdoListWrapper);
        resultsBox.append(pdoWrapper);
      }
      return resultsBox;
    }

    function buildFAOrgsSummaryBox(data, resultsWrapper, searchString) {
      if (stateTitle == 'The United States') {
        var headlineString = ' Feeding America Food Bank[s] that serve the United States';
      } else {
        var headlineString = ' Feeding America Food Bank[s] that serve[t] ' + stateTitle;
      }
      if (data.length === 1) {
        headlineString = '1' + headlineString.replace('[s]', '').replace('[t]', 's');
      } else {
        headlineString = data.length.toString() + headlineString.replace('[s]', 's').replace('[t]', '') + ' ';
      }

      jQuery('#fbSearchSummary').remove();
      resultsWrapper.prepend(
        '<div class="results-box" id="fbSearchSummary">' +
        '<div class="headline">' + headlineString + /*searchString.toString() +*/ '</div>' +
        '<!--<p class="countstring"></p>-->' +
        '<p>Feeding America food banks serve large areas and will be able to find a feeding program in your local community.</p>' +
        '</div>'
        );
    }

    if (stateTitle == 'The United States') {
      function returnFAResults(data, searchString, execSearch) {
        var resultsWrapper = jQuery('#find-fb-search-results'),
        mapPointInfoBoxes = [];

        if (data !== null) {
          FBMapAllOrgs = data;

          // Because of IE issues with long running js script,
          // we have to break it down into chunks of 25 records per batch
          var processFAResults = function(current, cycles, total) {
            var to = current + cycles;
            to = to > total ? total : to;

            for (var i = current; i < to; i++) {
              // Build our HTML for each item.
              var org = orgXmlToJson(data[i], orgProperties),
              resultsBox = buildFAOrgResultBox(org),
              profileUrlName = org.FullName.replace(/ /g, '-').toLowerCase(),
              profileUrl = '/find-your-local-foodbank/' + (profileUrlName.replace(/[&]/g, 'and')).replace(/[\.,']/g, '');

              // Save infobox data.
              mapPointInfoBoxes[org.OrganizationID] = {
                title: org.FullName,
                address: org.MailAddress.Address1,
                phone: org.Phone,
                url: org.URL,
                profileurl: profileUrl
              };

              resultsWrapper.append(resultsBox);
            }

            if (total > to) {
              setTimeout(function() { processFAResults(i, cycles, total) }, 1);
            } else {
              finalizeFAResults();
            }
          };

          var finalizeFAResults = function() {
            var extraSearch = (typeof(execSearch) == "function");

            // Create the summary box, handle plural/singular result.
            buildFAOrgsSummaryBox(data, resultsWrapper, searchString);
          };

          // Start the process
          processFAResults(0, 25, data.length);

        } else { // No results
          resultsWrapper.append('The search did not produce any results');
        }
        resultsWrapper.show();
      }
    }

    // jQuery('#map_states option.' + stateTitle.replace(/\s+/g, '-').toLowerCase()).attr('selected', true);

    // var iScrollPos = 0;
    // jQuery(window).scroll(function() {
    //   var iCurScrollPos = jQuery(this).scrollTop();
    //   if (iCurScrollPos > iScrollPos) {
    //     // Scrolling Down.
    //     jQuery('.state-content').removeClass('up');
    //     jQuery('.state-content').addClass('down');
    //   } else {
    //     // Scrolling Up.
    //     jQuery('.state-content').addClass('up');
    //     jQuery('.state-content').removeClass('down');
    //   }
    //   iScrollPos = iCurScrollPos;
    // });

});
;
