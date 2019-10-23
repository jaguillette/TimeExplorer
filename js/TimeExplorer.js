/**
 * Makes an associative array based on the keys and values provided
 * @param {array} keys - Array of keys for output array
 * @param {array} values - Array of values for output array
 */
function zip_arrays(keys, values) {
  return Object.assign(...keys.map((v,i) => ( {[v]: values[i]} )));
}

/**
 * Retrieves HTTP GET parameters from url, returns them in an associative array
 */
function get_url_params() {
  var $_GET = {};

  document.location.search.replace(/\??(?:([^=]+)=([^&]*)&?)/g, function () {
      function decode(s) {
          return decodeURIComponent(s.split("+").join(" "));
      }

      $_GET[decode(arguments[1])] = decode(arguments[2]);
  });
  return $_GET;
}

/**
 * Takes a string representing a time, and returns the hour and minute values in an array
 * @param {string} timestring - A string representing a time, such as "10:30am"
 */
function timeParse(timestring) {
  let pmMatch = timestring.match(/(.*)pm\s*$/i);
  let timeArray = pmMatch ? pmMatch[1].split(':') : timestring.split(':');
  if (timeArray.length === 2) {
    let hour = pmMatch ? parseInt(timeArray[0])+12 : parseInt(timeArray[0]);
    let minute = parseInt(timeArray[1]);
    if (pmMatch && hour == 12) {
      hour = 24;
    }
    return [hour,minute]
  } else {
    return null;
  }
}

/**
 * Zero-pads a number to a 4-digit string
 */
function padToNDigit(number, nDigits) {
  let str = String(number);
  let pad = Array(nDigits+1).join("0");
  let insert = str[0] === "-" ? 1 : 0;
  return str.slice(0, insert) + pad + str.slice(insert);
}

/**
 * Takes an ID string for a div, and removes leading #, if any
 * @param {string} id_string - string to be modified
 */
function plainId(id_string) {
  return id_string.startsWith('#') ? id_string.slice(1) : id_string;
}

/**
 * Constructs a display date based on a given data row, as well as start and end dates.
 * Row data is used to determine the precision with which the date was defined
 * startDate and endDate are used to determine the values in a standard way
 * @param {object} row - Dictionary-like object representing a row of data from spreadsheet
 * @param {datetime} startDate
 * @param {datetime} endDate
 */
 function GetDisplayDate(row, startDate, endDate) {
   if (startDate == null) {return null;}
   let displayDate = "";
   displayDate = appendDate(row, displayDate, startDate, "");
   if(endDate != null) {displayDate = appendDate(row, displayDate, endDate, "End ");}
   return displayDate;

   function appendDate(row, displayDate, date, rowIndicator) {
     const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
     if (rowIndicator === "End ") {displayDate += " - ";}
     if (row[rowIndicator + 'Month'] && row[rowIndicator + 'Month'] != "") { displayDate += months[date.getMonth()]+" "; }
     if (row[rowIndicator + 'Day']   && row[rowIndicator + 'Day'] != "")   { displayDate += date.getDate()+", "; }
     if (row[rowIndicator + 'Year']  && row[rowIndicator + 'Year'] != "")  { displayDate += date.getFullYear(); }
     if (row[rowIndicator + 'Time']  && row[rowIndicator + 'Time'] != "")  {
       displayDate += " at " + date.getHours() + ":";
       let minutes = String(date.getMinutes()).length == 1 ? "0"+String(date.getMinutes()) : String(date.getMinutes());
       displayDate += minutes;
      }
     return displayDate;
   }
 }

/**
 * // TODO: What is this function for?
 */
function testFilter(self) {
  if (self.filters.tagOptions == "all") {
    return function(item) {
      console.log("filter run because all");
      return true;
    }
  } else {
    return function(item) {
      console.log("filter run because any");
      return true;
    }
  }
}

/**
 * Utility function to get the Headline and display date for an entry and render it in HTML
 * @param {object} row - Row of data from spreadsheet, parsed as a dictionary-like object
 * @param {string} displayDate - String representing date as it should be displayed
 */
function GetDisplayTitle(row,displayDate) {
  return "<div class=\"ft-item-tooltip\"><h1>" + row['Headline'] + "</h1><p>"+displayDate+"</p></div>";
}

/**
 * Class loading data from one or more Google Sheets formatted for use in Knight
 * Lab's Timeline JS. Prepares data for use in visjs timeline. Uses jquery.
 * Data is loaded asynchronously, so should be loaded in TimeExplorer.promise.done()
 * function. Start and end dates are loaded, other properties are stored as item
 * properties to be loaded by templates or as part of the item dataset object.
 */
