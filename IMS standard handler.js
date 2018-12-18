/*
 * Standard Handlers library is a consolidation of handler functions written
 * to capture various events on a page. Handlers are NOT enabled by default
 * and require wiring at the Website->Events level and the Tags->Page Event
 * level like in all other cases.
 * 
 * Author: KR
 * Created Date: 07/22/2015
 * Version Date: 03/10/2018
 * Version: 1.18
 *
 * Copyright (c) 2015, 2016, 2017, 2018 IMS Health Incorporated. All rights reserved.
 * 
 */

/// jQuery Plugins
jQuery.fn.extend({
  renameAttr: function( name, newName, removeData ) {
    var val;
    return this.each(function() {
      val = jQuery.attr( this, name );
      jQuery.attr( this, newName, val );
      jQuery.removeAttr( this, name );
      // remove original data
      if (removeData !== false){
        jQuery.removeData( this, name.replace('data-','') );
      }
    });
  }
});

/**
* @function
* @property {object} jQuery plugin which runs handler function once specified element is inserted into the DOM
* @param {function} handler A function to execute at the time when the element is inserted
* @param {bool} shouldRunHandlerOnce Optional: if true, handler is unbound after its first invocation
* @example $(selector).waitUntilExists(function);
*/

jQuery.fn.extend({
  waitUntilExists: function (handler, shouldRunHandlerOnce, isChild) {
    var found = 'found';
    var $this = $(this.selector);
    var $elements = $this.not(function () { return $(this).data(found); }).each(handler).data(found, true);
    
    if (!isChild)
    {
        (window.waitUntilExists_Intervals = window.waitUntilExists_Intervals || {})[this.selector] =
            window.setInterval(function () { $this.waitUntilExists(handler, shouldRunHandlerOnce, true); }, 500);
    }
    else if (shouldRunHandlerOnce && $elements.length)
    {
        window.clearInterval(window.waitUntilExists_Intervals[this.selector]);
    }
    return($this);
  }
});

/*
 * Section 1: Page Load Functions
 */
var imsOldLocation = location.href.replace('https://', '').replace('http://', '');
var imsLateSelectors = null;
var imsLateFormSelectors = null;
var imsLateSearchSelectors = null;
ims_pageLoadHandler = function(pageName, hash)
{
    if(!!!hash)
    {
        s.events="";
        s.prop20=s.prop21=s.prop22=s.prop30=s.prop34=s.prop51=s.prop52="";

        s.eVar20="D=c20";
        s.eVar21="D=c21";
        s.eVar22="D=c22";
        s.eVar30="D=c30";
        s.eVar34="D=c34";
        s.eVar51="D=c51";
        s.eVar52="D=c52";

        s.t(); // Increment pageViews and instances
        // s.tl(); - This will increment only instances - so avoid calling this on pageLoads
    }
    else
    {
        ims_stdClickHandler(null, s.prop22);
        s.prop22=s.prop51=s.prop52=s.eVar22=s.eVar51=s.eVar52="";
    }
}

ims_stdPageHandler = function(event, pageName, formSelectors, selectors, searchSelectors, ignoreHash)
{
    if(!!formSelectors)
    {
        imsLateFormSelectors = formSelectors;
        ims_formLateInit(); // Forces initialization of any forms & videos that may already be present
    }
    if(!!selectors)
    {
        imsLateSelectors = selectors;
        ims_tagLateInit();
    }
    if(!!searchSelectors)
    {
        imsLateSearchSelectors = searchSelectors;
        ims_searchLateInit();
    }
    $(window).on('hashchange', function(event) {
        var href = location.href.replace('https://', '').replace('http://', '');
        var hash = false;
        if(!!ignoreHash && ignoreHash && (href.indexOf('#') >= 0))
        {
            // Convert the location.href to a string subset ending with the '#'
            href = href.split('#')[0];
        }
        else
        if(href.indexOf('#') >= 0)
        {
            // Do not ignoreHash
            var splits = href.split('#');
            if((splits[0] == imsOldLocation) && (splits[1].length <= 0))
                href = splits[0];
            hash = true;
        }
        
        if(href != imsOldLocation)
        {
            var newPageName = pageName;
            ims_pageLoadHandler(newPageName, hash);
            imsOldLocation = href;
            
            // Call a lateFormInit
            ims_formLateInit();
            ims_tagLateInit();
            ims_searchLateInit();
        }
    }).trigger('hashchange');
}

