/**
 * Makes an associative array based on the keys and values provided
 * @param {array} keys - Array of keys for output array
 * @param {array} values - Array of values for output array
 */
function zip_arrays(keys, values) {
  var returnValues = {};
  values.forEach(function(val, i) {
    returnValues[keys[i]] = val;
  });
  return returnValues
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
 * Class loading data from one or more Google Sheets formatted for use in Knight
 * Lab's Timeline JS. Prepares data for use in visjs timeline. Uses jquery.
 * Data is loaded asynchronously, so should be loaded in FabulousTime.promise.done()
 * function. Start and end dates are loaded, other properties are stored as item
 * properties to be loaded by templates or as part of the item dataset object.
 */
class FabulousTime {
  /**
   * Load data from Google Sheets by sheet IDs
   * @param {array} sheet_ids - Array with Google Sheet ids as strings. If
   * sheet_ids is a string, it is assumed to be a single sheet ID
   * @param {string} api_key - Google Sheets API key.
   * @param {vis.Timeline} timeline - vis.js timeline object to contain the items
   */
  constructor(api_key, timeline, sheet_ids=null) {
    this.api_key = api_key;
    this.sheet_data = [];
    this.timeline = timeline;

    var self = this;

    this.getting_sheet_ids = this.get_sheet_ids(self,sheet_ids);

    this.getting_sheet_data = this.getting_sheet_ids.then(function() {
      return self.get_all_sheet_data();
    });

    self.ready = self.getting_sheet_data.then(function() {
      self.items = self.set_items(self, self.sheet_data);
      self.groups = self.set_groups(self);
      self.tags = self.set_tags(self);
    });
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
            var the_id = url.match(pattern)[0]
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
          var baseurl = "http://" + window.location.hostname + window.location.pathname;
          var tl_setup = $('#timeline-setup');
          function redirect_multi() {
            var list_sheet_id = $('#multi-sheet-url').val().match(pattern);
            window.location.replace(baseurl+'?tl_list='+list_sheet_id);
          }
          function redirect_single() {
            var single_sheet_id = $('#single-sheet-url').val().match(pattern);
            window.location.replace(baseurl+'?tl_sheet='+single_sheet_id);
          }
          var tl_single_entry = $('#timeline-single-entry').dialog({
            autoOpen: false,
            height: 300,
            width: 300,
            modal: true,
            buttons: {
              "Create Timeline": redirect_single
            }
          });
          var tl_multi_entry = $('#timeline-multi-entry').dialog({
            autoOpen: false,
            height: 300,
            width: 300,
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
                tl_single_entry.dialog('open');
                $(this).dialog("close");
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
    $.getJSON("https://sheets.googleapis.com/v4/spreadsheets/"+sheet_id+"/values/A:ZZZ?key="+this.api_key).done(function(data) {
      var columns = data.values[0];
      for (var i = 1; i < data.values.length; i++) {
        var values = zip_arrays(columns, data.values[i]);
        self.sheet_data.push(values);
      };
      dfd.resolve();
    });
    return dfd.promise();
  };

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
    var self = this;
    var promises = [];
    for (var i = 0; i < this.sheet_ids.length; i++) {
      var sheet_id = this.sheet_ids[i];
      promises.push(this.get_sheet_data(sheet_id));
    };
    return $.when.apply($,promises);
  };

  /**
   * Constructs a date, given year, month, day, or time may be null.
   * Returns a date object or null, if all inputs are null.
   * @param {integer} year  - year for date constructor
   * @param {integer} month - month for date constructor
   * @param {integer} day   - day for date constructor
   * @param {integer} time  - time for date constructor
   */
  dateWithNulls(year,month,day,time){
    var date = new Date([1,'01','01','00:00'])
    if (year  && year.trim())  { date.setYear(year) }
    if (month && month.trim()) { date.setMonth(month); }
    if (day   && day.trim())   { date.setDate(day); }
    if (time  && time.trim())  { date.setTime(time); }
    if (date.getTime() != new Date([1,'01','01','00:00']).getTime()) {
      // If the date has changed from the initial value, return it
      return date;
    } else {
      // Otherwise return null
      return null;
    }
  }

  /**
   * Gets date/time information from datum by column names.
   * @uses dateWithNulls
   * @param {array} datum - Associative array of row as generated by get_sheet_data
   * @param {string} year_column  - Key for year data in datum
   * @param {string} month_column - Key for month data in datum
   * @param {string} day_column   - Key for day data in datum
   * @param {string} time_column  - Key for time data in datum
   * @param {function} callback - Function to construct the datetime object
   */
  get_datetime(datum,year_column,month_column,day_column,time_column,callback) {
    var year  = datum[year_column];
    var month = datum[month_column];
    var day   = datum[day_column];
    var time  = datum[time_column];
    var output = callback(year,month,day,time);
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
      var item = {};
      item['start'] = self.get_datetime(sheet_data[i],'Year','Month','Day','Time',self.dateWithNulls);
      item['end']   = self.get_datetime(sheet_data[i],'End Year','End Month','End Day','End Time',self.dateWithNulls);
      item['display_date']    = sheet_data[i]['Display Date']
      item['headline']        = sheet_data[i]['Headline'];
      item['text']            = sheet_data[i]['Text'];
      item['media']           = {};
      item['media']['url']       = sheet_data[i]['Media'];
      item['media']['credit']    = sheet_data[i]['Media Credit'];
      item['media']['caption']   = sheet_data[i]['Media Caption'];
      item['media']['thumbnail'] = sheet_data[i]['Media Thumbnail'];
      item['sheet_type']      = sheet_data[i]['Type'];
      item['sheet_group']     = sheet_data[i]['Group'];
      if (item['end'] && item['start'] && item['end']-item['start']<=0) {
        // If there is both a start date and an end date, but they are equal,
        // or less than zero (end before start),
        // set the end date to null to make it display as a point.
        item['end'] = null;
      }
      if ('Tags' in sheet_data[i]) {
        var tags = sheet_data[i]['Tags'].split(',').map(function(x) {
          return x.trim();
        });
        item['tags'] = tags;
      }
      if (item['start']) { items.push(item); }
    }
    return items;
  }

  /**
   * Uses groups from Timeline JS to color the timeline.
   */
  set_groups(self) {
    var groups = [];
    for (var i = 0; i < self.items.length; i++) {
      if (self.items[i]['sheet_group']) {
        var slug = self.slugify(self.items[i]['sheet_group']);
        if ($.inArray(slug,groups) == -1) {
          groups.push(slug);
        }
        self.items[i]['className'] = slug;
      } else {
        self.items[i]['className'] = "Ungrouped"
        if ($.inArray('Ungrouped',groups) == -1) {
          groups.push("Ungrouped");
        }
      }
    }
    groups.sort();
    self.setup_group_ui(self, groups);
    return groups;
  }

  /**
   * Sets up color scheme and filters for groups.
   */
  setup_group_ui(self, groups) {
    self.setup_filters(self,groups,"Groups");
    var scheme = palette.listSchemes('rainbow')[0];
    var colors = scheme.apply(scheme, [groups.length, 0.3]);
    var darkColors = scheme.apply(scheme, [groups.length, 0.8]);
    var theStyle = $("#docstyle");
    for (var i = 0; i < groups.length; i++) {
      var slug = self.slugify(groups[i]);
      var style = `.${slug}.vis-item,\
      .${slug}.filter {\
        background-color: #${colors[i]};\
        border-color: #${darkColors[i]};\
      }\n`;
      theStyle.append(style);
    }
  }

  /**
   * Sets up tags to be used as filters
   */
  set_tags(self) {
     var tags = [];
     for (var i = 0; i < self.items.length; i++) {
       if (self.items[i]['tags']) {
         var these_tags = self.items[i]['tags'].map(self.slugify);
         tags = tags.concat(these_tags);
         if (self.items[i]['className']) {
           self.items[i]['className'] = self.items[i]['className'] + ' ' + these_tags.join(' ');
         } else {
           self.items[i]['className'] = these_tags.join(' ');
         }
       }
     }
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
      for (var i = 0; i < filter_names.length; i++) {
        var slug = self.slugify(filter_names[i]);
        var name = filter_names[i];
        var HTMLtemplate = `<div class="filter ${slug} ${filter_class}"><label for="${slug}">${name}</label>\
        <input id="${slug}" type="checkbox" class="tagFilter" value="${slug}" checked></div>`;
        var CSSTemplate = `<style id="${slug}-style">.vis-item.${slug}{display:inline-block !important;}</style>`
        html += HTMLtemplate;
        $("head").append(CSSTemplate);
      }
      var all_name = "All " + filter_class;
      var all_slug = self.slugify(all_name);
      var template = `<div class="meta-filter ${all_slug} ${filter_class}"><label for="${all_slug}">${all_name}</label>\
      <input id="${all_slug}" type="checkbox" class="tagFilter" value="${all_slug}" checked></input></div>`;
      html += template;
      html += "</div>";
      $("#filters").append(html);
      $('.filter input').on('click',{self:self},self.filter_items);
      $(`.${all_slug} input`).on('click',function() {
        var is_checked = $(this).prop('checked');
        var selector = `.filter.${filter_class} input`;
        $(selector).each(function() {
          if ($(this).prop('checked')!=is_checked) {
            $(this).click();
          }
        });
        // .prop('checked',$(this).prop('checked'));
        // self.filter_items();
      });
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
    var style_block = $(`#${slug}-style`);
    style_block.empty();
    if ($(this).prop('checked')) {
      style_block.append(`.vis-item.${slug}{display:inline-block !important;}`)
    } else {
      style_block.append(`.vis-item.${slug}{display:none;}`);
    }
    event.data.self.timeline.redraw();
  }

  /**
   * Takes a text string, prepares it to be used as an identifying slug
   * Returns slugified string
   * @param {string} text - the text to be made into a slug.
   */
  slugify(text) {
    var output = text.trim()
    output = output.replace(' ','_')
    return output
  }

  /**
   * Used as a filter for an array, this function returns only the unique values
   * of that array.
   */
  onlyUnique(value, index, self) {
    return self.indexOf(value) === index;
  }
}
