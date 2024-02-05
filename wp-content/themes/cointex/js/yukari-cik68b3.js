$(function() {
    $("#top").click(function() {
        $("html,body").stop().animate({
            scrollTop: "0"
        }, 100);
    });
});
$(window).scroll(function() {
    var uzunluk = $(document).scrollTop();
    if (uzunluk > 300) $("#top").fadeIn(500);
    else {
        $("#top").fadeOut(500);
    }
});