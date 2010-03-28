
JS_COMPILER = closure-compiler
JS_COMPILER_ARGS = \
				   --compilation_level \
				   SIMPLE_OPTIMIZATIONS \
				   --charset utf-8 \
				   --summary_detail_level 3 \
				   --warning_level QUIET 

CSS_COMPILER = csstidy
CSS_COMPILER_ARGS = --compress_colors=true --compress_font-weight=true --remove_last_\;=true --merge_selectors=2 --optimise_shorthands=2 --template=highest

js_files = jquery.video.js
js_min_files = $(patsubst %.js,%.min.js,$(js_files))
js_min_gz_files = $(patsubst %.js,%.js.gz,$(js_min_files))

css_files = jquery.video.css
css_min_files = $(patsubst %.css,%.min.css,$(css_files))
css_min_gz_files = $(patsubst %.css,%.css.gz,$(css_min_files))

all: minify gzip


minify: $(js_min_files) $(css_min_files)


gzip: $(js_min_gz_files) $(css_min_gz_files)

$(js_min_gz_files): $(js_min_files)

$(css_min_gz_files): $(css_min_files)

%.min.css.gz: %.min.css
	cat $< | gzip - > $@

%.min.js.gz: %.min.js
	cat $< | gzip - > $@

%.min.js: %.js
	$(JS_COMPILER) $(JS_COMPILER_ARGS) --js $< --js_output_file $@

%.min.css: %.css
	$(CSS_COMPILER) $< $(CSS_COMPILER_ARGS) $@

clean:
	rm -f $(js_min_files) $(js_min_gz_files)
	rm -f $(css_min_files) $(css_min_gz_files)
