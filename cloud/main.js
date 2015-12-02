Parse.Cloud.useMasterKey();

// EndPoint:
//  https://api.parse.com/1/functions/deleteUser
//
// Body:
// { userId : 1234 }
Parse.Cloud.define("deleteUser", function (request, response) {
    var uid = request.params.userId;
    var User = Parse.Object.extend("_User");
    var query = new Parse.Query(User);


    query.get(uid, {
        success: function (data) {
            // The object was retrieved successfully.
            console.log(data);
            data.destroy({
                success: function (myObject) {
                    // The object was deleted from the Parse Cloud.
                    response.success(myObject);
                },
                error: function (myObject, error) {
                    // The delete failed.
                    // error is a Parse.Error with an error code and message.
                    response.error(error);
                }
            });

        },
        error: function (object, error) {
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

Parse.Cloud.define("updateUser", function (request, response) {
    var uid = request.params.userId;
    var newUsername = request.params.username;
    var newEmail = request.params.email;
    var newPassword = request.params.password;
    //Temporary, will use roles in v2
    var access = request.params.access;
    var User = Parse.Object.extend("_User");
    var query = new Parse.Query(User);


    query.get(uid, {
        success: function (data) {
            // The object was retrieved successfully.
            if (newUsername && newUsername.length > 0) {
                data.set('username', newUsername);

            }
            if (newEmail && newEmail.length > 0) {
                data.set('email', newEmail);

            }

            if (newPassword && newPassword.length > 0) {
                data.set('password', newPassword);

            }

            if (access && access.length > 0) {
                data.set('access', access);
            }

            data.save(null, {
                success: function (data1) {
                    console.log('success');
                    console.log(data1);
                    response.success(data1);
                },
                error: function (object, error) {
                    response.error(error);
                }
            });
        },
        error: function (object, error) {
            // The object was not retrieved successfully.
            // error is a Parse.Error with an error code and message.
            response.error(error);
        }
    });
});
