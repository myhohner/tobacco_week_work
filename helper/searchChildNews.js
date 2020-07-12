/// <reference path="pb.js" />

//查找相似转载
var childNews = {
    isReview: false,
    //存储已经加载的链接
    is2Week: function (date1, date2) {
        /// <summary>判断2个日期差是否在2周内</summary>
        var day = date1.getTime() - date2.getTime();
        day = Math.abs(day);

        day = Math.floor(day / (24 * 3600 * 1000));
        return day < 14;
    },
    init: function (str_pageUrl) {
        if (str_pageUrl.indexOf("searchNews.aspx") != -1) {
            _config.load(function () { });
            this.ui.init();
            this.so.init();
            this.review.init();
            this.group.init();

        }
    }

};
//标签对象
childNews.tag = {
    arr: {},
    add: function (obj) {
        /// <summary>添加标签</summary>
        var tags = obj.find("h3 em");
        tags.each(function () {
            var str_tag = $.trim($(this).text());
            if (str_tag) {
                if (!childNews.tag.arr.hasOwnProperty(str_tag)) {
                    childNews.tag.arr[str_tag] = 1;
                }
            }
        });

        return tags;
    }
};
//一些ui操作
childNews.ui = {
    tab: function () {
        /// <summary>点击选项卡</summary>
        $(document).on("click", ".tab_news .tt", function () {
            var obj = $(this);
            var obj_next = obj.next(".ttc");
            var obj_p = obj.closest(".tab_news");
            if (obj_next.css("display") === "none") {

                obj_p.find(".ttc").slideUp("normal");
                obj_p.find(".tt").css("cursor", "pointer");
                obj_p.find("i.fa-chevron-circle-stop").attr("class", "fa fa-chevron-circle-down");
                obj_next.slideDown("normal").css("border-bottom", "1px solid #e7e7e7");
                obj.css("cursor", "default").find("i.fa-chevron-circle-down").attr("class", "fa fa-chevron-circle-stop");
            }

        });
    }
    ,
    show: function () {
        /// <summary>点击展开筛选条件</summary>
        $("#setFilter a").click(function () {
            $("#filters").slideToggle("normal", function () {
                var str_src = "http://mice.meihua.info/images/wbsetup.png";
                if ($(this).css("display") === "none") {
                    str_src = "http://mice.meihua.info/images/wbset.png";
                }
                $("img.icon_open").attr("src", str_src);
            });
        });
    },
    ck_all: function () {
        $(document).on("click", ".groups .ck_all", function () {
            var obj_ck = $(this);
            obj_ck.closest(".groups").next().find(":checkbox[name='ck_news']").prop("checked", obj_ck.prop("checked"));
        });
    },
    init: function () {
        this.tab();
        this.show();
        this.ck_all();
    }
};
var _kw = "";
//整个搜索统筹对象
childNews.so = {
    get_panelId: function () {
        /// <summary>获取当前数据要存储到的容器id</summary>
        var panel_id = "#news";
        if (childNews.isReview) {
            panel_id = "#review_new";
        }
        return panel_id;
    },
    loading: function (str_msg) {
        if (document.getElementById("loading_news")) {
            $("#loading_news label").html(str_msg);
        }
        else {
            $("#btn_search").after('<div class="loading" id="loading_news"><img src="http://mice.meihua.info/images/ajax-loader-sm.gif"><label>' + str_msg + '</label></div>');
        }
    },
    count_sort: function () {
        /// <summary>按新闻组里的数据多少排序</summary>
        var arr = [];
        $("#news .groups").each(function () {
            var obj = $(this);
            var num_count = parseInt(obj.find("span.num_count").text());
            if (num_count === 0) {
                obj.next(".group").remove();
                obj.remove();
            }
            else {
                arr.push({ "id": obj.attr("id"), "count": num_count });
            }
        });
        var arr_new = sort_object(arr, "count", "desc");
        var prev_id = "";
        var ht = '', ht_item = '';
        for (var i = 0; i < arr_new.length; i++) {
            var cur_id = arr_new[i].id;
            var obj_cur = $("#" + cur_id);
            if (arr_new[i].count == 1) {
                ht_item += obj_cur.next(".group").find("ul").html();
            }
            else {
                ht += obj_cur.prop("outerHTML") + obj_cur.next(".group").prop("outerHTML");
            }
        }
        if (ht_item != "") {
            ht += '<div  class="groups" id="itemNogroup"><a class="c_show"><i class="fa fa-plus-square-o"></i></a><input type="checkbox" class="ck_all"><label>未归组的新闻</label>&nbsp;&nbsp;（<span class="num_count"></span>）<a class="btn_delGroup">删除此组</a></div>';
            ht += '<div class="group"><ul id="ul_Nogroup" class="newList">';
            ht += ht_item;
            ht += '</ul></div>';
        }
        $("#news").empty().html(ht);
        this.reset_idx();
    },
    has_domain: function (panel_id) {
        /// <summary>结束检查，是否有域名重复的新闻,有的话删掉，并整理到底下域名重复栏里</summary>
        var obj = {};
        var obj_source = $("#" + panel_id + " span.source");
        obj_source.each(function () {
            var key = $.trim($(this).text());
            if (obj.hasOwnProperty(key)) {
                obj[key] = parseInt(obj[key]) + 1;
            }
            else {
                obj[key] = 1;
            }
        });
        var hts = '';
        var str_PrevTitle = "";
        for (key in obj) {
            if (obj[key] > 1) {
                var arr_obj = [];
                var ht = '';
                var ht_wrap = '<div  class="groups"><a class="c_show"><i class="fa fa-plus-square-o"></i></a><input type="checkbox" class="ck_all"><label>' + key + '</label>&nbsp;&nbsp;（<span class="num_count">4</span>）</div>';
                ht_wrap += '<div class="group"><ul class="newList">';
                obj_source.each(function () {
                    var str = $.trim($(this).text());
                    if (str === key) {
                        var obj_li = $(this).closest('li');
                        if (key.indexOf("weixin.qq.") == -1) {
                            var str_curTitle = $.trim(obj_li.find("h3 a").text());
                            if (str_curTitle === str_PrevTitle) {
                                obj_li.attr("class", "li_del");
                            }
                            else {
                                arr_obj.push(obj_li);
                                ht += obj_li.prop("outerHTML");
                            }
                            str_PrevTitle = str_curTitle;
                        }
                        else {
                            //微信特殊处理
                            obj_li.attr("class", "li_del");
                            ht += obj_li.prop("outerHTML");
                        }
                    }
                });
                if (ht.split('activeName').length > 2) {
                    ht_wrap += ht;
                    for (var i = 0; i < arr_obj.length; i++) {
                        arr_obj[i].attr("class", "li_del");
                    }
                    ht_wrap += '</ul></div>';
                    hts += ht_wrap;
                }
            }
        }
        $("#domain_new").append(hts);
        var obj_del = $("#news li.li_del,#review_new li.li_del");
        childNews.so.has_count += obj_del.size();
        obj_del.remove();
        this.reset_idx();
    },
    //重复的新闻数量
    has_count: 0,
    get_allCount: function (panel_id) {
        /// <summary>获取一个集合的总数量</summary>
        var num_count = parseInt($("#" + panel_id + " h3.title").size());
        if (num_count > 0) {
            $("#" + panel_id).prev(".tt").find("span.num_count").css("display", "inline-block").text("（" + num_count + "）");
        }
    },
    reset_idx: function () {
        /// <summary>重新整理新闻编号以及组里的新闻数量</summary>
        $("#left_news .group").each(function () {
            $(this).find("li").each(function (idx) {
                $(this).find("span.span_idx").text((idx + 1).toString() + "、");
            });

        });
        $("#left_news .groups").each(function (idx) {
            var obj = $(this);
            obj.find("span.num_count").text(obj.next(".group").find("li").size());
        });
        this.get_allCount("news");
        this.get_allCount("domain_new");
        this.get_allCount("review_new");
    },
    status: function (num_p, is360, isSuc) {
        /// <summary>显示查询数据的状态</summary>
        var str_page = '', str_msg = '';
        if (isSuc) {
            str_page = "搜索完成";
            $("#loading_news").find("img").remove();
            str_msg = '搜索完成，' + $("#loading_news").find("label").html();
            //创建怀疑无关的数据
            childNews.no.create();
            if (!childNews.isReview) {
                this.has_domain("news");
                this.count_sort();
            }
            else {
                this.has_domain("review_new");
            }
            if (!childNews.isReview) {
                childNews.yes.titles = {};
            }
        }
        else {
            str_page = "查询360第" + num_p + "页…";
            if (!is360) {
                str_page = "查询百度第" + num_p + "页…";
            }
            //计算已检索出的数据条数
            var num_dataCount = $("h3.title").size();
            //重复的数据条数
            str_msg = '已检索' + (num_dataCount + childNews.so.has_count) + '条数据';
            str_msg += '，其中符合条件的数据' + $("#news h3.title").size() + '条（左侧）、过滤掉疑似无关的数据' + $("#noAddNews h3.title").size() + '条（右侧）。';
            if (childNews.so.has_count > 0) {
                str_msg += '另有' + childNews.so.has_count + '条数据出现重复，已被过滤。';
            }
            $("#group_error label").text('排除掉的疑似无关新闻（' + $("#div_errors h3.title").size() + '）');
            $("#group_error2 label").text('标题未命中任何搜索词的新闻（' + $("#div_errors2 h3.title").size() + '）');
        }
        document.title = str_page;
        childNews.so.loading(str_msg);
    },
    //已存在的新闻链接
    urls: "",
    obj_source: {},
    has_url: function (str_link, isBaidu) {
        /// <summary>判断链接是否已经存在</summary>
        if (!str_link) {
            return true;
        }
        str_link = $.trim(str_link).toLowerCase().replace("http://", "").replace("https://", "").replace("www.", "");
        if (isBaidu) {
            if (childNews.so.urls.indexOf(str_link) != -1) {
                //判断链接是否重复
                return true;
            }
        }
        else {
            var arr = childNews.so.urls.split('|');
            for (var i = 0; i < arr.length; i++) {
                if (!(arr[i] && $.trim(arr[i]) != "")) {
                    continue;
                }
                if (str_link.indexOf(arr[i]) != -1) {
                    return true;
                }
            }
        }
        childNews.so.urls += "|" + str_link;
        return false;
    },
    clear: function (isClearHtml) {
        /// <summary>搜索之前还原一切临时变量</summary>
        childNews.so360.clear(isClearHtml);
        childNews.baidu.clear(isClearHtml);
        this.startBaidu = false;
        this.endBaidu = true;
    },
    start: function () {
        /// <summary>点击开始搜索</summary>
        $("#btn_search").click(function () {
            childNews.so.clear(true);
            var obj_btn = $(this);
            var str_text = $.trim($("#txt_Search").val());
            if (str_text == "") {
                alert("请先填写新闻标题！");
                return false;
            }
            _kw = pub.trim(str_text);
            childNews.so360.search(str_text);
            childNews.so.loading('正在检索数据…');
            obj_btn.css("display", "none");
        });
    },
    suc_360: function (obj_dom) {
        /// <summary>360完成一页搜索</summary>
        childNews.so360.getPageCount(obj_dom);
        childNews.so360.p++;

        if (childNews.yes.arr.length == 0) {
            childNews.so360.empty++;
            var num_max = 3;
            if (childNews.isReview) {
                num_max = 15;
            }
            if (childNews.so360.empty > num_max) {
                childNews.so360.isNext = false;
            }
        }
        else if (!childNews.isReview) {
            childNews.so360.empty = 0;
        }
    },
    suc_baidu: function () {
        /// <summary>百度完成一页搜索</summary>

        childNews.baidu.p++;

        if (childNews.yes.arr.length == 0) {
            childNews.baidu.empty++;
            if (childNews.baidu.empty > 2) {
                childNews.baidu.isNext = false;
            }
        }
        else {
            childNews.baidu.empty = 0;
        }
    },
    suc: function (suc, dom) {
        /// <summary>搜索成功后的回调函数</summary>
        var obj_dom = $(suc.html);
        var arr_q = dom.list.split('或');
        for (var i = 0; i < arr_q.length; i++) {
            if (arr_q[i] && pub.trim(arr_q[i]) != "") {
                var _datas = obj_dom.find(arr_q[i]);

                _datas.each(function () {
                    //循环封装对象并将新闻归类
                    childNews.so.group(this, suc, dom);
                });
            }
        }

        if (this.startBaidu) {
            this.suc_baidu();
        }
        else {
            this.suc_360(obj_dom);
        }
        //生成左侧符合条件的新闻
        childNews.yes.create(suc.kw);
        childNews.so.next(suc.kw);
    },
    hasTitle: function (title) {
        /// <summary>检查标题是否完全包含搜索词，怕过滤错了</summary>
        var text = $("<div>" + title + "</div>").text();
        console.log(text + "O(∩_∩)O哈哈~" + _kw);
        return pub.trim(text).indexOf(_kw) != -1;
    },
    group: function (t, suc, dom) {
        /// <summary>将新闻好、坏分组</summary>
        /// <param name="dom" type="Object">配置在v.html里的dom结构</param>
        var $obj = $(t);
        //生成单个新闻对象
        var obj = childNews.so.obj($obj, suc.url, dom);
        if (!obj) {
            //新闻发生重复
            return true;
        }
        if (childNews.yes.isOK(suc.kw, obj, $obj)) {
            //符合条件的新闻
            childNews.yes.arr.push(obj);
        }
        else {
            //不满足条件，被过滤放到右侧的新闻
            if (obj.title) {
                if (obj.title.indexOf("<em>") != -1) {
                    childNews.no.arr.push(obj);
                }
                else {
                    //标题未命中任何搜索词的新闻
                    childNews.no.arr2.push(obj);
                }
            }

        }
    },
    obj: function ($obj, str_link, dom) {
        /// <summary>生成单个新闻对象</summary>
        /// <param name="dom" type="Object">配置在v.html里的dom结构</param>
        var obj = {};
        //链接
        var isBaidu = str_link.indexOf('www.baidu.com') != -1;
        var str_link = pub.dom.get($obj, dom.url, false);
        //标题
        var str_tt = pub.dom.get($obj, dom.title, false);
        obj.title = str_tt;
        obj.url = str_link;
        obj.summary = pub.dom.get($obj, dom.summary, false);
        obj.time = pub.dom.get($obj, dom.time, false);
        if (dom.url.indexOf("data-mdurl") == -1 && obj.time.indexOf(" ") != -1) {
            var arrTime = obj.time.split(' ');
            if (obj.time.indexOf("年") != -1) {
                obj.time = $.trim(arrTime[arrTime.length - 2]) + " " + $.trim(arrTime[arrTime.length - 1]);
            }
            else {
                obj.time = $.trim(arrTime[arrTime.length - 1]);
            }
        }
        var str_source = "", str_hasUrl = '';
        if (str_link.indexOf('www.baidu.com') != -1) {
            obj.sourceUrl = $.trim(pub.dom.get($obj, dom.source, false));
            str_hasUrl = obj.sourceUrl;
            if (str_hasUrl.indexOf("..") != -1) {
                str_hasUrl = str_hasUrl.split("..")[0];
            }
            str_source = pub.getDomain(obj.sourceUrl);
            obj.source = '<a href="' + str_link + '" target="_blank">百度搜索</a>';
        }
        else {
            str_source = pub.getDomain(obj.url);
            str_hasUrl = obj.url;
            obj.sourceUrl = "";
            if (isBaidu) {
                obj.source = '<a href="' + str_link + '" target="_blank">百度搜索</a>';
            }
            else {
                obj.source = '<a href="' + str_link + '" target="_blank">360搜索</a>';
            }
        }
        if (childNews.so.has_url(str_hasUrl, isBaidu)) {
            childNews.so.has_count++;
            //链接出现重复
            return false;
        }
        obj.author = str_source;
        return obj;
    },
    startBaidu: false,
    endBaidu: true,
    next: function (keyWord) {
        /// <summary>翻下一页</summary>
        childNews.title.reg();
        if (childNews.isReview) {

            childNews.review.loading();
        }
        if (!this.startBaidu) {
            var pagerIsEnd = childNews.so360.p > childNews.so360.pc;
            if (childNews.so360.isNext) {
                childNews.so360.search(keyWord);
            }
            if (!childNews.so360.isNext || pagerIsEnd) {
                //查询结束后，如果是复查操作，则查询是否还有词汇需要复查
                this.startBaidu = true;
                if (this.endBaidu) {
                    childNews.baidu.search(keyWord);
                }
            }
        }
        else {

            var pagerIsEnd = childNews.baidu.p > 4;
            if (childNews.baidu.isNext) {
                childNews.baidu.search(keyWord);
            }
            if (!childNews.baidu.isNext || pagerIsEnd) {
                //查询结束后，如果是复查操作，则查询是否还有词汇需要复查

                this.startBaidu = false;
                this.endBaidu = false;
                if (childNews.isReview) {
                    setTimeout(function () {
                        childNews.review.isContinue();
                    }, 4000);
                    this.endBaidu = true;
                }

                childNews.review.create();
            }
            //验证一下群组标题是否给对了

        }
    },
    init: function () {
        this.start();
    }
};
//搜索360对象
childNews.so360 = {
    clear: function (isClearHtml) {
        /// <summary>清除存储状态的变量</summary>
        this.empty = 0;
        this.isNext = true;
        this.p = 1;
        this.pc = 0;
    },
    str_error: "",
    //是否继续翻页
    isNext: true,
    //当前页面一条数据都未获取到就累加1，到5时就停止往下翻页获取数据，说明后面的数据没意义了
    empty: 0,
    //翻页的页码
    p: 1,
    pc: 0,
    search: function (keyWord) {
        /// <summary>360搜索</summary>
        var obj_json = {};
        var config_json = dataConfig["360_html"];
        obj_json.url = config_json["sourl"].replace("页码", this.p).replace("关键词", keyWord.replace(/#/g, ""));
        if ($("#sls_time").val() != "") {
            obj_json.url += '&adv_t=' + $("#sls_time").val();
        }
        childNews.so.status(this.p, true, false);
        obj_json.kw = keyWord;
        var num_time = 2000;
        if (this.p % 2 == 0) {
            num_time = 3000;
        }
        if (this.p % 6 == 0) {
            num_time = 5000;
        }
        if (this.p == 1) {
            num_time = 500;
        }
        setTimeout(function () {
            console.log(obj_json.url);
            host.ajax({ "host": "ajax请求", "url": obj_json.url }, function (res) {
                var json_suc = { "html": res.html, "url": obj_json.url, "kw": obj_json.kw };
                childNews.so.suc(json_suc, config_json);
            });
        }, num_time);
    },
    getPageCount: function (obj_dom) {
        /// <summary>查询新闻的页数</summary>
        if (this.pc === 0) {
            var obj_pager = obj_dom.find("#page .nums");
            if (obj_pager.size() > 0 && !this.pc) {
                var num_p = pub.getNumber(obj_pager.text());
                if (num_p) {
                    if (num_p % 10 != 0) {
                        this.pc = parseInt((num_p / 10)) + 1;
                    }
                    else {
                        this.pc = num_p / 10;
                    }
                }
            }
            if (this.pc === 0) {
                this.pc = 30;
            }
        }
    }
};

//搜索百度对象
childNews.baidu = {
    clear: function (isClearHtml) {
        /// <summary>清除存储状态的变量</summary>
        this.empty = 0;
        this.isNext = true;
        this.p = 1;
    },
    str_error: "",
    //是否继续翻页
    isNext: true,
    //当前页面一条数据都未获取到就累加1，到5时就停止往下翻页获取数据，说明后面的数据没意义了
    empty: 0,
    //翻页的页码
    p: 1,
    pc: 5,
    time: function (str_url) {
        var str_endTime = "", str_startTime = "";
        var setDate = $("#sls_time").val();
        if (setDate != "") {
            var now = new Date(); //当前时间

            //结束日期就是当天
            str_endTime = Date.parse(new Date()) / 1000
            if (setDate === "d") {
                now.setDate(now.getDate() - 2);
            }
            if (setDate === "w") {
                now.setDate(now.getDate() - 7);
            }
            if (setDate === "m") {
                now.setMonth(now.getMonth() - 1);
            }
            if (setDate === "3m") {
                now.setMonth(now.getMonth() - 3);
            }
            if (setDate === "y") {
                now.setFullYear(now.getFullYear() - 1);
            }
            str_startTime = Date.parse(now) / 1000;
        }
        return str_url = str_url.replace("$时间戳开始$", str_startTime).replace("$时间戳结束$", str_endTime);
    },
    search: function (keyWord) {
        /// <summary>360搜索</summary>
        var obj_json = {};
        var config_json = dataConfig["baidu_html"];

        obj_json.url = config_json["sourl"].replace("页码", (this.p - 1) * 50).replace("关键词", keyWord.replace(/#/g, ""));
        obj_json.url = this.time(obj_json.url);
        if ($("#sls_time").val() != "") {
            obj_json.url += '&adv_t=' + $("#sls_time").val();
        }
        obj_json.url += "&tn=news";
        childNews.so.status(this.p, false, false);
        obj_json.kw = keyWord;
        var num_time = 3000;
        if (this.p % 2 == 0) {
            num_time = 6000;
        }
        if (this.p == 1) {
            num_time = 5000;
        }

        setTimeout(function () {
            console.log(obj_json.url);
            host.ajax({ "host": "ajax请求", "url": obj_json.url }, function (res) {
                var json_suc = { "html": res.html, "url": obj_json.url, "kw": obj_json.kw };
                childNews.so.suc(json_suc, config_json);
            });
        }, num_time);
    }
};
//复查操作对象
childNews.review = {
    count: 0,
    click_start: function () {
        /// <summary>点击开始复查</summary>
        $(document).on("click", "#btn_review", function () {
            if ($("#ul_review :checkbox:checked").size() == 0) {
                alert("请先勾选需要复查的标题。");
            }
            else {
                childNews.isReview = true;
                childNews.review.start();
            }
        });
    },
    start: function () {
        /// <summary>进行复查</summary>
        this.count = $("#review_new h3.title").size();
        var obj_ck = $("#ul_review :checkbox:checked").eq(0);
        var p_obj = obj_ck.closest("li");
        p_obj.attr("class", "loading").append('<div class="reviewing">正在复查…</div>');
        childNews.so.clear(false);
        childNews.so360.search($.trim(obj_ck.val()));
    },
    loading: function () {
        var cur_count = parseInt($("#review_new h3.title").size()) - this.count;
        if (cur_count > 0) {
            $(".reviewing").text("复查已补充了" + cur_count + "条新闻（未去重前的）")
        }
    },
    isContinue: function () {
        /// <summary>判断是否还有需要复查的词汇，有的话，继续查询</summary>
        var cur_count = parseInt($("#review_new h3.title").size()) - this.count;
        if (cur_count < 0) {
            cur_count = 0;
        }
        $(".reviewing").text("复查补充了" + cur_count + "条新闻").closest("li").find(":checkbox").prop("checked", false);
        $(".reviewing").attr("class", "ok");
        if ($("#ul_review :checkbox:checked").size() > 0) {
            this.start();
        }
    },
    isAdd: function (str_text) {
        /// <summary>判断要累加的可供复查的标题是否已经存在</summary>
        if (!str_text) {
            return false;
        }
        var isOk = true;
        $("#ul_review li label").each(function () {
            var str_label = $.trim($(this).text());
            if (str_text === str_label) {
                isOk = false;
                return false;
            }
        });
        return isOk;
    },
    create: function () {
        /// <summary>生成供调研员选择重复查询转载子新闻的关键词</summary>
        var ht = '';
        var panel_id = childNews.so.get_panelId();

        $(panel_id + " .groups").each(function () {
            try {
                var obj = $(this);
                var str_val = obj.find("label").text();
                if (obj.find("label").html().indexOf('<em>') == -1) {
                    //未带标签的不要
                    return true;
                }
                if (str_val != "" && str_val.indexOf('（') != -1) {
                    str_val = str_val.split('（')[0];
                }
                str_val = $.trim(str_val);
                if (!childNews.review.isAdd(str_val)) {
                    return true;
                }
                var obj_clone = obj.clone();
                obj_clone.find("a.c_show,.ck_all").remove();
                ht += '<li class="li_review"><input type="checkbox" value="' + str_val + '" />' + obj_clone.html() + '</li>';
            }
            catch (ex) {
                console.log(ex);
            }
        });
        if (ht != "") {
            $("#li_review").remove();
            ht += '<li id="li_review"><input type="button" value="点击用勾选标题复查补漏" id="btn_review" /></li>';
        }
        $("#ul_review").append(ht);
        childNews.so.status(0, false, true);
    },
    init: function () {
        this.click_start();
    }
};
//要被收录的新闻对象
childNews.yes = {
    count: 0,
    //存储满足条件的新闻
    arr: [],
    sysIsOk: function (tags) {
        /// <summary>系统判定逻辑(先删掉标签中文字相同的,如果命中了一个标签，那字数必须大于7;否则必须每个标签至少4个字，并且还要命中两个标签)</summary>

        //含标签就显示
        var wordIsMax7 = false;
        var tag_count = 0;
        var arr_tags = [], arr_ok = [];
        tags.each(function () {
            var str_curTag = pub.trim($(this).text());
            arr_tags.push(str_curTag);
        });
        tags.each(function (idx) {
            var str_curTag = $.trim($(this).text());
            for (var i = 0; i < arr_tags.length; i++) {
                if (i != idx) {
                    str_curTag = str_curTag.replace(arr_tags[i], "");
                }
            }
            var num_size = str_curTag.length;
            if (num_size > 3) {
                tag_count++;
            }
            if (num_size > 7) {
                wordIsMax7 = true;
            }
        });

        //至少命中两个词或者一个命中的词要大于5个词
        return tag_count > 1 || wordIsMax7;
    },
    filter: function (str_title, str_filter) {
        /// <summary>调研员设置了过滤条件</summary>
        /// <param name="str_title" type="String">新闻标题</param>
        /// <param name="str_filter" type="String">调研员设置的过滤词组</param>
        str_filter = str_filter.toLowerCase();
        var arr_filter = str_filter.split('|');
        for (var i = 0; i < arr_filter.length; i++) {
            var str_tag = $.trim(arr_filter[i]);
            if (str_tag != "" && str_title.toLowerCase().indexOf(str_tag) == -1) {
                return false;
            }
        }
        return true;
    },
    filter_time: function (str_time) {
        /// <summary>过滤日期</summary>
        try {
            var setDate = $("#sls_time").val();
            if (!setDate) {
                //不限制时间
                return false;

            }
            if (str_time.indexOf("：") != -1) {
                str_time = str_time.split('：')[1];
            }
            var newsDate = false;
            try {
                newsDate = pub.time.parse(str_time);
            }
            catch (ex) {
                _error.log(ex, "日期字符串转换错误" + str_time);
                return false;
            }
            var curDate = new Date(); //当前时间
            var day = curDate.getTime() - newsDate.getTime();
            var num_h = Math.floor(day / (3600 * 1000));
            day = Math.floor(day / (24 * 3600 * 1000));

            if (setDate === "d" && num_h < 48) {
                return false;
            }
            if (setDate === "w" && day < 8) {
                return false;
            }
            if (setDate === "m" && day < 31) {
                return false;
            }
            if (setDate === "3m" && day < 90) {
                return false;
            }
            if (setDate === "y" && day < 365) {
                return false;
            }
            return true;
        }
        catch (ex) {
            return false;
        }
    },
    reset: function () {
        /// <summary>还原变量</summary>
        this.arr = [];
    },
    isOK: function (keyWord, obj, $obj) {
        /// <summary>判断新闻是否应该收录 </summary>
        var str_title = obj.title;
        //em标签
        var tags = childNews.tag.add($obj);
        if (pub.isRubbishWeb(str_title)) {
            //是垃圾站点
            return false;
        }
        if (pub.isRubbishUrl(obj.url, obj.sourceUrl)) {
            //是垃圾站点
            return false;
        }
        if (this.filter_time(obj.time)) {
            return false;
        }
        var str_filter = $.trim($("#txt_filter").val());
        if (str_filter != "") {
            //调研员自己设置了过滤条件
            return this.filter(str_title, str_filter);
        }
        else {
            /**平台自己的判定收录方法**/
            return this.sysIsOk(tags);
        }
    },
    //群组的标题列表
    titles: {},
    //群组列表的编号
    idx: 0,
    html: function (obj, idx) {
        /// <summary>获取单条新闻的html</summary>
        var ht = '';
        ht += '<li t="' + obj.title2 + '">';
        ht += '<h3 class="title"><input type="checkbox" name="ck_news" /><span class="span_idx">' + idx + '、</span><a href="' + obj.url + '" target="_blank">' + obj.title + '</a></h3>';
        ht += '<div class="c-author">';
        ht += '<span class="source">' + obj.author + '</span>';
        ht += '<span class="time">' + obj.time + '</span>';
        ht += '<span class="activeName">' + obj.source + '</span></div>';
        ht += '<div class="sm">' + obj.summary + '</div>';
        var str_text = obj.url;
        if (str_text.indexOf("www.baidu.com") != -1) {
            str_text = obj.sourceUrl;
        }
        ht += '<div class="sm_link">链接：<a href="' + obj.url + '" target="_blank">' + str_text + '</a></div>';
        ht += '</li>';
        return ht;
    },
    create: function (keyWord) {
        /// <summary>生成左侧满足条件的新闻列表</summary>
        var objs = this.arr;
        if (objs && objs.length > 0) {
            objs = this.title(objs);
            //创建群组html
            this.group(objs, childNews.so.get_panelId());
        }
        this.reset();
    },
    title: function (objs) {
        /// <summary>归类可作为群组的标题列表</summary>
        var str_id = "item";
        if (childNews.isReview) {
            str_id = "itemR";
        }
        for (var i = 0; i < objs.length; i++) {
            var str_title = pub.title.get(objs[i].title);
            objs[i].title2 = str_title;

            if (!this.titles.hasOwnProperty(str_title)) {
                this.titles[str_title] = str_id + this.idx++;
            }
        }
        return objs;
    },
    group: function (objs, panel_id) {
        /// <summary>按相同标题分组，不行则按标签相同的把新闻分组</summary>
        for (var i = 0; i < objs.length; i++) {
            try {
                var obj = objs[i];
                //用系统筛选的标题到内存中查找看是否有符合条件的群组存在
                var str_id = this.titles[obj.title2];

                var pobj = $("#" + str_id);
                if (pobj.size() == 0) {
                    //按标题一模一样的，没有匹配到群组，只能按标签一样的匹配了
                    var tags = [];
                    $("<div>" + obj.title + "</div>").find("em").each(function () {
                        tags.push($(this).text());
                    });
                    //用|拼接标签，然后去找寻是否有这个拼接标签的群组存在
                    var str_tags = tags.join('|');
                    var str_sid = childNews.group.tagsFind(str_tags);
                    if (str_sid) {
                        str_id = str_sid;
                    }
                    else {
                        //创建新群组
                        $(panel_id).append(childNews.group.html(obj.title2, str_id, str_tags));
                    }
                }
                var obj_ul = $("#ul_" + str_id);
                var idx = obj_ul.find("li").size() + 1;
                //获取要的新闻内容，并放入匹配到的群组里
                obj_ul.append(this.html(obj, idx));
                childNews.group.count(panel_id);
            }
            catch (ex) {
                conosle.log(ex);
            }
        }
    }
};
//疑似无关新闻对象
childNews.no = {
    arr: [],
    arr2: [],
    reset: function () {
        /// <summary>还原变量</summary>
        this.arr = [];
        this.arr2 = [];
        this.arr_groups = {};
    },
    arr_titleGroups: {},
    create: function () {
        /// <summary>生成右侧疑似无关新闻的列表</summary>
        var objs = this.arr;
        if (objs && objs.length > 0) {
            //创建群组html
            this.group(objs, "#div_errors");
        }
        this.lastGroup();
    },
    group: function (objs, panel_id) {
        /// <summary>按相同标题分组</summary>
        for (var i = 0; i < objs.length; i++) {
            var obj = objs[i];
            //获取不含网站名称、干净真实的新闻标题
            var clearTitle = pub.title.get(obj.title);
            if (!this.arr_titleGroups.hasOwnProperty(clearTitle)) {
                this.arr_titleGroups[clearTitle] = [];
            }
            this.arr_titleGroups[clearTitle].push(obj);
        }
    },
    lastGroup: function () {
        /// <summary>最后分组呈现</summary>
        var arr_order = [];
        for (key in this.arr_titleGroups) {
            var _obj = this.arr_titleGroups[key];
            arr_order.push({ "count": _obj.length, "title": key, "list": _obj });
        }
        var list = sort_object(arr_order, "count", "desc");
        var fc = 0;
        var dataCount = 0;
        for (var i = 0; i < list.length; i++) {
            var _obj = list[i];
            fc++;
            dataCount += _obj.count;
            if (_obj.count > 1) {
                var str_id = "group_error" + fc;
                //群组的html
                var str_groupHtml = this.groupHtml(str_id, _obj.title, _obj.count);
                var html_child = this.childHtml(_obj.list);
                str_groupHtml = str_groupHtml.replace("#childs#", html_child);
                $("#div_errors").append(str_groupHtml);
            }
            else {
                var obj = _obj.list[0];
                var html = '<h3 class="title" style="padding-left:13px;font-weight:normal;font-size:12px;"><input type="checkbox" name="ck_news" /><a href="' + obj.url + '">' + obj.title + '</a>（' + obj.time + '）</h3>';
                $("#div_errors").append(html);
            }
        }
        $("#group_error label").html("排除掉的疑似无关新闻（" + dataCount + "）");
    },
    childHtml: function (list) {
        /// <summary>获取子新闻的html结构</summary>
        var html_child = "";
        for (var i = 0; i < list.length; i++) {
            html_child += this.html(list[i]);
        }
        return html_child;
    },
    html: function (obj) {
        /// <summary>获取单条新闻的html</summary>
        var ht = '';
        ht += '<li>';
        ht += '<h3 class="title"><input type="checkbox" name="ck_news" /><a href="' + obj.url + '" target="_blank">' + obj.title + '</a></h3>';
        ht += '<div class="c-author">';
        ht += '<span class="source">' + obj.author + '</span>';
        ht += '<span class="time">' + obj.time + '</span>';
        ht += '<span class="activeName">' + obj.source + '</span></div>';
        ht += '<div class="sm">' + obj.summary + '</div>';
        var str_text = obj.url;
        if (str_text.indexOf("www.baidu.com") != -1) {
            str_text = obj.sourceUrl;
        }
        ht += '<div class="sm_link">链接：<a href="' + obj.url + '" target="_blank">' + str_text + '</a></div>';
        ht += '</li>';
        return ht;
    },
    groupHtml: function (str_id, str_title, count) {
        /// <summary>获取群组的html</summary>
        /// <param name="str_id" type="String">要生成的群组id</param>
        /// <param name="str_title" type="String">归纳出的新闻标题</param>
        /// <param name="count" type="Int">群组里的新闻条数</param>
        var ht = '<div class="groups" id="' + str_id + '"><a class="c_show"><i class="fa fa-plus-square-o"></i></a><input type="checkbox" class="ck_all" /><label>' + str_title + '</label>&nbsp;&nbsp;（<span>' + count + '</span>）<a class="btn_delGroup">删除此组</a></div>';
        ht += '<div class="group"><ul id="ul_' + str_id + '" class="newList">#childs#</ul></div>';
        return ht;
    }
};
//标题处理对象
childNews.title = {
    reg: function () {
        /// <summary>验证分组的标题是否取正确了</summary>
        var panel_id = childNews.so.get_panelId();
        $(panel_id + " ul.newList").each(function () {
            var arr = {};
            var obj_group = $(this);
            if (obj_group.attr("id") === "ul_Nogroup") {
                return true;
            }
            //统计一个组里面标题出现的次数，用最多的作为标题
            obj_group.find("li").each(function () {
                var str_tt = $.trim($(this).attr("t"));
                if (!arr.hasOwnProperty(str_tt)) {
                    arr[str_tt] = 1;
                }
                else {
                    arr[str_tt] = parseInt(arr[str_tt]) + 1;
                }
            });
            var str_groupTitle = "";
            var dc = 0;

            for (var key in arr) {
                if (arr[key] > dc) {
                    dc = arr[key];
                    str_groupTitle = key;
                }
            }

            if (str_groupTitle != "") {
                var arr_em = [];
                var obj_label = obj_group.closest(".group").prev(".groups").find("label");
                obj_label.find("em").each(function () {
                    arr_em.push($(this).text());
                });
                for (var i = 0; i < arr_em.length; i++) {
                    str_groupTitle = str_groupTitle.replace(arr_em[i], "<em>" + arr_em[i] + "</em>")
                }
                obj_label.html(str_groupTitle);
            }
        });
    }
};
childNews.group = {
    del: function (event) {
        /// <summary>让调研员自己可以删除指定的群组</summary>
        $(document).on("click", "a.btn_delGroup", function (event) {
            var obj_group = $(this).closest(".groups");
            var str_msg = "将删除“" + obj_group.text() + "”群组里的所有新闻，是否继续？";
            if (confirm(str_msg)) {
                obj_group.next(".group").remove();
                obj_group.remove();
            }
            event.stopPropagation();
        });
    },
    show: function () {
        /// <summary>点击展开群组</summary>
        $(document).on("click", "a.c_show", function () {
            var obj = $(this).closest(".groups");
            obj.next().slideToggle("normal", function () {
                var str_css = "fa fa-plus-square-o";
                var obj_icon = obj.find("a.c_show i");
                if (obj_icon.attr("class").indexOf("fa-plus") != -1) {
                    str_css = "fa fa-minus-square-o";
                }
                obj_icon.attr("class", str_css);
            });
        });
    },
    html: function (str_title, str_id, str_tags) {
        /// <summary>生成分组的html</summary>
        /// <param name="str_title" type="String">分组的标题</param>
        var ht = '<div ';
        if (str_tags) {
            ht += ' tags="' + str_tags + '"';
        }
        ht += ' class="groups" id="' + str_id + '"><a class="c_show"><i class="fa fa-plus-square-o"></i></a><input type="checkbox" class="ck_all" /><label>' + str_title + '</label>&nbsp;&nbsp;（<span class="num_count">0</span>）<a class="btn_delGroup">删除此组</a></div>';
        ht += '<div class="group"><ul id="ul_' + str_id + '" class="newList"></ul></div>';
        return ht;
    },
    count: function (panel_id) {
        /// <summary>修改分组里的新闻数量</summary>
        $(panel_id + " .group").each(function () {
            var obj_group = $(this);
            var obj_prev = obj_group.prev();
            obj_prev.find("span").text(obj_group.find("li").size());
            if (obj_prev.find("em").size() == 0) {
                var str_title = obj_prev.find("label").text();
                obj_group.find("li:eq(0)").find(".title em").each(function () {

                    str_title = str_title.replace($(this).text(), "<em>" + $(this).text() + "</em>");
                });

                obj_prev.find("label").html(str_title);
            }
        });
    },
    tagsFind: function (str_tags) {
        /// <summary>因为按标题没有匹配到群组，只能按标签去匹配群组</summary>
        var str_id = "";
        var panel_id = childNews.so.get_panelId();
        $(panel_id + " .groups").each(function () {
            var obj = $(this);
            if (obj.attr("tags") === str_tags) {
                str_id = obj.attr("id");
                return false;
            }
        });
        return str_id;
    },
    init: function () {
        this.show();
        this.del();
    }
}
$(function () {
    var str_pageUrl = window.location.href;
    childNews.init(str_pageUrl);
    $("#installTip2").remove();
    $("#s_c").css("display", "block");
});