var test = require('cloud/controller/role.js');

// Use Parse.Cloud.define to define as many cloud functions as you want.
// For example:
Parse.Cloud.useMasterKey();
// Parse.Cloud.define("test", function(request, response) {
//     console.log(test);
//     response.success(test);
// });
//
//
// Parse.Cloud.define("getUser", function(request, response) {
//     var currentUser = Parse.User.current();
//     console.log('currentUser');
//     console.log(currentUser);
//
//     var uid = request.params.userId;
//     var User = Parse.Object.extend("_User");
//     var query = new Parse.Query(User);
//
//     query.get(uid, {
//         success: function(data) {
//             // The object was retrieved successfully.
//             response.success(data);
//         },
//         error: function(object, error) {
//             // The object was not retrieved successfully.
//             // error is a Parse.Error with an error code and message.
//             response.success(error);
//         }
//     });
// });
// Parse.Cloud.define("current", function(request, response) {
//     var currentUser = Parse.User.current();
//     console.log('currentUser');
//     console.log(currentUser);
//     // The object was retrieved successfully.
//     response.success(currentUser);
//
// });


// EndPoint:
//  https://api.parse.com/1/functions/deleteUser
//
// Body:
// { userId : 1234 }
Parse.Cloud.define("deleteUser", function(request, response) {
    var uid = request.params.userId;
    var User = Parse.Object.extend("_User");
    var query = new Parse.Query(User);


    query.get(uid, {
        success: function(data) {
            // The object was retrieved successfully.
            console.log(data);
            data.destroy({
                success: function(myObject) {
                    // The object was deleted from the Parse Cloud.
                    response.success(myObject);
                },
                error: function(myObject, error) {
                    // The delete failed.
                    // error is a Parse.Error with an error code and message.
                    response.error(error);
                }
            });

        },
        error: function(object, error) {
            // The object was not retrieved successfully.
            // error is a Parse.Error with an error code and message.
            response.error(error);
        }
    });
});

// EndPoint:
//  https://api.parse.com/1/functions/updateUser
// 
// Body:
// {
//     username : "John Doe",
//     email: "John@Doe.com",
//     password: "myNewPassword"
// }

Parse.Cloud.define("updateUser", function(request, response) {
    var uid = request.params.userId;
    var newUsername = request.params.username;
    var newEmail = request.params.email;
    var newPassword = request.params.password;
    var User = Parse.Object.extend("_User");
    var query = new Parse.Query(User);


    query.get(uid, {
        success: function(data) {
            // The object was retrieved successfully.
            if(newUsername && newUsername.length > 0){
                data.set('username', newUsername);

            }
            if(newEmail && newEmail.length > 0){
                data.set('email', newEmail);

            }

            if(newPassword && newPassword.length > 0){
                data.set('password', newPassword);

            }

            data.save(null, {
                success : function(data1){
                    console.log('success');
                    console.log(data1);
                    response.success(data1);
                },
                error : function(object, error) {
                    response.error(error);
                }
            });
        },
        error: function(object, error) {
            // The object was not retrieved successfully.
            // error is a Parse.Error with an error code and message.
            response.error(error);
        }
    });
});