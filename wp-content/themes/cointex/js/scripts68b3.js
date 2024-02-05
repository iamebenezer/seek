(function($) {
    $(document).ready(function() {
        "use strict";


        // TAB
        $(".tab-nav li").on('click', function(e) {
            $(".tab-item").hide();
            $(".tab-nav li").removeClass('active');
            $(this).addClass("active");
            var selected_tab = $(this).find("a").attr("href");
            $(selected_tab).stop().show();
            return false;
        });


        // LOGO HOVER
        $(".site-menu ul li").hover(function() {
                $('.site-menu ul li').not(this).css({
                    "opacity": "1"
                });
            },
            function() {
                $('.site-menu ul li').not(this).css({
                    "opacity": "1"
                });
            });


        // HAMBURGER MENU
        $('.hamburger-menu').on('click', function(e) {
            $(this).toggleClass('open');
            $(".side-widget").toggleClass('active');
            $("body").toggleClass("overflow");
        });

        // PAGE TRANSITION
        $('body a').on('click', function(e) {

            var target = $(this).attr('target');
            var fancybox = $(this).data('fancybox');
            var url = this.getAttribute("href");
            if (target != '_blank' && typeof fancybox == 'undefined' && url.indexOf('') < 0) {


                e.preventDefault();
                var url = this.getAttribute("href");
                if (url.indexOf('') != -1) {
                    var hash = url.substring(url.indexOf(''));


                    if ($('body ' + hash).length != 0) {
                        $('.page-transition').removeClass("active");


                    }
                } else {
                    $('.page-transition').toggleClass("active");
                    setTimeout(function() {
                        window.location = url;
                    }, 1000);

                }
            }
        });



    });
    // END DOCUMENT READY

    // DATA BACKGROUND IMAGE
    var pageSection = $("*");
    pageSection.each(function(indx) {
        if ($(this).attr("data-background")) {
            $(this).css("background", "url(" + $(this).data("background") + ")");
        }
    });



    // DATA BACKGROUND COLOR
    var pageSection = $("*");
    pageSection.each(function(indx) {
        if ($(this).attr("data-background")) {
            $(this).css("background", $(this).data("background"));
        }
    });


    // WOW ANIMATION 
    wow = new WOW({
        animateClass: 'animated',
        offset: 0
    });
    wow.init();


    // MAIN SLIDER
    var swiper = new Swiper('.main-slider', {
        slidesPerView: '1',
        spaceBetween: 0,
        speed: 1000,
        effect: 'fade',
        loop: false,
        draggable: 'false',
        autoplay: {
            delay: 15000000000,
            disableOnInteraction: false,
        }

    });

    // CAROUSEL CLASSES SLIDER
    var swiper = new Swiper('.carousel-classes', {
        slidesPerView: '4',
        spaceBetween: 30,
        loop: 'true',
        draggable: 'true',
        navigation: {
            prevEl: '.button-prev1',
            nextEl: '.button-next1',
        },
        pagination: {
            el: '.swiper-pagination',
            clickable: true,
        },
        breakpoints: {
            640: {
                slidesPerView: 1,
                spaceBetween: 15,
            },
            768: {
                slidesPerView: 2,
                spaceBetween: 30,
            },
            1024: {
                slidesPerView: 3,
                spaceBetween: 30,
            },
        }
    });



    // COUNTER
    $(document).scroll(function() {
        $('.odometer').each(function() {
            var parent_section_postion = $(this).closest('section').position();
            var parent_section_top = parent_section_postion.top;
            if ($(document).scrollTop() > parent_section_top - 300) {
                if ($(this).data('status') == 'yes') {
                    $(this).html($(this).data('count'));
                    $(this).data('status', 'no');
                }
            }
        });
    });

    /* List Marquee*/

    jQuery(document).ready(function() {

        var objListMarquee = jQuery('#cointex-list-id');

        function cloneItems() {

            var objItemsWrapper = objListMarquee.find('.cointex-marqu-des');

            for (let i = 0; i < 3; i++) {

                var objItemsCloned = objListMarquee.find('.cointex-marqu-tag').clone();

                objItemsWrapper.append(objItemsCloned);

            }

        }

        cloneItems();

        objListMarquee.on("cointex-effect-id", function() {
            cloneItems();
        });

    });

    // Preloader
    $(window).load(function() {
        $("body").addClass("page-loaded");
    });


})(jQuery);

// accordion
let question = document.querySelectorAll(".question");

question.forEach(question => {
    question.addEventListener("click", event => {
        const active = document.querySelector(".question.active");
        if (active && active !== question) {
            active.classList.toggle("active");
            active.nextElementSibling.style.maxHeight = 0;
        }
        question.classList.toggle("active");
        const answer = question.nextElementSibling;
        if (question.classList.contains("active")) {
            answer.style.maxHeight = answer.scrollHeight + "px";
        } else {
            answer.style.maxHeight = 0;
        }
    })
})
//sticky
$(window).scroll(function() {
    if ($(this).scrollTop() > 100) {
        $('.navbar').addClass('sticky')
    } else {
        $('.navbar').removeClass('sticky')
    }
});