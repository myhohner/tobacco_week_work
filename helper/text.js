var _word = {
    isAjax: true,
    ajaxIsOk: true,
    s_url: '',
    start_time: function () {
        /// <summary>定时请求获取正文内容</summary>
        setInterval(function () {
            if (_word.isAjax && $("h3.title a").size() > 0) {
                _word.isAjax = false;
                _word.start_getUrl();
            }
        }, 3000);
    },
    start_getUrl: function () {
        /// <summary>获取要请求正文的链接</summary>

        $("h3.title a[ok!='ok']").each(function () {
            var obj_li = $(this);
            var str_sword = obj_li.closest("li").attr("s");
            if (str_sword) {
                _word.s_url += obj_li.attr("ok", "ok").attr("href") + "@" + str_sword + "|";
            }
        });

        if (_word.s_url == "") {
            return;
        }
        var obj_ajaxTime = setInterval(function () {
            if (_word.ajaxIsOk) {
                _word.ajaxIsOk = false;
                if (_word.s_url.indexOf("|") == -1) {
                    _word.isAjax = true;
                    _word.ajaxIsOk = true;
                    clearInterval(obj_ajaxTime);
                }
                var obj_each = _word.s_url.split('|')[0].split('@');

                _word.start_ajax(obj_each[0], obj_each[1]);
            }
        }, 500);

    },
    clearHeadHtml: function (str_html) {

        if (str_html.indexOf("<body") != -1) {
            var str_body = str_html.split('<body')[1];

            str_body = pub.clearHtml(str_body, "<script", "</script>");

            str_body = pub.clearHtml(str_body, "<!--", "-->");
            str_body = pub.clearHtml(str_body, "<li", "</li>");
            str_body = pub.clearHtml(str_body, "<a", "</a>");
            str_body = pub.getHtml(str_body, "<p", "</p>");
            if (str_body.indexOf("<a") != -1) {
                return "";
            }

            str_body = pub.clearHtml(str_body, 'alt="', '"');
            str_body = pub.clearHtml(str_body, 'title="', '"');
            return str_body;
        }

        return str_html;
    },
    clearHeadHtml_v2: function (str_html) {
        str_html = pub.clear(str_html);
        var obj_p = $(str_html);
        obj_p.find("li,a").remove();
        return obj_p.find("p").text();
    },
    start_ajax: function (str_url, sword) {
        /// <summary>去请求新闻的正文内容</summary>

        if (str_url) {
            $.get(str_url, function (suc) {
                _word.s_url = _word.s_url.replace(str_url + "@" + sword + "|", "");
                _word.getWordCount(_word.clearHeadHtml_v2(suc), sword);
            });
        }
    },
    getWordCount: function (str_html, sword) {
        /// <summary>计算匹配到的正文数量</summary>

        if (!str_html) {
            _word.ajaxIsOk = true;
            return;
        }
        var arr = sword.split('##');
        sword = arr[0];
        var str_pid = arr[1];
        if (sword.indexOf('-') != -1) {
            sword = sword.split('-')[0];
        }
        sword = $.trim(sword).replace(/\s/g, ";");
        if (sword.indexOf(";") == -1) {
            sword += ";";
        }
        makeTree(sword + dataConfig.words);
        var obj_html = {};
        var arrMatch = search(str_html);
        for (var i = 0, n = arrMatch.length; i < n; i += 2) {
            mid = arrMatch[i];
            var key = str_html.substring(mid, p = arrMatch[i + 1]);
            if (obj_html.hasOwnProperty(key)) {
                obj_html[key] = parseInt(obj_html[key]) + 1;
            }
            else {
                obj_html[key] = 1;
            }
        }
        var ht = '';
        for (key in obj_html) {
            ht += '<span>' + key + '（' + obj_html[key] + '）</span>';
        }
        if (ht != '') {
            $("#li_" + str_pid).append('<div class="tagc">' + ht + '</div>');
        }
        _word.ajaxIsOk = true;
    },
    init: function () {
        _word.start_time();
    }
};

$(function () {
//_word.init();
});