ims_visitPageHandler = function(event, pageName)
{
    if(!!pageName)
    {
        s.events="";
        s.prop20=s.prop21=s.prop22=s.prop30=s.prop34=s.prop51=s.prop52="";
        
        s.eVar20="D=c20";
        s.eVar21="D=c21";
        s.eVar22="D=c22";
        s.eVar30="D=c30";
        s.eVar34="D=c34";
        s.eVar51="D=c51";
        s.eVar52="D=c52";
        
        // Set Visit behavior variables - these need to be set once per visit
        //s.eVar56=bt_data('content hierarchy level 1');
        s.visitPageNum=getVisitPageViews();

        // On the first page of the visit
        if (s.visitPageNum == 1)
            s.eVar14=s.prop6; // Set Visit Number eVar

        s.prop10 = "Visit Page View: " + s.visitPageNum;
        s.prop11 = "Lifetime Page Views: " + getLifetimePageViews();

        // Set pageName to prop14 and eVar46
        s.prop14=s.eVar46="D=pageName";
        s.prop41=s.eVar47="D=g";
        s.eVar45="D=c1";

        s.t(); // Increment pageViews and instances
    }
}

/*
 * Section 2: Video Handler Functions
 */
ims_stdVideoHandler = function(event, videoName, coreContent)
{
    var vloc = this.currentTime;
    if(vloc > 0)
    {
        // The StandardVideoHandler will get called when the video timeUpdate event is invoked
        if(!!!$(this).data("videoStart") && (((vloc / this.duration)*100) < 100))
        {
            // We need to check for location < 100 to avoid an IE bug
            // Invoke a startEvent
            $(this).data("videoStart", true);

            // Clear all other markers immediately after a start
            ims_clearVideoMarkers(this);
 
            ims_callVideoSCEvent("event5", videoName, "Start");
        }
        else
        {
            var loc = (vloc / this.duration)*100;
            if((loc >= 25) && (loc < 50) && !!!$(this).data("video1Q"))
            {
                $(this).data("video1Q", true);
                ims_callVideoSCEvent("event34", videoName, "25% Milestone Reached");
            }
            else
            if((loc >= 50) && (loc < 75) && !!!$(this).data("video2Q"))
            {
                $(this).data("video2Q", true);
                ims_callVideoSCEvent("event35", videoName, "50% Milestone Reached");
            }
            else
            if((loc >= 75) && (loc < 100) && !!!$(this).data("video3Q"))
            {
                $(this).data("video3Q", true);
                ims_callVideoSCEvent("event36", videoName, "75% Milestone Reached");
            }
            else
            if((loc >= 100) && !!!$(this).data("video4Q"))
            {
                $(this).data("video4Q", true);
                ims_callVideoSCEvent("event37", videoName, "100% Milestone Reached");
            }

            // Check for Core Content Completion
            coreContent = !!coreContent ? coreContent : "0";
            if(!!coreContent && !!!$(this).data("videoCoreContent"))
            {
                var ccm = isNaN(parseInt(coreContent)) ? 0 : parseInt(coreContent);
                if((ccm > 0) && (vloc > ccm))
                {
                    $(this).data("videoCoreContent", true);
                    ims_callVideoSCEvent("event38", videoName, "Core Content Completed");
                }
            }
        }
    }
}

ims_stdVideoSeekedHandler = function(event, videoName)
{
    var vloc = this.currentTime;
    var loc = 0;
    if(vloc > 0)
        loc = (vloc / this.duration)*100;

    // Video Position Changed
    ims_callVideoSCEvent("event57", videoName, "Position Changed: "+Math.round(loc)+"%");
}

ims_stdVideoEndedHandler = function(event, videoName)
{
    // Invoke an endEvent
    $(this).data("videoEnd", true);

    if($(this).data("video1Q") && $(this).data("video2Q") && $(this).data("video3Q") && $(this).data("video4Q"))
        ims_callVideoSCEvent("event6", videoName, "Complete");

    // A video can restart only if it is at the end
    $(this).data("videoStart", false);
}