class TimeExplorer {
  /**
   * Load data from Google Sheets by sheet IDs
   * @param {array} sheet_ids - Array with Google Sheet ids as strings. If
   * sheet_ids is a string, it is assumed to be a single sheet ID
   * @param {string} api_key - Google Sheets API key.
   * @param {array} options - options for setting up timeline display
   */
  constructor(api_key, sheet_ids=null, options={}) {
    // Set up initial static stuff
    this.api_key = api_key;
    this.options = this.set_options(options);

    this.sheet_data = [];

    this.filters = {
      "activeGroups": [],
      "activeTags": [],
      "tagOptions": "any",
    };

    this.itemDataTemplate = Handlebars.compile('\
      <style>\
        #ft-item-data { background: {{background}}; }\
        {{#if background}}\
        #ft-item-text .ft-vcenter-inner { background-color: rgba(255,255,255,0.7); padding: 1em;}\
        #ft-item-media-container .ft-vcenter-inner { background-color: rgba(255,255,255,0.7); padding: 1em; overflow: hidden; }\
        {{/if}}\
      </style>\
      <div class="ft-close-button ft-vcenter-outer">\
        <div class="ft-vcenter-middle">\
          <span class="ft-vcenter-inner">X</span>\
        </div>\
      </div>\
      <div id="ft-item-text">\
        <div class="ft-vcenter-outer ft-cols-1">\
          <div class="ft-vcenter-middle">\
            <div class="ft-vcenter-inner">\
              <h1>{{headline}}</h1>\
              <p class="ft-display-date">{{display_date}}</p>\
              <p>{{{text}}}</p>\
            </div>\
          </div>\
        </div>\
      </div>');

    this.tag_col = this.get_tag_col();

    // Create a context-agnostic way to refer back to this parent object
    var self = this;

    // Set up page skeleton for the addition of content
    this.setup_dom(self, options);

    $(window).resize(function() {
      self.timeline.options.height = window.innerHeight;
      self.timeline.redraw();
      var windowHeight = window.innerHeight;
      var bylineHeight = $(".tl-caption").height() + $(".tl-credit").height() || 0;
      // var creditHeight =
      $("#ft-dynamic-style").html(`
        #ft-item-data {
          height: ${0.7 * windowHeight}px;
          top: ${0.15 * windowHeight}px;
        }
        .tl-media-image {
          max-height: ${0.7 * windowHeight - bylineHeight - 105}px !important;
        }
      `);
    });

    // Set up vis.js timeline object
    this.timeline = this.create_timeline(options);

    // Get the IDs of Google sheets to draw data from.
    // Returns a promise, so subsequent functions have to make sure it's done.
    this.getting_sheet_ids = this.get_sheet_ids(self,sheet_ids);

    // When sheet IDs have been retrieved, get the data from relevant sheets.
    this.getting_sheet_data = this.getting_sheet_ids.then(function() {
      self.getting_title = self.get_sheet_title(self.sheet_ids[0]);
      return self.get_all_sheet_data();
    });

    // Run data setup functions once data has been retrieved
    self.ready = self.getting_sheet_data.then(function() {
      self.items = self.set_items(self, self.sheet_data);
      self.groups = self.set_groups(self);
      self.tags = self.set_tags(self);
    });

    // When data has been retrieved and massaged into shape, render the visualization.
    self.ready.done(function() {
      $("#ft-item-data").empty();
      if (self.title_entry) {
        self.RenderItem(self,self.title_entry,self.itemDataTemplate);
      }
      var dataset = new vis.DataSet(self.items);
      var view = new vis.DataView(dataset, {
        // filter: self.item_filter(self),
        filter: self.item_filter(self),
      });
      self.view = view;
      self.timeline.setItems(view);
      var dataRange = self.timeline.getDataRange();
      var padding = 0.01 * (dataRange.max - dataRange.min);
      var timelineMin = new Date(dataRange.min.getTime() - padding);
      var timelineMax = new Date(dataRange.max.getTime() + padding);
      self.options.timelineOptions.min = timelineMin;
      self.options.timelineOptions.max = timelineMax;
      self.timeline.setOptions(self.options.timelineOptions);
      self.timeline.on('select', function(properties) {
        var selected_item = dataset._getItem(properties.items[0]);
        if (selected_item) {
          self.RenderItem(self, selected_item, self.itemDataTemplate);
        } else {
          self.HideItemDetails();
        }
      });
      $("#ft-loading").addClass("ft-inactive");
    })
  }

  /**
   * Sets up options using initial default set of options, which is extended by user input
   * @param {array} supplied_options - The user-defined options to overwrite defaults
   */
  set_options(supplied_options) {
    var defaults = {
      timelineOptions: {
        height: window.innerHeight,
        dataAttributes: ['text','media'],
        margin: {
          item: 5,
          axis: 10,
        },
        tooltip: {
          followMouse: true,
        },
        template: Handlebars.compile(""),
        order: function(a, b) { return b.duration - a.duration; },
      }
    }
    $.extend(defaults.timelineOptions,supplied_options);
    return defaults;
  }

  get_tag_col() {
    return 'tag_col' in get_url_params() ? url_params['tag_col'] : 'Tags';
  }

