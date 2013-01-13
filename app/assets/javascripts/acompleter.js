/*
 *
 *
 */

;(function( $, undefined ) {

    var pluginName = 'acompleter',
        defaults = {
            delay: 400, // specifies the amount of time to wait for displaying data between each key press
            url: "/kladr/list.json",
            remoteDataType: "json",
            loadingClass: "loading",
            resultsClass: "results",
            resultsId: pluginName + "-results",
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

            getValue: function( result ) { return result; },
            /**
            * Returns value by which the plugin will compares result items with each other
            */
            getComparableValue: function( result ) { return result; },

            _dummy: "just to be last item"
        };


    /**
     * Sanitize result
     * @param {Object} result
     * @returns {Object} object with members value (String) and data (Object)
     * @private
     */
    var sanitizeResult = function( result ) {
        return result;
        /*
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
        */
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


    $.Acompleter = function( $el, options ) {
        /**
         * Assert parameters
         */
        if (!$el || !($el instanceof $) || $el.length !== 1 || $el.get(0).tagName.toUpperCase() !== 'INPUT') {
            $.error( "Invalid parameter for jquery." + pluginName
                    + ", jQuery object with one element with INPUT tag expected.");
        }

        this.options = $.extend( {}, defaults, options );
        // from boilerplate, but don't know for what
        //this._defaults = defaults;
        //this._name = pluginName;

        this._active = false;
        this._current = { index: 0, valueToCompare: null };
        this._keyTimeout = null;
        this._lastProcessedValue = undefined;
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

        this.$el.bind( "blur." + pluginName, function() {
            if (self.options._debug) { return; }
            self.deactivate( true );
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
        this.$el.unbind( "." + pluginName );
        if ( this.$results.data("instances") == 1 ) {
            this.$results.remove();
        } else {
            this.$results.data( "instances", this.$results.data("instances") - 1 );
        }
        this.$el.removeData( "plugin_" + pluginName );
    }; // destroy


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


    $.Acompleter.prototype.fetchRemoteData = function( value ) {
        var data = this.cacheRead( value );
        if ( data ) {
            this.processResults( value, data );
        } else {
            var self = this,
                ajaxCallback = function( data ) {
                    if ( data.length ) {
                        self.cacheWrite( value, data );
                    }
                    self.$el.removeClass( self.options.loadingClass );
                    self.processResults( value, data );
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
     * Default filter for results
     * @param {Object} result
     * @param {String} filter
     * @returns {boolean} Include this result
     * @private
     */
    $.Acompleter.prototype.defaultFilter = function( result, filter ) {
        /*
        if ( !result.value ) {
            return false;
        }
        */
        var testValue = result, //.value,
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
            $items = $ul.children("li"),
            scrollTop = Math.max( 0, this._current.index - this.options.listLength + 1 ),
            scrollBottom = Math.min( scrollTop + this.options.listLength, this.results.length ),
            removeMarkClass = "_remove_mark_" + pluginName,
            appendMarkClass = "_append_mark_" + pluginName;

        // Mark items that  be removed
        //
        (function() {
            var i, r, remove, itemString, resultString,
                max = scrollBottom;
            for ( i = $items.length; i--; i ) {
                itemString = $items.eq( i ).text();
                remove = true;
                // Search itemString inside results
                for ( r = scrollTop; r < max; r++ ) {
                    resultString = self.results[ r ].name;
                    if ( resultString >= itemString ) {
                        remove = resultString > itemString;
                        max = r;
                        break;
                    }
                }
                // If itemString is not found mark it to be removed
                if ( remove ) {
                    $items.eq( i ).addClass( removeMarkClass );
                }
            }
        }());

        // Prepend new items before and between existing items
        //
        (function() {
            var i, r, itemString, resultString, $item,
                $restItems = $items.filter( ":not(." + removeMarkClass + ")" ),
                min = scrollTop;
            for ( i = 0; i < $restItems.length; i++ ) {
                itemString = $restItems.eq( i ).text();
                for ( r = min; r < scrollBottom; r++ ) {
                    resultString = self.results[ r ].name;
                    if ( resultString < itemString ) {
                        $item = self.createListItem( r );
                        $item.addClass( appendMarkClass );
                        $restItems.eq( i ).before( $item );
                    } else {
                        // Recreate existing items for sake of update highlighted value and
                        // index of corresponding data in the results array
                        if ( resultString === itemString ) {
                            $item = self.createListItem( r );
                            $restItems.eq( i ).replaceWith( $item );
                        }
                        min = r + 1;
                        break;
                    }
                }
            }
        }());

        // Append rest of the items to populate list
        //
        (function() {
            var i, $item;
            for ( i = scrollTop + $ul.find( "li:not(." + removeMarkClass + ")" ).length; i < scrollBottom; i++ ) {
                $item = self.createListItem( i );
                $item.addClass( appendMarkClass );
                $ul.append( $item );
            }
        }());

        if ( this.options.animation ) {
            alert("animation here");
        } else {
            $ul.find( "." + removeMarkClass ).remove();
            this.highlightCurrent();
            this.showList();
        }
        this._active = true;
        //console.log("showResults end");
    }; // showResults


    $.Acompleter.prototype.highlightCurrent = function() {
        //console.log("highlightCurrent start");
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
        //console.log("highlightCurrent end");
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
        var $results = $( "#" + this.options.resultsId );
        if ( !$results.length ) {
            $results = $( "<div></div>", { id: this.options.resultsId } )
                .hide()
                .addClass( this.options.resultsClass )
                .css( { position: "absolute" } )
                .append( $("<ul></ul>") );
        }
        $results.data( 'instances' , ($results.data("instances") || 0) + 1 );
        return $results;
    }; // createList


    $.Acompleter.prototype.createListItem = function( index ) {
        var result = this.results[ index ],
            // TODO: escape processed value to safly use in RegEx
            pattern = new RegExp(
                ( this.options.matchInside ? "" : "^" ) + this._lastProcessedValue,
                "i"
            );
        // TODO: figure out what to do when `getValue` appends text
        //       which trigger math against `_lastProcessedValue`
        return $("<li></li>")
            .html( this.options.getValue(result).replace( pattern, "<span>$&</span>" ) )
            .data( "valueToCompare", this.options.getComparableValue(result) )
            .data( "index", index );
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

    $.Acompleter.prototype.selectItem = function($li) {
        var value = $li.data("valueToCompare");
        this.deactivate( true );
        this.$el.val( value );
        this.$el.focus();    
    };



    $.Acompleter.prototype.focusNext = function() {
        this.focusMove( +1 );
    }; // focusNext


    $.Acompleter.prototype.focusPrev = function() {
        this.focusMove( -1 );
    }; // focusPrev



    $.Acompleter.prototype.focusMove = function( modifier ) {
        //console.log("focusMove start");
        if ( !this.results.length ) {
            return;
        }
        var currentClass = this.options.currentClass,
            currentOutside = true,
            index = Math.max( 0, Math.min(this.results.length - 1, this._current.index + modifier) );

        this.setCurrent( index );

        this.getItems().each(function() {
            var $this = $( this );
            if ( $this.data("index") === index ) {
                $this.addClass( currentClass );
                currentOutside = false;
            } else {
                $this.removeClass( currentClass );
            }
        });
        // Redraw results with new scroll position
        if ( currentOutside ) {
            this.scrollList( modifier );
        }
        //console.log("focusMove end");
    }; // focusMove

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