ims_clearVideoMarkers = function(obj)
{
    if(!!$(obj))
    {
        $(obj).data("video1Q", false);
        $(obj).data("video2Q", false);
        $(obj).data("video3Q", false);
        $(obj).data("video4Q", false);
        $(obj).data("videoCoreContent", false);
    }
}

ims_callVideoSCEvent = function(eventName, videoName, milestone)
{
    s.linkTrackVars="prop1,prop2,prop3,prop4,prop5,prop6,prop7,prop8,prop9,prop10,prop11,prop12,prop13,prop14,prop15,prop22,prop23,prop25,prop30,prop31,prop32,prop33,prop34,prop35,prop36,prop39,prop41,prop42,prop43,prop51,prop52,eVar1,eVar2,eVar14,eVar22,eVar23,eVar24,eVar30,eVar31,eVar32,eVar35,eVar36,eVar37,eVar38,eVar39,eVar43,eVar45,eVar46,eVar47,eVar51,eVar52,events";
    s.linkTrackEvents=s.events=eventName;
    s.prop22=videoName+" > "+milestone;
    s.prop23=videoName;
    s.eVar22="D=c22";
    s.eVar23="D=c23";
    s.tl(this,'o',s.prop23);

    if(eventName == 'event5' || eventName == 'event6')
    {
        $(window).trigger('floodlightEvent', eventName);
        $(window).trigger('swoopEvent', eventName);
    }
}


/*
 * Section 3: Form Handler Functions
 */
ims_stdFormInitHandler = function(event, formName)
{
    // This handler will get called when any object in the form receives focus
    var form = $(event.target).closest("form");
    formName = !!formName ? formName : event.data.formName;
    search = event.data.search;
    if(!!$(form))
    {
        var attrName = $(event.target).attr('name');
        if(!$(form).data("formInit"))
        {
            $(form).data("formInit", true);
            ims_callFormSCEvent("event39", formName, null, null, null, null, null, "Form Touched", null);
        }
        // Disable the blur event so this method does not get called again
        $(form).find('input,select,text,textarea,option').off('focusin');
    }
}

ims_stdFormHandler = function(event, formName)
{
    // This handler will get called when any content is added/modified on the form
    var form = $(event.target).closest("form");
    formName = !!formName ? formName : event.data.formName;
    search = event.data.search;
    if(!!$(form))
    {
        var attrName = !!$(event.target).attr('data-name') ? $(event.target).attr('data-name') : $(event.target).attr('name');
        var dataValue = $(event.target).attr('data-value');
        var attrValue = $(event.target).val();
        if(!$(form).data("formInit"))
        {
            ims_stdFormInitHandler(event, formName);
        }
 
        if(!$(form).data("formStart"))
        {
            $(form).data("formStart", true);
            $(form).data("formStartTime", event.timeStamp);
            ims_callFormSCEvent("event1", formName, null, null, null, null, null, "Form Start", null);
            
            // Also send a form change event on this field
            ims_callFormSCEvent("event3", formName, attrName, !!dataValue ? dataValue : !!attrValue ? 'not null' : 'null', null, null, null, attrName, !!search ? attrValue : null);
        }
        else
        {
            // This is a form change event
            var ttc = (event.timeStamp - $(this).data("formStartTime")) / 60000;
            ims_callFormSCEvent("event3", formName, attrName, !!dataValue ? dataValue : !!attrValue ? 'not null' : 'null', null, null, ttc, attrName, !!search ? attrValue : null);
        }
    }
}