  /**
   * Set up the DOM within the timeline div for use by the rest of the functions
   * @param {array} options - A dictionary-like array of options to use in DOM creation
   */
  setup_dom(self, options) {
    if ("divId" in options) {
      var div_id = plainId(options['divId']);
    } else {
      var div_id = "timeline";
    }
    var container = $("#"+div_id);
    var windowHeight = window.innerHeight;
    var bylineHeight = $(".tl-caption").height() + $(".tl-credit").height() || 0;
    var html = "";
    html += `<div id="ft-loading" class="ft-vcenter-outer"><div class="ft-vcenter-middle"><div class="ft-vcenter-inner"><p><i class="fa fa-spinner fa-pulse fa-fw"></i>Loading...</p></div></div></div>`;
    html += `<div id="ft-filter-container"><h1>Filter Timeline</h1>`;
    html += `<div id="ft-filters"></div>`;
    html += `<div class="clear-filters"><p>Clear all filters</p></div></div>`
    html += `<div id="ft-nav-buttons">\
              <div id="ft-nav-zoom-in" class="ft-nav-button ft-vcenter-outer"><div class="ft-vcenter-middle"><div class="ft-vcenter-inner"><i class="fa fa-2x fa-plus-circle" aria-hidden="true"></i></div></div></div>\
              <div id="ft-nav-zoom-out" class="ft-nav-button ft-vcenter-outer"><div class="ft-vcenter-middle"><div class="ft-vcenter-inner"><i class="fa fa-2x fa-minus-circle" aria-hidden="true"></i></div></div></div>\
              <div id="ft-nav-left" class="ft-nav-button ft-vcenter-outer"><div class="ft-vcenter-middle"><div class="ft-vcenter-inner"><i class="fa fa-2x fa-arrow-circle-left" aria-hidden="true"></i></div></div></div>\
              <div id="ft-nav-right" class="ft-nav-button ft-vcenter-outer"><div class="ft-vcenter-middle"><div class="ft-vcenter-inner"><i class="fa fa-2x fa-arrow-circle-right" aria-hidden="true"></i></div></div></div>\
              </div>`
    html += `<div id="ft-item-data" class="ft-data-inactive"><span class="ft-close">X</span></div>`;
    html += `<div id="ft-visualization"></div>`;
    html += `<style id="ft-dynamic-style">
        #ft-item-data { height: ${0.7 * windowHeight}px; top: ${0.15 * windowHeight}px; }
        .tl-media-image { max-height: ${0.7 * windowHeight - bylineHeight - 70}px !important; }
      </style>`;
    container.append(html);
    $(`.clear-filters`).on('click', {self:self}, function() {
      $(".filter input").prop('checked',false);
      self.set_filters('none',self);
      self.view.refresh();
    });
    $("#ft-nav-zoom-in").on("click", {self:self}, function() { self.timeline.zoomIn(0.2); });
    $("#ft-nav-zoom-out").on("click",function() { self.timeline.zoomOut(0.2); });
    $("#ft-nav-left").on("click",function() {
      var range = self.timeline.getWindow();
      var interval = range.end - range.start;
      var percentage = 0.2
      self.timeline.setWindow({
        start: range.start.valueOf() - interval * percentage,
        end:   range.end.valueOf() - interval * percentage
      });
    });
    $("#ft-nav-right").on("click",function() {
      var range = self.timeline.getWindow();
      var interval = range.end - range.start;
      var percentage = -0.2
      self.timeline.setWindow({
        start: range.start.valueOf() - interval * percentage,
        end: range.end.valueOf() - interval * percentage
      });
    });
    return true;
  }

  /**
   *
   */
  create_timeline(options) {
    let container = document.getElementById('ft-visualization');
    return new vis.Timeline(container,options.timelineOptions);
  }

  /**
   * Render the given item according to the given template, adding to elements
   * identified by selectors
   * @param {array} item - Array representing a timeline item
   * @param {Handlebars.compile} template - Handlebars templating function to apply to item
   */
  RenderItem(self,item,template) {
    var data_id = "ft-item-data";
    var text_id = "ft-item-text";
    var media_id = "ft-item-media";
    $("#"+data_id).empty();
    var contents = template(item);
    $("#"+data_id).append(contents);
    var item_media_dict = item['media'];
    if (item_media_dict['url'] && item_media_dict['url']!="") {
      $("#"+data_id).append(
        `<div id="ft-item-media-container" class="ft-cols-2">\
          <div class="ft-vcenter-outer">\
            <div class="ft-vcenter-middle">\
              <div id="${media_id}" class="ft-vcenter-inner"></div>\
            </div>\
          </div>\
        </div>`
      );
      $("#"+text_id).attr('class','ft-cols-2');
      $("#"+data_id).attr('class','ft-data-active');
      var item_media_type = TL.MediaType(item_media_dict);
      var item_media = new item_media_type.cls(item_media_dict);
      item_media.data.mediatype = item_media_type;
      item_media.addTo(document.getElementById(media_id));
      item_media.loadMedia();
      item_media.options['width'] = $("#ft-item-media-container").width() - 10;
      window.item_media = item_media;
      $(".tl-caption").attr('style',"");
      if (item_media.data.url.indexOf('youtube') > -1) {
        $(window).on("resize", function() {
          var target_width = $("#ft-item-media-container").width() - 10;
          item_media._el.content_item.style.height = TL.Util.ratio.r16_9({w:target_width}) + "px";
          item_media._el.content_item.style.width = target_width + "px";
          $(".tl-caption").attr('style','');
          $(".tl-credit").attr('style','');
        });
      } else if (item_media.data.url.indexOf('vimeo') > -1) {
        $(window).on("resize", function() {
          $(".tl-caption").attr('style','');
          $(".tl-credit").attr('style','');
        });
      }
    } else {
      $("#"+text_id).attr('class','ft-cols-1');
      $("#"+data_id).attr('class','ft-data-active');
    }
    $(".ft-close-button").on('click',{item: item, self: self},self.HideItemDetails);
    return null;
  }

