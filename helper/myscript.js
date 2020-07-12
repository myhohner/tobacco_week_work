/// <reference path="gb2312.js" />
/// <reference path="words.js" />
/// <reference path="pb.js" />
/// <reference path="weibo.js" />

//这个对象是记录列表的页数及当前的页码数量
var htmls = [], htmls2 = [];
//这个对象还原页面刷新前已经加载过的数据
var rest_oldData = {};
//定时加载数据
var timer_task = {};
//汇总调研回来的数据
var webDatas = {};
//存储页面所有标题的变量
var str_tts = "";
var log = {
    //存页码
    page: {},
    //存网站的json属性
    json: {},
    //一个监测项的索引号
    idx: {},
    //用于记录新生成的html要追加的对象id
    html: {},
    //存储调研设置的筛选时间
    setTime: {},
    //放置关键词词组
    words: {},
    //一个监测项下面关键词的索引号
    words_idx: {},
    rest: function (str_id) {
        /// <summary>重置标识数据</summary>
        webDatas[str_id] = [];

    },
    //尝试翻看的页数
    try_pager: {}
};
var host = {
    ajax: function (json, fun) {
        /// <summary>与后台通信</summary>
        chrome.extension.sendRequest(json, fun);
    }
};
var readHasUrl = "";
var monitor = {
    //标识是否是社媒监测
    isMedia: false,
    isChecked: function (key) {
        /// <summary>顶部勾选了，才监测</summary>
        var str_cks = '';
        $(":checkbox[name='ck_new']:checked").each(function () {
            var obj_ck = $(this);
            if (obj_ck.closest("label").find(":radio").size() == 0) {
                str_cks += $(this).val().toLowerCase();
            }
            else {
                str_cks += obj_ck.closest("label").find(":radio:checked").val().toLowerCase();
            }
        });
        return str_cks.indexOf(key) != -1;
    },
    hasSetDate: function (str_OldUrl, str_url) {
        /// <summary>判断网站是否支持选择时间段参数</summary>
        /// <param name="str_url" type="String">站内的搜索链接</param>
        if (!str_OldUrl) {
            return false;
        }
        if (str_OldUrl.indexOf('$时间戳开始$') != -1) {
            return true;
        }
        var bool_search = str_OldUrl.indexOf('[') != -1 || str_OldUrl.indexOf('$自定义开始时间$') != -1;

        if (str_url) {
            var str_day = "", str_time = "";
            if (bool_search) {
                var arr_search = str_OldUrl.split('&');
                for (var i = 0; i < arr_search.length; i++) {
                    if (arr_search[i].indexOf('[') != -1) {
                        str_day = arr_search[i].split('=')[0];
                    }
                    if (arr_search[i].indexOf('$自定义开始时间$') != -1) {
                        str_time = arr_search[i].split('=')[0];
                    }
                }
            }
            var isDay = str_day != "" && str_url.indexOf(str_day + '=&') == -1;
            var isTime = str_time != "" && str_url.indexOf(str_time + '=&') == -1;
            if (!isDay && !isTime) {
                return false;
            }
        }
        else if (typeof str_url === 'undefined') {
            return false;
        }
        return bool_search;

    },
    isAnyWord: function (word) {
        /// <summary>是否支持任意关键词搜索</summary>
        return word.indexOf("$搜索任意关键词") != -1;
    }
     ,
    searchJson: function (key) {
        /// <summary>用给定的key检索配置的网站结构</summary>
        key = key.toLowerCase();
        for (var i = 0; i < htmls2.length; i++) {
            if (key === htmls2[i].key.toLowerCase()) {
                return htmls2[i];
            }
        }

    }
     ,
    get_webJson: function (idx, str_id) {
        /// <summary>获取真实要查询的html结构，因为有特殊情况不一定查勾选的网站，如微博、搜狗、360选了自定义时间</summary>
        var obj_json = htmls[idx];
        if (log.setTime["start" + str_id] != "") {
            var key = obj_json.key.toLowerCase();
            if ("微博原创：ecdeaf53-9b30-4684-93b7-bda764ce5b54微博认证：f82a785c-5fb8-4937-9281-f8c7c5b52e92微博全部：1d6611ce-dc5d-4f29-a0cc-e3607f73c063".toLowerCase().indexOf(key) != -1) {
                if (obj_json.search_pager.indexOf("&starttime") != -1) {
                    obj_json.search_pager = obj_json.search_pager.split('&starttime')[0];
                }
                var str_time = "&starttime=" + log.setTime["start" + str_id].split(' ')[0].replace(/-/g, "") + "&endtime=" + log.setTime["end" + str_id].split(' ')[0].replace(/-/g, "");
                obj_json.search_pager = obj_json.search_pager + str_time;
                return obj_json;
            }
        }
        return obj_json;

    },
    search_url: function (str_url, num_pageIdx, word, str_id) {
        /// <summary>用于传递给第三方网站的搜索网址逻辑处理</summary>
        /// <param name="str_url" type="String">要处理的原网址</param>
        /// <param name="num_pageIdx" type="String">当前页码</param>
        /// <param name="word" type="String">搜索的关键字</param>
        //页面和关键字编码处理
        str_url = str_url.replace("$搜索关键词$", word).replace("$当前页码$", num_pageIdx).replace('$搜索编码关键词$', escape(word)).replace('$特殊关键词$', encodeURIComponent(word));
        if (str_url.indexOf('$公式分页$') != -1) {
            //页码需要计算
            var page_arr = str_url.split('算法')[1];
            str_url = str_url.replace('算法' + page_arr + '算法', '').replace('$公式分页$', eval(page_arr));
        }
        if (monitor.isAnyWord(str_url)) {
            //支持搜索任意关键词
            var str_split = str_url.split('搜索任意关键词')[1].split('$')[0];
            word = word.replace(/\s/g, str_split);
            str_url = str_url.replace("$搜索任意关键词" + str_split + "$", word);
        }
        if (monitor.hasSetDate(str_url, '')) {
            //网站的站内搜索自带时间筛选条件
            var num_idx = parseInt(log.setTime[str_id]);
            if (str_url.indexOf('[') != -1) {
                var str_type = str_url.split('[')[1].split(']')[0];
                var str_webtype = "[" + str_type + "]";
                if (num_idx < 5) {
                    str_url = str_url.replace(str_webtype, str_type.split(',')[num_idx]);
                }
                else if (str_url.indexOf("weixin.sogou.com") != -1) {
                    str_url = str_url.replace(str_webtype, "5");
                }
                else {
                    str_url = str_url.replace(str_webtype, "");
                }
            }
            //设置了自定义时间
            str_url = monitor.time.get_set(str_id, str_url);
        }
        if (str_url.indexOf("s.weibo.com") != -1) {
            //设置了自定义时间
            str_url = monitor.time.get_set(str_id, str_url);
        }
        if (str_url.indexOf("$gb2312编码$") != -1) {
            //地址栏关键词需要gb2312编码
            str_url = str_url.replace("$gb2312编码$", code.gb2312(word));
        }
        return str_url.replace("占位符", "");
    },
    weixin_try: function (str_url, ajax_json) {
        /// <summary>微信处理</summary>
        var open_url = "http://weixin.sogou.com/weixin?type=2&query=%E6%98%9F%E5%B7%B4%E5%85%8B#wxlink=" + escape(str_url + "#wx2017");
        host.ajax({ "host": ajax_type.openPage, "url": open_url }, function (res) {
            if (!res.value) {
                //还未登录过微信
                setTimeout(function () {
                    monitor.weixin_try(str_url, ajax_json);
                }, 2000);
            }
            else {
                var weixin_time = setInterval(function () {
                    host.ajax({ "host": ajax_type.get_weixinData }, function (res) {
                        if (res.data) {
                            clearInterval(weixin_time);
                            ajax_json.html = res.data;
                            monitor.suc(ajax_json);
                        }
                    });
                }, 500);
            }
        });
    },
    ajax_web: function (word, str_id, idx, str_url, str_key) {
        /// <summary>正式ajax请求数据</summary>
        /// <param name="word" type="String">关键词</param>
        /// <param name="str_id" type="String">编号</param>
        /// <param name="idx" type="String">当前的顺序</param>
        /// <param name="str_key" type="String">记录当前调研站点状态的编号，如当前站点调研到了第几页</param>
        //拼接站内搜索的链接
        var obj_webJson = this.get_webJson(idx, str_id);
        var num_pageIdx = log.page[str_id];
        if (num_pageIdx == 1 && obj_webJson.pageidx === "0") {
            //有的网站分页是0开始的
            num_pageIdx = 0;
        }
        if (str_url == "") {
            str_url = obj_webJson.search_pager;
        }
        //获取搜索的关键词
        word = monitor.word.get(str_id, str_url, word);
        //搜索网址逻辑处理
        str_url = monitor.search_url(str_url, num_pageIdx, word, str_id);
        //传给浏览器插件跨域请求
        var ajax_json = {};
        ajax_json.url = str_url;
        ajax_json.key = str_key;
        ajax_json.obj_id = str_id;
        ajax_json.word = word;
        //配置的原有网站链接
        ajax_json.oldurl = obj_webJson.search_pager;
        if (str_url.indexOf("weixin.sogou.com") != -1) {
            monitor.weixin_try(str_url, ajax_json);
        }
        else {
            $.get(str_url, ajax_json, monitor.callback(ajax_json)).error(function (error) {
                setTimeout(function () {
                    if (str_url) {
                        if (str_url.indexOf("news.baidu.com") != -1) {
                            monitor.ajax_web(word, str_id, idx, str_url, str_key);
                        }
                        else if (str_url.indexOf("weibo.") != -1) {
                            pub.loading(str_id, '遇到一个奇怪错误，正在尝试处理，长时间未反应，<a href="' + str_url + '" target="_blank">点击前往</a>查看。');
                            host.ajax({ "host": ajax_type.openPage, "url": str_url, "value": str_id }, function (res) {
                                monitor.ajax_web(word, str_id, idx, str_url, str_key);
                            });
                        }
                        else {
                            pub.loading(str_id, '获取数据，出现异常！');
                        }
                    }
                }, 2000);
            });
        }

    },
    callback: function (ajax_json) {
        /// <summary>请求网站数据成功后的回调函数</summary>
        return function (suc) {
            ajax_json.html = suc;
            monitor.suc(ajax_json);
        }
    },
    start: function (word, str_id) {
        var idx = parseInt(log.idx[str_id]) + 1;
        //更新一个监测项里当前正在查询的站点索引号
        log.idx[str_id] = idx;
        //未勾选的监测项跳过
        if (!monitor.isChecked(htmls[idx].key)) {
            monitor.reset(word, str_id, htmls[idx].key !== "92aaf395-406a-4aee-8712-70800e30d963");
            return;
        }
        var obj_webJson = this.get_webJson(idx, str_id);
        if (obj_webJson.name.indexOf("微信") != -1) {
            pub.loading(str_id, '正在检索' + obj_webJson.name + '（如果长时间无数据，可能未登录&nbsp;&nbsp;<a href="http://weixin.sogou.com/#wxlogin" target="_blank">点击前往登录</a>）');
        }
        else {
            pub.loading(str_id, '正在检索' + obj_webJson.name + '…');
        }
        //增加尝试翻页的次数
        if (!log.try_pager.hasOwnProperty(str_id)) {
            log.try_pager[str_id] = 1;
        }
        else {
            log.try_pager[str_id] = parseInt(log.try_pager[str_id]) + 1;
        }
        var str_key = obj_webJson.key + str_id;
        //把配置的站点信息放入缓存中
        if (!log.json.hasOwnProperty(str_key)) {
            log.json[str_key] = obj_webJson;
        }
        if (!obj_webJson.hasOwnProperty("search_pager")) {
            //技术人员还未分析站点结构的
            var str_webLink = $.trim(obj_webJson.url);
            if (str_webLink.indexOf("/") == -1) {
                //微信公众号
                weixin.get_url(word, str_id, idx, str_webLink, str_key, false);
            }
            else {
                //使用百度站内搜索
                var str_domain = pub.getDomain(str_webLink);
                monitor.ajax_web(word, str_id, idx, dataConfig.baidu_url.replace("$域名$", str_domain), str_key);
            }

        }
        else {
            //技术人员分析过的站点
            monitor.ajax_web(word, str_id, idx, "", str_key);
        }
    },
    urlHas: function (str_hasLink, obj) {
        if (obj.url.indexOf("weixin.sogou.com") != -1) {
            //微信去重不是判断链接，而是标题和作者
            var str = "|" + obj.title + "$" + obj.author + "$";
            return str_hasLink.indexOf(str) != -1;
        }
        return str_hasLink.indexOf(obj.url) != -1;
    },
    reset: function (word, str_id, isNotLoadNext) {
        /// <summary>获取完一个网站的html结构后，开始获取下一个，直到完成为止</summary>
        var num_count = 0, num_pager = 0;
        if (document.getElementById("sls_count")) {
            num_count = parseInt($("#sls_count").val());
            num_pager = num_count / 10;
        }
        var idx = parseInt(log.idx[str_id]);
        if ((htmls.length - 1) > idx) {
            monitor.start(word, str_id);
        }
        else if ((log.words[str_id].length - 1) > log.words_idx[str_id]) {
            log.idx[str_id] = -1;
            log.words_idx[str_id] = parseInt(log.words_idx[str_id]) + 1;
            pub.loading(str_id, '正在检索下一个监测词');
            monitor.start(word, str_id);
        }
        else if (webDatas.hasOwnProperty(str_id) && webDatas[str_id].length < num_count && parseInt(log.try_pager[str_id]) < num_pager && !isNotLoadNext) {
            log.idx[str_id] = -1;
            log.page[str_id] = parseInt(log.page[str_id]) + 1;
            pub.loading(str_id, '正在查询下一页数据。');
            monitor.start(word, str_id);
        }
        else {
            //重置json索引
            log.idx[str_id] = -1;
            log.try_pager[str_id] = 0;
            log.words_idx[str_id] = 0;
            monitor.html.bind(str_id, word);
        }
    },
    setColorBg: function (oldFont, font) {
        /// <summary>给关键词标颜色</summary>
        if (!oldFont) {
            return "";
        }
        var arr_font = font.split(/[\s+]/g);
        for (var i = 0; i < arr_font.length; i++) {
            font = $.trim(arr_font[i]);

            if (font) {
                font = font.replace(/"/g, "");
                var reg = new RegExp(font, 'g');
                oldFont = oldFont.replace(reg, '<span class="bgkey">' + font + '</span>');
            }
        }
        return oldFont;
    },
    isHas: function (str_url, str_title, str_sourceName, str_time) {
        /// <summary>判断监测到的新闻是否重复</summary>
        if (str_url.indexOf(".baidu") != -1 || str_url.indexOf("weixin.sogou.com") != -1) {
            var bool_has = false;
            if (str_tts == "") {
                $("ul.newList li").each(function () {
                    var s_time = $.trim($(this).find(".time").text()) + "|";
                    if (s_time.indexOf("分钟") != -1 || s_time.indexOf("小时") != -1 || s_time.indexOf("刚刚") != -1 || s_time.indexOf("秒") != -1) {
                        s_time = "";
                    }
                    str_tts += "|" + $.trim($(this).find(".title a").text()).replace(/&quot;/g, '"') + "|" + $.trim($(this).find(".source").text()) + "|" + s_time;
                });
            }
            str_time = str_time + "|";
            if (str_time.indexOf("分钟") != -1 || str_time.indexOf("小时") != -1 || str_time.indexOf("刚刚") != -1 || str_time.indexOf("秒") != -1) {
                str_time = "";
            }
            var str_idx = "|" + $.trim(str_title).replace(/&nbsp;/g, " ").replace(/&amp;quot;/g, '"') + "|" + $.trim(str_sourceName) + "|" + str_time;
            if (str_tts.indexOf(str_idx) != -1 || readHasUrl.indexOf(str_idx) != -1) {
                //标题有重复的
                return true;
            }
            if (str_url.indexOf("weixin.sogou.com") != -1) {
                readHasUrl += str_idx;
            }
            return bool_has;
        }
        else {
            return $("a[href='" + str_url + "']").size() > 0;
        }
        return false;
    },
    getInJsHtml: function (obj, str_html) {
        /// <summary>判断想要的html或js是否在js里，如果是将截取获取</summary>

        if (obj.hasOwnProperty("hasjs")) {
            var str_split = unescape(obj.hasjs);
            var arr_split = str_split.split('$');
            if (str_html.indexOf(arr_split[0]) != -1) {
                str_html = str_html.split(arr_split[0])[1].split(arr_split[1])[0];
            }
            else {
                return "";
            }
            if (obj.key !== "d933672d-63b3-441b-8a28-b89c25371c8e") {
                str_html = unescape(str_html.replace(/\\(u[0-9a-fA-F]{4})/gm, '%$1').replace(/\\"/g, '"').replace(/\//g, ""));
            }
        }

        return str_html;
    },
    suc: function (res) {
        var objs = [];
        //后台设置的站点分析结构
        var obj = log.json[res.key];
        if (res.html.indexOf("没有找到相关的微信公众号文章") != -1) {
            res.html = "";
        }
        else if (_error.yes(res.url, res.html, res.obj_id)) {
            //网站出现了异常
            return;
        }
        _error.weixinisNull = false;
        //防止有的html或xml在js文件里
        res.html = monitor.getInJsHtml(obj, res.html);
        if (res.html == "") {
            monitor.dom.data({}, res);
            return;
        }
        var isClear = obj.hasOwnProperty("search_html") && $.trim(obj["search_html"].img) != "";
        res.html = pub.clear(res.html, !isClear);
        if (!obj.hasOwnProperty("search_html")) {
            //技术人员未设置网站结构的，说明是读取的site:baidu的站点，网站结构要从配置文件读取
            if (obj.url.indexOf('/') != -1) {
                //baidu站内搜索
                obj.search_html = dataConfig.search_html;
            }
        }
        if (obj.search_html.xml) {
            objs = monitor.dom.eachXml(res, obj);
        }
        else {
            objs = monitor.dom.eachHtml(res, obj);
        }
        //汇总数据
        monitor.dom.data(objs, res);
    },
    click: function () {
        /// <summary>点击开始调研</summary>
        $(document).on("click", "a.start_monitor", function () {
            var _isClick = false;
            $("a.start_monitor").each(function () {
                if ($(this).text() !== "开始调研" && $(this).text() !== "完成") {
                    _isClick = true;
                    return false;
                }
            });
            var obj_click = $(this);
            if (_isClick) {
                obj_click.text("搜狗微信屏蔽太厉害，不能同时调研多条，请谅解！");
                setTimeout(function () {
                    obj_click.text("开始调研");
                }, 500);
                return false;
            }
            if (obj_click.text() !== "开始调研") {
                return false;
            }
            if ($(":checkbox[name='ck_new']:checked").size() == 0) {
                alert("请先勾选需要监测的站点。");
                return;
            }
            var pobj = obj_click.text("获取中…").parents(".skey");
            //标识一次调研任务的唯一key
            var str_id = pobj.attr("num");
            if (document.getElementById("ld_" + str_id)) {
                return false;
            }
            pub.loading(str_id, "正在抓取数据…");
            //把设置的日期放入缓存变量
            pub.getSetTime(str_id, $(this));
            log.idx[str_id] = -1;
            log.page[str_id] = 1;
            monitor.start(unescape(pobj.attr("skey")), str_id);
        });
    },
    click_next: function () {
        /// <summary>点击翻看下一页，加载更多数据</summary>
        $(document).on("click", ".pager", function () {
            var obj_click = $(this);
            if (obj_click.text() != "加载更多…" && obj_click.text().indexOf("木有了") == -1) {
                return false;
            }
            obj_click.text("获取中…");
            //把当前点击的父元素存入字典，让数据加载完填充html结构使用
            var str_id = obj_click.attr("num");
            pub.getSetTime(str_id, obj_click);

            var word = unescape(obj_click.attr("skey"));

            log.idx[str_id] = -1;
            log.page[str_id] = parseInt(log.page[str_id]) + 1;
            obj_click.remove();
            pub.loading(str_id, "正在抓取数据…");
            monitor.start(word, str_id);
        });
    },
    loadJson: function () {
        var str_json = $.trim($("#weblist").text());
        var arr = [];
        if (str_json != "") {
            htmls = jQuery.parseJSON("[" + str_json.substring(1) + "]");
            var arr_keys = [], keys = "", keys2 = dataConfig["keys"].toLowerCase();
            $(":checkbox[name='ck_new']").each(function () {
                arr_keys.push($(this).val());
            });
            keys = arr_keys.join(',').toLowerCase();

            for (var o = 0; o < htmls.length; o++) {
                if (keys.indexOf(htmls[o].key) != -1) {
                    arr.push(htmls[o]);
                }
                if (keys2.indexOf(htmls[o].key) != -1) {
                    htmls2.push(htmls[o]);
                }
            }
            htmls = arr;
        }
    },
    saveCk: function () {
        /// <summary>记住勾选过的监测项</summary>
        $(document).on("click", ":checkbox[name='ck_new']", function () {
            var arr_cks = [];
            $(":checkbox[name='ck_new']:checked").each(function () {
                arr_cks.push($(this).val());
            });
            store.set("cks", arr_cks.join('|'));
        });
        arr_cks = store.get("cks").split('|');
        ///读取浏览器记录，把上一次勾选的监测项勾选上
        for (var i = 0; i < arr_cks.length; i++) {
            $(":checkbox[name='ck_new'][value='" + arr_cks[i] + "']").prop("checked", true);
        }

    },
    init: function (str_pageUrl) {
        if (str_pageUrl.indexOf("/spider.aspx") != -1) {
            //只有定源监测页面需要使用到浏览器插件
            monitor.isMedia = window.location.href.indexOf("321acb5b-c970-410e-abaa-c99fe85a3b6e") != -1;
            //monitor.saveCk();
            monitor.click();
            monitor.click_next();
            _config.load(function () {
                monitor.loadJson();
                monitor.saveCk();
            });
        }
    }
};
monitor.word = {
    group: function (str_id, str_word) {
        /// <summary>拿到搜索词按任意关键词的数量进行分组</summary>
        var arr = [];
        if (str_word.indexOf('$$') != -1) {
            var arr_w = str_word.split('$$');
            //完成关键词
            var word = arr_w[0];
            var no = arr_w[2];
            //任意关键词
            var any = arr_w[1];
            if (any && $.trim(any) != "") {
                var arr_any = any.split(/\s/g);
                for (var i = 0; i < arr_any.length; i++) {
                    if (arr_any[i] && $.trim(arr_any[i]) != "") {
                        arr.push(word + "$$" + arr_any[i] + "$$" + no);
                    }
                }
            }
            else {
                arr.push(word + "$$" + any + "$$" + no);
            }
        }
        log.words[str_id] = arr;
    },
    idx: function (str_id) {
        /// <summary>获取搜索词的索引</summary>
        if (!log.words_idx.hasOwnProperty(str_id)) {
            log.words_idx[str_id] = 0;
            return 0;
        }
        return log.words_idx[str_id];
    },
    get: function (str_id, str_url, str_word) {
        /// <summary>获取关键词</summary>
        if (!log.words.hasOwnProperty(str_id)) {
            this.group(str_id, str_word);
        }
        var idx = this.idx(str_id);
        var arr = log.words[str_id];
        return this.get_join(str_url, arr[idx]);
    },
    get_join: function (str_url, str_word) {
        /// <summary>根据不同的搜索引擎，返回不同的组合词</summary>
        var s_word = '';
        if (str_word.indexOf('$$') != -1) {
            //完整关键词、任意关键词、排除词
            var arr_w = str_word.split('$$');
            //完成关键词
            var word = arr_w[0];
            var no = arr_w[2];
            //任意关键词
            var any = arr_w[1];
            s_word = this.join(str_url, word, any, no);
        }
        else {
            s_word = str_word;
        }
        return s_word;
    },
    join: function (str_url, word, any, no) {
        /// <summary>获取完整关键词、任意关键词、排除词逻辑的拼接字符串</summary>
        word = $.trim(word);
        any = $.trim(any);
        var w = "";
        var isCk = document.getElementById("ck_word") && $("#ck_word").is(":checked");
        if (word != "") {
            if (isCk) {
                w += '"' + word + '"';
            }
            else {
                w += word;
            }
        }
        if (any != "") {
            if (isCk) {
                w += '"' + any + '"';
            }
            else {
                w += " " + any;
            }
        }
        w += this.get_no(str_url, no);
        return w;
    }
    ,
    get_no: function (str_url, no) {
        /// <summary>针对不同搜索引擎，排除词的拼接处理</summary>
        no = $.trim(no);
        if (no == "") {
            return "";
        }
        var arr_no = no.split(/\s/g);
        var s = '';
        var arr = [];
        for (var i = 0; i < arr_no.length; i++) {
            if (arr_no[i] && $.trim(arr_no[i]) != "") {
                arr.push(arr_no[i]);
            }
        }
        if (str_url.indexOf('.baidu.com') != -1) {
            //百度的排除词形式是这样的-(难喝|猫)
            s = ' -(' + arr.join('|') + ')';
        }
        else if (str_url.indexOf('www.sogou.com') != -1) {
            s = '';
        }
        else {
            s = arr.join(' -');
            s = " -" + s;
        }
        return s;
    }
};
//生成最终呈现到页面的列表html逻辑对象
monitor.html = {
    keys: {},
    count: 0,
    get_groupKey: function (idx) {
        /// <summary>获取不重复的组id</summary>
        var str_key = pub.guid(idx);
        if (this.keys.hasOwnProperty(str_key)) {
            str_key = str_key + this.count;
        }
        else {
            this.keys[str_key] = "";
            this.count++;
        }
        return str_key;
    },
    isShowSource: function (domain) {
        /// <summary>为保持神秘感，有些就不显示数据的具体出处</summary>

        if (dataConfig.hasOwnProperty("noviewSource")) {
            var arr = dataConfig["noviewSource"].split('|');
            for (var i = 0; i < arr.length; i++) {
                if (domain.indexOf(arr[i]) != -1) {
                    return false;
                }
            }
        }
        return true;
    },
    create: function (objs, str_id, cid) {
        /// <summary>依据返回的网站结构拼接html</summary>
        var ht = '';
        //标题
        var idx = 1;
        var str_hasLink = localStorage.getItem("importurl") || "";
        for (var i = 0; i < objs.length; i++) {

            var obj = objs[i];
            if ($.trim(obj.title) == "") {
                continue;
            }
            if (monitor.urlHas(str_hasLink, obj)) {
                //已经导入过的新闻，变灰
                ht += '<li class="hasTr" ';
            }
            else {
                ht += '<li ';
            }
            var str_gid = this.get_groupKey(i);
            ht += ' id="li_' + str_gid + '" ';
            ht += ' s="' + obj.swd + '##' + str_gid + '" ';
            if ($.trim(obj.urlIsError) != "" && obj.url.indexOf(obj.urlIsError) != -1) {
                ht += ' error="true" oldurl="' + obj.url + '" >';
            }
            else if (obj.hasOwnProperty("authorUrl")) {
                ht += ' authorlink="' + obj.authorUrl + '" >';
            }
            else {
                ht += ' >';
            }
            if (obj.img) {
                ht += '<div class=\"leftFont\">';
            }
            var str_linkShow = '';
            //是否有子新闻
            var hasChild = obj.hasOwnProperty("groups") && obj["groups"].length > 0;
            if (hasChild) {
                str_linkShow = '<a class="link_show" href="javascript:void(0)">（' + (obj["groups"].length + 1) + '）</a>';
            }
            ht += '<h3 class="title">' + idx + '、<input type="checkbox" name="chk' + str_id + '" value="' + str_gid + '" /><a href="' + obj.url + '" target="_blank">' + obj.title + '</a>' + str_linkShow + '</h3>';
            idx++;
            ht += '<div class="c-author">';
            //作者
            ht += '<span class="source">' + obj.author + '</span>';
            //日期
            ht += '<span class="time">' + obj.time + '</span>';
            var str_webName = obj.name;
            if (str_webName.indexOf('（') != -1) {
                str_webName = str_webName.replace(str_webName.split('（')[1], '').replace('（', '');
            }
            if (this.isShowSource(obj.domain)) {
                //来源
                ht += '<span class="activeName"><a href="' + obj.domain + '" target="_blank">' + str_webName + '</a></span>';
            }
            ht += '<span class="ddlCategoryList" onclick="SetCateList(this,\'' + cid + '\',\'' + cid + 'a1\');">&nbsp;&nbsp;&nbsp;<label id="Lbl_Cate22352235a1">当前分类</label>&nbsp;&nbsp;&nbsp;<img src="images/xiajiantou.gif" align="absmiddle"></span>';
            ht += '</div>';
            ht += '<div class="sm">' + obj.summary + '</div>';
            //            if (obj.hasOwnProperty("msg") && obj["msg"]) {
            //                var num_childCount = parseInt(obj["msg"]);
            //                if (num_childCount > 1) {
            //                    var obj_title = $("<div>" + obj.title + "</div>");
            //                    var str_title = obj_title.text().replace("...", "");
            //                    ht += '<div class="div_childs">有<a href="#">' + num_childCount + '</a>条（估值）相似新闻，<a href="searchNews.aspx?k=' + escape(str_title) + '" target="_blank">点击前往</a>搜索明细</div>';
            //                }
            //            }

            if (obj.img) {
                ht += '</div><div class="rightImg"><img src="' + obj.img + '" /></div>';
            }

            if (hasChild) {
                var cht = '<ul class="ul_childs">';
                for (var c = 0; c < obj.groups.length; c++) {
                    var obj_c = obj.groups[c];
                    cht += '<li><input type="checkbox" name="chk' + str_id + '" value="' + str_gid + '" /><a href="' + obj_c.url + '" target="_blank">' + obj_c.title + '（' + obj_c.author + '  ' + obj_c.time + '）</a></li>';
                }
                cht += '</ul>';
                ht += cht;
            }
            ht += '</li>';
        }
        str_tts = "";
        var pager_count = 1;
        var next_item = $("#key_" + str_id).next(".items");
        if (next_item.size() > 0) {
            pager_count = parseInt(next_item.find(".show_data").size()) + 1;
            if (pager_count == 0) {
                pager_count = 1;
            }
        }
        return '<div class="spider_htmls"><div class="show_data"><span>第<label>' + pager_count + '</label>页，共检索到<label>' + objs.length + '</label>条数据！</span><a><i class="fa fa-chevron-circle-up"></i></a></div><div class="datas"><ul class="newList" id="' + str_id + '">' + ht + '</ul></div></div>';
    },
    pager: function (word, str_id, hasData) {
        /// <summary>生成下一页的按钮</summary>
        /// <param name="word" type="String">调研时查询的关键词</param>
        /// <param name="str_id" type="String">一次调研操作的唯一标识符</param>
        /// <param name="hasData" type="Bool">指示是否还有数据</param>
        var ht = '';
        if (hasData) {
            ht = '<div id="pager' + str_id + '" class="pager" num="' + str_id + '" skey="' + escape(word) + '">加载更多…</div>';
        }
        else {
            ht = '<div id="pager' + str_id + '" class="pager nodata" num="' + str_id + '" skey="' + escape(word) + '">木有了，换个筛选条件后点击重试！</div>';
        }
        readHasUrl = "";
        return ht;
    },
    bind: function (str_id, word) {
        /// <summary>最后结束绑定结果</summary>
        var ht_pager = '', isload = false;
        if (webDatas.hasOwnProperty(str_id)) {
            var objs = monitor.dom.order(webDatas[str_id]);
            objs = monitor.dom.group(objs);
            if (objs && objs.length > 0) {
                var pobj = $("#key_" + str_id);
                if (pobj.next(".items").size() == 0) {
                    pobj.after('<div class="items"></div>');
                }
                pobj.next(".items").append(this.create(objs, str_id, ''));
                log.rest(str_id);
                isload = true;
            }
        }
        ht_pager = this.pager(word, str_id, isload);
        $("#ld_" + str_id).replaceWith(ht_pager);
        page.hide(str_id);
        $("#key_" + str_id).find("a.start_monitor").text("完成");
    }
};
//存储dom对象
monitor.dom = {
    title: function (str_title) {
        /// <summary>获取新闻标题，用于把相同标题的新闻归纳到一组，方便调研查看</summary>
        try {
            if (str_title) {
                return pub.trim(pub.title.get(str_title).replace(/[“,”,"]/g, ""));
            }

        }
        catch (ex) {

        }
        return str_title;
    },
    group: function (objs) {
        /// <summary>相同新闻归组</summary>
        if (!monitor.isMedia) {
            //不是社媒监测才分组
            var arr = {};
            var obj_news = {};
            var arr_news = [];
            for (var i = 0; i < objs.length; i++) {
                var key = this.title(objs[i].title);
                if (arr.hasOwnProperty(key)) {
                    arr[key].push(objs[i]);
                }
                else {
                    arr[key] = [];
                    obj_news[key] = objs[i];
                }
            }
            for (k in obj_news) {
                if (arr.hasOwnProperty(k)) {
                    obj_news[k].groups = arr[k];
                    arr_news.push(obj_news[k]);
                }
            }
            return arr_news;
        }
        else {
            return objs;
        }
    },
    source: function (str_source) {
        /// <summary>网站来源规则处理</summary>
        try {
            if (str_source.indexOf("...") != -1) {
                str_source = str_source.split('...')[0];
            }
            if (str_source.indexOf(".com") == -1 && str_source.indexOf(".co") != -1) {
                str_source = str_source.replace(".co", ".com");
            }
        }
        catch (ex) {

        }
        return str_source;
    },
    obj: function (dom, isWeibo, obj, res, timeTry) {
        /// <summary>构造单个对象</summary>
        /// <param name="dom" type="Object">当前循环的遍历的dom对象</param>
        /// <param name="isWeibo" type="Bool">标识当前正在遍历的是否是微博数据</param>
        /// <param name="obj" type="Object">设置的网站结构对象</param>
        /// <param name="res" type="Object">请求bg后台返回的结果</param>
        if (isWeibo) {
            return weibo.obj(dom, obj, res);
        }
        var o = {};
        o.swd = res.word;
        //标题
        o.title = pub.dom.get(dom, obj.search_html.title, obj);
        //垃圾或标题包含要屏蔽的站点，则不显示
        if (!monitor.isMedia && pub.isRubbishWeb(o.title)) {
            return true;
        }
        //链接
        o.url = $.trim(pub.dom.get(dom, obj.search_html.url, obj));
        //作者（来源）
        o.author = this.source(pub.dom.get(dom, obj.search_html.author, obj));

        if (!monitor.isMedia && pub.isRubbishUrl(o.url, o.author)) {
            return true;
        }
        if (obj.search_pager.indexOf("weixin.sogou.com") != -1) {
            o.time = dom.find(".s-p").attr("t");

            var unixTimestamp = new Date(parseInt(o.time) * 1000);
            o.time = monitor.time.show(unixTimestamp);

            o.date = unixTimestamp;
        }
        else if (timeTry) {
            o.time = pub.dom.get(dom, obj.search_html.time, obj);
            var obj_time = monitor.time.get(o.time, res.obj_id);
            if (obj_time.no) {
                return true;
            }
            o.time = obj_time.time;
            o.date = obj_time.date;
        }
        else {
            o.time = "";
        }
        //摘要
        o.summary = pub.dom.get(dom, obj.search_html.summary, obj);
        if (!o.url || monitor.isHas(o.url, o.title, o.author, o.time)) {
            //处理网站重复的
            return true;
        }
        o.img = pub.dom.get(dom, obj.search_html.img, obj);
        o.domain = obj.url;
        o.name = obj.name;
        //高亮关键字
        o.summary = monitor.setColorBg(o.summary, res.word);
        o.title = monitor.setColorBg(o.title, res.word);
        try {
            o.msg = pub.getNumber(pub.dom.get(dom, obj.search_html.msgCount, obj));
        }
        catch (ex) {
            o.msg = "";
        }
        return o;
    },
    eachHtml: function (res, obj) {
        /// <summary>循环dom结构</summary>
        /// <param name="obj" type="Object">站点结构对象</param>
        var str_html = res.html;
        var $dom = $("<div>" + str_html + "</div>");
        var objs = [];
        var $list = $dom.find(obj.search_html.list);
        //链接是否需要特殊处理
        var isWeibo = obj.search_html.url === "新浪微博" || res.url.indexOf("s.weibo.com") != -1;
        //监测是否需要验证日期，因为有的网站时间数据难取，并且已经带了时间筛选条件
        var timeTry = monitor.time.isTest(res.url, obj);

        $list.each(function () {
            var c_obj = monitor.dom.obj($(this), isWeibo, obj, res, timeTry);
            if (c_obj !== true) {
                objs.push(c_obj);
            }
        });
        return objs;
    },
    eachXml: function (res, obj) {
        /// <summary>循环xml</summary>
        var objs = [];
        var str_xml = res.html;
        var set_xml = obj.search_html.xml;
        //站点返回的xml对象
        var obj_xml = {};
        if (str_xml instanceof Object) {
            obj_xml = str_xml;
        }
        else {
            obj_xml = eval('(' + str_xml + ')');
        }
        //xml的dom结构
        var xml_domArr = set_xml.replace("网页", "").split('|');
        //拼接获取值的链式
        var str_eval = "";
        for (var i = 0; i < xml_domArr.length; i++) {
            str_eval += "['" + xml_domArr[i] + "']";
        }
        var objs_xml = eval("obj_xml" + str_eval);
        if (set_xml.indexOf('网页') != -1) {
            //虽然是xml，但内部实际存储还是一大段html文字，如好奇心日报网站
            res.html = objs_xml;

            return this.eachHtml(res, obj);
        }
        else {
            for (var i = 0; i < objs_xml.length; i++) {
                var xml = objs_xml[i];
                var o = {};
                o.time = pub.attr(xml, obj.search_html.time);
                var obj_time = monitor.time.get(o.time, res.obj_id);
                if (obj_time.no) {
                    continue;
                }
                o.time = obj_time.time;
                o.date = obj_time.date;
                o.url = $.trim(pub.attr(xml, obj.search_html.url));
                o.title = pub.attr(xml, obj.search_html.title);
                o.author = pub.attr(xml, obj.search_html.author);
                if (monitor.isHas(o.url, o.title, o.author, o.time)) {
                    //处理网站重复的
                    continue;
                }
                o.img = pub.attr(xml, obj.search_html.img);

                o.domain = obj.url;
                o.name = obj.name;
                o.summary = pub.attr(xml, obj.search_html.summary);
                //高亮关键字
                o.summary = monitor.setColorBg(o.summary, res.word);
                o.title = monitor.setColorBg(o.title, res.word);
                objs.push(o);
            }
        }
        return objs;
    },
    filter: function (objs) {
        /// <summary>过滤重复数据</summary>
        try {
            var str_u = "";
            var arr = [];
            for (var i = 0; i < objs.length; i++) {
                var obj = objs[i];
                if (str_u.indexOf(obj.url) == -1) {
                    str_u += obj.url;
                    arr.push(obj);
                }
            }
            return arr;
        }
        catch (ex) {
            return objs;
        }
    },
    test: function (objs) {
        /// <summary>查看域名出现的次数，判断是否要过滤</summary>
        try {
            var obj_d = {};
            for (var i = 0; i < objs.length; i++) {
                var obj = objs[i];
                var s_d = "";
                if (obj.url.indexOf(".baidu.com") != -1) {
                    s_d = pub.getDomain(obj.author);
                }
                else {
                    s_d = pub.getDomain(obj.url);
                }
                var arr_d = s_d.split('.');
                if (arr_d.length > 1) {
                    s_d = s_d.replace(arr_d[0] + ".", "");
                }
                s_d = $.trim(s_d);
                objs[i].test = s_d;
                if (obj_d.hasOwnProperty(s_d)) {
                    obj_d[s_d] = parseInt(obj_d[s_d]) + 1;
                }
                else {
                    obj_d[s_d] = 1;
                }
            }
            for (var key in obj_d) {
                //域名在一次调研出现超过7次，就认为是垃圾网站在刷屏
                if (parseInt(obj_d[key]) > 7) {
                    if (key !== "com" && key !== "cn" && key !== ".com.cn") {
                        for (var i = 0; i < objs.length; i++) {
                            if (objs[i].test === key) {
                                objs[i].del = true;
                            }
                        }
                    }
                }
            }
            var arr_new = [];
            for (var i = 0; i < objs.length; i++) {
                if (!objs[i].hasOwnProperty("del")) {
                    arr_new.push(objs[i]);
                }
            }
            return arr_new;
        }
        catch (ex) {
            return objs;
        }
    },
    order: function (objs) {
        /// <summary>排序</summary>
        objs = this.filter(objs);
        return sort_object(objs, 'date', true);
    },
    data: function (objs, res) {
        /// <summary>网站都调研完后，汇总数据</summary>
        var str_key = res.obj_id;
        if (objs && objs.length > 0) {
            var arr = [];
            if (webDatas.hasOwnProperty(str_key)) {
                arr = webDatas[str_key];
            }
            for (var i = 0; i < objs.length; i++) {
                arr.push(objs[i]);
            }
            webDatas[str_key] = arr;
        }
        monitor.reset(res.word, str_key, res.oldurl.indexOf("weixin.sogou.com") != -1);
    }
};
monitor.time = {
    get: function (str_date, str_id) {
        /// <summary>获取网站新闻的发布日期</summary>
        try {
            if (!str_date || str_date.indexOf("1天内") != -1) {
                return { "no": false, "time": str_date, "date": "" };
            }
            if (/^[0-9]{6,}$/.test(str_date)) {
                //表示时间格式是时间戳，需要转换一下
                var unixTimestamp = new Date(parseInt(str_date) * 1000);
                str_date = unixTimestamp.toLocaleString();
            }

            try {
                str_date = pub.time.parse(str_date);
            }
            catch (ex) {
                //转换日期出现错误，就不过滤了直接显示
                _error.log(ex, "日期字符串转换错误" + str_date);
                return { "no": false, "date": "", "time": str_date };
            }
            var isOk = str_date && !this.compare(str_id, str_date);
            return { "no": isOk, "date": str_date, "time": this.show(str_date) };
        }
        catch (ex) {
            return { "no": false, "time": str_date, "date": "" };
        }
    },
    compare: function (str_id, newsDate) {
        /// <summary>对比时间，好过滤不符号条件的新闻</summary>
        var setDate = log.setTime[str_id];

        if (setDate) {
            if (setDate === "0") {
                //不限制时间
                return true;
            }
            else {
                var curDate = new Date(); //当前时间
                var day = curDate.getTime() - newsDate.getTime();
                var num_h = Math.floor(day / (3600 * 1000));
                day = Math.floor(day / (24 * 3600 * 1000));

                if (day < 0) {
                    return false;
                }
                if (setDate === "1" && num_h < 24) {
                    return true;
                }
                if (setDate === "2" && day < 7) {
                    return true;
                }
                if (setDate === "3" && day < 30) {
                    return true;
                }
                if (setDate === "4" && day < 365) {
                    return true;
                }
            }
        }
        else {
            //自定义时间
            return newsDate > pub.time.parse(log.setTime["start" + str_id]) && newsDate <= pub.time.parse(log.setTime["end" + str_id]);
        }
    },
    show: function (newsDate) {
        /// <summary>获取供调研员显示查看的统一日期格式</summary>
        try {
            var str_format = "";
            var curDate = new Date(); //当前时间
            var day = curDate.getTime() - newsDate.getTime();
            var num_h = Math.floor(day / (3600 * 1000));

            day = Math.abs(curDate.getDate() - newsDate.getDate());
            var str_hour = " " + completionDate(newsDate.getHours()) + "：" + completionDate(newsDate.getMinutes());
            if (num_h < 1) {
                var num_m = Math.abs(curDate.getMinutes() - newsDate.getMinutes());
                return num_m + "分钟前";
            }
            if (num_h < 24) {
                return num_h + "小时前";
            }
            if (day === 1) {
                return "昨天" + str_hour;
            }
            if (day === 2) {
                return "前天" + str_hour;
            }
            if (day < 4) {
                return day + "天前";
            }
            return pub.time.format(Date.parse(newsDate), "m月d");
        }
        catch (ex) {
            _error.log(ex, newsDate + "转换显示的日期失败！");
        }
    },
    isTest: function (url, obj) {
        /// <summary>判断是否需要验证日期</summary>
        //站点是有时间过滤机制的
        if (monitor.hasSetDate(obj.search_pager, url) && $.trim(obj.search_html.time) == "") {
            return false;
        }
        //否则都需要验证日期
        return true;
    },
    get_set: function (str_id, str_url) {
        /// <summary>自定义日期处理</summary>
        /// <param name="str_id" type="String">监测的编号</param>
        /// <param name="str_url" type="String">搜索的链接</param>
        var setDate = log.setTime[str_id];
        var str_startTime = "", str_endTime = Date.parse(new Date()) / 1000;
        var str_split = "-";
        if (str_url.indexOf('无间隔') != -1) {
            str_url = str_url.replace("无间隔", "");
            str_split = '';
        }
        if (str_url.indexOf('斜杠间隔') != -1) {
            str_url = str_url.replace("斜杠间隔", "");
            str_split = '/';
        }
        if (setDate) {
            if (setDate === "0") {
                //不限制时间

            }
            else {
                var now = new Date(); //当前时间
                if (setDate === "1") {
                    now.setDate(now.getDate() - 1);
                }
                if (setDate === "2") {
                    now.setDate(now.getDate() - 7);
                }
                if (setDate === "3") {
                    now.setMonth(now.getMonth() - 1);
                }
                if (setDate === "4") {
                    now.setFullYear(now.getFullYear() - 1);
                }
                str_startTime = Date.parse(now) / 1000;
            }
        }
        else {
            //自定义时间
            str_startTime = Date.parse(log.setTime["start" + str_id]) / 1000;
            str_endTime = Date.parse(log.setTime["end" + str_id]) / 1000;
        }
        if (str_url.indexOf("$时间戳开始$") != -1) {
            return str_url.replace("$时间戳开始$", str_startTime)
                    .replace("$时间戳结束$", str_endTime);
        }
        else {
            return str_url.replace("$自定义开始时间$", log.setTime["start" + str_id].split(' ')[0])
                    .replace("$自定义结束时间$", log.setTime["end" + str_id].split(' ')[0]);
        }
    }
};

$(function () {
    var str_pageUrl = window.location.href;
    monitor.init(str_pageUrl);
    page.init();
});

