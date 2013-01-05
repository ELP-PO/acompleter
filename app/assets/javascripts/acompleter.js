
// plugin
//
(function( $ ) {

	$.fn.acompleter = function( options ) {
		var opts = $.extend($.fn.acompleter.defaults, options);
		
		return this.each( function() {
			/**
			 * Skip non-inputs
			 */
			if ( !this.tagName || this.tagName.toUpperCase() !== 'INPUT' ) {
				return true;
			}
			var $this = $(this);
			var acompleter = new Acompleter($this, opts);
			
			/**
			 * Attach keyboard monitoring to input
			 */
			$this.keydown(function(e) {
				switch(e.keyCode) {
			        case 40: // down arrow
			        case 38: // up arrow
						e.preventDefault();
			            /*
						if (!this.scroll_timeout) {
			                this.scroll_timeout = setTimeout(function() {p.scroll_timeout = null;}, p.scroll_delay);
			                this.moveHighlight( key == 40 ? 1 : -1 );
			                return true;
			            }
						*/
						// TODO: wait for scroll delay and start scrolling
			            break;

			        // enter
			        case 13:
			            //return !this.selectHighlighted();
			            break;

			        // escape
			        case 27:
						// TODO: hide list
		                //this.hideList();
		                //return false;
			            break;

					// ignore navigational and special keys
					//
			        case 37: case 39:    // left, right arrows
			        case 34: case 33:    // pg up, pg down
			        case 35: case 36:    // home, end
					case 91: case 93:            // left command, right command
			        case 16: case 17: case 18:   // shift, ctrl, alt
			        case 9: case 20:    // tab, capslock
			        	// no reaction
			            break;


			        default:
						acompleter.activate();
			            break;            
			    } // switch
			}); // $this.keydown
		}); // this.each
	} // fn.acompleter 
		
	$.fn.acompleter.defaults =  {
		delay: 400, // specifies the amount of time to wait for displaying data between each key press
        url: '/kladr/list.json?query=',
        remoteDataType: 'json',
        loadingClass: 'loading',
        resultsClass: 'results',
        onError: undefined,
        listLength: 10, 

		_dummy: 'just to be last item'
	};
		


	var Acompleter = function($elem, options) {
		var self = this;
		
		this.$elem = $elem;
        this.$results = null;
		this.options = options;
        this.current_ = { index: 0, serialized: null };
		this.keyTimeout_ = null;
    };



    Acompleter.prototype.activate = function() {
        if (this.keyTimeout_) {
            clearTimeout(this.keyTimeout_);
        }
        var self = this;
        this.keyTimeout_ = setTimeout(function() {
            self.activateNow();
        }, this.options.delay);
    }; // this.activate


    Acompleter.prototype.activateNow = function() {
        // TODO: prepare value, check necessary to update
        var value = this.$elem.val();
        this.fetchData(value);
    }; // this.activateNow

		
    Acompleter.prototype.fetchData = function(value) {
        var data = this.cacheRead(value);
        if (data) {
            this.processResults(value, data);
        } else {
            var self = this;
            var ajaxCallback = function(data) {
                if (data.length) {
                    self.cacheWrite(value, data);
                }
                self.$elem.removeClass(self.options.loadingClass);
                self.processResults(value, data);
            };

            this.$elem.addClass(this.options.loadingClass);
            $.ajax({
                url: this.makeUrl(value),
                success: ajaxCallback,
                error: function(jqXHR, textStatus, errorThrown) {
                    if ($.isFunction(self.options.onError)) {
                        self.options.onError(jqXHR, textStatus, errorThrown);
                    } else {
                        ajaxCallback(false);
                    }
                },
                dataType: self.options.remoteDataType
            });
        }
    }; // fetchData
		

    Acompleter.prototype.makeUrl = function(value) {
        return this.options.url + value;
    }; // makeUrl
        

    Acompleter.prototype.processResults = function(value, data) {
            this.lastProcessedValue_ = value;
            this.results = data;
            this.updateCurrent();
            if (data.length) {
                this.showResults();
            } else {
                this.hideResults();
            }
    }; // processResults


    /**
     * Update index of the current item in new results set 
     * or set to first item if current item is not found in reulsts
     */
    Acompleter.prototype.updateCurrent = function() {
        var index = 0,
            self = this;
        if (this.current_.serialized !== null) {
            $.each(this.results, function(i, n) {
                if (self.current_.serialized == $.param(n)) {
                    index = i;
                    return false;
                }
            });
        }
        this.setCurrent(index);
    }; // updateCurrent


    /**
     * Remember item in results[index] as current item
     */
    Acompleter.prototype.setCurrent = function(index) {
        this.current_.index = index;
        this.current_.serialized = $.param(this.results[index]);
    }; // setCurrent


    Acompleter.prototype.showResults = function() {
        if (!this.$results) {
            this.createList();
        } else {
            this.rebuildList();
        }
        this.showList();
    }; // showResults


    Acompleter.prototype.hideResults = function() {
        this.$results.hide();
    };


    Acompleter.prototype.createList = function() {
        this.$results = $('<div></div>').hide().addClass(this.options.resultsClass).css({ position: 'absolute' });

        // create items
        //
        (function(self) {
            var $ul = $('<ul></ul>');
            var min = Math.max(0, self.current_.index - self.options.listLength + 1);
            var max = Math.min(min + self.options.listLength, self.results.length);
            for(var i = min; i < max; i++) {
                var item = self.createListItem(self.results[i]);
                if (i == self.current_.index) {
                    item.addClass('current');
                }
                $ul.append(item);
            }
            self.$results.append($ul);
        })(this);

        $('body').append(this.$results);
    }; // createList
        

    Acompleter.prototype.createListItem = function(result) {
        return $('<li></li>', {
            text: result.name
        });
    }; // createListItem


    Acompleter.prototype.rebuildList = function() {
        this.$results.empty();
        this.createList();
    }; // rebuildList


    Acompleter.prototype.showList = function() {
        // Always recalculate position since window size or
        // input element location may have changed.
        var position = this.$elem.offset();
        position.top += this.$elem.outerHeight();
        position.minWidth = this.$elem.outerWidth() - (this.$results.outerWidth() - this.$results.width());

        this.$results
            .css(position)
            .show();
    }; // showList

        
    Acompleter.prototype.cacheRead = function(value) {
        return false;
    }; // cacheRead


    Acompleter.prototype.cacheWrite = function(value, data) {
        return false;
    }; // cacheWrite




})(jQuery);
