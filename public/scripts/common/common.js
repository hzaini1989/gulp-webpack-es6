
var api = (function(){
    var a = 5555;
    var api = {
        con:function(){
            return a;
        }
    };
    return api;
})();
console.log(api.con());


