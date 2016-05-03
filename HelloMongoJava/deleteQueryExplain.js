db = db.getSiblingDB("eb-execution");
var dq = { "nbrAssigned" : 0, "nbrPending" : 0 };
db.Events.find(dq).explain("allPlansExecution")

