var tblRoot;

/*
* 函数: makeTree
* 注释: 将关键字生成一颗树
*/
function makeTree(str_key) {
    var strKeys = str_key;
    var arrKeys = strKeys.split("");
    var tblCur = tblRoot = {};
    var key;

    for (var i = 0, n = arrKeys.length; i < n; i++) {
        key = arrKeys[i];

        if (key == ';')		//完成当前关键字
        {
            tblCur.end = true;
            tblCur = tblRoot;
            continue;
        }

        if (key in tblCur)	//生成子节点
            tblCur = tblCur[key];
        else
            tblCur = tblCur[key] = {};
    }

    tblCur.end = true; 	//最后一个关键字没有分割符
}

/*
* 函数: search
* 注释: 标记出内容中关键字的位置
*/
function search(content) {
    var arrMatch = [];
    try {
        var tblCur;
        var i = 0;
        var n = content.length;
        var p, v;


        while (i < n) {
            tblCur = tblRoot;
            p = i;
            v = 0;

            for (; ; ) {
                if (!(tblCur = tblCur[content.charAt(p++)])) {
                    i++;
                    break;
                }

                if (tblCur.end)		//找到匹配关键字
                    v = p;
            }

            if (v)					//最大匹配
            {
                arrMatch.push(i - 1, v);
                i = v;
            }
        }
    }
    catch (ex) {

    }
    return arrMatch;
}



function sort_object(object, subkey, desc) {
    /// <summary>排序数组或者对象</summary>
    /// <param name="object" type="Object">数组或对象</param>
    /// <param name="subkey" type="String">需要排序的子键, 该参数可以是字符串, 也可以是一个数组</param>
    /// <param name="desc" type="Bool">排序方式, true:降序, false|undefined:升序</param>
    var is_array = false;

    if (Object.prototype.toString.call(object) === '[object Array]') {
        is_array = true;
    }

    if (is_array) {
        var keys = { length: object.length };
    } else {
        var keys = Object.keys(object);
    }

    for (var i = 0; i < keys.length; i++) {
        for (var j = i + 1; j < keys.length; j++) {

            if (is_array) {
                //数组排序
                if (Object.prototype.toString.call(subkey) === '[object Array]') {
                    var vali = object[i];
                    var valj = object[j];

                    for (var si = 0; si < subkey.length; si++) {
                        vali = vali[subkey[si]];
                        valj = valj[subkey[si]];
                    }
                } else {
                    if ((!subkey && subkey !== 0) || subkey == '' && object.sort) {
                        var vali = object[i];
                        var valj = object[j];
                    } else {
                        var vali = object[i][subkey];
                        var valj = object[j][subkey];
                    }
                }

                if (desc) {
                    if (valj > vali) {
                        var tmp = object[i];
                        object[i] = object[j];
                        object[j] = tmp;
                    }
                } else {
                    if (valj < vali) {
                        var tmp = object[i];
                        object[i] = object[j];
                        object[j] = tmp;
                    }
                }
            } else {
                //对象排序
                var obi = object[keys[i]];
                var obj = object[keys[j]];

                if (Object.prototype.toString.call(subkey) === '[object Array]') {
                    var vali = obi;
                    var valj = obj;

                    for (var si = 0; si < subkey.length; si++) {
                        vali = vali[subkey[si]];
                        valj = valj[subkey[si]];
                    }
                } else {
                    if ((!subkey && subkey !== 0) || subkey == '' && object.sort) {
                        var vali = obi;
                        var valj = obj;
                    } else {
                        var vali = obi[subkey];
                        var valj = obj[subkey];
                    }
                }

                if (desc) {
                    if (valj > vali) {
                        var tmp = keys[i];
                        keys[i] = keys[j];
                        keys[j] = tmp;
                    }
                } else {
                    if (valj < vali) {
                        var tmp = keys[i];
                        keys[i] = keys[j];
                        keys[j] = tmp;
                    }
                }
            } //is!array
        }
    }

    if (is_array) {
        return object;
    } else {
        var sorted = {};

        for (var i = 0; i < keys.length; i++) {
            sorted[keys[i]] = object[keys[i]];
        }

        return sorted;
    }
} 