ims_stdFormSubmitHandler = function(event, formErrorMessage)
{
    // This handler gets called when the Submit button is pressed
    // An event32 (Form Error) is generated if there is an error
    // Else an event3 (Form Field Populated) and an event2 (Form Completed) is generated
    
    // Check to see if there is an error at submission - this can be monitored via the
    // the value in the error box
    var form = $(event.target).closest("form");
    formName = event.data.formName;
    search = event.data.search;
    formError = event.data.formError;
    formErrorMessage = !!formErrorMessage ? formErrorMessage : "";
    
    var formFieldValues = "";
    $(form).find("input,select,text,textarea").each(
        function(index)
        {
            var dataName = !!$(this) ? (!!$(this).attr('data-name') ? $(this).attr('data-name') : null) : null;
            var attrName = !!$(this) ? (!!$(this).attr('name') ? $(this).attr('name') : null) : null;
            var dataValue = !!$(this) ? (!!$(this).attr('data-value') ? $(this).attr('data-value') : null) : null;
            var attrValue = !!$(this) ? (!!$(this).val() ? $(this).val() : null) : null;

            dataName = !!dataName ? dataName : attrName;
            dataValue = !!dataValue ? dataValue : (!!attrValue ? 'not null' : 'null');
            formFieldValues += !!$(this) && !!dataName ? (dataName+':['+dataValue+']; ') : '';
        }
    );

    var ttc = (event.timeStamp - $(form).data("formStartTime")) / 60000;
    if(!!formError)
    {
        ims_callFormSCEvent("event32", formName, null, formFieldValues, formError, formErrorMessage, ttc, "Form Error", null);
    }
    else
    {
        ims_callFormSCEvent("event2", formName, null, formFieldValues, null, null, ttc, "Form Complete", null);
    }
}

ims_callFormSCEvent = function(eventName, formName, formField, formFieldValues, formError, formErrorMessage, timeToCompleteForm, mileStone, searchValue)
{
    s.linkTrackVars="prop1,prop2,prop3,prop4,prop5,prop6,prop7,prop8,prop9,prop10,prop11,prop12,prop13,prop14,prop15,prop16,prop24,prop25,prop30,prop31,prop32,prop33,prop34,prop35,prop36,prop39,prop41,prop42,prop43,prop51,prop52,eVar1,eVar2,eVar14,eVar16,eVar24,eVar30,eVar31,eVar32,eVar33,eVar34,eVar35,eVar36,eVar39,eVar41,eVar42,eVar43,eVar45,eVar46,eVar47,eVar51,eVar52,events";
    s.linkTrackEvents=s.events=eventName;

    s.prop25=(((eventName == 'event1') || (eventName == 'event39')) ? "" : (!!timeToCompleteForm ? timeToCompleteForm.toFixed(2) : "0.00") + " Minutes");
    s.prop30=formName;
    s.eVar30="D=c30";
    if(!!searchValue)
    {
        s.prop16=searchValue;
        s.eVar16="D=c16";
    }
    else
    {
        s.prop31=(formFieldValues != null ? formFieldValues : 'null');
        s.prop32=s.prop6;
        s.eVar32="D=c32";
    }
    s.prop34=formField;
    s.prop35=(eventName == 'event32' ? formError : "");
    s.prop36=formErrorMessage;
    s.eVar34="D=c34";
    s.eVar35="D=c35";
    if((eventName == 'event2') || (eventName == 'event32'))
    {
        s.eVar39="";
        s.eVar41="D=c31";
    }
    else
    {
        s.eVar39="D=c31";
        s.eVar41="";
    }
 
    // Get New vs Repeat Visitor
    s.prop12=s.eVar35=s.getNewRepeat(30,'s_gnr');
    s.tl(this,'o',s.prop30+" > "+mileStone);

    if(eventName == 'event1' || eventName == 'event2' || eventName == 'event3')
    {
        $(window).trigger('floodlightEvent', eventName);
        $(window).trigger('swoopEvent', eventName);
    }
}

ims_stdSearchHandler = function(event, results)
{
    s.linkTrackVars="prop1,prop2,prop3,prop4,prop5,prop6,prop7,prop8,prop9,prop10,prop11,prop12,prop13,prop14,prop15,prop16,prop19,prop24,prop30,prop34,prop41,prop42,prop43,prop51,prop52,eVar1,eVar2,eVar14,eVar16,eVar19,eVar24,eVar30,eVar34,eVar35,eVar36,eVar37,eVar38,eVar42,eVar43,eVar45,eVar46,eVar47,eVar51,eVar52,events";
    s.linkTrackEvents=s.events=event.data.eventName; // Will be either event27 or event28

    var field = $(event.target);
    field = $(field).attr('type') == 'text' ? field : $(field).closest('form').find('input[type="text"]');
    var keywords = $(field).val();
    var resl = !!results ? results : event.data.results;

    s.prop16=keywords;
    s.eVar16="D=c16";

    s.prop19=resl;
    s.eVar19="D=c19";

    s.prop30=s.prop34='Search';
    s.eVar30="D=c30";
    s.eVar34="D=c34";

    // Get New vs Repeat Visitor
    s.prop12=s.eVar35=s.getNewRepeat(30,'s_gnr');
    s.tl(this,'o',s.prop30+": "+keywords);
}

