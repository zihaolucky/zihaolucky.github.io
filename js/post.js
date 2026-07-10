$(document).ready(function () {
    var isMobile = /Android|BlackBerry|iPhone|iPad|iPod|Opera Mini|IEMobile/i.test(navigator.userAgent);

    $('pre').addClass('prettyprint linenums');

    $('.entry a').each(function () {
        var href = $(this).attr('href');
        if (!href) return;

        var isHash = href.indexOf('#') === 0;
        var isInternal = href.indexOf('/') === 0 || href.toLowerCase().indexOf('zihaolucky.github.io') > -1;
        var hasImage = $(this).has('img').length;

        if (!isHash && !isInternal && !hasImage) {
            $(this).attr('target', '_blank');
            $(this).attr('rel', 'noopener noreferrer');
            $(this).addClass('external');
        }
    });

    (function buildToc() {
        if ($('.entry h2').length <= 2 || isMobile) return;

        var headings = [];
        $('.entry h2, .entry h3').each(function (index) {
            var id = 'menuIndex' + index;
            this.id = id;
            headings.push({
                id: id,
                name: $(this).text(),
                level: this.tagName.toLowerCase()
            });
        });

        var tmpl = '<ul><li class="h1"><a href="#">' + $('h1.entry-title').text() + '</a></li>';
        for (var i = 0; i < headings.length; i++) {
            var h = headings[i];
            var cls = h.level === 'h3' ? ' class="h3"' : '';
            tmpl += '<li' + cls + '><a href="#" data-id="' + h.id + '">' + h.name + '</a></li>';
        }
        tmpl += '</ul>';

        var $layout = $('.post-layout');
        $layout.addClass('has-toc');
        $layout.append('<nav id="menuIndex" aria-label="Table of contents"></nav>');
        $('#menuIndex').append(tmpl);

        $('#menuIndex').on('click', 'a', function (e) {
            e.preventDefault();
            var selector = $(this).attr('data-id') ? '#' + $(this).attr('data-id') : 'h1.entry-title';
            var top = $(selector).offset().top - 80;
            $('body, html').animate({ scrollTop: top }, 400, 'swing');
        });

        var scrollTops = [];
        $('#menuIndex li a').each(function () {
            var selector = $(this).attr('data-id') ? '#' + $(this).attr('data-id') : 'h1.entry-title';
            scrollTops.push($(selector).offset().top);
        });

        $(window).on('scroll', function () {
            var nowTop = $(window).scrollTop();
            var index = 0;
            for (var i = 0; i < scrollTops.length; i++) {
                if (nowTop + 100 >= scrollTops[i]) {
                    index = i;
                }
            }
            $('#menuIndex li').removeClass('on').eq(index).addClass('on');
        });
    })();

    $.getScript('/js/prettify/prettify.js', function () {
        if (typeof prettyPrint === 'function') {
            prettyPrint();
        }
    });
});
