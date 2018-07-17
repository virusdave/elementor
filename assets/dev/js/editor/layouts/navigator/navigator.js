module.exports = Marionette.Region.extend( {
	el: '#elementor-navigator',

	isDocked: false,

	isDraggingNeedsStop: false,

	opened: false,

	storage: {
		visible: true
	},

	constructor: function() {
		Marionette.Region.prototype.constructor.apply( this, arguments );

		var savedStorage = elementor.getStorage( 'navigator' );

		if ( savedStorage ) {
			this.storage = savedStorage;
		}

		if ( this.storage.visible ) {
			this.open();
		}
	},

	getLayout: function() {
		return this.currentView;
	},

	getDraggableOptions: function() {
		return {
			iframeFix: true,
			handle: '#elementor-navigator__header',
			snap: 'body',
			snapMode: 'inner',
			drag: this.onDrag.bind( this ),
			stop: this.onDragStop.bind( this )
		};
	},

	getResizableOptions: function() {
		var self = this;

		return {
			handles: 'all',
			containment: 'document',
			minWidth: 150,
			maxWidth: 500,
			minHeight: 210,
			start: function() {
				elementor.$previewWrapper.addClass( 'ui-resizable-resizing' );
			},
			stop: function() {
				elementor.$previewWrapper.removeClass( 'ui-resizable-resizing' );

				self.saveSize();
			}
		};
	},

	beforeFirstOpen: function() {
		var NavigatorLayoutView = require( 'elementor-layouts/navigator/layout' );

		this.show( new NavigatorLayoutView() );

		this.$el.draggable( this.getDraggableOptions() );

		this.$el.resizable( this.getResizableOptions() );
	},

	open: function( model ) {
		if ( ! this.opened ) {
			this.beforeFirstOpen();

			this.opened = true;
		}

		this.$el.show();

		if ( this.storage.docked ) {
			this.dock();
		} else {
			this.setSize();
		}

		if ( model ) {
			model.trigger( 'request:edit' );
		}

		this.saveStorage( 'visible', true );
	},

	close: function() {
		this.$el.hide();

		if ( this.isDocked ) {
			this.undock( true );
		}

		this.saveStorage( 'visible', false );
	},

	isSnapping: function() {
		var draggableInstance = this.$el.draggable( 'instance' ),
			snapElements = draggableInstance.snapElements;

		return snapElements.some( function( element ) {
			return element.snapping;
		} );
	},

	dock: function() {
		elementor.$body.addClass( 'elementor-navigator-docked' );

		elementor.helpers.cssWithBackup( this.$el, 'undocked', {
			width: '',
			height: '',
			top: '',
			bottom: '',
			left: '',
			right: ''
		} );

		this.$el.resizable( 'destroy' );

		var resizableOptions = this.getResizableOptions(),
			side = elementor.config.is_rtl ? 'left' : 'right';

		resizableOptions.handles = elementor.config.is_rtl ? 'e' : 'w';

		resizableOptions.resize = function( event, ui ) {
			elementor.$previewWrapper.css( side, ui.size.width );
		};

		this.$el.resizable( resizableOptions );

		this.isDocked = true;

		this.saveStorage( 'docked', true );
	},

	undock: function( silent ) {
		elementor.$body.removeClass( 'elementor-navigator-docked' );

		elementor.helpers.recoverCSSBackup( this.$el, 'undocked' );

		elementor.$previewWrapper.css( elementor.config.is_rtl ? 'left' : 'right', '' );

		this.$el.resizable( 'destroy' );

		this.$el.resizable( this.getResizableOptions() );

		this.isDocked = false;

		if ( ! silent ) {
			this.saveStorage( 'docked', false );
		}
	},

	saveStorage: function( key, value ) {
		this.storage[ key ] = value;

		elementor.setStorage( 'navigator', this.storage );
	},

	saveSize: function() {
		this.saveStorage( 'size', elementor.helpers.getElementInlineStyle( this.$el, [ 'width', 'height', 'top', 'bottom', 'right', 'left' ] ) );
	},

	setSize: function() {
		if ( this.storage.size ) {
			this.$el.css( this.storage.size );
		}
	},

	onDrag: function( event, ui ) {
		if ( this.isDraggingNeedsStop ) {
			return false;
		}

		if ( this.isDocked ) {
			if ( ui.position.left === ui.originalPosition.left ) {
				if ( ui.position.top !== ui.originalPosition.top ) {
					return false;
				}
			} else {
				this.undock();
			}

			return;
		}

		if ( this.isSnapping() ) {
			var elementRight = ui.position.left + this.$el.outerWidth();

			if ( elementRight >= innerWidth ) {
				this.dock();

				this.isDraggingNeedsStop = true;

				return false;
			}
		}
	},

	onDragStop: function() {
		this.isDraggingNeedsStop = false;

		this.saveSize();
	}
} );