ims_tagLateInit = function()
{
    if(!!imsLateSelectors)
    {
        try
        {
            $.each(imsLateSelectors, function(index, nv) {
                var selector = nv['selector'];
                var event = nv['eventName'];
                var eventFunction = nv['eventFunction'];
                
                //console.log("Selector: "+selector+", EventName: "+event+", EventFunction: "+eventFunction);
                if(!!selector && !!eventFunction)
                {
                    var func = window[eventFunction];
                    if ((typeof func === "function") && ($(selector).length > 0))
                    {
                        $(selector).waitUntilExists(function()
                        {
                            $(this).unbind(event, func);
                            $(this).bind(event, func);
                        });
                    }
                }
            });
        } catch(err) { console.log(err); }
    }
}

ims_formLateInit = function()
{
    // In a typical static form, the following is the sequence of events:
    // When a 'change' event occurs on the form, it triggers a Form->Start event
    // and sets the variable SC->Form Name. Also the change event is mapped to all
    // 'input,select,text,textarea,option' fields.
    // A Form->Start event in effect triggers a 'changeContent' event as follows:
    // $(this).trigger('changeContent', [[SC->Form Name]]);
    // Similarly when a 'submit' event occurs on the form, it triggers a Form->Submit
    // event and sets the variables SC->Form Name and SC->Error Code. The event itself
    // is mapped to 'form'.
    // A Form->Submit event in effect triggers a 'submitContent' event as follows:
    // $(this).trigger('submitContent', [ [[SC->Form Name]], [[SC->Error Code]] ]);
    
    // We first need to insert events for each AJAX loaded form
    if(!!imsLateFormSelectors)
    {
        try
        {
            $.each(imsLateFormSelectors, function(index, nv) {
                var formName = nv['formname'];
                var submitButton = nv['submitbutton'];
                var selector = nv['selector'];
                var validFormHook = nv['validFormHook'];
                var invalidFormHook = nv['invalidFormHook'];
                var search = !!nv['search'] ? nv['search'] : false;
                if(!!formName && !!selector)
                {
                    var forms = null;
                    if(selector.indexOf('(') == 0)
                        forms = eval('$'+selector);
                    else
                    if(selector.indexOf('$') == 0)
                        forms = eval(selector);
                    else
                        forms = $(selector);
                    
                    if(!!forms && (forms.length > 0) && (!$($(forms).get(0)).data('formInit')))
                    {
                        //console.log('FormInitalized');
                        // The focusin and change events are responsible for triggering events 1, 3, 39
                        $(forms).find('input,select,text,textarea,option').off('focusin', ims_stdFormInitHandler);
                        $(forms).find('input,select,text,textarea,option').off('change', ims_stdFormHandler);
                        
                        $(forms).find('input,select,text,textarea,option').on('focusin', {formName: formName, search: search}, ims_stdFormInitHandler);
                        $(forms).find('input,select,text,textarea,option').on('change', {formName: formName, search: search}, ims_stdFormHandler);
                        // If an invalidFormHook exists, link the FormSubmit callback to that
                        if(!!invalidFormHook)
                        {
                            $(forms).off(invalidFormHook, ims_stdFormSubmitHandler);
                            $(forms).on(invalidFormHook, {formName: formName, search: search, formError: 'Form Submission Error'}, ims_stdFormSubmitHandler);
                        }
                        // If a validFormHook exists, link the FormSubmit callback to that
                        if(!!validFormHook)
                        {
                            $(forms).off(validFormHook, ims_stdFormSubmitHandler);
                            $(forms).on(validFormHook, {formName: formName, search: search}, ims_stdFormSubmitHandler);
                        }
                        else
                        {
                            $(forms).off('submit', ims_stdFormSubmitHandler);
                            $(forms).on('submit', {formName: formName, search: search}, ims_stdFormSubmitHandler);
                            if(!!submitButton && (submitButton.length > 0))
                            {
                                $(forms).find(submitButton).off('click', ims_stdFormSubmitHandler);
                                $(forms).find(submitButton).on('click', {formName: formName, search: search}, ims_stdFormSubmitHandler);
                            }
                        }
                    }
                }
            });
        } catch(err) { console.log(err); }
    }
}

