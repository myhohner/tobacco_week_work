var proxyWeb = {};
//微博模拟登录打开的窗体
var str_weiboWinId = "";
//搜狗模拟登录打开的窗体id
var str_sogouWinId = "";
//微信模拟打开的窗体id
var str_weixinId = "";
///配置的数据
var json_v = null;
var str_openid = "";
var weixinPageData = "";
var weixin_loginId = "";

var ajax_type = {
    "search360": "搜索360转载新闻",
    "loadWebConfig": "读取配置信息并判断版本号",
    "get_weixinUrl": "用微信公众号查询微信主页链接",
    "save_weixinData": "保存微信页面数据",
    "get_weixinData": "获取存储bg.js里的微信数据",
    "weiboLogin": "微博登录",
    "delWeiboLogin": "删除微博登录",
    "isLogin": "判断某一个账号登录是否成功",
    "delCookie": "删除cookie",
    "openPage": "打开一个页面",
    "ajax": "ajax请求"
};
var aj = {
    rq: "",
    bck: "",
    error: function () {
        aj.bck("error");
    },
    get: function () {
        if (aj.rq.host === ajax_type.loadWebConfig) {
            //判断安装的插件版本
            var version = null;
            $.get(chrome.extension.getURL('manifest.json'), function (info) {
                version = info.version;
                $.get("http://mice.meihua.info/images/v.html?v=" + Date.parse(new Date()), function (suc) {
                    json_v = jQuery.parseJSON(suc);
                    aj.bck({ "cv": version, "v": json_v });
                });
            }, 'json');
        }
        else if (aj.rq.host === ajax_type.ajax) {
            //判断安装的插件版本
            $.get(aj.rq.url, function (res) {
                aj.bck({ "html": res });
            });
        }
        else if (aj.rq.host === ajax_type.weiboLogin) {
            //模拟微博登录
            if (str_weiboWinId != "") {
                var str_winId = str_weiboWinId;
                str_weiboWinId = "";

                chrome.tabs.remove(str_winId);
            }
            var str_weiboUrl = 'http://weibo.cn/';
            chrome.cookies.getAll({ "url": str_weiboUrl }, function (cok) {
                for (var i = 0; i < cok.length; i++) {
                    chrome.cookies.remove({ "url": str_weiboUrl, "name": cok[i].name });
                }

            });
            chrome.cookies.getAll({ "url": "https://passport.sina.cn" }, function (cok) {
                for (var i = 0; i < cok.length; i++) {
                    chrome.cookies.remove({ "url": "https://passport.sina.cn", "name": cok[i].name });
                }
            });
            setTimeout(function () {
                chrome.tabs.create({ "url": "https://passport.sina.cn/signin/signin#weibologin", "active": false }, function (tab) {
                    str_weiboWinId = tab.id;
                    aj.bck({ "value": true });
                });
            }, 4000);


        }
        else if (aj.rq.host === ajax_type.openPage) {
            //打开指定页面
            if (str_openid != "") {
                chrome.tabs.remove(str_openid);
            }
            if (str_weixinId != "") {
                chrome.tabs.remove(str_weixinId);
            }
            if (aj.rq.url.indexOf("wx2017") != -1) {
                ///检查微信是否已经登录过，没有则弹窗提醒
                chrome.cookies.getAll({ "url": aj.rq.url }, function (cok) {
                    var isHas = false;
                    for (var i = 0; i < cok.length; i++) {
                        if (cok[i].name === "ppinf") {
                            isHas = true;
                            break;
                        }
                    }
                    var _url = aj.rq.url;
                    if (!isHas) {
                        _url = "http://weixin.sogou.com/#wxlogin";
                        if (weixin_loginId != "") {
                            aj.bck({ "value": false });
                            return;
                        }
                    }
                    else {
                        if (weixin_loginId != "") {
                            chrome.tabs.remove(weixin_loginId);
                            weixin_loginId = "";
                        }

                    }
                    chrome.tabs.create({ "url": _url, "active": !isHas }, function (tab) {
                        if (isHas) {
                            str_weixinId = tab.id;
                        }
                        else {
                            weixin_loginId = tab.id;
                        }
                        aj.bck({ "value": isHas });
                    });

                });
            }
            else {
                chrome.tabs.create({ "url": aj.rq.url, "active": false }, function (tab) {
                    str_openid = tab.id;
                    aj.bck({ "value": true });
                });
            }
        }
        else if (aj.rq.host === ajax_type.delWeiboLogin) {
            //删除微博模拟登录
            if (str_weiboWinId != "") {
                var str_winId = str_weiboWinId;
                str_weiboWinId = "";
                chrome.tabs.remove(str_winId);
            }
        }
        else if (aj.rq.host === ajax_type.isLogin) {
            var isHas = false;
            chrome.cookies.getAll({ "url": aj.rq.domain }, function (cok) {
                for (var i = 0; i < cok.length; i++) {
                    if (cok[i].name === aj.rq.name) {
                        isHas = true;
                    }
                }
                aj.bck({ "isLogin": isHas });
            });

        }
        else if (aj.rq.host === ajax_type.save_weixinData) {
            weixinPageData = aj.rq.data;
            if (str_weixinId != "") {
                var str_winId = str_weixinId;
                str_weixinId = "";
                chrome.tabs.remove(str_winId);
            }
            aj.bck({ "value": true });
        }
        else if (aj.rq.host === ajax_type.get_weixinData) {
            if (weixinPageData) {
                aj.bck({ "data": weixinPageData });
                weixinPageData = "";
            }
            aj.bck({ "data": "" });
        }
        else if (aj.rq.host === ajax_type.delCookie) {
            chrome.cookies.getAll({ "url": aj.rq.url }, function (cok) {
                for (var i = 0; i < cok.length; i++) {
                    if (aj.rq.url.indexOf("weixin.sogou.com/weixin") != -1 && cok[i].name.indexOf("pp") != -1) {
                        //是搜狗就不删除登录状态
                        continue;
                    }
                    chrome.cookies.remove({ "url": aj.rq.url, "name": cok[i].name });
                }
                aj.bck({ "value": true });
            });
        }
    }
};
chrome.extension.onRequest.addListener(function (request, sender, sendResponse) {
    aj.bck = function (json) {
        sendResponse(json);
    }
    aj.rq = request;
    aj.get();
});


