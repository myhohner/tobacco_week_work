/// <reference path="pb.js" />

var t_weiboUrl = "", obj_timer;
var weibo = {
    isLogin: function (str_html) {
        /// <summary>判断登录的微博账号是否出现异常，需要切换账号重新登录</summary>
        if (str_html.indexOf("登录成功后保存任意页面为书签") != -1 || str_html.indexOf("解除帐号异常") != -1 || str_html.indexOf("sudaref=") != -1) {
            return true;
        }
        return false;
    },
    login: function (str_pageUrl) {
        /// <summary>微博模拟登录</summary>
        if (str_pageUrl.indexOf("#weibologin") != -1) {

            _config.load(function () {
                //微博模拟登录页面
                var str_user = "", str_pwd = "", num_random = dataWeibo.length;
                //购买的微博数量
                var userCount = dataWeibo.length - 1;
                while (num_random > userCount) {
                    num_random = pub.random(0, userCount);
                }
                str_user = dataWeibo[num_random];
                if (str_user.indexOf('|') == -1) {
                    str_pwd = "aaa333";
                }
                else {
                    str_pwd = str_user.split('|')[1];
                    str_user = str_user.split('|')[0];

                }
                $("#loginName").val(str_user);
                $("#loginPassword").val(str_pwd);
                $("#loginAction")[0].click();
            });
        }

    },
    add: function () {
        /// <summary>单条添加微博</summary>
        //微博单条解析
        $("#link_jx").click(function () {
            var str_weiboUrl = $.trim($("#txt_weiboUrl").val());
            if (str_weiboUrl == "") {
                alert("请先填写要解析的微博地址！");
                return;
            }
            var link_obj = $(this);
            link_obj.text("解析中…");
            chrome.extension.sendRequest(
            { "host": ajax_type.weibo, "url": str_weiboUrl }, function (res) {
                link_obj.text("分析中…");
                var str_ht = '<div class=\"WB_feed ' + res.html.split('WB_feed ')[1].split('"}')[0];
                str_ht = str_ht.replace(/\\n/g, "").replace(/\\/g, "");
                var obj_weibo = $(str_ht);
                var str_text = $.trim(obj_weibo.find(".WB_text").text());
                //标题
                var str_t = weibo.getTitle(str_text);
                //昵称
                $("#txt_nic .TextBox:eq(0)").val(obj_weibo.find(".WB_info a:eq(0)").text());
                $("#txt_tt .TextBox").val(str_t);
                //转发量
                $("#div_zf .TextBox:eq(0)").val(obj_weibo.find(".ficon_forward").next().text());
                //评论量
                $("#div_zf .TextBox:eq(1)").val(obj_weibo.find(".ficon_repeat").next().text());
                //正文
                $("#div_text .TextBox").val(str_text);
                link_obj.text("查粉丝…");

                weibo.get(obj_weibo.find(".WB_cardwrap").attr("tbinfo").replace("ouid=", ""));

            });
        });

    },
    get: function (userId) {
        /// <summary>获取粉丝数</summary>
        chrome.extension.sendRequest(
            { "host": ajax_type.weibo, "url": "http://weibo.cn/u/" + userId }, function (res) {
                var obj_weibo = $(res.html);
                //粉丝数

                var num_fensi = pub.getNumber(obj_weibo.find(".tip2 a:eq(1)").text());
                $("#txt_fensi .TextBox:eq(0)").val(num_fensi);
                //地区
                obj_weibo.find(".ctt a").remove();

                var str_diqu = $.trim(obj_weibo.find(".ctt").text().split('/')[1]).split(' ')[0];

                $("#txt_fensi .TextBox:eq(1)").val(str_diqu);
                $("#link_jx").text("解析");
            });
    },
    getTitle: function (str_text) {
        /// <summary>根据微博正文获取标题内容</summary>
        var str_t = "";

        if (str_text.indexOf("【") != -1 && str_text.indexOf("】") != -1) {
            str_t = str_text.split('【')[1].split('】')[0];
        }
        else {
            //取第一个逗号，如果取出来的字数大于10，小于22就可以作为标题
            if (str_text.indexOf('，') != -1) {
                var old_tt = str_text.split('，')[0];

                if (old_tt.length > 10 && old_tt.length < 22) {
                    return old_tt;
                }
            }
            //如果正文大于20，取前20个字作为标题
            if (str_text.length > 20) {
                str_t = str_text.substring(0, 20) + "…";
                if (str_t.indexOf("。") != -1) {
                    //如果在截取的20个字中有句号，取句号前面的。
                    str_t = str_t.split('。')[0];
                }
            }
            else {
                str_t = str_text;
            }
        }
        return str_t;
    },
    getAuthorIsV: function (str_author, dom) {
        /// <summary>判断微博作者是否加V,以及加V的类型</summary>
        var str_html = dom.prop("outerHTML");
        //新浪微博显示蓝v或黄v
        if (str_html.indexOf("5337.gif") != -1) {
            str_author += '<img src="http://mice.meihua.info/images/lanv.gif" style="margin-left:2px;" title="蓝V" />';
        }
        else if (str_html.indexOf("5338.gif") != -1) {
            str_author += '<img src="http://mice.meihua.info/images/huangv.gif" style="margin-left:2px;" title="黄V" />';
        }
        else if (str_html.indexOf("5547.gif") != -1) {
            str_author += '<img src="http://mice.meihua.info/images/daren.gif" style="margin-left:2px;" title="微博达人" />';
        }
        return str_author;
    },
    getText: function (str_text, dom, isZf) {
        /// <summary>获取微博正文内容，处理转发的结构</summary>

        //微博摘要特殊处理
        var div_links;
        if (isZf) {
            //是转发的微博
            div_links = dom.clone();
            div_links.find("div:last a").each(function () {
                var str_lk = $(this).text();
                if (str_lk.indexOf("[") != -1 || "收藏|原图".indexOf(str_lk) != -1) {
                    $(this).remove();
                }
            });
            div_links.find(".ct,img").remove();
            div_links.find("a").each(function () {
                $(this).replaceWith($(this).text());
            });
            str_text = div_links.html();
        }
        else {
            div_links = dom.find(".cc").parent("div");
        }
        div_links.find(".ct,img").remove();
        //微博的评论和转发量要显示出来
        var str_links = '';
        var obj_links;
        if (isZf) {
            //如果是转发，html结构里有两个div
            obj_links = dom.find("div:last a");
        }
        else {
            obj_links = div_links.find("a");
        }
        obj_links.each(function () {
            var str_eachVal = $(this).text();
            if (str_eachVal == "原图") {
                str_links += '<a href="' + $(this).attr("href") + '" target="_blank">点击查看原图</a>&nbsp;&nbsp;';
            }
            else if (str_eachVal.indexOf('赞') != -1 || str_eachVal.indexOf('转发') != -1 || str_eachVal.indexOf('评论') != -1) {
                str_links += '<span class="wbCount">' + str_eachVal + '</span>';
            }
        });
        str_text += '<div class="wbcc">' + str_links + "</div>";
        //转发理由文字加粗 
        str_text = str_text.replace("转发理由:", '<span style="color:#666">转发理由:</span>');
        return str_text;
    },
    getLink: function (isZf, dom) {
        /// <summary>获取转发微博的真实链接</summary>
        //通过留言的地址转换微博网页的正确地址，因为微博抓取的是手机端
        var str_msgLink = dom.find(".cc").attr("href");
        if (!str_msgLink || isZf) {
            str_msgLink = dom.find(".cc:eq(1)").attr("href");
        }
        if (!str_msgLink) {
            return "";
        }
        return "http://weibo.com/" + pub.getUrlParam(str_msgLink, "uid") + "/" + str_msgLink.split('?')[0].split('comment/')[1];
    },
    getMobUrl: function (str_oldUrl) {
        /// <summary>获取手机</summary>
        var str_url = str_oldUrl.split('?')[0];
        str_url = str_url.replace("weibo.com", "weibo.cn");
        return "http://" + str_url;
    },
    getUrls: function () {
        var str_urls = $("#txtr_news").val();
        str_urls = pub.url(str_urls);
        var arr_urls = str_urls.split('http://');
        var arr_weibo = [];
        for (var i = 0; i < arr_urls.length; i++) {
            if (arr_urls[i].indexOf("weibo.com") != -1) {
                arr_weibo.push(weibo.getMobUrl(arr_urls[i]));
            }
        }
        return arr_weibo;
    },
    replace: function (str) {
        /// <summary>替换{和|符号</summary>
        if (!str) {
            return "{" + str;
        }
        return "{" + str.replace(/[{,|]/g, "");
    },
    getFenSi: function (str_url, _fun) {
        /// <summary>获取微博粉丝数</summary>
        /// <param name="str_url" type="String">微博的作者主页地址</param>
        /// <param name="_fun" type="String">获取数据成功后的回调函数</param>
        $.get(str_url, function (suc) {
            var weiboPage = $(suc);
            //粉丝数
            var num_fensi = parseInt(weiboPage.find(".tip2 a:eq(1)").text().replace(/[粉丝,\[,\]]/g, ""));
            weiboPage.find(".ctt:eq(0) a").remove();
            //性别
            var str_sex = "男";
            var str_old = weiboPage.find("div.ut .ctt:eq(0)").text();
            if (str_old.indexOf("女") != -1) {
                str_sex = "女";
            }
            //地区
            var str_diqu = "";
            if (str_old) {
                str_diqu = $.trim(str_old.split('/')[1].split(' ')[0]);
            }
            var json_suc = { "url": str_url, "fensi": num_fensi, "diqu": str_diqu, "sex": str_sex };
            _fun(json_suc);
        });
    },
    obj: function (dom, obj, res) {
        /// <summary>构造单个对象</summary>
        /// <param name="dom" type="Object">当前循环的遍历的dom对象</param>
        /// <param name="obj" type="Object">设置的网站结构对象</param>
        /// <param name="res" type="Object">请求bg后台返回的结果</param>
        var o = {};
        o.swd = res.word;
        o.time = pub.dom.get(dom, obj.search_html.time, obj);
        o.img = pub.dom.get(dom, obj.search_html.img, obj);
        //作者
        o.author = pub.dom.get(dom, obj.search_html.author, obj);
        o.author = weibo.getAuthorIsV(o.author, dom);
        //微博作者的介绍链接
        o.authorUrl = dom.find("a.nk").attr("href");
        //摘要
        o.summary = pub.dom.get(dom, obj.search_html.summary, obj);
        if (o.summary) {
            o.summary = o.summary.replace(/:/g, "");
        }
        //标识是否为转发
        var str_msgLink = dom.find(".cc").attr("href");
        var isZf = pub.getUrlParam(str_msgLink, "uid") == "";

        o.url = weibo.getLink(isZf, dom);
        //根据摘要获取微博标题
        o.title = weibo.getTitle(o.summary);
        o.summary = weibo.getText(o.summary, dom, isZf);

        if (isZf) {
            o.title = "【转发】" + o.title;
        }
        var obj_time = monitor.time.get(o.time, res.obj_id);
        if (log.setTime["start" + res.obj_id] == "" && obj_time.no) {
            return true;
        }
        o.time = obj_time.time;
        o.date = obj_time.date;
        if (!o.url || monitor.isHas(o.url, o.title, obj.name)) {
            //处理网站重复的
            return true;
        }

        o.domain = obj.url;
        o.name = obj.name;

        o.summary = pub.setNegativeColor(o.summary);
        //高亮关键字
        o.summary = monitor.setColorBg(o.summary, res.word);
        o.title = monitor.setColorBg(o.title, res.word);
        return o;
    },
    import: function () {
        //加密或错误地址处理
        $(document).on("click", ":button.btnimport", function () {
            var $ckObj = $("#NewspaperKeys" + $(this).attr("cid") + " " + ":checkbox:checked").not(".ck_h,.ck_a,.ck_t");
            var str_errorUrl = "";
            if ($("#ck_fensi").is(":checked")) {
                $ckObj.each(function () {
                    var pobj = $(this).parents("li");
                    var str_link = pobj.attr("authorlink");
                    if (str_link && str_link != "") {
                        //微博作者信息要解析
                        str_errorUrl += "|" + str_link;
                    }
                });
            }
            var isOk = true;
            var fc = 0;
            var fensiCount = 0;
            var obj_errorTime = setInterval(function () {
                if (!isOk) {
                    return;
                }
                isOk = false;
                if (str_errorUrl.indexOf("|") != -1) {
                    var arr_fensi = str_errorUrl.split('|');
                    if (fensiCount == 0 && arr_fensi.length > 0) {
                        fensiCount = arr_fensi.length;
                    }
                    var str_url = arr_fensi[1];
                    var obj_timeOut = setTimeout(function () {
                        str_errorUrl = str_errorUrl.replace("|" + str_url, "");
                        $("li[authorlink='" + str_url + "']").attr({ "fensi": "0", "diqu": "", "sex": "男" });
                        fc++;
                        isOk = true;

                    }, 15000);
                    weibo.getFenSi(str_url, function (res) {
                        str_errorUrl = str_errorUrl.replace("|" + str_url, "");
                        clearTimeout(obj_timeOut);
                        //微博获取粉丝数处理
                        $(":button.btn_importing").val("正在查询第" + fc + "条的粉丝数，还剩" + (fensiCount - fc));
                        $("li[authorlink='" + res.url + "']").attr({ "fensi": res.fensi, "diqu": res.diqu, "sex": res.sex });
                        fc++;
                        isOk = true;
                    });
                }
                else {
                    clearInterval(obj_errorTime);
                    $("body").append('<input type="hidden" id="hd_suc" />');
                }
            }, 50);
        });
    },
    init: function (str_pageUrl) {
        if (str_pageUrl.indexOf("urlAnalysis.aspx") != -1) {
            $("body").append('<input type="hidden" id="hd_helper" />');
            this.adds.click_save();
        }
        else if (str_pageUrl.indexOf("321acb5b-c970-410e-abaa-c99fe85a3b6e") != -1) {
            weibo.import();
        }
        else if (str_pageUrl.indexOf("https://sina.cn/") != -1) {
            //关闭已打开的微博模拟窗口页面
            host.ajax({ "host": ajax_type.delWeiboLogin }, function () {

            });
        }
        weibo.login(str_pageUrl);
    }
};

//批量添加
weibo.adds = {
    //要保存的微博数据
    str_saveWeiboData: "",
    isAdd: true,
    isOk: true,
    addError: function (str_msg) {
        /// <summary>输出错误信息到页面上</summary>
        $("#import_error").append("<br />" + str_msg);
    },
    //存储作者链接
    arr_userUrl: [],
    arr_json: [],
    //点击的按钮对象
    obj_click: null,
    get_fensi: function () {
        var str_urls = weibo.adds.arr_userUrl.join('|') + "|";
        if ($("#ck_fensi2").is(":checked")) {
            //勾选了才读取粉丝数
            var fc = 0;
            var obj_fensiTimer = setInterval(function () {
                if (weibo.adds.isOk) {
                    weibo.adds.isOk = false;
                    fc++;
                    weibo.adds.obj_click.addClass("noimg").val("正在查询第" + fc + "条微博的粉丝数");
                    var str_url = str_urls.split('|')[0];

                    str_urls = str_urls.replace(str_url + "|", "");
                    //等待15秒，还未成功直接跳过这一条
                    timer_error = setTimeout(function () {
                        weibo.adds.isOk = true;
                    }, 15000);
                    weibo.getFenSi(str_url, function (res) {
                        var str_json = weibo.adds.str_saveWeiboData;
                        var reg_url = str_url.replace(/\//g, "\/");
                        reg_url = weibo.adds.subUrl(reg_url);
                        var reg_diqu = new RegExp(reg_url + '地区', 'g'), reg_fensi = new RegExp(reg_url + '粉丝数', 'g'), reg_sex = new RegExp(reg_url + '性别', 'g');
                        str_json = str_json.replace(reg_diqu, res.diqu);
                        str_json = str_json.replace(reg_fensi, res.fensi);
                        str_json = str_json.replace(reg_sex, res.sex);
                        weibo.adds.str_saveWeiboData = str_json;
                        weibo.adds.isOk = true;
                        clearTimeout(timer_error);
                        if (str_urls.indexOf("|") == -1) {
                            weibo.adds.isAdd = true;
                            clearInterval(obj_fensiTimer);
                            $("body").append('<div id="hd_save">' + weibo.adds.str_saveWeiboData + '</div>');
                            weibo.adds.obj_click.val("开始保存…");
                        }
                    });

                }
            }, 1500);
        }
        else {
            //没勾粉丝数直接开始保存了
            while (str_urls.indexOf("|") != -1) {
                var str_url = str_urls.split('|')[0];
                str_urls = str_urls.replace(str_url + "|", "");
                var reg_url = str_url.replace(/\//g, "\/");
                reg_url = weibo.adds.subUrl(reg_url);
                var reg_diqu = new RegExp(reg_url + '地区', 'g'), reg_fensi = new RegExp(reg_url + '粉丝数', 'g'), reg_sex = new RegExp(reg_url + '性别', 'g');
                weibo.adds.str_saveWeiboData = weibo.adds.str_saveWeiboData.replace(reg_diqu, '').replace(reg_fensi, '0').replace(reg_sex, '男');
            }
            $("body").append('<div id="hd_save">' + weibo.adds.str_saveWeiboData + '</div>');
            weibo.adds.isAdd = true;
        }

    },
    subUrl: function (str_url) {
        /// <summary>截取链接部分</summary>
        try {
            var arr = str_url.split('/');
            var idx = arr.length - 1;
            return arr[idx];
        }
        catch (e) {
            return str_url;
        }
    },
    wbLogin: function (str_url) {
        host.ajax({ "host": ajax_type.isLogin, "name": "SSOLoginState", "domain": "http://m.weibo.cn" }, function (res) {
            if (res.isLogin) {
                //等待20秒，还未成功直接跳过这一条
                timer_error = setTimeout(function () {
                    weibo.adds.addError("解析超时：" + str_url.replace("weibo.cn", "weibo.com"));
                    weibo.adds.isOk = true;
                }, 15000);
                $.get(str_url, function (suc) {
                    weibo.adds.sucTry({ "html": suc, "url": str_url.replace("weibo.cn", "weibo.com") });
                    if (t_weiboUrl.indexOf("|") == -1) {
                        clearInterval(obj_timer);
                        weibo.adds.isOk = true;
                        //把之前拼接的微博数据，再次传入好和粉丝数合并输出
                        weibo.adds.str_saveWeiboData = weibo.adds.arr_json.join('|');
                        weibo.adds.get_fensi();
                    }
                });
            }
            else {
                weibo.adds.obj_click.addClass("noimg").val("微博未登录，正在尝试登录…");
                host.ajax({ "host": ajax_type.weiboLogin }, function (res) {

                });
                setTimeout(function () {
                    weibo.adds.wbLogin(str_url);
                }, 4000);
            }
        });
    },
    start: function () {
        /// <summary>开始获取</summary>
        t_weiboUrl = weibo.getUrls().join('|') + "|";
        if (t_weiboUrl != "|") {
            obj_timer = setInterval(function () {
                if (weibo.adds.isOk) {
                    weibo.adds.isOk = false;
                    if (weibo.adds.obj_click != null) {
                        weibo.adds.obj_click.addClass("noimg").val("正在解析第" + (weibo.adds.arr_json.length + 1) + "条微博内容");
                    }
                    var str_url = t_weiboUrl.split('|')[0];
                    t_weiboUrl = t_weiboUrl.replace(str_url + "|", "");
                    weibo.adds.wbLogin(str_url);
                }
            }, 1500);
        }
    },
    sucTry: function (res) {
        var obj_html = $("<div>" + res.html + "</div>");
        var obj_msg = obj_html.find("#M_ .ctt");
        if (obj_msg.size() == 0) {
            weibo.adds.addError("解析错误：" + res.url);
            if (weibo.isLogin(res.html)) {
                host.ajax({ "host": ajax_type.weiboLogin }, function (res) {
                    weibo.adds.suc(res);
                });
            }
            else {
                weibo.adds.isOk = true;
                clearTimeout(timer_error);
            }
        }
        else {
            weibo.adds.suc(res);
        }
    },
    weibo: function (obj_html) {
        /// <summary>依据html获取单条微博对象数据</summary>
        var obj_msg = obj_html.find("#M_ .ctt");
        var obj = {};
        //微博作者的主页地址
        obj.useLink = "http://weibo.cn" + obj_html.find("#M_ a:eq(0)").attr("href");
        obj_msg.find("a").each(function () {
            var obj_link = $(this);
            var str_link = obj_link.text();
            if ("举报|收藏|操作".indexOf(str_link) != -1) {
                obj_link.remove();
            }
            else {
                obj_link.replaceWith(str_link);
            }
        });
        //微博正文
        obj.text = obj_msg.text();

        if (obj.text != "") {
            obj.text = obj.text.replace(":", "");
        }
        //微博标题
        obj.title = weibo.getTitle(obj.text);
        //发布时间
        obj.time = obj_html.find("#M_ .ct").text();
        //微博作者
        obj.author = obj_html.find("#M_ a:eq(0)").text();
        ///转发量、评论量、点赞数、粉丝数
        var num_RepostsCount = 0, num_CommentsCount = 0, num_dianzan = 0;
        obj_html.find("#cmtfrm").prev("div").find("span").each(function () {
            var str_val = $(this).text();
            if (str_val.indexOf("转发") != -1) {
                num_RepostsCount = pub.getNumber(str_val);
            }
            else if (str_val.indexOf("评论") != -1) {
                num_CommentsCount = pub.getNumber(str_val);
            }
            else if (str_val.indexOf("赞") != -1) {
                num_dianzan = pub.getNumber(str_val);
            }
        });
        if (!num_RepostsCount) {
            num_RepostsCount = 0;
        }
        if (!num_CommentsCount) {
            num_CommentsCount = 0;
        }
        if (!num_dianzan) {
            num_dianzan = 0;
        }

        obj.dianzan = num_dianzan;
        obj.repostsCount = num_RepostsCount;
        obj.commentsCount = num_CommentsCount;
        //粉丝数、地区、性别
        var str_useLink = weibo.adds.subUrl(obj.useLink);
        obj.fensi = str_useLink + '粉丝数';
        obj.diqu = str_useLink + '地区';
        obj.sex = str_useLink + '性别';
        //加v类型
        var v_type = "";
        var obj_img = obj_html.find("#M_ img:eq(0)");
        if (obj_img.attr("alt") === "V") {
            if (obj_img.attr("src").indexOf("5337.gif") != -1) {
                v_type = "黄V";
            }
            else if (obj_img.attr("src").indexOf("5338.gif") != -1) {
                v_type = "蓝V";
            }
        }
        obj.type = v_type;
        return obj;
    },
    suc: function (res) {

        var obj_html = $("<div>" + res.html + "</div>");
        var str_ids = $("#txt_cmenu").attr("ids");
        var str_json = "";
        var obj_msg = obj_html.find("#M_ .ctt");
        if (obj_msg.size() == 0) {
            weibo.adds.addError("解析错误：" + res.url);
            if (weibo.isLogin(res.html)) {
                host.ajax({ "host": ajax_type.weiboLogin }, function (res) {

                });
            }
        }
        else {
            var obj = weibo.adds.weibo(obj_html);
            //微博作者的主页地址
            weibo.adds.arr_userUrl.push(obj.useLink);
            var text_sm = $.trim($("#txta_sm").val()), text_title = $.trim($("#txta_title").val());
            if (text_sm != "") {
                text_sm = weibo.replace(text_sm);
                //进行了自定义摘要设置
                text_sm = text_sm.replace(/#粉丝数#/g, obj.fensi).replace(/#评论数#/g, obj.commentsCount).replace(/#点赞数#/g, obj.dianzan);
                text_sm = text_sm.replace(/#转发数#/g, obj.repostsCount).replace(/#原标题#/g, obj.title).replace(/#原摘要#/g, obj.text);
                text_sm = text_sm.replace(/#博主昵称#/g, obj.author).replace(/#博主性别#/g, obj.sex).replace(/#发微设备信息#/g, "");
                text_sm = "{" + text_sm.replace(/#地区#/g, obj.diqu).replace(/#微博链接#/g, res.url).replace(/{/g, "");
            }
            else {
                //不然就空
                text_sm = "{";
            }
            if (text_title != "") {
                text_title = weibo.replace(text_title);
                //进行了自定义摘要设置
                text_title = text_title.replace(/#粉丝数#/g, obj.fensi).replace(/#评论数#/g, obj.commentsCount).replace(/#点赞数#/g, obj.dianzan);
                text_title = text_title.replace(/#转发数#/g, obj.repostsCount).replace(/#原标题#/g, obj.title).replace(/#原摘要#/g, obj.text);
                text_title = text_title.replace(/#博主昵称#/g, obj.author).replace(/#博主性别#/g, obj.sex).replace(/#发微设备信息#/g, "");
                text_title = text_title.replace(/#地区#/g, obj.diqu).replace(/#微博链接#/g, res.url).replace(/{/g, "");
            }
            else {
                text_title = obj.title;
            }

            //微博标题
            str_json += text_title;
            //微博链接
            str_json += weibo.replace(res.url);
            //微博作者
            str_json += weibo.replace(obj.author);
            //发布时间
            str_json += weibo.replace(obj.time);
            //发布设备
            str_json += weibo.replace("");
            //正文
            str_json += weibo.replace(obj.text);
            //转发量
            str_json += weibo.replace(obj.repostsCount);
            //评论量
            str_json += weibo.replace(obj.commentsCount);
            // 点赞量
            str_json += weibo.replace(obj.dianzan);
            //分类
            str_json += "{" + str_ids;
            //地区
            str_json += weibo.replace(obj.diqu);
            //粉丝数
            str_json += weibo.replace(obj.fensi);
            //性别
            str_json += weibo.replace(obj.sex);
            //摘要
            str_json += text_sm;
            //加V类型
            str_json += weibo.replace(obj.type);
            weibo.adds.arr_json.push(str_json);
        }
        weibo.adds.isOk = true;
        clearTimeout(timer_error);
    },
    click_save: function () {
        $("#btn_saveNews,#btn_saveNewsAuid").click(function () {
            var ids = $("#txt_cmenu").attr("ids");
            var str_urls = $.trim($("#txtr_news").val());

            if (ids && str_urls && weibo.adds.isAdd) {
                weibo.adds.arr_json = [];
                weibo.adds.arr_userUrl = [];
                weibo.adds.isAdd = false;
                weibo.adds.obj_click = $(this);
                weibo.adds.start();
            }
        });
    }
};


$(function () {
    var str_pageUrl = window.location.href;
    weibo.init(str_pageUrl);
});