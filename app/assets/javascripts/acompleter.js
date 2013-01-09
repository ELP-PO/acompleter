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
            currentClass: "current",
            onError: undefined,
            listLength: 10,
            matchInside: true,

            getValue: function( result ) { return result; },
            /**
            * Returns value by which the plugin will compares result items with each other
            */
            getComparableValue: function( result ) { return result; },

            _dummy: "just to be last item"
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





    $.Acompleter = function( $elem, options ) {
        /**
         * Assert parameters
         */
        if (!$elem || !($elem instanceof $) || $elem.length !== 1 || $elem.get(0).tagName.toUpperCase() !== 'INPUT') {
            throw new Error('Invalid parameter for jquery.Acompleter, jQuery object with one element with INPUT tag expected.');
        }

        this.options = $.extend( {}, defaults, options);
        // from boilerplate, but don't know for what
        //this._defaults = defaults;
        //this._name = pluginName;

        this._current = { index: 0, valueToCompare: null };
        this._keyTimeout = null;
        this._lastProcessedValue = undefined;
        this.$elem = $elem;

        this.init();
    };

    $.Acompleter.prototype.init = function() {
        var self = this;

        $("body").append( this.$results = this.createList() );

        this.$elem.bind( "processed.acompleter", function() { self.updateCurrent(); } );
        this.$elem.bind( "processed.acompleter", function() { self.updateResults(); } );
        this.$elem.bind( "keydown.acompleter", function( e ) {
            switch ( e.keyCode ) {
                case 40: // down arrow
                    e.preventDefault();
                    self.focusNext();
                    break;
                case 38: // up arrow
                    e.preventDefault();
                    self.focusPrev();
                    break;
                case 13: // return
                    //return !this.selectHighlighted();
                    break;
                case 27: // escape
                    // TODO: hide list
                    //this.hideList();
                    //return false;
                    break;
                /*
                 * Ignore navigational and special keys
                 */
                case 37: case 39: case 34: case 33:  // left, right arrows, pg up, pg down
                case 35: case 36:    // home, end
                case 91: case 93:            // left command, right command
                case 16: case 17: case 18:   // shift, ctrl, alt
                case 9: case 20:    // tab, capslock
                    // no reaction
                    break;


                default:
                    self.activate();
                    break;
            } // switch
        }); // $this.keydown
    }; // init

    $.Acompleter.prototype.activate = function() {
        if ( this._keyTimeout ) {
            clearTimeout( this._keyTimeout );
        }
        var self = this;
        this._keyTimeout = setTimeout(function() {
            self.activateNow();
        }, this.options.delay);
    }; // this.activate


    $.Acompleter.prototype.activateNow = function() {
        // TODO: prepare value, check necessary to update
        var value = this.$elem.val();
        this.fetchData( value );
    }; // this.activateNow


    $.Acompleter.prototype.fetchData = function( value ) {
        var data = this.cacheRead( value );
        if ( data ) {
            this.processResults( value, data );
        } else {
            var self = this,
                ajaxCallback = function( data ) {
                    if ( data.length ) {
                        self.cacheWrite( value, data );
                    }
                    self.$elem.removeClass( self.options.loadingClass );
                    self.processResults( value, data );
                };

            this.$elem.addClass( this.options.loadingClass );
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
    }; // fetchData


    $.Acompleter.prototype.processResults = function( value, data ) {
        // TODO: check data === false - need error heandling
        //
        this._lastProcessedValue = value;
        this.results = data;
        this.$elem.trigger("processed.acompleter");
    }; // processResults


    /**
     * Update index of the current item in new results set
     * or set to first item if current item is not found in reulsts
     */
    $.Acompleter.prototype.updateCurrent = function() {
        console.log("updateCurrent start");
        if ( this.results.length === 0 ) {
            return;
        }
        var i, currentString,
            index = 0;
        if ( this._current.valueToCompare !== null ) {
            currentValue = this.$results.find(".current").data('valueToCompare');
            for ( i = this.results.length; i--; i ) {
                if ( currentValue >= this.results[ i ].name ) {
                    index = i;
                    break;
                }
            }
        }

        this.setCurrent( index );
        console.log("updateCurrent end");
    }; // updateCurrent


    /**
     * Remember item in results[index] as current item
     */
    $.Acompleter.prototype.setCurrent = function( index ) {
        console.log("setCurrent start");
        this._current.index = index;
        this._current.valueToCompare = this.options.getComparableValue( this.results[ index ] );
        console.log("setCurrent end");
    }; // setCurrent


    /**
     * Smart replace dom-list items by results items
     **/
    $.Acompleter.prototype.updateResults = function() {
        console.log("updateResults start");
        if ( this.results.length === 0 ) {
            this.hideResults();
            return;
        }
        var self = this,
            $ul = this.$results.children("ul"),
            $items = $ul.children("li"),
            scrollTop = Math.max( 0, this._current.index - this.options.listLength + 1 ),
            scrollBottom = Math.min( scrollTop + this.options.listLength, this.results.length ),
            removeMarkClass = "_remove_mark_acompleter",
            appendMarkClass = "_append_mark_acompleter";

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
        console.log("updateResults end");
    }; // updateResults


    $.Acompleter.prototype.highlightCurrent = function() {
        console.log("highlightCurrent start");
        var index = this._current.index,
            currentClass = this.options.currentClass;
        this.$results.find("ul>li").each(function() {
            var $this = $( this );
            if ( $this.data("index") === index ) {
                $this.addClass( currentClass );
            } else {
                $this.removeClass( currentClass );
            }
        });
        console.log("highlightCurrent end");
    }; // highlightCurrent


    $.Acompleter.prototype.hideResults = function() {
        this.$results.hide();
    }; // hideResults


    $.Acompleter.prototype.createList = function() {
        return $("<div></div>")
            .hide()
            .addClass( this.options.resultsClass )
            .css( { position: "absolute" } )
            .append( $("<ul></ul>") );
    }; // createList


    $.Acompleter.prototype.createListItem = function( index ) {
        var result = this.results[ index ],
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
        var position = this.$elem.offset();
        position.top += this.$elem.outerHeight();
        position.minWidth = this.$elem.outerWidth() - ( this.$results.outerWidth() - this.$results.width() );

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




    $.Acompleter.prototype.focusNext = function() {
        this.focusMove( +1 );
    }; // focusNext


    $.Acompleter.prototype.focusPrev = function() {
        this.focusMove( -1 );
    }; // focusPrev



    $.Acompleter.prototype.focusMove = function( modifier ) {
        console.log("focusMove start");
        var currentClass = this.options.currentClass,
            currentOutside = true,
            index = Math.max( 0, Math.min(this.results.length - 1, this._current.index + modifier) );

        this.setCurrent( index );

        this.$results.find("ul>li").each(function() {
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
        console.log("focusMove end");
    }; // focusMove

    $.Acompleter.prototype.scrollList = function( modifier ) {
        var $newItem = this.createListItem( this._current.index ).addClass( this.options.currentClass );
        this.$results
            .find("ul")[ modifier === 1 ? "append" : "prepend" ]( $newItem )
            .children( "li:" + (modifier === 1 ? "first" : "last") ).remove();
    }; // scrollList



    $.fn[ pluginName ] = function( options ) {
        return this.each(function () {
            if ( !$.data( this, 'plugin_' + pluginName ) ) {
                $.data( this, 'plugin_' + pluginName, new $.Acompleter($(this), options) );
            }
        });
    };

}( jQuery ));
