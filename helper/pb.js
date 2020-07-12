//请求后台的请求类型及功能表述
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
    "openPage": "打开一个页面"
};

var dataWeibo = [];
//配置信息
var dataConfig = "";
function completionDate(input) {
    if (input < 10)
        return "0" + input;
    else
        return input;
}
//本地存储对象
var store = {
    get: function (key) {
        /// <summary>获取值</summary>
        var str_return = localStorage.getItem(key);
        if (str_return == "null" || $.trim(str_return) == "undefined" || !str_return) {
            str_return = "";
        }
        return str_return;
    },
    set: function (key, value) {
        /// <summary>设置值</summary>
        localStorage.setItem(key, value);
    },
    remove: function (key) {
        /// <summary>删除指定key的值</summary>
        localStorage.setItem(key, "");
    }
};
var _error = {
    weixinisNull: false,
    log: function (obj_msg, email_title) {
        /// <summary>错误日志记录</summary>
        /// <param name="obj_msg" type="String">浏览器抛出的错误异常对象</param>
        var str_msg = '';
        for (var key in obj_msg) {
            str_msg += "\r\n<br />   " + key + "：" + obj_msg[key];
        }
        this.send(str_msg, email_title);
    },
    send: function (str_msg, email_title) {
        /// <summary>出现错误，发送邮件通知程序员，还没有实现</summary>
    },
    yes: function (str_url, str_html, str_id) {
        /// <summary>判断网站是否出现异常,返回true表示有异常</summary>
        if (dataConfig && dataConfig.hasOwnProperty("errors")) {
            var arr = dataConfig["errors"].split(';');
            for (var i = 0; i < arr.length; i++) {
                var _arr = arr[i].split('|');
                if (str_url.indexOf(_arr[0]) != -1 && str_html.indexOf(_arr[1]) != -1) {
                    if (_error.weixinisNull && str_url.indexOf("weixin.sogou.com/weixin") != -1 && _arr[2].indexOf("登录") != -1) {
                        return false;
                    }
                    else {
                        this._try(str_url, str_id, _arr[2]);
                        return true;
                    }
                }
            }
        }
        return false;
    },
    _retry: function (str_id) {
        /// <summary>遇到错误后，重新尝试请求</summary>
        log.idx[str_id] = -1;
        log.page[str_id] = 1;
        var word = unescape($("#key_" + str_id).attr("skey"));

        monitor.start(word, str_id);
    },
    timer_retry: function (str_id) {
        /// <summary>定时尝试</summary>
        return function () {
            _error._retry(str_id);
        }
    },
    _try: function (str_url, str_id, str_type) {
        /// <summary>错误处理</summary>
        if (str_type.indexOf("登录") != -1) {
            //说明未登录
            if (str_url.indexOf("weibo.cn") != -1) {
                pub.loading(str_id, "微博模拟登录中…");
                //微博未登录
                host.ajax({ "host": ajax_type.weiboLogin }, function (res) {

                });
                var time_has = setInterval(function () {
                    host.ajax({ "host": ajax_type.isLogin, "name": "SSOLoginState", "domain": "http://m.weibo.cn" }, function (res) {
                        if (res.isLogin) {
                            clearInterval(time_has);
                            clearTimeout(time_has1);
                            _error._retry(str_id);
                        }
                    });
                }, 5000);
                var time_has1 = setTimeout(function () {
                    pub.loading(str_id, '模拟登录超时，好汉请速速<a target="_blank" href="https://passport.sina.cn/signin/signin">前往查看</a>，是否需要输入验证码！');
                }, 10000);
            }
            else if (str_url.indexOf("weixin.sogou.com/weixin") != -1) {

                host.ajax({ "host": ajax_type.isLogin, "name": "ppinf", "domain": "http://weixin.sogou.com/" }, function (res) {
                    if (!res.isLogin) {
                        _error.weixinisNull = false;
                        pub.loading(str_id, '微信登录后能检索到更多数据，请先<a target="_blank" href="http://weixin.sogou.com/">前往登录</a>一下！（点右上角登录）');
                        var time_sogou = setInterval(function () {
                            host.ajax({ "host": ajax_type.isLogin, "name": "ppinf", "domain": "http://weixin.sogou.com/" }, function (res) {
                                if (res.isLogin) {
                                    clearInterval(time_sogou);
                                    _error._retry(str_id);
                                }
                            });
                        }, 5000);
                    }
                    else {
                        _error.weixinisNull = true;
                        _error._retry(str_id);
                    }
                });
            }
        }
        else if (str_type.indexOf("屏蔽") != -1) {
            //说明未登录
            if (str_url.indexOf("weixin.sogou.com/weixin") != -1) {
                //搜狗被屏蔽
                pub.loading(str_id, '被搜狗屏蔽了，正在尝试处理，长时间未反应，<a href="' + str_url + '" target="_blank">点击前往</a>输入验证码');
                host.ajax({ "host": ajax_type.delCookie, "url": str_url }, function (res) {
                    _error._retry(str_id);
                });
            }
        }
        else if (str_type.indexOf("访问") != -1) {
            //说明未登录
            pub.loading(str_id, '遇到一个奇怪错误，正在尝试处理，长时间未反应，<a href="' + str_url + '" target="_blank">点击前往</a>查看。');
            host.ajax({ "host": ajax_type.openPage, "url": str_url, "value": str_id }, function (res) {
                setTimeout(_error.timer_retry(str_id), 4000);
            });
        }
    }
};
var pub = {
    loading: function (str_id, str_msg) {
        /// <summary>加载抓取状态信息</summary>
        /// <param name="str_id" type="String">一次调研操作的唯一标识符</param>
        var pobj = $("#key_" + str_id);
        var obj_next = pobj;
        if (pobj.next(".items").size() > 0) {
            obj_next = pobj.next(".items");
        }
        if (document.getElementById("ld_" + str_id)) {
            $("#ld_" + str_id).find("label").html(str_msg);
        }
        else {
            obj_next.after('<div class="loading" id="ld_' + str_id + '"><img src="http://mice.meihua.info/images/ajax-loader-sm.gif" /><label>' + str_msg + '</label></div>');
        }
        if (webDatas.hasOwnProperty(str_id)) {
            //显示已经加载的新闻数量
            $("#key_" + str_id).find("a.start_monitor").text(webDatas[str_id].length);
        }
    },
    clear: function (str_html, delImg) {
        var typeStr = Object.prototype.toString.call(str_html);
        if (typeStr === "[object String]") {
            str_html = str_html.replace(/<script/g, "sc").replace(/<link/g, "");
            if (delImg) {
                str_html = str_html.replace(/<img/g, "");
            }
            return str_html;
        }
        return str_html;

    },
    clearHtml: function (str_html) {
        var typeStr = Object.prototype.toString.call(str_html);
        if (typeStr === "[object String]") {
            if (str_html.indexOf("<body>") != -1 && str_html.indexOf("</body>") != -1) {
                return str_html.split('<body>')[1].split('</body>')[0];
            }
        }
        return str_html;

    },
    random: function (min, max) {
        /// <summary>生成指定范围内的随机数</summary>
        return Math.floor(min + Math.random() * (max - min));
    },
    getNumber: function (text) {
        /// <summary>从字符串中提取数字</summary>
        try {
            if (!text) {
                return text;
            }
            return text.replace(/[^0-9]/ig, "");
        }
        catch (ex) {
            return "";
        }
    },
    isRubbishWeb: function (str_title) {
        /// <summary>判定是否是垃圾网站</summary>
        if (!str_title) {
            return false;
        }
        if (dataConfig.hasOwnProperty("filterword")) {
            var strFilter = dataConfig.filterword;
            var arrFilter = strFilter.split(';');
            for (var i = 0; i < arrFilter.length; i++) {
                var _t = $.trim(arrFilter[i]);
                if (_t != "" && str_title.indexOf(_t) != -1) {
                    return true;
                }
            }
            return false;
        }

        return true;
    },
    isRubbishUrl: function (str_url, str_source) {
        /// <summary>看网址是否是黑名单或者是否首页而不是新闻详情页</summary>
        if (!str_url) {
            return false;
        }
        str_url = $.trim(str_url);
        str_url = str_url.replace(/\//g, "");
        if (this.isHome(str_url)) {
            //说明是官网，不是新闻详情页
            return true;
        }
        if (dataConfig.hasOwnProperty("filterurl")) {
            var strFilter = dataConfig.filterurl;
            var arrFilter = strFilter.split(';');
            for (var i = 0; i < arrFilter.length; i++) {
                var _t = $.trim(arrFilter[i]);
                if (str_url.indexOf("www.baidu.com") != -1) {
                    str_url = str_source;
                }
                if (_t != "" && str_url != "" && str_url.indexOf(_t) != -1) {
                    return true;
                }
            }
        }
        return false;
    },
    isHome: function (str_url) {
        /// <summary>判断是不是官网首页</summary>
        if (!str_url || str_url == "") {
            return true;
        }
        str_url = str_url.toLowerCase();
        var arr = [".net", ".cn", ".com", ".org", ".me", "index.htm", "index.html", "index.aspx", "default.aspx", "default.html", "default.htm"];
        for (var i = 0; i < arr.length; i++) {
            if (str_url.indexOf(arr[i]) != -1) {
                var _arr = str_url.split(arr[i]);
                if (_arr[1] == "") {
                    return true;
                }
            }
        }
        return false;
    },
    getUrlParam: function (str_url, name) {
        /// <summary>获取地址栏的参数</summary>
        /// <param name="str_url" type="String">网址</param>
        /// <param name="name" type="String">地址栏的参数名称</param>
        try {
            if (!str_url) {
                return "";
            }
            var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)");
            var r = str_url.split('?')[1].match(reg);
            if (r != null) {
                return unescape(r[2]);
            }
            return "";
        }
        catch (ex) {
            return str_url;
        }
    },
    getDomain: function (str_url) {
        /// <summary>获取给定网址字符串的域名</summary>
        str_url = str_url + "/";
        var str_domain = "";
        if (str_url.indexOf('//') != -1) {
            str_domain = str_url.split('//')[1].split('/')[0];
        }
        else {
            str_domain = str_url.split('/')[0];
        }
        return str_domain.replace(".co...", ".com").replace("www.", "").replace("...", "");
    },
    clearHtml: function (str_html, s_tag, end_tag) {
        /// <summary>清除掉指定标签之间的内容</summary>

        var fc = 0;
        while (str_html.indexOf(s_tag) != -1) {
            fc++;
            if (fc > 5000) {
                return str_html;
            }
            var str_start = str_html.split(s_tag)[1];
            if (str_start.indexOf(end_tag) != -1) {
                str_start = s_tag + str_start.split(end_tag)[0] + end_tag;
            }
            str_html = str_html.replace(str_start, "");
        }

        return str_html;
    },
    getHtml: function (str_html, s_tag, end_tag) {

        var fc = 0;
        var s_html = '';
        while (str_html.indexOf(s_tag) != -1) {
            fc++;
            if (fc > 2000) {
                return s_html;
            }
            var str_start = str_html.split(s_tag)[1];
            if (str_start.indexOf(end_tag) != -1) {
                str_start = s_tag + str_start.split(end_tag)[0] + end_tag;
                s_html += str_start;
            }
            str_html = str_html.replace(str_start, "");
        }
        if (s_html != '') {
            return s_html;
        }

        return str_html;
    },
    url: function (str_urls) {
        /// <summary>不正规的url处理，就是那种https:或者只有www.没有http://的</summary>
        str_urls = str_urls.replace(/https:/g, "http://");
        str_urls = str_urls.replace(/http:\/\/www./g, "www.");
        str_urls = str_urls.replace(/www./g, "http://www.");
        str_urls = str_urls.replace(/\r|\n/ig, "");
        return str_urls;
    },
    trim: function (str) {
        try {
            var result;
            result = str.replace(/(^\s+)|(\s+$)/g, "");
            return result.replace(/\s/g, "");
        }
        catch (ex) {
            return str;
        }
    },
    getSetTime: function (str_id, obj) {
        /// <summary>获取调研员设置的时间</summary>
        /// <param name="str_id" type="String">调研按钮的编号</param>
        /// <param name="obj" type="String">调研按钮jq对象</param>
        var obj_pubTime = $("#cbx_publicTime");
        var str_setTime = "";
        if (obj_pubTime.is(":checked")) {
            str_setTime = obj_pubTime.parents("td").find(".slsTime").val();
            if (str_setTime === "5") {
                log.setTime[str_id] = "";
                log.setTime["start" + str_id] = $("#sTime").val();
                log.setTime["end" + str_id] = $("#eTime").val();
            }
            else {
                log.setTime["start" + str_id] = "";
                log.setTime["end" + str_id] = "";
                log.setTime[str_id] = str_setTime;
            }
        }
        else {
            var obj_id = obj.parents(".NewspaperKeys").attr("id").replace("NewspaperKeys", "");
            str_setTime = $("#" + obj_id).find(".curTime").attr("time");
            if (str_setTime.indexOf("D") != -1) {
                log.setTime[str_id] = "";
                log.setTime["start" + str_id] = $("#" + obj_id).find(".StartTimeStr").text();
                log.setTime["end" + str_id] = $("#" + obj_id).find(".EndTimeStr").text();
            }
            else {
                log.setTime["start" + str_id] = "";
                log.setTime["end" + str_id] = "";
                log.setTime[str_id] = str_setTime;
            }
        }
    },
    attr: function (obj, key) {
        /// <summary>获取json对象的属性值，会判断属性是否存在</summary>
        if (obj && key && obj.hasOwnProperty(key)) {
            return obj[key];
        }
        return "";
    },
    guid: function (idx) {
        /// <summary>生成一个不重复guid</summary>
        var timestamp = Date.parse(new Date());
        return timestamp + "" + idx;
    }
    ,
    setNegativeColor: function (str_html) {
        /// <summary>给文本中的负面词汇表颜色</summary>
        try {
            makeTree(dataConfig.words);
            str_html = pub.trim(str_html.replace(/:/g, "").replace(/\"/g, "")).replace(/<[^>]+>/g, "").replace(/&nbsp;/g, "").replace(/;/g, "");
            var arrMatch = search(str_html);
            var arr_w = [];
            for (var i = 0, n = arrMatch.length; i < n; i += 2) {
                var mid = arrMatch[i];
                var font = str_html.substring(mid, p = arrMatch[i + 1]);
                if (font) {
                    arr_w.push(font);
                }
            }
            for (var i = 0; i < arr_w.length; i++) {
                var reg = new RegExp(arr_w[i], "g");
                str_html = str_html.replace(reg, '<span class="bgkey2">' + arr_w[i] + '</span>');
            }
        }
        catch (ex) {

        }
        return str_html;

    }
};
//通用的日期处理方法
pub.time = {
    clear: function (str_date) {
        /// <summary>清除不一致的分隔符号</summary>
        try {
            return str_date.replace(/[\/.·月]/g, "-").replace('日', '');
        }
        catch (ex) {
            return str_date;
        }
    },
    parse: function (str_date) {
        /// <summary>字符串转换成日期格式</summary>

        var now = new Date;
        var str_time = "", str_hour = "";
        var str_copy = str_date;
        if (str_date.indexOf(':') != -1 || str_date.indexOf('：') != -1) {
            //类似昨天 12:03 、前天 12:34这样
            var arr_time = str_date.split(/\s/);
            str_date = arr_time[0];
            str_hour = $.trim(arr_time[1]);
            if (str_hour == "" && str_copy.indexOf("天") != -1) {
                str_hour = str_copy.split('天')[1];
            }
        }
        var new_time = this.chinese(str_date);
        var isParse = true;
        if (new_time != "") {

            if (str_hour != "") {
                str_date = this.format(new_time, 'y-m-d');
                //说明日期格式是带：的情况
                str_date += " " + str_hour;
            }
            else {
                str_date = this.format(new_time, '');
            }
            return this.try_parse(str_date);
        }
        else {
            str_time = str_date;
            //说明不是常规的中文描述日期格式（3分钟前、昨天 23:00、刚刚）
            if (/[a-z]/.test(str_time)) {
                //英文日期格式
                var timestamp = Date.parse(str_time);
                if (timestamp) {
                    return this.format(timestamp);
                }
            }
            if (!this.isHasYear(str_time)) {
                //说明日期格式不包含年份
                str_time = now.getFullYear() + "-" + this.clear(str_date);
            }
            if (str_hour != "") {
                //说明日期格式是带：的情况
                str_time = str_time + " " + str_hour;
            }
            str_time = this.clear(str_time);
        }
        str_time = this.try_parse(str_time);
        return new Date(str_time);
    },
    try_parse: function (str_date) {
        /// <summary>不确定因素日期转换</summary>
        try {
            return eval('new Date(' + str_date.replace(/\d+(?=-[^-]+$)/,
                   function (a) { return parseInt(a, 10) - 1; }).match(/\d+/g) + ')');
        }
        catch (ex) {
            return str_date;
        }
    },
    chinese: function (str_date) {
        /// <summary>中文表述语的日期格式处理（2月前、刚刚、3分钟前、昨天 23:00等）</summary>
        try {
            var now = new Date;
            //存储最终生成的日期格式
            var str_time = "";
            //获取日期格式中的数字部分
            var num_time = pub.getNumber(str_date);
            if (str_date.indexOf("时") != -1) {
                //类似22小时前
                str_time = now.setHours(now.getHours() - num_time);
            }
            else if (str_date.indexOf("天") != -1) {
                //类似1天前、昨天、前天
                if (str_date.indexOf("昨") != -1) {
                    str_time = now.setDate(now.getDate() - 1);
                }
                else if (str_date.indexOf("前天") != -1) {
                    str_time = now.setDate(now.getDate() - 2);
                }
                else {
                    str_time = now.setDate(now.getDate() - num_time);
                }
            }
            else if (str_date.indexOf("分") != -1) {
                //类似20分钟前
                str_time = now.setMinutes(now.getMinutes() - num_time);
            }
            else if (str_date.indexOf("月前") != -1) {
                //类似2月前
                str_time = now.setMonth(now.getMonth() - num_time);
            }
            else if (str_date.indexOf("刚") != -1) {
                //类似刚刚
                str_time = now.setMinutes(now.getMinutes() - 1);
            }
            return str_time;
        }
        catch (ex) {
            return "";
        }
    },
    format: function (timestamp, str_format) {
        /// <summary>把时间戳转换成日期格式</summary>
        try {
            var testDate = new Date(parseInt(timestamp));
            var year = testDate.getFullYear();
            var month = parseInt(testDate.getMonth()) + 1;
            var date = testDate.getDate();
            var hour = testDate.getHours();
            var minu = testDate.getMinutes();
            var s = testDate.getMilliseconds();
            if (str_format === "m月d") {
                return month + "月" + date + "日";
            }
            else if (str_format === "y-m-d") {
                return year + "-" + completionDate(month) + "-" + completionDate(date);
            }
            else {
                return year + "-" + completionDate(month) + "-" + completionDate(date) + " " + completionDate(hour) + "：" + completionDate(minu);
            }
        }
        catch (ex) {
            return timestamp;
        }
    },
    isHasYear: function (str_date) {
        /// <summary>判断日期字符串格式中是否包含年份部分</summary>
        if (!str_date) {
            str_date = "";
        }
        if (str_date.indexOf("年") != -1) {
            return true;
        }
        if (str_date.split('/').length>2) {
            return true;
        }
        if (str_date.split('-').length > 2) {
            return true;
        }
        var now = new Date;
        var str_year = "";
        try {
            str_year = now.getFullYear().toString().substring(0, 3);
        }
        catch (ex) {
            str_year = "201";
        }
        return str_date.indexOf(str_year) != -1;
    }
};
pub.dom = {
    attr: function (q, attr, obj) {
        /// <summary>获取指定dom的指定属性</summary>
        /// <param name="q" type="String">自定义获取dom结构的语法选择器</param>
        /// <param name="attr" type="String">dom属性</param>
        /// <param name="obj" type="Object">当前循环的列表当前行对象</param>
        var obj_dom = obj.find(q.split('$')[0]);
        if (obj_dom.size() == 0) {
            return "";
        }
        var str_val = this.val(obj_dom, attr);
        //取固定字符串
        var obj_font = this.font(q, str_val);
        //分隔符
        str_val = this.split(q, str_val);
        //用正则表达式取
        str_val = this.reg(q, str_val);
        //删除不要的数据或字符串
        str_val = this.del(q, str_val);
        return obj_font.str1 + str_val + obj_font.str2;
    },
    val: function (obj_dom, attr) {
        /// <summary>获取属性值</summary>
        var str_val = "";
        if (attr == "text") {
            str_val = obj_dom.text();
        }
        else if (attr == "html") {
            str_val = obj_dom.html();
        }
        else {
            str_val = obj_dom.attr(attr);
        }
        return str_val;
    },
    font: function (q, str_val) {
        /// <summary>截取固定字符串</summary>
        var obj = { "str1": "", "str2": "" };
        if (q.indexOf('前') != -1) {
            obj.str1 = this.sub(q, '前');
        }
        if (q.indexOf('后') != -1) {
            obj.str2 = this.sub(q, '后');
        }
        return obj;
    },
    split: function (q, str_val) {
        /// <summary>依据符号分隔出想要的数据</summary>
        /// <param name="q" type="String">自定义获取dom结构的语法选择器</param>
        /// <param name="str_val" type="String">获取到的dom属性值</param>
        if (q.indexOf('分隔') != -1) {
            var arr_split = this.sub(q, '分隔').split('|');
            var sc = arr_split[0];
            var num_idx = parseInt(arr_split[1]);
            return str_val.split(sc)[num_idx];
        }
        return str_val;
    },
    reg: function (q, str_val) {
        /// <summary>用正则表达式匹配数据</summary>
        /// <param name="q" type="String">自定义获取dom结构的语法选择器</param>
        /// <param name="str_val" type="String">获取到的dom属性值</param>
        var reg_time = "";
        if (q.indexOf('正则匹配日期') != -1) {
            var str_reg = /20[1-9]{2}-[0-9]{2}-[0-9]{2}\s+([0-9]{2}:[0-9]{2})?/;
            str_val.replace(str_reg, function (font) {
                reg_time = font;
            });
            return reg_time;
        }
        if (q.indexOf('正则') != -1) {
            var str_reg = eval("/" + this.sub(q, '正则') + "/");
            str_val.replace(str_reg, function (font) {
                reg_time = font;
            });
            return reg_time;
        }
        return str_val;
    },
    sub: function (q, key) {
        /// <summary>截取需要分析的dom结构语法</summary>
        if (q.indexOf(key) != -1) {
            q = q.split(key)[1];
        }
        if (q.indexOf('结束') != -1) {
            q = q.split('结束')[0];
        }
        return q;
    },
    get: function (obj, q, objs) {
        /// <summary>获取dom具体的属性值</summary>
        /// <param name="obj" type="Object">当前循环的列表当前行对象</param>
        /// <param name="q" type="String">jquery选择器</param>
        /// <param name="objs" type="Object">配置的dom元素</param>
        if (q == "") {
            return "";
        }
        //有或表示取dom时有多种情况
        var arr = q.split('或');
        var str = '';
        for (var i = 0; i < arr.length; i++) {
            if ($.trim(arr[i]) != "") {
                str = this._get(obj, arr[i], objs);
                if (str != "") {
                    return $.trim(str).replace(/\r/g, "").replace(/\n/g, "");
                }
            }
        }
        return str;
    },
    _get: function (obj, q, objs) {
        /// <summary>获取dom具体的属性值</summary>
        /// <param name="obj" type="Object">当前循环的列表当前行对象</param>
        /// <param name="q" type="String">jquery选择器</param>
        /// <param name="objs" type="Object">配置的dom元素</param>
        var str = "";
        var isDomain = objs && q.indexOf("$domain") != -1;
        q = q.replace("$domain", "");
        if (q.indexOf("$text") != -1) {
            str = this.attr(q, 'text', obj);
        }
        if (q.indexOf("$html") != -1) {
            str = this.attr(q, 'html', obj);
        }
        else if (q.indexOf("$href") != -1) {
            str = this.attr(q, 'href', obj);
            if (q.indexOf("$domain") != -1) {
                str = objs.url + str;
            }
        }
        else if (q.indexOf("$src") != -1) {
            str = this.attr(q, 'src', obj);
            if (q.indexOf("$domain") != -1) {
                str = objs.url + str;
            }
        }
        else if (q.indexOf("自定义") != -1) {
            str = this.attr(q.split('自定义')[0], q.split('自定义')[1], obj);
        }
        else if (q.indexOf("特殊取链接") != -1) {
            //从地址栏的参数取特定的值
            var str_link = obj.find(q.split('$')[0]).attr("href");
            str = unescape(pub.getUrlParam(str_link, q.split('特殊取链接')[1]));
        }
        if (isDomain) {
            str = objs.url + str;
        }
        return str;
    },
    del: function (q, str_val) {
        /// <summary>去掉dom返回值中不要的元素，例：删除<a和</a>|字符串百度快照</summary>
        /// <param name="q" type="String">自定义获取dom结构的语法选择器</param>
        /// <param name="str_val" type="String">获取到的dom属性值</param>
        if (q.indexOf('删除') != -1) {
            var arr = this.sub(q, '删除').split('|');
            var obj_html = $('<div>' + str_val + '</div>');
            for (var i = 0; i < arr.length; i++) {
                if (arr[i].indexOf('和') == -1 && arr[i].indexOf('字符串') == -1) {
                    //循环依据jQuery选择器删除元素
                    obj_html.find(arr[i]).remove();
                }
            }
            str_val = obj_html.html();
            for (var i = 0; i < arr.length; i++) {
                if (arr[i].indexOf('和') != -1) {
                    var _arr = arr[i].split('和');
                    if (str_val.indexOf(_arr[0]) != -1 && str_val.indexOf(_arr[1]) != -1) {
                        var rfont = _arr[0] + str_val.split(_arr[0])[1].split(_arr[1])[0] + _arr[1];
                        str_val = str_val.replace(rfont, "");
                    }
                }
                if (arr[i].indexOf('字符串') != -1) {
                    str_val = str_val.replace(arr[i].replace("字符串"), "");
                }
            }

        }
        return str_val;
    }
};
var page = {
    tools: function () {
        $(document).on("mouseenter", ".newList li", function () {
            var obj_hover = $(this);
            if (obj_hover.closest("ul.ul_childs").size() > 0) {
                return false;
            }
            var ht = '<div class="tools"><label><input type="checkbox" class="ck_h"  value="h" />高亮</label><label><input type="checkbox" class="ck_a" value="a" />警戒</label><label><input type="checkbox" class="ck_t" value="t" />翻译</label></div>';
            if (obj_hover.find(".tools").size() == 0) {
                obj_hover.append(ht);
            }
            obj_hover.find(".tools").css("display", "block");
        });
        $(document).on("mouseleave", ".newList li", function () {
            var obj_hover = $(this);
            if (obj_hover.find(".tools :checked").size() == 0) {
                obj_hover.find(".tools").css("display", "none");
            }
        });
    },
    click_hide: function () {
        /// <summary>点击隐藏单个监测项</summary>
        $(document).on("click", ".NewspaperKeySpan", function () {
            var str_style = $(this).attr("dn");
            if (!str_style || str_style === "block") {
                str_style = "none";
            }
            else {
                str_style = "block";
            }
            $(this).attr("dn", str_style);
            $(this).parents(".skey").next().css("display", str_style);
        });
    },
    click_show: function () {
        /// <summary>点击显示已经加载的数据</summary>
        $(document).on("click", ".show_data", function () {
            var obj = $(this);
            var obj_next = obj.next(".datas");
            var str_css = "fa fa-chevron-circle-down";
            obj_next.slideToggle("normal", function () {

                if (obj_next.css("display") != "none") {
                    str_css = "fa fa-chevron-circle-up";
                }
                obj.find("i").attr("class", str_css);
            });

        });
    },
    ckAll: function () {
        /// <summary>全选</summary>
        $(document).on("click", ".skey :checkbox", function () {
            $(this).parents(".skey").next().find(":checkbox:not('.ck_h,.ck_a,.ck_t')").prop("checked", $(this).is(":checked"));
        });
        $(document).on("click", ":checkbox[name='categoryName']", function () {

        });
    },
    hide: function (str_id) {
        /// <summary>隐藏其他已经加载的数据</summary>
        var pobj = $("#key_" + str_id).next(".items");
        var obj = pobj.find(".datas:last");
        pobj.find(".datas").not(obj).css("display", "none");

        pobj.find(".show_data:not('.show_data:last')").find("i").attr("class", "fa fa-chevron-circle-down");
    },
    click_showChilds: function () {
        /// <summary>网络监测，点击展开相似新闻</summary>
        $(document).on("click", "a.link_show", function () {
            var obj = $(this).closest("li").find("ul.ul_childs");
            obj.css("display", obj.css("display") == "none" ? "block" : "none");
        });
    },
    ck_childs: function () {
        /// <summary>网络监测，勾选主新闻的同时，全选底下的相似新闻</summary>
        $(document).on("click", "h3.title :checkbox", function () {
            var obj = $(this);
            obj.closest("li").find("ul.ul_childs :checkbox").prop("checked", obj.is(":checked"));
        });
    },
    init: function () {
        var str_pageUrl = window.location.href;
        if (str_pageUrl.indexOf("spider.aspx") != -1) {
            this.click_hide();
            this.click_show();
            this.ckAll();
            this.tools();
            $(".slsTime").val("1");
            this.click_showChilds();
            this.ck_childs();
        }


    }
};
//处理标题对象
pub.title = {
    sub: function (str_title, str_split) {
        /// <summary>判断截取标题符合的哪部分</summary>
        /// <param name="str_split" type="String">分隔符</param>
        var arr = str_title.split(str_split);
        var str = arr[0];
        for (tag in childNews.tag.arr) {
            if (str.indexOf(tag) != -1 && str.length > 5) {
                return str;
            }
        }
        if (str.length > arr[1].length) {
            return str;
        }
        return arr[1];
    },
    clear: function (arr, str_title) {
        /// <summary>过滤标题的特殊符号，获取真实的标题数据</summary>
        for (var i = 0; i < arr.length; i++) {
            if (str_title.indexOf(arr[i]) != -1) {
                str_title = this.sub(str_title, arr[i]);
            }
        }
        return str_title;
    },
    del: function (arr, str_title) {
        /// <summary>需要删除特殊符号包裹的字符串</summary>
        for (var i = 0; i < arr.length; i++) {
            var obj = arr[i];
            if (str_title.indexOf(obj.s1) != -1 && str_title.indexOf(obj.s2) != -1) {
                var str_subject = obj.s1 + str_title.split(obj.s1)[1];
                str_subject = str_title.split(obj.s2)[0] + obj.s2;
                str_title = str_title.replace(str_subject, "");
            }
        }
        return str_title;
    },
    get: function (str_title) {
        /// <summary>获取真实的标题</summary>
        try {
            var old_title = str_title;
            str_title = str_title.replace(/[话题:,评论:,...,?,《,》,的相似文章,{,}@]/g, "").replace(/<\/em>/g, "").replace(/讯:/g, "|").replace(/:/g, "|")
            .replace(/来自/g, "|").replace("_", "|").replace("——", "|").replace("-","|");
            //添加需要判断删除的符号
            if (str_title.indexOf('|') != -1) {
                var _arr = str_title.split('|');
                //把包含em标签最多的作为标题
                var _count = 0;
                var _title = "";
                for (var i = 0; i < _arr.length; i++) {

                    var arr_title = _arr[i].split('<em');

                    if (arr_title.length > _count) {
                        _count = arr_title.length;
                        _title = _arr[i].replace(/<em>/g, "");
                    }
                }
                return _title;
            }
            return str_title.replace(/<em>/g, "");
        }
        catch (ex) {
            return str_title;
        }
    }
};
var _config = {
    tree: function () {
        /// <summary>加载监测项选项</summary>
        var str_url = window.location.href;
        if (str_url.indexOf("spider.aspx") != -1) {
            if (dataConfig.hasOwnProperty("web")) {
                var key = pub.getUrlParam(str_url, "t");
                if (key && key.toLowerCase() === "cbea265d-c0f0-419e-a634-f576a21feb9e") {
                    $("#div_spider").css("display", "block");
                }
                else {
                    $("#div_spider").remove();
                }
                if (dataConfig["web"].hasOwnProperty(key)) {
                    var arr = dataConfig["web"][key];
                    var ht = '<div id="cks">';
                    for (var i = 0; i < arr.length; i++) {
                        var _arr = arr[i].split('|');
                        var str_ck = '';
                        var _ht = '';
                        if (_arr[0].indexOf('$') != -1) {
                            //说明里面有多选如微博（原创、认证、全部）
                            var arr_key = _arr[0].split('$');
                            var arr_radio = arr_key[2].split(',');
                            var arr_val = _arr[1].split(',');
                            _ht += '(<span>';
                            for (var r = 0; r < arr_radio.length; r++) {
                                var str_rdck = '';
                                if (r == 0) {
                                    str_rdck = ' checked="checked" ';
                                }
                                _ht += '<label><input type="radio" ' + str_rdck + ' value="' + arr_val[r] + '" name="' + arr_key[1] + '" />' + arr_radio[r] + '</label>';
                            }
                            _ht += '</span>)';
                            _arr[0] = arr_key[0];
                        }

                        ht += '<label><input type="checkbox" name="ck_new" value="' + _arr[1] + '" ' + str_ck + ' />' + _arr[0] + _ht + '</label>';

                    }
                    ht += '</div>';
                    $("#ckList").append(ht);
                }
            }
        }
    },
    load: function (_fun) {
        /// <summary>监测插件版本、获取一些基本配置、微博模拟登录</summary>
        var ajax_json = {};
        ajax_json.host = ajax_type.loadWebConfig;
        chrome.extension.sendRequest(ajax_json, function (res) {
            dataConfig = res.v;
            dataWeibo = dataConfig.weibo.split(',');
            if (parseFloat(dataConfig.version) == parseFloat(res.cv)) {

                $("#installTip2").remove();
                $(".Header,#install2").css("display", "block");

            }
            else {
                $("#installTip2").after('<div id="update_log">' + dataConfig.log + '</div>');
            }
            _config.tree();
            _fun();
        });
    }
};
