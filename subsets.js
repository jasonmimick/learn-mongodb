/* Given a set (as an array)
 * return all the subsets
 * (as an array of arrays)
 *
 */
var subsets = function(set) {
    var subs = [];
    var numSubs = Math.pow(2,set.length);
    for (var i=0;i<numSubs;i++) {
        // get binary representation for i
        // if the n^th bit is one, then add the n^th
        // element of set to the subset
        var bin = Number(i).toString(2);
        // need to reverse the binary representation
        // since 10 = take the 2nd element, not the first
        bin = bin.split("").reverse().join("");
        var subset = [];
        for (var j=0;j<bin.length;j++) {
            if ( bin.charAt(j)==1 ) {
                subset.push(set[j]);
            }
        }
        subs.push(subset);
    }
    return subs;
}

printjson( subsets( [ 1,2 ] ) );
printjson( subsets( [ 1,2,3 ] ) );
printjson( subsets( [ "w", "x", "y", "z" ] ) );

