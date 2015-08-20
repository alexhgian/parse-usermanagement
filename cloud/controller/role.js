Parse.Cloud.useMasterKey();
Parse.Cloud.define("test", function(request, response) {
    var currentUser = Parse.User.current();
    console.log('currentUser');
    console.log(currentUser);
    // The object was retrieved successfully.
    response.success(currentUser);

});


exports.test = function(){
    console.log('hello');
}
