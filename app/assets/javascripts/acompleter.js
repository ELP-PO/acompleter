
// plugin
//
(function( $, undefined ) {

    $.fn.acompleter = function( options ) {
        var opts = $.extend( $.fn.acompleter.defaults, options );

        return this.each( function() {
            /**
             * Skip non-inputs
             */
            if ( !this.tagName || this.tagName.toUpperCase() !== "INPUT" ) {
                return true;
            }
            var $this = $( this ),
                acompleter = new Acompleter( $this, opts );

            /**
             * Attach keyboard monitoring to input
             */
            $this.keydown(function( e ) {
                switch ( e.keyCode ) {
                    case 40: // down arrow
                    case 38: // up arrow
                        e.preventDefault();
                        if ( e.keyCode === 40 ) {
                            acompleter.focusNext();
                        } else {
                            acompleter.focusPrev();
                        }
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
    }; // fn.acompleter

    $.fn.acompleter.defaults =  {
        delay: 400, // specifies the amount of time to wait for displaying data between each key press
        url: "/kladr/list.json?query=",
        remoteDataType: "json",
        loadingClass: "loading",
        resultsClass: "results",
        currentClass: "current",
        onError: undefined,
        listLength: 10,
        matchInside: true,

        _dummy: "just to be last item"
    };


    var Acompleter = function( $elem, options ) {
        var self = this;

        this.options = options;
        this.current_ = { index: 0, serialized: null };
        this.keyTimeout_ = null;
        this.lastProcessedValue_ = undefined;
        this.$elem = $elem;
        this.$elem.bind( "processed.acompleter", function() { self.updateCurrent(); } );
        this.$elem.bind( "processed.acompleter", function() { self.updateResults(); } );

        this.$results = this.createList();
        $("body").append( this.$results );
    };


    Acompleter.prototype.activate = function() {
        if ( this.keyTimeout_ ) {
            clearTimeout( this.keyTimeout_ );
        }
        var self = this;
        this.keyTimeout_ = setTimeout(function() {
            self.activateNow();
        }, this.options.delay);
    }; // this.activate


    Acompleter.prototype.activateNow = function() {
        // TODO: prepare value, check necessary to update
        var value = this.$elem.val();
        this.fetchData( value );
    }; // this.activateNow


    Acompleter.prototype.fetchData = function( value ) {
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
                url: this.makeUrl( value ),
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


    Acompleter.prototype.makeUrl = function( value ) {
        return this.options.url + value;
    }; // makeUrl


    Acompleter.prototype.processResults = function( value, data ) {
        // TODO: check data === false - need error heandling
        //
        this.lastProcessedValue_ = value;
        this.results = data;
        this.$elem.trigger("processed.acompleter");
    }; // processResults


    /**
     * Update index of the current item in new results set
     * or set to first item if current item is not found in reulsts
     */
    Acompleter.prototype.updateCurrent = function() {
        console.log("updateCurrent start");
        if ( this.results.length === 0 ) {
            return;
        }
        var i, currentString,
            index = 0;
        if ( this.current_.serialized !== null ) {
            currentString = this.$results.find(".current").text();
            for ( i = this.results.length; i--; i ) {
                if ( currentString >= this.results[ i ].name ) {
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
    Acompleter.prototype.setCurrent = function( index ) {
        console.log("setCurrent start");
        this.current_.index = index;
        this.current_.serialized = $.param( this.results[ index ] );
        console.log("setCurrent end");
    }; // setCurrent


    /**
     * Smart replace dom-list items by results items
     **/
    Acompleter.prototype.updateResults = function() {
        console.log("updateResults start");
        if ( this.results.length === 0 ) {
            this.hideResults();
            return;
        }
        var self = this,
            $ul = this.$results.children("ul"),
            $items = $ul.children("li"),
            scrollTop = Math.max( 0, this.current_.index - this.options.listLength + 1 ),
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


    Acompleter.prototype.highlightCurrent = function() {
        console.log("highlightCurrent start");
        var index = this.current_.index,
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


    Acompleter.prototype.hideResults = function() {
        this.$results.hide();
    }; // hideResults


    Acompleter.prototype.createList = function() {
        return $("<div></div>")
            .hide()
            .addClass( this.options.resultsClass )
            .css( { position: "absolute" } )
            .append( $("<ul></ul>") );
    }; // createList


    Acompleter.prototype.createListItem = function( index ) {
        var result = this.results[ index ],
            pattern = new RegExp( (this.options.matchInside ? "" : "^") + this.lastProcessedValue_, "i" );
        return $("<li></li>")
            .html( result.name.replace( pattern, "<span>$&</span>" ) )
            .data( "serialized", $.param(result) )
            .data( "index", index );
    }; // createListItem


    Acompleter.prototype.showList = function() {
        // Always recalculate position since window size or
        // input element location may have changed.
        var position = this.$elem.offset();
        position.top += this.$elem.outerHeight();
        position.minWidth = this.$elem.outerWidth() - ( this.$results.outerWidth() - this.$results.width() );

        this.$results
            .css( position )
            .show();
    }; // showList


    Acompleter.prototype.cacheRead = function() { // function( value ) {
        return false;
    }; // cacheRead


    Acompleter.prototype.cacheWrite = function() { //value, data) {
        return false;
    }; // cacheWrite




    Acompleter.prototype.focusNext = function() {
        this.focusMove( +1 );
    }; // focusNext


    Acompleter.prototype.focusPrev = function() {
        this.focusMove( -1 );
    }; // focusPrev



    Acompleter.prototype.focusMove = function( modifier ) {
        console.log("focusMove start");
        var currentClass = this.options.currentClass,
            currentOutside = true,
            index = Math.max( 0, Math.min(this.results.length - 1, this.current_.index + modifier) );

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

    Acompleter.prototype.scrollList = function( modifier ) {
        var $newItem = this.createListItem( this.current_.index ).addClass( this.options.currentClass );
        this.$results
            .find("ul")[ modifier === 1 ? "append" : "prepend" ]( $newItem )
            .children( "li:" + (modifier === 1 ? "first" : "last") ).remove();
    }; // scrollList


}( jQuery ));
