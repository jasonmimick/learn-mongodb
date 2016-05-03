/*
* Script to validate replSet health
*/
var checkReplSetHeath = function(verbose) {

	var SLEEP_TIME = 1*1000;	// milliseconds
	// double check healthy status 
	ok = false;
	var timedOut = false;
	var checkCount = 0;
	var healthyStates = [ "PRIMARY", "SECONDARY" ];
	while ( !ok ) {
		if ( checkCount++ > 20 ) {
			if ( verbose ) {
				print("ERROR: Unable to validate healthy replica set after " + (checkCount*250)/1000 + " seconds.");
				printjson(ok);
			}
			ok = true;
			timedOut = true;
		}
		var status = rs.status();
		ok = true;
		status.members.forEach( function(member) { 
			if ( healthyStates.indexOf( member.stateStr ) == -1 ) {
				ok = false;
			}
		});
		if ( !ok ) {
			sleep( SLEEP_TIME );
		}
	}
	if ( ok && !timedOut ) {
		if ( verbose ) {
			print("SUCCESS: replica set healthy.");
		} else {
			return true
		}
	}	 
}



