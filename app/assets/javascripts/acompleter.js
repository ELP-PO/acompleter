
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


    /**
     * Smart replace dom-list items by results items
     **/
    Acompleter.prototype.updateResults = function() {
        if (this.results.length === 0) {
            this.hideResults();
            return;
        }

        var self = this,
            $ul = this.$results.children('ul'),
            $items = $ul.children('li'),
            scrollBottom = Math.max( 0, this.current_.index - this.options.listLength + 1 ),
            scrollTop = Math.min( scrollBottom + this.options.listLength, this.results.length ),
            removeMarkClass = '_remove_mark_acompleter',
            appendMarkClass = '_append_mark_acompleter',
            dum;

        // DEBUG: remove this string after debugging
        $items.removeClass(removeMarkClass).removeClass(appendMarkClass);

        // Mark items that should be removed
        //
        (function() {
            var i, r, remove, itemString, resultString,
                max = scrollTop;
            for (i = $items.length; i--;) {
                itemString = $items.eq(i).text();
                remove = true;
                // Search itemString inside results
                for (r = scrollBottom; r < max; r++) {
                    resultString = self.results[r].name;
                    if (resultString >= itemString) {
                        remove = resultString > itemString;
                        max = r;
                        break;
                    }
                }
                // If itemString is not found mark it to be removed
                if (remove) {
                    $items.eq(i).addClass(removeMarkClass);
                }
            }
        })();

        // Prepend new items before and between existing items
        //
        (function() {
            var i, r, itemString, resultString, 
                $item, $restItems = $items.filter(":not(." + removeMarkClass + ")"),
                min = scrollBottom;
            for (i = 0; i < $restItems.length; i++) {
                itemString = $restItems.eq(i).text();
                for (r = min; r < scrollTop; r++) {
                    resultString = self.results[r].name;
                    if (resultString < itemString) {
                        $item = self.createListItem(r);
                        $item.addClass(appendMarkClass);
                        $restItems.eq(i).before($item);
                    } else {
                        // Recreate existing items for sake of update highlighted value and
                        // index of corresponding data in the results array
                        if (resultString == itemString) {
                            $item = self.createListItem(r);
                            $restItems.eq(i).replaceWith($item);
                        }
                        min = r + 1;
                        break;
                    }
                }
            }
        })();

        // Append rest of the items to populate list
        //
        (function() {
            var i, $item;
            for (i = scrollBottom + $ul.find("li:not(." + removeMarkClass + ")").length; i < scrollTop; i++) {
                $item = self.createListItem(i);
                $item.addClass(appendMarkClass);
                $ul.append($item);
            }
        })();

        if (this.options.animation) {
        } else {
            $ul.find("." + removeMarkClass).remove();
            this.highlightCurrent();
            this.showList();
        }
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
