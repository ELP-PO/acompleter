
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
                        if (e.keyCode == 40) {
                            acompleter.focusNext();
                        } else {
                            acompleter.focusPrev();
                        }

			            /*
						if (!this.scroll_timeout) {
			                this.scroll_timeout = setTimeout(function() {p.scroll_timeout = null;}, p.scroll_delay);
			                this.moveHighlight( key == 40 ? 1 : -1 );
			                return true;
			            }
						*/
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
        currentClass: 'current',
        onError: undefined,
        listLength: 10, 
        matchInside: true,

		_dummy: 'just to be last item'
	};
		


	var Acompleter = function($elem, options) {
		var self = this;
		
		this.options = options;
        this.current_ = { index: 0, serialized: null };
		this.keyTimeout_ = null;
        this.lastProcessedValue_ = undefined;
		this.$elem = $elem;
        this.$elem.bind('processed.acompleter', function() { self.updateCurrent(); });
        this.$elem.bind('processed.acompleter', function() { self.updateResults(); });

        this.$results = this.createList();
        $('body').append(this.$results);
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
        console.debug('process results', "'" + value + "'", data.length);
        this.lastProcessedValue_ = value;
        this.results = data;
        this.$elem.trigger('processed.acompleter');
    }; // processResults


    /**
     * Update index of the current item in new results set 
     * or set to first item if current item is not found in reulsts
     */
    Acompleter.prototype.updateCurrent = function() {
        if (this.results.length === 0) {
            return;
        }
        var index = 0, self = this;
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


    Acompleter.prototype.updateResults = function() {
        if (this.results.length === 0) {
            this.hideResults();
            return;
        }
        var $ul = this.$results.children('ul');
        var min = Math.max(0, this.current_.index - this.options.listLength + 1); 
        var max = Math.min(min+this.options.listLength, this.results.length);
        var self = this;

        $ul.find('li').removeClass('_delete_mark').removeClass('_append_mark');

        // mark diehards
        // 
        var r_max = max;
        var diehard = true;
        var $items = this.$results.find('ul>li');
        for (var i = $items.length; i--;) {
            diehard = true;
            var I = $items.eq(i).text();
            for (var r = min; r < r_max; r++) {
                var R = this.results[r].name;
                if (R < I) { 
                    continue;
                }
                diehard = R > I;
                r_max = r;
                break;
            }
            if (diehard) {
                $items.eq(i).addClass('_delete_mark');
            }
        }

        // prependions
        //
        $items = $items.filter(':not(._delete_mark)');
        var r_min = min;
        for (var i = 0; i < $items.length; i++) {
            var I = $items.eq(i).text();
            for (var r = r_min; r < max; r++) {
                var R = this.results[r].name;
                if (R < I) {
                    var $item = this.createListItem(r);
                    $item.addClass('_append_mark');
                    $items.eq(i).before($item);
                } else {
                    if (R == I) {
                        $item = this.createListItem(r);
                        $items.eq(i).replaceWith($item);
                    }
                    r_min = r + 1;
                    break;
                }
            }
        }
        // appendinos
        //
        min = min + $ul.find('li:not(._delete_mark)').length;
        for (var i = min; i < max; i++) {
            var $item = this.createListItem(i);
            $item.addClass('_append_mark');
            $ul.append($item);
        }




        $ul.find('._delete_mark').remove();
        
        console.log('current', this.current_.index, this.results[this.current_.index].name);
        this.highlightCurrent();

        this.showList();
    }; // updateResults


    Acompleter.prototype.highlightCurrent = function() {
        var self = this;
        this.$results.find('ul>li.' + this.currentClass).removeClass(this.currentClass);
        this.$results.find('ul>li').filter(function() { return $(this).data('index') == self.current_.index; }).addClass(this.options.currentClass);
    }; // highlightCurrent
    

    Acompleter.prototype.hideResults = function() {
        console.log('hide results');
        this.$results.hide();
    }; // hideResults


    Acompleter.prototype.createList = function() {
        var $results = $('<div></div>').hide().addClass(this.options.resultsClass).css({ position: 'absolute' });
        var $ul = $('<ul></ul>');
        $results.append($ul);
        return $results;
    }; // createList
        

    Acompleter.prototype.createListItem = function(index) {
        var result = this.results[index];
        var pattern = new RegExp((this.options.matchInside ? '' : '^') + this.lastProcessedValue_, 'i');
        var $li = $('<li></li>')
                .html(result.name.replace(pattern, "<span>$&</span>"))
                .data('serialized', $.param(result))
                .data('index', index);

        /*
        if (index == this.current_.index) {
            $li.addClass(this.options.currentClass);
        }
        (*/
        return $li;
    }; // createListItem


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


    Acompleter.prototype.updateScroll = function() {
        this.scroll_ = Math.max(0, this.current_.index - this.options.listLength + 1);
    }; // updateScroll


    Acompleter.prototype.focusNext = function() {
        this.focusMove(+1);
    }; // focusNext


    Acompleter.prototype.focusPrev = function() {
        this.focusMove(-1);
    }; // focusPrev


    Acompleter.prototype.focusMove = function(modifier) {
        var index = this.current_.index + modifier;
        this.focusRedraw(index);
    }; // focusMove


    Acompleter.prototype.focusRedraw = function(index) {
        this.current_.element.removeClass(this.options.currentClass);
        this.setCurrent(index);
        this.current_.element.addClass(this.options.currentClass);
    }; // focusRedraw


})(jQuery);
