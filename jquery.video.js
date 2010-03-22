/*
 * jQuery video - jQuery "clone" of YUI gallery-player
 *
 * Copyright © 2010 Carl Fürstenberg
 *
 * Released under GPL, BSD, or MIT license.
 * ---------------------------------------------------------------------------
 *  GPL:
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * Copyright (c) The Regents of the University of California.
 * All rights reserved.
 *
 * ---------------------------------------------------------------------------
 *  BSD:
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 * 1. Redistributions of source code must retain the above copyright
 *    notice, this list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright
 *    notice, this list of conditions and the following disclaimer in the
 *    documentation and/or other materials provided with the distribution.
 * 3. Neither the name of the University nor the names of its contributors
 *    may be used to endorse or promote products derived from this software
 *    without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE REGENTS AND CONTRIBUTORS ``AS IS'' AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
 * ARE DISCLAIMED.  IN NO EVENT SHALL THE REGENTS OR CONTRIBUTORS BE LIABLE
 * FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
 * DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS
 * OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION)
 * HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT
 * LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY
 °* OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF
 * SUCH DAMAGE.
 * 
 * ---------------------------------------------------------------------------
 *  MIT:
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 * 
 * ---------------------------------------------------------------------------
 *
 *  Version: 0.0.1
 */