ims_searchLateInit = function()
{
    // We first need to insert events for each AJAX loaded searchField
    if(!!imsLateSearchSelectors)
    {
        try
        {
            $.each(imsLateSearchSelectors, function(index, nv) {
                var submitButton = nv['submitbutton'];
                var selector = nv['selector'];
                var successHook = nv['successHook'];
                var failureHook = nv['failureHook'];
                if(!!selector)
                {
                    var searchField = null;
                    if(selector.indexOf('(') == 0)
                        searchField = eval('$'+selector);
                    else
                    if(selector.indexOf('$') == 0)
                        searchField = eval(selector);
                    else
                        searchField = $(selector);
                    
                    if(!!searchField && (searchField.length > 0) && (!$($(searchField).get(0)).data('searchInit')))
                    {
                        //console.log('SearchInitalized');
                        // If an failureHook exists, link the Submit callback to that
                        if(!!failureHook)
                        {
                            $(searchField).off(failureHook, ims_stdSearchHandler);
                            $(searchField).on(failureHook, {eventName: 'event28', results: 'No Search Results'}, ims_stdSearchHandler);
                        }
                        // If a successHook exists, link the Submit callback to that
                        if(!!successHook)
                        {
                            $(searchField).off(successHook, ims_stdSearchHandler);
                            $(searchField).on(successHook, {eventName: 'event27', results: 'unknown'}, ims_stdSearchHandler);
                        }
                        else
                        {
                            $(searchField).off('submit', ims_stdSearchHandler);
                            $(searchField).on('submit', {eventName: 'event27', results: 'unknown'}, ims_stdSearchHandler);
                            if(!!submitButton && (submitButton.length > 0))
                            {
                                $(submitButton).off('submit', ims_stdSearchHandler);
                                $(submitButton).on('submit', {eventName: 'event27', results: 'unknown'}, ims_stdSearchHandler);
                            }
                            var form = $(searchField).closest("form");
                            if($(form).length > 0)
                            {
                                $(form).off('submit', ims_stdSearchHandler);
                                $(form).on('submit', {eventName: 'event27', results: 'unknown'}, ims_stdSearchHandler);
                            }
                        }
                    }
                }
            });
        } catch(err) { console.log(err); }
    }
}

ims_stdClickHandler = function(event, linkName, linkValue)
{
    s.linkTrackVars="prop1,prop2,prop3,prop4,prop5,prop6,prop7,prop8,prop9,prop10,prop11,prop12,prop13,prop14,prop15,prop22,prop24,prop25,prop30,prop31,prop32,prop33,prop34,prop35,prop36,prop39,prop41,prop42,prop43,prop51,prop52,eVar1,eVar2,eVar14,eVar22,eVar23,eVar24,eVar30,eVar31,eVar32,eVar34,eVar35,eVar36,eVar37,eVar38,eVar39,eVar41,eVar43,eVar45,eVar46,eVar47,eVar51,eVar52,events";
    s.linkTrackEvents=s.events="";
    s.prop22=(!!linkName ? linkName : "");
    s.prop31=(!!linkValue ? linkValue : s.prop31);
    s.eVar22="D=c22";

    // Get New vs Repeat Visitor
    s.prop12=s.eVar35=s.getNewRepeat(30,'s_gnr');
    s.setupLinkTrack(","+(s.prop22.length > 0 ? "prop22,," : "prop22,prop51,prop52"), "");

    if(s.prop22.length > 0)
        s.tl(this,'o',s.prop22);
    else
        s.tl(this,'o','Scroll');
}

