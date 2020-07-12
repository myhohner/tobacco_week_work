/// <reference path="pb.js" />

var weixin = {
    getListHtml: function () {
        /// <summary>获取微信内容</summary>
        var ht = $("body").html();
        if (ht.indexOf("script") == -1) {
            setTimeout(function () {
                window.location.reload();
            }, 2500);
        }
        else {
            host.ajax({ "host": ajax_type.save_weixinData, "data": ht }, function (res) {

            });
        }
    },
    init: function () {
        this.getListHtml();
    }
};
setTimeout(function () {
    if (window.location.href.indexOf("#wxlink=") != -1) {
        setTimeout(function () {
            if ($("a:eq(0)").size() == 0) {
                setTimeout(function () {
                    window.location.reload();
                }, 800);

            }
            else {
                $("a:eq(0)").attr("href", unescape(window.location.href.split('#wxlink=')[1]))[0].click();
            }
        }, 3000);
    }
    else if (window.location.href.indexOf("#wx2017") != -1) {
        weixin.init();
    }
    else if (window.location.href.indexOf("#wxlogin") != -1) {
        $("body").append('<div style=\" background-color:#fff;text-align:center;position: absolute;top:15%;left:50%;height:30px;line-height:30px;font-size:14px;font-weight:bold;z-index:99999999;width:600px;margin-left:-300px;border-radius:2px;\">提示：搜狗微信未登录的状态，最多只能获取100条数据。请先扫码登录后才能调研数据。</div>');
        if ($("#loginBtn").size() == 0) {
            setTimeout(function () {
                window.location.reload();
            }, 3000);
        }
        else {
            $("#loginBtn")[0].click();
        }
    }
}, 0);