$.widget("ui.video", {
		// default options
		options: {
			volume: .5,
			fadeSpeed: 1000,
			fadeDelay: 2000,
			minHeight: 0,
			minWidth: 0,
			width: null,
			height: null,
			autoPlay: false,
			loop: false,
			autoBuffer: false
		},

		_create: function() {
			var self = this;
			this.wasPureVideoElement = false;

			var videoOptions = {
				width: Math.max( self.element.outerWidth() , self.options.minWidth ),
				height: Math.max( self.element.outerHeight() , self.options.minHeight ),
				autoplay: self.options.autoPlay,
				controls: false,
				loop: self.options.loop,
				autobuffer: self.options.autoBuffer,
			};

			self.element.wrapAll( $('<div />',{'class': 'ui-video-widget'}) );
			self.wrapperElement = self.element.parent();
			self.wrapperElement.width( self.element.outerWidth(true) );
			self.wrapperElement.height( self.element.outerHeight(true) );

			self.oldVideoOpts = {};

			$.each( videoOptions , function( key, value) {
					if( value !== null ) {
						// webkit bug
						if( key == 'autoplay' && $.browser.webkit ) {
							value = false;
						}
						self.oldVideoOpts[key] = self.element.attr( key );
						self.element.attr( key, value );
					}
				}
			);
			var videoEvents = [
				"abort",
				"canplay",
				"canplaythrough",
				"canshowcurrentframe",
				"dataunavailable",
				"durationchange",
				"emptied",
				"empty",
				"ended",
				"error",
				"loadedfirstframe",
				"loadedmetadata",
				"loadstart",
				"pause",
				"play",
				"progress",
				"ratechange",
				"seeked",
				"seeking",
				"suspend",
				"timeupdate",
				"volumechange",
				"waiting",
				"resize"
			];

			$.each( videoEvents, function(){
					if( self["_event_" + this] ) {
						self.element.bind( this + ".video", $.proxy(self["_event_" + this],self) );
					} else {
						self.element.bind( this + ".video", $.proxy(function(){console.log("event %s", this, arguments)},this) );
					}
				}
			);
			self._createControls();

			self.wrapperElement.hover(
				$.proxy(self._showControls,self),
				$.proxy(self._hideControls,self)
			);

			self.spinnerContainer = $('<div/>', {'class': 'ui-video-spinner-container'});
			self.spinner = $('<div/>', {'class': 'ui-video-spinner'}).appendTo(self.spinnerContainer);

			self.controls
			.fadeIn(this.options.fadeSpeed)
			.delay(this.options.fadeDelay)
			.fadeOut(this.options.fadeSpeed);

			self.volumeSlider.slider('value', this.options.volume * 100);

			// webkit bug
			if( this.options.autoPlay && $.browser.webkit ) {
				self.play();
			}
		},

		_createControls: function() {
			var self = this;
			this.controls = $('<div/>', 
				{
					'class': 'ui-widget ui-widget-content ui-corner-all ui-video-control'
				}
			)
			.prependTo(this.wrapperElement)
			.position({
					'my': 'bottom',
					'at': 'bottom',
					'of': this.element,
					'offset': '0 -10',
					'collision': 'none'
				}
			);

			this.progressDiv = $('<div/>', 
				{
					'class': 'ui-video-progress'
				}
			)
			.appendTo(this.controls);

			this.currentProgressSpan = $('<span/>', 
				{
					'class': 'ui-video-current-progress', 'text': '00:00'
				}
			)
			.appendTo(this.progressDiv);

			$('<span/>',
				{
					'html': '/',
					'class': 'ui-video-progress-divider'
				}
			)
			.appendTo(this.progressDiv);

			this.durationSpan = $('<span/>', 
				{
					'class': 'ui-video-length', 'text': '00:00'
				}
			)
			.appendTo(this.progressDiv);


			this.muteIcon = $('<div/>', 
				{
					'class': 'ui-icon ui-icon-volume-on ui-video-mute'
				}
			)
			.appendTo(this.controls)
			.bind('click.video', $.proxy(self._mute,self));

			this.playIcon = $('<div/>', 
				{
					'class': 'ui-icon ui-icon-play ui-video-play'
				}
			)
			.appendTo(this.controls)
			.bind('click.video', $.proxy(self._playPause,self));

			this.seekPrevIcon = $('<div/>',
				{
					'class': 'ui-icon ui-icon-seek-prev ui-video-seek-prev'
				}
			)
			.appendTo(this.controls)
			.bind('click.video', $.proxy(self.rewind,self));

			this.seekNextIcon = $('<div/>', 
				{
					'class': 'ui-icon ui-icon-seek-next ui-video-seek-next'
				}
			)
			.appendTo(this.controls)
			.bind('click.video', $.proxy(self.forward,self));

			this.volumeSlider = $('<div/>', 
				{
					'class': 'ui-video-volume-slider'}
			)
			.appendTo(this.controls)
			.slider({
					range: 'min',
					animate: true,
					slide: function( e, ui ) {
						self.volume.apply(self,[ui.value]);
						return true;
					}
				}
			);

			this.scrubberSlider = $('<div/>',
				{
					'class': 'ui-video-scrubber-slider'
				}
			)
			.appendTo(this.controls)
			.slider({
					range: 'min',
					animate: true,
					slide: function( e, ui ) {
						self.scrub.apply(self,[ui.value]);
						return true;
					}
				}
			);

			this.scrubberSliderAbsoluteWidth = this.scrubberSlider.width();

			this.bufferStatus = $('<div/>', 
				{
					'class': 'ui-video-buffer-status ui-corner-all'
				}
			).appendTo( this.scrubberSlider );


		},
		_playPause: function() {
			if( this.element[0].paused ) {
				this.play();
			} else {
				this.pause();
			}
		},
		_mute: function() {
			this.muteIcon.toggleClass('ui-icon-volume-on').toggleClass('ui-icon-volume-off');
			this.element[0].muted = !this.element[0].muted;
		},
		_hideControls: function(){
			this.controls.stop(true,true).delay(this.options.fadeDelay).fadeOut(this.options.fadeSpeed);
		},
		_showControls: function(){
			this.controls.stop(true,true).fadeIn(this.options.fadeSpeed);
		},
		_hideSpinner: function(){
			var self = this;
			if( self.spinnerId ) {
				clearInterval( self.spinnerId );
				self.spinnerId = null;
				self.spinnerContainer.fadeOut('fast').remove();
			}
		},
		_showSpinner: function(){
			var self = this;
			if( ! self.spinnerId ) {
				this.spinner.css('left', 0);
				self.spinnerContainer
				.appendTo(self.wrapperElement)
				.position({
						'my': 'center',
						'at': 'center',
						'of': self.element,
						'collision': 'none'
					}
				).fadeIn('fast');
				var spinnerWidth = this.spinner.width();
				var spinnerContainerWidth = this.spinnerContainer.width();
				self.spinnerId = setInterval(function(){
						var cur_left = Math.abs(self.spinner.position().left);

						self.spinner.css({'left': -((cur_left + spinnerContainerWidth) % spinnerWidth) });

					},50);
			}
		},		
		_formatTime: function( seconds ) {
			var m = parseInt(seconds / 60);
			var s = parseInt(seconds % 60);
			var sp = s >= 10 ? '' : '0';
			var mp = m >= 10 ? '' : '0';
			return mp + m + ":" + sp + s;
		},


		// Events 
		_event_progress: function(e) {
			var lengthComputable = e.originalEvent.lengthComputable,
			loaded = e.originalEvent.loaded,
			total = e.originalEvent.total;

			if( lengthComputable ) {
				var fraction = Math.max(Math.min(loaded / total,1),0);

				this.bufferStatus.width(Math.max(fraction * this.scrubberSliderAbsoluteWidth));
			}

		},
		_event_seeked: function() {
			this._hideSpinner();
		},
		_event_canplay: function() {
			this._hideSpinner();
		},
		_event_loadstart: function() {
			this._showSpinner();
		},
		_event_durationchange: function() {
			this._showSpinner();
		},
		_event_seeking: function() {
			this._showSpinner();
		},
		_event_waiting: function() {
			this._showSpinner();
		},
		_event_loadedmetadata: function() {
			this.durationSpan.text(this._formatTime(this.element[0].duration));
		},
		_event_play: function() {
			this.playIcon.addClass('ui-icon-pause').removeClass('ui-icon-play');
		},
		_event_pause: function() {
			this.playIcon.removeClass('ui-icon-pause').addClass('ui-icon-play');
		},

		_event_timeupdate: function() {
			if( ! this.element[0].seeking ) {
				var duration = this.element[0].duration;
				var currentTime = this.element[0].currentTime;
				this.scrubberSlider.slider(
					'value', 
					[(currentTime/duration)*100]
				);
				this.durationSpan.text(this._formatTime(duration));
				this.currentProgressSpan.text(this._formatTime(currentTime));
			}
		},

		_event_resize: function() {
			var self = this;
			self.controls.position({
					'my': 'bottom',
					'at': 'bottom',
					'of': self.element,
					'offset': '0 -10',
					'collision': 'none'
				}
			);
			self.wrapperElement.width( self.element.outerWidth(true) );
			self.wrapperElement.height( self.element.outerHeight(true) );
		},

		// User functions

		play: function() {
			this.element[0].play();
		},
		pause: function() {
			this.element[0].pause();
		},
		mute: function() {
			this.element[0].muted = true;
		},
		unmute: function() {
			this.element[0].muted = false;
		},
		rewind: function() {
			this.element[0].playbackRate -= 2;
		},
		forward: function() {
			this.element[0].playbackRate += 2;
		},
		volume: function(vol) {
			this.element[0].volume = Math.max(Math.min(parseInt(vol)/100,1),0);
		},
		scrub: function(pos){
			var duration = this.element[0].duration;
			pos = Math.max(Math.min(parseInt(pos)/100,1),0);
			this.element[0].currentTime = pos > 1 ? duration : duration * pos;
		},

		// The destroyer
		destroy: function() {
			var self = this;
			$.each( self.oldVideoOpts , function( key, value) {
					self.element.attr( key, value );
				}
			);

			self.controls.remove();
			self.element.unwrap();
			$.Widget.prototype.destroy.apply(self, arguments); // default destroy
		}
	});