ims_stdDownloadHandler = function(event, linkName)
{
    s.linkTrackVars="prop1,prop2,prop3,prop4,prop5,prop6,prop7,prop8,prop9,prop10,prop11,prop12,prop13,prop14,prop15,prop20,prop24,prop25,prop30,prop31,prop32,prop33,prop34,prop35,prop36,prop39,prop41,prop42,prop43,prop51,prop52,eVar1,eVar2,eVar14,eVar20,eVar24,eVar30,eVar31,eVar32,eVar34,eVar35,eVar36,eVar37,eVar38,eVar39,eVar41,eVar43,eVar45,eVar46,eVar47,eVar51,eVar52,events";
    s.linkTrackEvents=s.events="event4";

    // Reset Form attributes
    s.prop25=s.prop30=s.prop31=s.prop32=s.prop33=s.prop34=s.prop35=s.prop36=s.eVar30=s.eVar31=s.eVar32=s.eVar33=s.eVar34=s.eVar39=s.eVar41="";

    s.prop20=linkName;
    s.eVar20="D=c20";

    // Get New vs Repeat Visitor
    s.prop12=s.eVar35=s.getNewRepeat(30,'s_gnr');

    s.tl(this,'d',s.prop20);

    $(window).trigger('floodlightEvent', 'event4');
    $(window).trigger('swoopEvent', 'event4');
}

ims_stdExitHandler = function(event, linkName)
{
    s.linkTrackVars="prop1,prop2,prop3,prop4,prop5,prop6,prop7,prop8,prop9,prop10,prop11,prop12,prop13,prop14,prop15,prop21,prop24,prop25,prop30,prop31,prop32,prop33,prop34,prop35,prop36,prop39,prop41,prop42,prop43,prop51,prop52,eVar1,eVar2,eVar14,eVar21,eVar24,eVar30,eVar31,eVar32,eVar34,eVar35,eVar36,eVar37,eVar38,eVar39,eVar41,eVar43,eVar45,eVar46,eVar47,eVar51,eVar52,events";
    s.linkTrackEvents=s.events="";

    // Reset Form attributes
    s.prop25=s.prop30=s.prop31=s.prop32=s.prop33=s.prop34=s.prop35=s.prop36=s.eVar30=s.eVar31=s.eVar32=s.eVar33=s.eVar34=s.eVar39=s.eVar41="";

    s.prop21=linkName;
    s.eVar21="D=c21";

    // Get New vs Repeat Visitor
    s.prop12=s.eVar35=s.getNewRepeat(30,'s_gnr');
    s.setupLinkTrack(",,prop51,prop52", "SC_LINKS");

    s.tl(this,'e',s.prop21);
}

ims_stdInterstitialHandler = function(event, linkName)
{
    s.linkTrackVars="prop1,prop2,prop3,prop4,prop5,prop6,prop7,prop8,prop9,prop10,prop11,prop12,prop13,prop14,prop15,prop22,prop24,prop25,prop30,prop31,prop32,prop33,prop34,prop35,prop36,prop39,prop41,prop42,prop43,prop51,prop52,eVar1,eVar2,eVar14,eVar22,eVar24,eVar30,eVar31,eVar32,eVar34,eVar35,eVar36,eVar37,eVar38,eVar39,eVar41,eVar43,eVar45,eVar46,eVar47,eVar51,eVar52,events";
    s.linkTrackEvents=s.events="";

    s.prop22=linkName;
    s.eVar22="D=c22";

    // Get New vs Repeat Visitor
    s.prop12=s.eVar35=s.getNewRepeat(30,'s_gnr');

    // This is for the interstitial 'Yes' click
    s.tl(true,'o',s.prop22);

    // This is for the true landing page - the page that appears AFTER the 'Yes' button is clicked
    s.interstitial = false;
    s.events="";
    s.prop21=s.eVar21=s.prop22=s.eVar22=s.prop51=s.eVar51="";
    s.t();
}