  HideItemDetails(event) {
    $("#ft-item-data").attr('class','ft-data-inactive');
    if (event) {
      event.data.self.timeline.setSelection();
    }
  }

  /**
   * Get sheet ids from parameters, or from HTTP GET pointing to spreadsheets
   * @param {scope} self - The scope on which this function will be applied.
   * @param {array|string} - IDs for Google Spreadsheets given as parameters. If
   * none are given, the function will look to a url parameter, tl_list, for the
   * id of a master spreadsheet, and pull sheet urls from there.
   */
  get_sheet_ids(self,sheet_ids=null) {
    var dfd = $.Deferred();
    if (typeof(sheet_ids)=='string') {
      self.sheet_ids = [sheet_ids];
      dfd.resolve();
    } else if (typeof(sheet_ids)=='array') {
      self.sheet_ids = sheet_ids;
      dfd.resolve();
    } else {
      var pattern = /([a-zA-Z0-9_-]{44})/g
      var master_id_sheet = get_url_params()['tl_list'];
      var single_sheet_id = get_url_params()['tl_sheet'];
      if (master_id_sheet != null) {
        var sheet_ids = [];
        $.getJSON("https://sheets.googleapis.com/v4/spreadsheets/"+master_id_sheet+"/values/A:A?key="+self.api_key).done(function(data) {
          for (var i = 0; i < data.values.length; i++) {
            var url = data.values[i][0];
            var the_id = url.match(pattern)[0];
            sheet_ids.push(the_id);
          }
          self.sheet_ids = sheet_ids;
          dfd.resolve();
        });
      } else if (single_sheet_id != null) {
        self.sheet_ids = [single_sheet_id];
        dfd.resolve();
      } else {
        $( function() {
          var baseurl = window.location.origin + window.location.pathname;
          var tl_setup = $('#timeline-setup');
          function redirect_multi() {
            var list_sheet_id = $('#multi-sheet-url').val().match(pattern);
            var page_height = $('#page-height').val();
            var tag_col = $('#tag-column').val();
            var url = `${baseurl}?tl_list=${list_sheet_id}&height=${page_height}`;
            if (tag_col != '') {
              url += `&tag_col=${tag_col}`;
            }
            window.location.replace(url);
          }
          function redirect_single() {
            var single_sheet_id = $('#single-sheet-url').val().match(pattern);
            var page_height = $('#page-height').val();
            var tag_col = $('#tag-column').val();
            var url = `${baseurl}?tl_sheet=${single_sheet_id}&height=${page_height}`;
            if (tag_col != '') {
              url += `&tag_col=${tag_col}`;
            }
            window.location.replace(url);
          }
          var tl_single_entry = $('#timeline-single-entry').dialog({
            autoOpen: false,
            height: 300,
            width: 400,
            modal: true,
            buttons: {
              "Create Timeline": redirect_single
            }
          });
          var tl_multi_entry = $('#timeline-multi-entry').dialog({
            autoOpen: false,
            height: 300,
            width: 400,
            modal: true,
            buttons: {
              "Create Timeline": redirect_multi
            }
          });
          tl_setup.dialog({
            resizable: false,
            height: "auto",
            width: 400,
            modal: true,
            buttons: {
              "Single Timeline Sheet": function() {
                $(this).dialog("close");
                tl_single_entry.dialog('open');
              },
              "Multiple Timeline Sheets": function() {
                $(this).dialog("close");
                tl_multi_entry.dialog('open');
              }
            }
          });
          tl_multi_entry.find("form").on("submit", function(event) {
            event.preventDefault();
            redirect_multi();
          });
          tl_single_entry.find("form").on("submit", function(event) {
            event.preventDefault();
            redirect_single();
          });
        });
      }
    }
    return dfd.promise();
  }

  /**
   * Gets data from the spreadsheet with the given ID
   * Returns an array of rows as associative arrays keyed by column name
   * @param {string} sheet_id - ID of Google spreadsheet containing data
   */
  get_sheet_data(sheet_id) {
    var self = this;
    var dfd = $.Deferred();
    var request_url = `https://sheets.googleapis.com/v4/spreadsheets/${sheet_id}/values/A:ZZZ?key=${this.api_key}`;
    $.getJSON(request_url).done(function(data) {
      var columns = data.values[0];
      for (var i = 1; i < data.values.length; i++) {
        var values = zip_arrays(columns, data.values[i]);
        self.sheet_data.push(values);
      };
      dfd.resolve();
    });
    return dfd.promise();
  };

