if (Meteor.isServer) {
  Tinytest.add("fieldLimit: (countFromField fn) upon publish without field limit, warn user that entire documents are fetched", function (test) {
    var pub = new H.PubMock();
    var cursor = Posts.find({ testId: test.id });   // no field limit
    var conmock = { warn: H.detectRegex(/Collection cursor has no field limits and will fetch entire documents.  consider specifying only required fields./) };

    H.withConsole(conmock, function () {
      Counts.publish(pub, 'posts' + test.id, cursor, { countFromField: function (doc) { return doc.likes; } });
    });

    var fields = cursor._cursorDescription.options.fields;

    // verify the warning was sent to user
    test.isTrue(conmock.warn.found(), 'user was not warned of missing cursor field limit');

    // verify no restrictions were set.
    test.isUndefined(fields, 'Count must keep empty cursor fields limits when user uses accessor function');
  });

  Tinytest.add("fieldLimit: (countFromField fn) upon publish with count field assigned to field limit, keep existing field limit", function (test) {
    var pub = new H.PubMock();
    var cursor = Posts.find({ testId: test.id }, { fields: { likes: true }});   // field limit matches countFromField property.

    Counts.publish(pub, 'posts' + test.id, cursor, { countFromField: function (doc) { return doc.likes; } });

    var fields = cursor._cursorDescription.options.fields;

    test.isNotUndefined(fields, 'cursor is missing fields property');
    test.isNotUndefined(fields.likes, 'cursor is missing field (likes)');
    // verify only two fields are fetched.
    test.length(_.keys(fields), 1, 'cursor has more/less fields than specified');
  });

  // the user should always include the field used in the accessor function in the cursor field limit.
  // there is no means to automatically include the count field in the cursor field limit and chaos will ensue when
  // the user fails to handle this.
  Tinytest.add("fieldLimit: (countFromField fn) upon publish with other fields assigned to field limit, keep existing field limit", function (test) {
    var pub = new H.PubMock();
    var cursor = Posts.find({ testId: test.id }, { fields: { name: true, likes: true }});    // field limit must match countFromField property.

    Counts.publish(pub, 'posts' + test.id, cursor, { countFromField: function (doc) { return doc.likes; } });

    var fields = cursor._cursorDescription.options.fields;

    test.isNotUndefined(fields, 'cursor is missing fields property');
    test.isNotUndefined(fields.likes, 'cursor is missing field (likes)');
    test.isNotUndefined(fields.name, 'cursor is missing field (name)');
    // verify only three fields are fetched.
    test.length(_.keys(fields), 2, 'cursor has more/less fields than specified');
  });
}
