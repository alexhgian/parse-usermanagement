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


Parse.Cloud.afterSave(Parse.User, function (request) {

    var query = new Parse.Query(Parse.Role);

    if (request.user.get('userType') === 'app') {
        query.equalTo("name", "User");
    } else if (request.user.get('userType') === 'cms') {
        if (request.user.get('access')  === 'admin') {
            query.equalTo("name", "Admin");
        } else if (request.user.get('access') === 'staff') {
            query.equalTo("name", "Editor");
        } else if (request.user.get('access') === 'moderator') {
            query.equalTo("name", "Mod");
        }
    }
    query.first({
        success: function (object) {
            object.relation("users").add(request.user);
            object.save();
        },
        error: function (error) {
            throw "Got an error " + error.code + " : " + error.message;
        }
    });

});


Parse.Cloud.define("authorizeLinkedIn", function (request, response) {

    var IN_CLIENT = '758xwl5qajsppp';
    var IN_SECRET = 'xQUq2PN5hyDlbQL8';

    Parse.Cloud.httpRequest({
        method: 'POST',
        url: 'https://www.linkedin.com/uas/oauth2/accessToken',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8'
        },
        params: {
            client_id: IN_CLIENT,
            client_secret: IN_SECRET,
            redirect_uri: request.params.redirectUri,
            grant_type: 'authorization_code',
            code: request.params.code
        }
    }).then(function (httpResponse) {
        console.log(httpResponse.text);
        response.success(httpResponse.data);
    }, function (httpResponse) {
        console.error('Request failed with response code ' + httpResponse.status);
        response.error(httpResponse);
    });


});


Parse.Cloud.define("getLinkedInProfile", function (request, response) {
    Parse.Cloud.httpRequest({
        method: 'GET',
        url: 'https://api.linkedin.com/v1/people/~:(' + request.params.fields + ')?format=json',
        headers: {
            Authorization: 'Bearer ' + request.params.token
        }
    }).then(function (httpResponse) {
        console.log(httpResponse.text);
        response.success(httpResponse.data);
    }, function (httpResponse) {
        console.error('Request failed with response code ' + httpResponse.status);
        response.error(httpResponse.status);
    });
});