  get_sheet_title(sheet_id) {
    var self = this;
    var dfd = $.Deferred();
    var request_url = `https://sheets.googleapis.com/v4/spreadsheets/${sheet_id}?key=${this.api_key}`;
    $.getJSON(request_url).done(function(data) {
      var title = data.properties.title;
      document.title = title;
      dfd.resolve();
    });
    return dfd.promise();
  }

  /**
   * Gets data from multiple spreadsheets, returns it all in the same array.
   * Built for data where there is consistency in column naming
   * Resulting array will contain associative arrays keyed by their sheet's
   * column names, so having column names that differ may break the use of
   * output.
   * @param {array} sheet_ids - Array of sheet IDs from which data is to be extracted
   * @uses get_sheet_data
   */
  get_all_sheet_data() {
    let self = this;
    const promises = this.sheet_id.map( (id) => {
      return this.get_sheet_data(id);
    });
    return $.when.apply($,promises);
  };

  /**
   * Constructs a date, given that year, month, day, or time may be null.
   * Returns a date object or null, if all inputs are null.
   * Assumes that input is clean and verified, no non-int or invalid values.
   * @param {integer} year    - year for date constructor
   * @param {integer} month   - month for date constructor
   * @param {integer} day     - day for date constructor
   * @param {integer} hours   - hours for date constructor
   * @param {integer} minutes - minutes for date constructor
   */
  constructDate(year,month,day,hours,minutes){
    // console.log("Constructing date: [Y:"+year+"] [M:"+month+"] [D:"+day+"] [hh:"+hours+"] [mm:"+minutes+"]");
    var date = new Date("0001-01-01T00:00");
    // Set default date

    var dateString = "0001-01-01T00:00"
    // Set initial default date string

    if (year != null)  {
      if (year < 0) {
        // If BCE date, just set the year
        date.setFullYear(year);
      } else {
        // If CE date, set year in dateString then re-create date
        // This has to happen because setting years with low-digit years
        // puts them all in the 1900s
        dateString = padToNDigit(year,4) + dateString.slice(4);
        date = new Date(dateString);
      }
      if (month != null) {
        date.setMonth(month);
        if (day != null)   {
          date.setDate(day)
          if (hours !== null && minutes !== null)  {
            date.setHours(hours);
            date.setMinutes(minutes);
          }
        }
      }
    }
    if (date.getTime() != new Date("0001-01-01T00:00").getTime()) {
      // If the date has changed from the initial value, return it
      // console.log("returning date: "+date.toDateString());
      return date;
    } else if (year) {
      // If there is a year, this is a date, and may be set to 1
      return date;
    } else {
      // Otherwise return null
      // console.log("returning null");
      return null;
    }
  }

  /**
   * Gets date/time information from datum by column names.
   * Also performs validation on that input, returning a string detailing the
   * problem encountered. If all input is valid, returns value from callback
   * function.
   * @uses constructDate
   * @param {array} datum - Associative array of row as generated by get_sheet_data
   * @param {string} year_column  - Key for year data in datum
   * @param {string} month_column - Key for month data in datum
   * @param {string} day_column   - Key for day data in datum
   * @param {string} time_column  - Key for time data in datum
   * @param {function} callback - Function to construct the datetime object
   */
  get_datetime(datum,year_column,month_column,day_column,time_column,callback) {
    var tempYear = datum[year_column].trim();
    if (tempYear == null || tempYear == "") {
      // if year is actually empty, keep it that way
      var year = null;
    } else if (parseInt(tempYear)) {
      // if parsing the year as int works, return the year as an integer
      var year = parseInt(tempYear);
    } else {
      // non-null, non-integer year, which is invalid input
      return `Invalid year: "${datum[year_column]}"`;
    }
    var tempMonth = datum[month_column].trim();
    if (tempMonth == null || tempMonth == "") {
      // if month is actually empty, keep it that way
      var month = null;
    } else if (parseInt(tempMonth) && (parseInt(tempMonth) >= 1 && parseInt(tempMonth) <= 12)) {
      // if the month is parseable as an int and within month ranges set it up
      var month = parseInt(tempMonth)-1;
    } else {
      // non-null month either outside range or not coercible to integer. Invalid.
      return `Invalid month: "${datum[month_column]}"`;
    }
    var tempDay = datum[day_column].trim();
    if (tempDay == null || tempDay == "") {
      // if month is actually empty, keep it that way
      var day = null;
    } else if (parseInt(tempDay) && (parseInt(tempDay) >= 1 && parseInt(tempDay) <= 31)) {
      // if the day is parseable as an int and within day ranges set it up
      var day = parseInt(tempDay);
    } else {
      // non-null day either outside range or not coercible to integer. Invalid.
      return `Invalid day: "${datum[day_column]}"`;
    }
    var tempTime = datum[time_column].trim();
    if (tempTime == null || tempTime == "") {
      // If the time is null, just set the hours and minutes to null
      var hours   = null;
      var minutes = null;
    } else if (timeParse(tempTime)) {
      var time = timeParse(tempTime);
      var hours   = time[0];
      var minutes = time[1];
    } else {
      return `Invalid time: "${datum[time_column]}"`;
    }
    // Check if there are any out of order non-null date parts
    var vals = [year,month,day,hours,minutes];
    for (var i = 0; i < vals.length; i++) {
      if (vals[i] == null && vals.slice(i+1).some(function(x,i,a) {return x != null;})) {
        return `Invalid date construction: "${vals}" (should be year,month,day,hour,minute)`
      }
    }
    var output = callback(year,month,day,hours,minutes);
    return output;
  };

