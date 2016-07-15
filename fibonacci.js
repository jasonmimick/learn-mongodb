var nth_fib_recurse = function(n) { 
    if ( n==0 || n==1 ) { return 1; }
    return nth_fib_recurse(n-1)+nth_fib_recurse(n-2);
}

var nth_fib_straight = function(n) {
    if ( n==0 || n==1 ) { return 1; }
    var prev_prev = 1;
    var prev = 1;
    var next = prev_prev + prev;
    for (var i=2;i<n;i++ ) {
        prev_prev = prev;
        prev = next;
        next = prev + prev_prev;
    }
    return next;
}

var fibs = [];
var start = new Date().getTime();
for (var i=0;i<50;i++) {
    fibs.push(nth_fib_recurse(i));
}
print(fibs.join(","));
print("start="+start);
var end = new Date().getTime();
print("Runtime: " + (end-start));
start = new Date().getTime();
fibs = [];
for (var i=0;i<50;i++) {
    fibs.push(nth_fib_straight(i));
}
print(fibs.join(","));
var end = new Date().getTime();
print("Runtime: " + (end-start));

