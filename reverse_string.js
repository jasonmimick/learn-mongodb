var reverse = function(s) {
    var r = "";
    for (var i=s.length-1;i>-1;i--) {
        r += s.charAt(i);
    }
    return r;
}

var test = function(s) {
    print(s + '-->' + reverse(s));
}

test('Hello');

test('What is up doc?');

// OR
"hello world, this is better".split("").reverse().join("")