  /**
   * Used to set the `items` property of the class.
   * @param {object} self - The "this" to which the items should be set.
   * @param {array} sheet_data - Array of data from sheets to be made into items.
   */
  set_items(self, sheet_data) {
    var items = [];
    for (var i = 0; i < sheet_data.length; i++) {
      if (Object.keys(sheet_data[i]).length == 0) {
        break
      }
      var item = {};
      var start = self.get_datetime(sheet_data[i],'Year','Month','Day','Time',self.constructDate);
      if (typeof(start) == "string") {
        console.log(`Problem with start date of entry with headline "${sheet_data[i]['Headline']}".`);
        console.log(`\t${start}`);
        item['start'] = null;
      } else {
        item['start'] = start;
      }
      var end = self.get_datetime(sheet_data[i],'End Year','End Month','End Day','End Time',self.constructDate);
      if (typeof(end) == "string") {
        console.log(`Problem with end date of entry with headline "${sheet_data[i]['Headline']}".`);
        console.log(`\t${end}`);
        item['end'] = null;
      } else {
        item['end'] = end;
      }
      item['headline']           = sheet_data[i]['Headline'];
      item['text']               = sheet_data[i]['Text'];
      item['media']              = {};
      item['media']['url']       = sheet_data[i]['Media'];
      item['media']['credit']    = sheet_data[i]['Media Credit'];
      item['media']['caption']   = sheet_data[i]['Media Caption'];
      item['media']['thumbnail'] = sheet_data[i]['Media Thumbnail'];
      item['sheet_type']         = sheet_data[i]['Type'];
      item['sheet_group']        = sheet_data[i]['Group'];
      item['group_slug']         = self.slugify(sheet_data[i]['Group']);
      item['background']         = ((sheet_data[i]['Background'] && sheet_data[i]['Background'].startsWith('http')) ? 'url('+sheet_data[i]['Background']+")" : sheet_data[i]['Background'])
      if (item['end'] && item['start'] && item['end']-item['start']<=0) {
        // If there is both a start date and an end date, but they are equal,
        // or less than zero (end before start),
        // set the end date to null to make it display as a point.
        item['end'] = null;
      }
      item['duration'] = (item['end'] == null) ? 0 : (item['end'] - item['start'])
      if (sheet_data[i]['Display Date'] && sheet_data[i]['Display Date'] != "") {
        item['display_date'] = sheet_data[i]['Display Date'];
      } else {
        item['display_date'] = GetDisplayDate(sheet_data[i],item['start'],item['end']);
      }
      item['title'] = GetDisplayTitle(sheet_data[i],item['display_date'])
      if (self.tag_col in sheet_data[i]) {
        var tags = sheet_data[i][self.tag_col].split(',').map(function(x) {
          return x.trim();
        });
        item['tags'] = tags;
        item['tag_slugs'] = tags.map(function(x) { return self.slugify(x); });
      }
      if (item['start']) {
        items.push(item);
      } else if (item['sheet_type']=="title") {
        self.title_entry = item;
      }
    }
    return items;
  }

  /**
   * Uses groups from Timeline JS to color the timeline.
   */
  set_groups(self) {
    let groups = self.items.map( (item)=> {
      if (item['sheet_group']) {
        item['className'] = self.slugify(item['sheet_group']);
        return item['sheet_group'];
      } else {
        item['className'] = "Ungrouped";
        item['group_slug'] = "Ungrouped";
        return "Ungrouped";
      }
    });
    groups.filter(self.onlyUnique);
    groups.sort();
    self.setup_group_ui(self, groups);
    return groups;
  }



