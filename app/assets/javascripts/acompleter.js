/*
 *
 *
 */

;(function( $, undefined ) {

    var pluginName = 'acompleter',
        uuid = 0,
        defaults = {
            delay: 400, // specifies the amount of time to wait for displaying data between each key press
            url: "/kladr/list.json",
            remoteDataType: "json",
            loadingClass: "loading",
            onItemSelect: null,
            resultsClass: "results",
            resultsId: pluginName + "-results-", // + uid (plugin uid will append here)
            currentClass: "current",
            onError: undefined,
            beforeUseConverter: null,
            listLength: 10,
            minChars: 0,
            matchInside: true,
            matchCase: false,
            filter: null,
            sortResults: false,
            sortFunction: null,
            lineSeparator: '\n',
            cellSeparator: '|',
            processData: null,
            showResult: null,
            animation: true,
            animationSpeed: 177,
            highlight: true,
            //animationSpeed: 5000,

            /**
            * Returns value by which the plugin will compares result items with each other
            */
            getComparableValue: function( result ) { return result.value; },

            _dummy: "just to be last item"
        };


    // helper function
    var prepareToAnimation = function( $item ) {
        $item.data({
                height: $item.height(),
                opacity: $item.css( "opacity" )
            })
            .css({
                height: 0,
                opacity: 0,
                display: "none"
            });
    };

    /**
     * Sanitize result
     * @param {Object} result
     * @returns {Object} object with members value (String) and data (Object)
     * @private
     */
    var sanitizeResult = function( result ) {
        var value, data,
            type = typeof result;
        if ( type === 'string' ) {
            value = result;
            data = {};
        } else if ( $.isArray( result ) ) {
            value = result[ 0 ];
            data = result.slice( 1 );
        } else if ( type === 'object' ) {
            value = result.value;
            data = result.data;
        }
        value = String( value );
        if ( typeof data !== 'object' ) {
            data = {};
        }
        return {
            value: value,
            data: data
        };
    };

    /**
     * Create partial url for a name/value pair
     */
    var makeUrlParam = function( name, value ) {
        return [ name, encodeURIComponent(value) ].join('=');
    };

    /**
     * Build an url
     * @param {string} url Base url
     * @param {object} [params] Dictionary of parameters
     */
    var makeUrl = function( url, params ) {
        var urlAppend = [];
        $.each( params, function( index, value ) {
            urlAppend.push( makeUrlParam(index, value) );
        });
        if ( urlAppend.length ) {
            url += url.indexOf('?') === -1 ? '?' : '&';
            url += urlAppend.join('&');
        }
        return url;
    };


    /**
     * Default sort filter
     * @param {object} a
     * @param {object} b
     * @param {boolean} matchCase
     * @returns {number}
     */
    var sortValueAlpha = function( a, b, matchCase ) {
//        a = String( a.value );
 ////       b = String( b.value );
        a = String( a );
        b = String( b );
        if ( !matchCase ) {
            a = a.toLowerCase();
            b = b.toLowerCase();
        }
        if ( a > b ) {
            return 1;
        }
        if ( a < b ) {
            return -1;
        }
        return 0;
    };


    /**
     * Parse data received in text format
     * @param {string} text Plain text input
     * @param {string} lineSeparator String that separates lines
     * @param {string} cellSeparator String that separates cells
     * @returns {array} Array of autocomplete data objects
     */
    var plainTextParser = function(text, lineSeparator, cellSeparator) {
        var results = [];
        var i, j, data, line, value, lines;
        // Be nice, fix linebreaks before splitting on lineSeparator
        lines = String(text).replace('\r\n', '\n').split(lineSeparator);
        for (i = 0; i < lines.length; i++) {
            line = lines[i].split(cellSeparator);
            data = [];
            for (j = 0; j < line.length; j++) {
                data.push(decodeURIComponent(line[j]));
            }
            value = data.shift();
            results.push({ value: value, data: data });
        }
        return results;
    };


    $.Acompleter = function( $el, options ) {
        /**
         * Assert parameters
         */
        if (!$el || !($el instanceof $) || $el.length !== 1 || $el.get(0).tagName.toUpperCase() !== 'INPUT') {
            $.error( "Invalid parameter for jquery." + pluginName
                    + ", jQuery object with one element with INPUT tag expected.");
        }

        this.uid = ++uuid;
        this.options = $.extend( {}, defaults, options );
        // from boilerplate, but don't know for what
        //this._defaults = defaults;
        //this._name = pluginName;

        this._active = false;
        this._current = { index: 0, valueToCompare: null };
        this._keyTimeout = null;
        this._lastProcessedValue = undefined;
        this._ignoreBlur = false;
        this._elAttrs = {};
        this.results = [];
        this.$results = null;
        this.$el = $el;

        this.init();
    };

    // now used only in qunit
    $.Acompleter._defaults = defaults;

    $.Acompleter.prototype.init = function() {
        var self = this;

        this.$results = this.createList();
        $("body").append( this.$results );

        this._elAttrs.autocomplete = this.$el.attr("autocomplete");
        this.$el.attr( "autocomplete", "off" );

        this.$el.bind( "dblclick." + pluginName, function() {
            self.activate();
        });
        this.$el.bind( "blur." + pluginName, function(e) {
            if ( !self._ignoreBlur && !self.options._debug ) {
                self.deactivate( true );
            }
        });

        this.$el.bind( "keydown." + pluginName, function( e ) {
            //console.log( 'keykode:' , e.keyCode );
            switch ( parseInt(e.keyCode) ) {
                case 40: // down arrow
                    e.preventDefault();
                    if (self._active) {
                        self.focusNext();
                    } else {
                        self.activate();
                    }
                    return false;
                case 38: // up arrow
                    e.preventDefault();
                    if (self._active) {
                        self.focusPrev();
                    } else {
                        self.activate();
                    }
                    return false;
                case 13: // return
                    e.preventDefault();
                    if (self._active) {
                        self.selectCurrent();
                    }
                    break;
                case 27: // escape
                    if (self._active) {
                        e.preventDefault();
                        self.deactivate(true);
                        return false;
                    }
                    break;
                /*
                 * Ignore navigational and special keys
                 */
                case 37: case 39: case 34: case 33:  // left, right arrows, pg up, pg down
                case 35: case 36:            // home, end
                case 91: case 93:            // left command, right command
                case 16: case 17: case 18:   // shift, ctrl, alt
                case 9:  case 20: case 45:   // tab, capslock, insert
                    break;

                default:
                    self.activate();
            } // switch
        }); // $this.keydown
    }; // init


    $.Acompleter.prototype.destroy = function() {
        this.$results.remove();
        for ( var attr in this._elAttrs ) {
            this.$el.attr( attr, this._elAttrs[ attr ] );
        }
        this.$el.unbind( "." + pluginName );
        this.$el.removeData( "plugin_" + pluginName );
    }; // destroy


    /**
     * Call hook
     * Note that all called hooks are passed the autocompleter object
     * @param {string} hook
     * @param data
     * @returns Result of called hook, false if hook is undefined
     */
    $.Acompleter.prototype.callHook = function( hook, data ) {
        var f = this.options[ hook ];
        if ( f && $.isFunction(f) ) {
            return f( data, this );
        }
        return false;
    };


    $.Acompleter.prototype.activate = function() {
        if ( this._keyTimeout ) {
            clearTimeout( this._keyTimeout );
        }
        var self = this;
        this._keyTimeout = setTimeout(function() {
            self.activateNow();
        }, this.options.delay);
    }; // this.activate


    /**
     * Activate plugin immediately
     */
    $.Acompleter.prototype.activateNow = function() {
        var value = this.beforeUseConverter( this.$el.val() );
        if ( value !== this._lastProcessedValue ) {
            this.fetchData( value );
        }
    };

    /**
     * Convert string before use
     * @param s
     */
    $.Acompleter.prototype.beforeUseConverter = function( value ) {
        var converter = this.options.beforeUseConverter;
        if ( $.isFunction(converter) ) {
            value = converter( value );
        }
        return value;
    };

    /**
     * Get autocomplete data for a given value
     * @param {string} value Value to base autocompletion on
     * @private
     */
    $.Acompleter.prototype.fetchData = function( value ) {
        var self = this;
        var processResults = function( results, filter ) {
            if ( $.isFunction( self.options.processData ) ) {
                results = self.options.processData( results );
            }
            self.results = self.filterResults( results, filter );
            self.updateCurrent();
            self.showResults();
        };
        this._lastProcessedValue = value;
        if ( value.length < this.options.minChars ) {
            processResults( [], value );
        } else if ( this.options.data ) {
            processResults( this.options.data, value );
        } else {
            this.fetchRemoteData( value, function( remoteData ) {
                processResults( remoteData, value );
            });
        }
    };


    $.Acompleter.prototype.fetchRemoteData = function( value, callback ) {
        var data = this.cacheRead( value );
        if ( data ) {
            callback( data );
        } else {
            var self = this;
            var ajaxCallback = function( data ) {
                if ( data.length ) {
                    self.parseRemoteData( data );
                    self.cacheWrite( value, data );
                }
                self.$el.removeClass( self.options.loadingClass );
                callback( data );
            };

            this.$el.addClass( this.options.loadingClass );
            $.ajax({
                url: makeUrl( this.options.url, { q: value } ),
                success: ajaxCallback,
                error: function( jqXHR, textStatus, errorThrown ) {
                    if ( $.isFunction( self.options.onError ) ) {
                        self.options.onError( jqXHR, textStatus, errorThrown );
                    } else {
                        ajaxCallback( false );
                    }
                },
                dataType: self.options.remoteDataType
            });
        }
    }; // fetchRemoteData


    /**
     * Parse data received from server
     * @param remoteData Data received from remote server
     * @returns {array} Parsed data
     */
    $.Acompleter.prototype.parseRemoteData = function( remoteData ) {
        var remoteDataType,
            data = remoteData;
        if ( this.options.remoteDataType === 'json' ) {
            remoteDataType = typeof( remoteData );
            switch ( remoteDataType ) {
                case 'object':
                    data = remoteData;
                    break;
                case 'string':
                    data = $.parseJSON( remoteData );
                    break;
                default:
                    $.error( "Unexpected remote data type: " + remoteDataType );
            }
            return data;
        }
        return plainTextParser(data, this.options.lineSeparator, this.options.cellSeparator);
    };
    /**
     * Default filter for results
     * @param {Object} result
     * @param {String} filter
     * @returns {boolean} Include this result
     * @private
     */
    $.Acompleter.prototype.defaultFilter = function( result, filter ) {
        if ( !result.value ) {
            return false;
        }
        var testValue = result.value,
            pattern = filter;
        /*
        var pattern = this.matchStringConverter(filter);
        var testValue = this.matchStringConverter(result.value);
        */
        if ( !this.options.matchCase ) {
            pattern = pattern.toLowerCase();
            testValue = testValue.toLowerCase();
        }
        var patternIndex = testValue.indexOf( pattern );
        if ( this.options.matchInside ) {
            return patternIndex > -1;
        } else {
            return patternIndex === 0;
        }
        return true;
    };

    /**
     * Filter result
     * @param {Object} result
     * @param {String} filter
     * @returns {boolean} Include this result
     * @private
     */
    $.Acompleter.prototype.filterResult = function( result, filter ) {
        // No filter
        if ( this.options.filter === false ) {
            return true;
        }
        // Custom filter
        if ( $.isFunction(this.options.filter) ) {
            return this.options.filter( result, filter );
        }
        // Default filter
        return this.defaultFilter( result, filter );
    };

    /**
     * Filter results
     * @param results
     * @param filter
     */
    $.Acompleter.prototype.filterResults = function( results, filter ) {
        var i, result,
            filtered = [];

        for ( i = 0; i < results.length; i++ ) {
            result = sanitizeResult( results[ i ] );
            if ( this.filterResult( result, filter ) ) {
                filtered.push( result );
            }
        }
        if ( this.options.sortResults ) {
            filtered = this.sortResults( filtered, filter );
        }
        return filtered;
    };


    /**
     * Sort results
     * @param results
     * @param filter
     */
    $.Acompleter.prototype.sortResults = function( results, filter ) {
        var self = this;
        var sortFunction = this.options.sortFunction;
        if ( !$.isFunction( sortFunction ) ) {
            sortFunction = function( a, b, f ) {
                return sortValueAlpha( a, b, self.options.matchCase );
            };
        }
        results.sort(function( a, b ) {
            return sortFunction( a, b, filter, self.options );
        });
        return results;
    };
    /**
     * Update index of the current item in new results set
     * or set to first item if current item is not found in reulsts
     */
    $.Acompleter.prototype.updateCurrent = function() {
        //console.log("updateCurrent start");
        if ( this.results.length === 0 ) {
            return;
        }
        var i, currentValue, comparator,
            index = 0;
        if ( this._current.valueToCompare !== null ) {
            currentValue = this.getCurrentItem().data('valueToCompare');
            comparator = this.options.sortResult ?
                function( test ) { return currentValue >= test; } :
                function( test ) { return currentValue == test; };
            for ( i = this.results.length; i--; i ) {
                if ( comparator( this.options.getComparableValue(this.results[ i ]) ) ) {
                    index = i;
                    break;
                }
            }
        }

        this.setCurrent( index );
        //console.log("updateCurrent end");
    }; // updateCurrent


    /**
     * Remember item in results[index] as current item
     */
    $.Acompleter.prototype.setCurrent = function( index ) {
        //console.log("setCurrent start");
        this._current.index = index;
        this._current.valueToCompare = this.options.getComparableValue( this.results[ index ] );
        //console.log("setCurrent end");
    }; // setCurrent


    /**
     * Smart replace dom-list items by results items
     **/
    $.Acompleter.prototype.showResults = function() {
        if ( this.results.length === 0 ) {
            this.hideResults();
            this._active = false;
            return;
        }
        var self = this,
            $ul = this.$results.children("ul"),
            $items = this.getItems(),
            scrollTop = Math.max( 0, this._current.index - this.options.listLength + 1 ),
            scrollBottom = Math.min( scrollTop + this.options.listLength, this.results.length ),
            removeMarkClass = "_remove_mark_" + pluginName,
            appendMarkClass = "_append_mark_" + pluginName;

        this.showList();

        // Mark items that will be removed
        //
        (function() {
            var i, r, remove, itemValue, resultValue,
                max = scrollBottom;
            for ( i = $items.length; i--; i ) {
                itemValue = $items.eq( i ).data( "valueToCompare" );
                remove = true;
                // Search itemValue inside results
                for ( r = scrollTop; r < max; r++ ) {
                    resultValue = self.options.getComparableValue( self.results[ r ] );

                    if ( self.options.sortResult ) {
                        if ( resultValue >= itemValue ) {
                            remove = resultValue > itemValue;
                            max = r;
                            break;
                        }
                    } else if ( resultValue == itemValue ) {
                        remove = false;
                        max = r;
                        break;
                    }
                }
                // If itemValue is not found mark it to be removed
                if ( remove ) {
                    $items.eq( i ).addClass( removeMarkClass );
                }
            }
        }());

        // Prepend new items before and between existing items
        //
        (function() {
            var i, r,
                $restItems = $items.filter( ":not(." + removeMarkClass + ")" );
            // reindex items
            (function() {
                var itemValue, resultValue, $item,
                    min = scrollTop;
                for ( i = 0; i < $restItems.length; i++ ) {
                    itemValue = $restItems.eq( i ).data( "valueToCompare" );
                    for ( r = min; r < scrollBottom; r++ ) {
                        resultValue = self.options.getComparableValue( self.results[ r ] );
                        if ( resultValue === itemValue ) {
                            $item = self.createListItem( r );
                            $restItems.eq( i ).replaceWith( $item );
                            min = r + 1;
                            break;
                        }
                    }
                }
            }());

            // prepend items
            (function( $restItems ) {
                var itemIndex, 
                    maxItemIndex = $restItems.last().data('index');
                for ( r = scrollTop, i = 0; r < maxItemIndex; r++ ) {
                    itemIndex = $restItems.eq( i ).data('index');
                    if (r < itemIndex) {
                        $item = self.createListItem( r );
                        $restItems.eq( i ).before( $item );
                        if ( self.options.animation ) {
                            prepareToAnimation( $item );
                        }
                        $item.addClass( appendMarkClass );
                    } else {
                        i++;
                    }
                }
            }( self.getItems(":not(." + removeMarkClass + ")") ));
        }());

        // Append rest of the items to populate list
        //
        (function() {
            var i, $item;
            for ( i = scrollTop + $ul.find( "li:not(." + removeMarkClass + ")" ).length; i < scrollBottom; i++ ) {
                $item = self.createListItem( i );
                $ul.append( $item );
                if ( self.options.animation ) {
                    prepareToAnimation( $item );
                }
                $item.addClass( appendMarkClass );
            }
        }());


        if ( this.options.animation ) {
            // start to remove items
            //
            this.getItems( "." + removeMarkClass )
                // cancel animationa of the items marked to append
                .stop().removeClass( appendMarkClass )
                // start animation of the items marked to remove
                .animate({
                    opacity: 0,
                    height: "hide"
                }, this.options.animationSpeed, function() {
                    $( this ).remove();
                });

            // start to append items
            //
            this.getItems( "." + appendMarkClass )
                .show()
                .each(function() {
                    // each item can have its own height
                    var $this = $( this );
                    $this.animate({
                        opacity: $this.data("opacity"),
                        height: $this.data("height") + "px"
                    }, self.options.animationSpeed, function() {
                        $this.removeClass( appendMarkClass );
                    });
                });
        } else {
            this.getItems( "." + removeMarkClass ).remove();
            this.getItems( "." + appendMarkClass ).removeClass( appendMarkClass );
        }
        this.highlightCurrent();
        this._active = true;
    }; // showResults


    $.Acompleter.prototype.highlightCurrent = function() {
        var index = this._current.index,
            currentClass = this.options.currentClass;
        this.getItems().each(function() {
            var $this = $( this );
            if ( $this.data("index") === index ) {
                $this.addClass( currentClass );
            } else {
                $this.removeClass( currentClass );
            }
        });
    }; // highlightCurrent


    $.Acompleter.prototype.hideResults = function() {
        this.$results.hide();
    }; // hideResults


    $.Acompleter.prototype.deactivate = function( finish ) {
        if ( this._keyTimeout ) {
            clearTimeout( this._keyTimeout );
        }
        if ( finish ) {
            this._lastProcessedValue = null;
            this._active = false;
        }
        this.hideResults();
    };


    $.Acompleter.prototype.createList = function() {
        return $( "<div></div>", { id: this.options.resultsId + this.uid } )
            .hide()
            .addClass( this.options.resultsClass )
            .css( { position: "absolute" } )
            .append("<ul></ul>");
    }; // createList


    /*
       формирует содержимое тэга <li> в списке результатов
       может быть любым ХТМЛ
       */
    $.Acompleter.prototype.showResult = function( value, result ) {
        if ( $.isFunction(this.options.showResult) ) {
            return this.options.showResult( value, result );
        }
        return value;
    }; // showResult

    /* 
       выделяет query внутри value тэгами
    */
    $.Acompleter.prototype.defaultHighlight = function( query, value ) {
        // TODO: escape processed value to safly use in RegEx
        var pattern = new RegExp(
            ( this.options.matchInside ? "" : "^" ) + query,
            ( this.options.matchCase ? "" : "i" )
        );
        return value.replace( pattern, "<span class=\"hl\">$&</span>" );
    }; // defaultHighlight

    $.Acompleter.prototype.createListItem = function( index ) {
        var $li, value,
            self = this,
            result = this.results[ index ],
            value = result.value;

        if ( this.options.highlight === true ) {
            value = this.defaultHighlight( this._lastProcessedValue, result.value );
        } else if ( $.isFunction(this.options.highlight) ) {
            value = this.options.highlight( this._lastProcessedValue, result.value );
        } else {
            value = result.value;
        }

        $li = $("<li></li>")
            .html( this.showResult(value, result) )
            .data( "valueToCompare", this.options.getComparableValue(result) )
            .data( "index", index );
        $li.click(function() { self.selectItem( $li ); })
            .mousedown(function() { self._ignoreBlur = true; })
            .mouseup(function() { self._ignoreBlur = false; })
            .mouseover(function() { self.focusItem( $li ); });
        return $li;
    }; // createListItem


    $.Acompleter.prototype.showList = function() {
        // Always recalculate position since window size or
        // input element location may have changed.
        var position = this.$el.offset();
        position.top += this.$el.outerHeight();
        position.minWidth = this.$el.outerWidth() - ( this.$results.outerWidth() - this.$results.width() );

        this.$results
            .css( position )
            .show();
    }; // showList


    $.Acompleter.prototype.cacheRead = function() { // function( value ) {
        return false;
    }; // cacheRead


    $.Acompleter.prototype.cacheWrite = function() { //value, data) {
        return false;
    }; // cacheWrite


    $.Acompleter.prototype.selectCurrent = function() {
        this.selectItem( this.getCurrentItem() );
    };


    $.Acompleter.prototype.selectItem = function( $li ) {
        var selected = this.results[ $li.data("index") ];
        this.$el.val( selected.value );
        this.deactivate( true );
        this.$el.focus();    
        this.callHook( "onItemSelect", selected );
    };


    $.Acompleter.prototype.focusNext = function() {
        this.focusMove( +1 );
    }; // focusNext


    $.Acompleter.prototype.focusPrev = function() {
        this.focusMove( -1 );
    }; // focusPrev


    $.Acompleter.prototype.focusMove = function( modifier ) {
        if ( !this.results.length ) {
            return;
        }
        var index = Math.max( 0, Math.min(this.results.length - 1, this._current.index + modifier) );
        if ( !this.focusItem(index) ) {
            // Redraw results with new scroll position
            this.scrollList( modifier );
        }
    }; // focusMove

    $.Acompleter.prototype.focusItem = function( item ) {
        var index,
            currentClass = this.options.currentClass,
            itemFocused = false;
        if ( typeof item === "number" ) {
            index = item;
        } else {
            index = item.data("index");
        }
        this.setCurrent( index );
        this.getItems().each(function() {
            var $this = $( this );
            if ( $this.data("index") === index ) {
                $this.addClass( currentClass );
                itemFocused = true;
            } else {
                $this.removeClass( currentClass );
            }
        });
        return itemFocused;
    }; // focusItem


    $.Acompleter.prototype.scrollList = function( modifier ) {
        var $newItem = this.createListItem( this._current.index ).addClass( this.options.currentClass );
        this.$results
            .children("ul")[ modifier === 1 ? "append" : "prepend" ]( $newItem )
            .children( "li:" + (modifier === 1 ? "first" : "last") ).remove();
    }; // scrollList


    $.Acompleter.prototype.getItems = function( selector ) {
        return this.$results.find( ">ul>li" + (selector || "") );
    };


    $.Acompleter.prototype.getCurrentItem = function() {
        return this.getItems( "." + this.options.currentClass );
    };


    var methods = {
        destroy: function() {
            return this.each(function() {
                var plugin = $(this).data( "plugin_" + pluginName );
                if ( plugin ) {
                    plugin.destroy();
                }
            });
        }
    };

    $.fn[ pluginName ] = function( method ) {
        if ( methods[ method ] ) {
            return methods[ method ].apply( this, Array.prototype.slice.call(arguments, 1) );
        } else if ( typeof method === "object" || !method ){
            return this.each(function () {
                if ( !$.data( this, 'plugin_' + pluginName ) ) {
                    $.data( this, 'plugin_' + pluginName, new $.Acompleter($(this), method) );
                }
            });
        } else {
            $.error( "Method " +  method + " does not exist on jQuery." + pluginName );
        }
    };

}( jQuery ));
