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
			sources: [],
			minHeight: 0,
			minWidth: 0,
			width: null,
			height: null,
			poster: null,
			autoPlay: false,
			loop: false,
			autoBuffer: true,
			degrade: '<p>Your browser does not support this widget.</p>'
		},

		_create: function() {
			var self = this;

			var videoOptions = {
				width: self.options.width || Math.max( self.element.outerWidth() , self.options.minWidth ),
				height: self.options.height || Math.max( self.element.outerHeight() , self.options.minHeight ),
				poster: self.options.poster,
				autoplay: self.options.autoPlay,
				controls: false,
				loop: self.options.loop,
				autobuffer: self.options.autoBuffer,
				html: self.options.degrade
			};

			self.videoElement = $('<video/>', videoOptions).appendTo( self.element );

			$.each( this.options.sources, function() {
					self.videoElement.append( $('<source/>',{ 'src': this.title, 'type': this.type }) );
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
						self.videoElement.bind( this + ".video", $.proxy(self["_event_" + this],self) );
					} else {
						//console.log( "event %s missing/not implemented", this);
					}
				}
			);
			self._createControls();

			self.element.hover($.proxy(self._showControls,self), $.proxy(self._hideControls,self));

			self.controls.delay(this.options.fadeDelay).fadeOut(this.options.fadeSpeed);

			self.volumeSlider.slider('value', this.options.volume * 100);
		},

		_createControls: function() {
			var self = this;
			this.controls = $('<div/>', {'class': 'ui-widget ui-widget-content ui-corner-all video-control'})
			.appendTo(this.element)
			.position({
					'my': 'bottom',
					'at': 'bottom',
					'of': this.videoElement,
					'offset': '0 -10'
				}
			);
			this.progressDiv = $('<div/>', {'class': 'video-progress'})
			.appendTo(this.controls);
			this.currentProgressSpan = $('<span/>', {'class': 'video-current-progress', 'text': '00:00'})
			.appendTo(this.progressDiv);

			$('<span/>',{'html': '/', 'class': 'video-progress-divider'}).appendTo(this.progressDiv);

			this.durationSpan = $('<span/>', {'class': 'video-length', 'text': '00:00'})
			.appendTo(this.progressDiv);


			this.muteIcon = $('<div/>', {'class': 'ui-icon ui-icon-volume-on video-mute'})
			.appendTo(this.controls)
			.bind('click.video', $.proxy(self._mute,self));

			this.playIcon = $('<div/>', {'class': 'ui-icon ui-icon-play video-play'})
			.appendTo(this.controls)
			.bind('click.video', $.proxy(self._playPause,self));

			this.seekPrevIcon = $('<div/>', {'class': 'ui-icon ui-icon-seek-prev video-seek-prev'})
			.appendTo(this.controls)
			.bind('click.video', $.proxy(self.rewind,self));

			this.seekNextIcon = $('<div/>', {'class': 'ui-icon ui-icon-seek-next video-seek-next'})
			.appendTo(this.controls)
			.bind('click.video', $.proxy(self.forward,self));

			this.volumeSlider = $('<div/>', {'class': 'video-volume-slider'})
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

			this.scrubberSlider = $('<div/>', {'class': 'video-scrubber-slider'})
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
			
			this.bufferStatus = $('<div/>', {'class': 'video-buffer-status ui-corner-all'}).appendTo( this.scrubberSlider );


		},
		_playPause: function() {
			if( this.videoElement[0].paused ) {
				this.play();
			} else {
				this.pause();
			}
		},
		_mute: function() {
			this.muteIcon.toggleClass('ui-icon-volume-on').toggleClass('ui-icon-volume-off');
			this.videoElement[0].muted = !this.videoElement[0].muted;
		},
		_hideControls: function(){
			this.controls.stop(true,true).delay(this.options.fadeDelay).fadeOut(this.options.fadeSpeed);
		},
		_showControls: function(){
			this.controls.stop(true,true).fadeIn(this.options.fadeSpeed);
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
				this.bufferStatus.width(loaded/total * this.scrubberSliderAbsoluteWidth);
			}

		},
		_event_loadedmetadata: function() {
			this.durationSpan.text(this._formatTime(this.videoElement[0].duration));
		},
		_event_play: function() {
			this.playIcon.addClass('ui-icon-pause').removeClass('ui-icon-play');
		},
		_event_pause: function() {
			this.playIcon.removeClass('ui-icon-pause').addClass('ui-icon-play');
		},

		_event_timeupdate: function() {
			if( ! this.videoElement[0].seeking ) {
				this.scrubberSlider.slider('value', [(this.videoElement[0].currentTime/this.videoElement[0].duration)*100]);
				this.durationSpan.text(this._formatTime(this.videoElement[0].duration));
				this.currentProgressSpan.text(this._formatTime(this.videoElement[0].currentTime));
			}
		},

		_event_resize: function() {
			this.controls.position({
					'my': 'bottom',
					'at': 'bottom',
					'of': this.videoElement,
					'offset': '0 -10'
				}
			);
		},

		// User functions

		play: function() {
			this.videoElement[0].play();
		},
		pause: function() {
			this.videoElement[0].pause();
		},
		mute: function() {
			this.videoElement[0].muted = true;
		},
		unmute: function() {
			this.videoElement[0].muted = false;
		},
        rewind: function() {
			this.videoElement[0].playbackRate -= 2;
        },
        forward: function() {
			this.videoElement[0].playbackRate += 2;
        },
        volume: function(vol) {
			this.videoElement[0].volume = Math.max(Math.min(parseInt(vol)/100,1),0);
        },
		scrub: function(pos){
			var duration = this.videoElement[0].duration;
			pos = Math.max(Math.min(parseInt(pos)/100,1),0);
			this.videoElement[0].currentTime = pos > 1 ? duration : duration * pos;
		},

		// The destroyer
		destroy: function() {
			$.Widget.prototype.destroy.apply(this, arguments); // default destroy
			// now do other stuff particular to this widget
			this.videoElement.remove();
			this.controls.remove();
		}
	});