  /**
   * Sets up color scheme and filters for groups.
   */
  setup_group_ui(self, groups) {
    self.setup_filters(self,groups,"Groups");
    var defaultScheme = { hmin: 0, hmax: 360, cmin: 30, cmax: 80, lmin: 35, lmax: 80  };
    var fancyLight    = { hmin: 0, hmax: 360, cmin: 15, cmax: 40, lmin: 70, lmax: 100 };
    var checkColor = function(hcl, params) {
      var hCond = params.hmin < params.hmax ?
        hcl[0]>=params.hmin && hcl[0]<=params.hmax :
        hcl[0]>=params.hmin || hcl[0]<=params.hmax;
      if (hCond) {
        var cCond = hcl[1]>=params.cmin && hcl[1]<=params.cmax;
        if (cCond) {
          var lCond = hcl[2]>=params.lmin && hcl[2]<=params.lmax;
          return lCond;
        } else {
          return false;
        }
      } else {
        return false;
      }
    }
    var raw_colors = paletteGenerator.generate(groups.length, function(color) {
      var hcl = color.hcl();
      return checkColor(hcl, defaultScheme);
    });
    var colors = [];
    for (var i = 0; i < raw_colors.length; i++) {
      colors.push(raw_colors[i].hex());
    }
    colors.sort();
    var theStyle = $("#docstyle");
    for (var i = 0; i < groups.length; i++) {
      var slug = self.slugify(groups[i]);
      var style = `.${slug}.vis-item,\
      #ft-filters .${slug}.filter {\
        background-color: ${colors[i]};\
        border-color: ${colors[i]};\
      }\n`;
      theStyle.append(style);
    }
  }

  /**
   * Sets up tags to be used as filters
   */
  set_tags(self) {
    let tags = [];
    self.items.forEach( (item)=> {
       if (item['tags']) {
         let slugs = item['tags'].map(self.slugify);
         let concatter = item['classname'] ? item['classname'] : '';
         item['classname'] = concatter + ' ' + slugs.join(' ');
         tags = tags.concat(item['tags']);
       }
     });
     tags = tags.filter( self.onlyUnique );
     tags.sort();
     self.setup_filters(self,tags,"Tags");
     return tags;
  }

  /**
   *
   */
  setup_filters(self, filter_names, filter_class) {
    if (filter_names.length > 0) {
      var html = `<div class="${filter_class} filter-group">`;
      html += `<h1>Filter ${filter_class}</h1>`
      for (var i = 0; i < filter_names.length; i++) {
        var name = filter_names[i];
        if (name == "") {
          name = `[No ${filter_class}]`;
        }
        var slug = self.slugify(name);
        var HTMLtemplate = `<div class="filter ${slug} ${filter_class}"><label for="${slug}">${name}</label>\
        <input id="${slug}" type="checkbox" class="filter-checkbox" value="${slug}"></div>`;
        // var CSSTemplate = `<style id="${slug}-style">.vis-item.${slug}{display:inline-block !important;}</style>`
        html += HTMLtemplate;
        // $("head").append(CSSTemplate);
      }
      // var clear_name = "All " + filter_class;
      // var clear_slug = self.slugify(clear_name);
      // var template = `<div class="meta-filter ${clear_slug} ${filter_class}"><label for="${clear_slug}">${clear_name}</label>\
      // <input id="${clear_slug}" type="checkbox" class="tagFilter" value="${clear_slug}" checked></input></div>`;
      // html += template;
      // html += "</div>";
      if (filter_class == "Tags") {
        html += '<div id="tag-options">\
          <input type="radio" name="tag-options" id="tag-option-any" checked>\
          <label for="tag-option-any">OR</label>\
          <input type="radio" name="tag-options" id="tag-option-all">\
          <label for="tag-option-all">AND</label></div>';
      }
      // html += `<div class="${filter_class} clear-filters">Clear all filters</div>`;
      html += '</div>';
      $("#ft-filters").append(html);
      $(`.${filter_class}.filter input`).on('click',{self:self},self.filter_items);
      $("#tag-options input").on('click',{self:self},self.filter_items);
      // $(`.${clear_slug} input`).on('click',function() {
        // Clear all group filters
        // var is_checked = $(this).prop('checked');
        // var selector = `.filter.${filter_class} input`;
        // $(selector).each(function() {
        //   if ($(this).prop('checked')!=is_checked) {
        //     $(this).click();
        //   }
        // });
        // .prop('checked',$(this).prop('checked'));
        // self.filter_items();
      // });
    }
  }

  /**
   * This function runs as an on click event on filter checkboxes. It changes
   * the style blocks that determine how timeline items are displayed, then
   * redraws the timeline based on the new display settings.
   * @param {event} event - The event that triggers the function. This should
   * have a self parameter identified, which should have the timeline object to
   * be redrawn.
   */
  filter_items(event) {
    var slug = $(this).attr('id');
    event.data.self.set_filters(slug, event.data.self);
    event.data.self.view.refresh();
    // event.data.self.apply_filters(event.data.self);
    // var style_block = $(`#${slug}-style`);
    // style_block.empty();
    // if ($(this).prop('checked')) {
    //   style_block.append(`.vis-item.${slug}{display:inline-block !important;}`)
    // } else {
    //   style_block.append(`.vis-item.${slug}{display:none;}`);
    // }
    // event.data.self.timeline.redraw();
  }