ims_stdFloodlightHandler = function(event, sourceId, type, category)
{
    if(!!category)
    {
        var axel = Math.random() + "";
        var a = axel * 10000000000000;
        
        var t = document.body.appendChild(document.createElement("div"));
        t.setAttribute("id", "floodlightTag");
        t.style.position = "absolute", t.style.top = "0", t.style.left = "0", t.style.width = "1px", t.style.height = "1px", t.style.display = "none";
        t.innerHTML = '<iframe src="https://'+sourceId+'.fls.doubleclick.net/activityi;src='+sourceId+';type='+type+';cat='+category+';dc_lat=;dc_rdid=;tag_for_child_directed_treatment=;ord=1;num=' + a + '?" width="1" height="1" frameborder="0" style="display:none"></iframe>';
    }
}

ims_stdSwoopHandler = function(event, trackerId, reportingAction)
{
    if(!!trackerId && !!reportingAction)
    {
        !function(o,e){try{e=e||"https://ardrone.swoop.com/conversion.html",window.location!=window.parent.location?o.page_url=document.referrer:(o.page_url=document.location,o.ref_url=document.referrer);var n=document.createElement("iframe"),t=[];for(key in o)t.push(encodeURIComponent(key)+"="+encodeURIComponent(o[key]));n.src=e+"#"+t.join("&"),n.style="display: none",document.body.appendChild(n)}catch(c){}}({tracker_id:trackerId,reporting_action:reportingAction});
    }
}


// Aliased event handlers - these event handlers are called in response
// to events set inside Signal
// For example, to trigger a form->change event, the implementor would need
// to call a form->changeContent event in response to a form->change
// The reason for having a level of indirection is to allow the control
// of event creation within Signal as opposed to all form's inheriting this
// event
if(typeof jQuery == 'function')
{
    jQuery(document).ready(function()
    {
        // Download Link events
        jQuery(window).off('ims_click', ims_stdClickHandler);
        jQuery(window).on('ims_click', ims_stdClickHandler);

        // Download Link events
        jQuery(window).off('ims_download', ims_stdDownloadHandler);
        jQuery(window).on('ims_download', ims_stdDownloadHandler);

        // Exit Link events
        jQuery(window).off('ims_exit', ims_stdExitHandler);
        jQuery(window).on('ims_exit', ims_stdExitHandler);

        // Interstitial events
        jQuery(window).off('ims_interstitial', ims_stdInterstitialHandler);
        jQuery(window).on('ims_interstitial', ims_stdInterstitialHandler);

        // Form & Search events
        jQuery(window).off('ims_loadpage', ims_stdPageHandler);
        jQuery(window).on('ims_loadpage', ims_stdPageHandler);

        jQuery(window).off('ims_visitpage', ims_visitPageHandler);
        jQuery(window).on('ims_visitpage', ims_visitPageHandler);

        // Video events
        jQuery("video").off('ims_runvideo', ims_stdVideoHandler);
        jQuery("video").off('ims_seekvideo', ims_stdVideoSeekedHandler);
        jQuery("video").off('ims_endvideo', ims_stdVideoEndedHandler);
        jQuery("video").on('ims_runvideo', ims_stdVideoHandler);
        jQuery("video").on('ims_seekvideo', ims_stdVideoSeekedHandler);
        jQuery("video").on('ims_endvideo', ims_stdVideoEndedHandler);

        // Floodlight events
        jQuery(window).off('ims_floodlightEvent', ims_stdFloodlightHandler);
        jQuery(window).on('ims_floodlightEvent', ims_stdFloodlightHandler);

        // Swoop events
        jQuery(window).off('ims_swoopEvent', ims_stdSwoopHandler);
        jQuery(window).on('ims_swoopEvent', ims_stdSwoopHandler);
    });
}

// When AJAX calls change the contents of the locationBar so as to reflect
// page tagging, this creates an issue with loadEvent handlers. When a page
// is loaded, all of the above form and video event handlers will not get
// assigned - so we need to capture the pushState and invoke the event
// handlers to mimic a load event
(function(history){
    var pushState = history.pushState;
    history.pushState = function(state) {
        if (typeof history.onpushstate == "function") {
            history.onpushstate({state: state});
        }
        
        var retVal = pushState.apply(history, arguments);
        
        // Get the late binding variables via Signal tags
        //$('video').waitUntilExists(ims_videoLateInit);
        //$('form').waitUntilExists(ims_formLateInit);
        ims_tagLateInit();
        console.log("Push state");
        
        return(retVal);
    }
})(window.history);
