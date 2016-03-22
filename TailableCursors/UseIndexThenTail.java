Bson query = and(in("event",events),gte("ts", ts));
MongoCursor<Document> qcursor= coll.
                    find(query)
                    .batchSize(1000000)
                    .projection(projection).iterator();
while (qcursor.hasNext()) {
	// process
}

MongoCursor<Document> cursor= coll.
                    find(query)
                    .batchSize(1000000)
                    .cursorType(CursorType.TailableAwait).iterator();
while (cursor.hasNext()) {
	// now you're on the tailable… process forever
}