  /*
   *
   */
  set_filters(slug, self) {
    // Set Group filters
    var activeGroups = [];
    var groupCheckboxes = $(".Groups input.filter-checkbox");
    for (var i = 0; i < groupCheckboxes.length; i++) {
      if (groupCheckboxes[i].checked) {
        activeGroups.push(groupCheckboxes[i].value);
      }
    }
    self.filters.activeGroups = activeGroups;
    // Set Tag filters
    var activeTags = [];
    var tagCheckboxes = $(".Tags input.filter-checkbox");
    for (var i = 0; i < tagCheckboxes.length; i++) {
      if (tagCheckboxes[i].checked) {
        activeTags.push(tagCheckboxes[i].value);
      }
    }
    self.filters.activeTags = activeTags;
    if ($("#tag-options").length > 0) {
      if ($("#tag-option-any")[0].checked) {
        self.filters.tagOptions = "any";
      } else if ($("#tag-option-all")[0].checked) {
        self.filters.tagOptions = "all";
      } else {
        self.filters.tagOptions = "any";
        $("#tag-option-any")[0].checked = true;
        console.log("Tag options div exists, but radio input is unset. That's weird.");
      }
    }
  }

  /**
   * Function to be applied directly to the data view that backs the timeline
   */
  item_filter(self) {
    return function(item) {
      if (self.filters.activeGroups.length == 0 && self.filters.activeTags.length == 0) {
        // If neither group nor tag filters are set, return a filter function that
        // always returns true.
        return true;
      } else if (self.filters.activeGroups.length > 0 && self.filters.activeTags.length == 0) {
        // If only the group filter is set, return a function to check if the
        // group of an item is active
        return $.inArray(item.group_slug,self.filters.activeGroups) > -1;
      } else if (self.filters.activeGroups.length == 0 && self.filters.activeTags.length > 0) {
        // If only the tag filter is set...
        if (self.filters.tagOptions == "all") {
          // ...and tag options are set to match all tags, return a function to
          // filter to only items with all of the active tags applied.
          return self.filters.activeTags.every(function(element, index, array) {
            return $.inArray(element,item.tag_slugs) > -1;
          });
        } else {
          // ...and tag options are set to match any active tag, return a function
          // to filter to only items with any active tag applied.
          return self.filters.activeTags.some(function(element, index, array) {
            return $.inArray(element,item.tag_slugs) > -1;
          });
        };
      } else {
        // Both tag filters and group filters are set. Items should be filtered to
        // only those with an active group and any/all active tags, depending on
        // active tag behavior.
        var hasActiveGroup = $.inArray(item.group_slug,self.filters.activeGroups) > -1;
        if (hasActiveGroup) {
          // If the group is active, do the tag checks.
          if (self.filters.tagOptions == "all") {
            // Check if all tags are active
            var hasAllTags = self.filters.activeTags.every(function(element, index, array) {
              return $.inArray(element,item.tag_slugs) > -1;
            });
            return hasAllTags;
          } else {
            // Check if any tags are active
            var hasAnyTag = self.filters.activeTags.some(function(element, index, array) {
              return $.inArray(element,item.tag_slugs) > -1;
            });
            return hasAnyTag;
          }
        } else {
          // If the group is not active, don't bother with the tag checks, just
          // return false
          return false;
        }
      }
    }
  }

  apply_filters(self) {
    // add/remove items according to current filters
    if (self.filters.activeGroups.length == 0 && self.filters.activeTags.length == 0) {
      // No group or tag filters
      self.timeline.itemsData.clear();
      self.timeline.itemsData.add(self.items);
      return 0;
    } else if(self.filters.activeGroups.length > 0 && self.filters.activeTags.length == 0) {
      // Only active Groups are set as filters
      self.timeline.itemsData.clear();
      self.timeline.itemsData.add(self.items.filter(function(item) {
        return $.inArray(item.group_slug,self.filters.activeGroups) != -1;
      }));
    } else if (self.filters.activeGroups.length == 0 && self.filters.activeTags.length > 0) {
      // Only active Tags are set as filters
      self.timeline.itemsData.clear();
      if (self.filters.tagOptions == "all") {
        self.timeline.itemsData.add(self.items.filter(function(item) {
          return self.filters.activeTags.every(function(element, index, array) {
            return $.inArray(element,item.tag_slugs) != -1;
          });
        }));
      } else {
        self.timeline.itemsData.add(self.items.filter(function(item) {
          return self.filters.activeTags.some(function(element, index, array) {
            return $.inArray(element,item.tag_slugs) != -1;
          });
        }));
      }
    }
  }

  /**
   * Takes a text string, prepares it to be used as an identifying slug
   * Returns slugified string
   * @param {string} text - the text to be made into a slug.
   */
  slugify(text) {
    const pattern = /[\s~!@$%^&*()+=,./';:"?><[\] \\{}|`#]+/g;
    return typeof(text) == "string" ? text.trim().replace(pattern,'_') : "";
  }

  /**
   * Used as a filter for an array, this function returns only the unique values
   * of that array.
   */
  onlyUnique(value, index, self) {
    return self.indexOf(value) === index;
  }
}
