Parse.Cloud.useMasterKey();
var _ = require('underscore');
var stsi_id = 'GnyLYhHwNT';

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

Parse.Cloud.define("createDiscussionBoard", function (request, response) {
    var Con = Parse.Object.extend('Conference');
    var con = new Con();
    con.id = request.params.conId;

    // Create Event object and query
    var Event = Parse.Object.extend("Event");
    var query = new Parse.Query(Event);
    var list = [];

    // Query for events that do not have discussion board.
    query.doesNotExist("board");
    var qPromise = query.find({
        success: function (data) {
            data.forEach(function (val, key) {
                var Board = Parse.Object.extend("DiscussionBoard");
                var board = new Board();
                board.set('conference', con); // Add Conference pointer
                board.set('hasQuestions', false); // Add Conference pointer
                board.set('event', data[key]); // Add Event pointer
                data[key].set('board', board);
            });
            list = data;
        }
    });

    // Wait for promise to resolve
    qPromise.then(function () {
        Parse.Object.saveAll(list, {
            success: function (data) {
                console.log('Number of objects saved: ' + data.length);
                response.success(data);
            },
            error: function (error) {
                response.error(error);
            }
        });
    });
});

Parse.Cloud.define("populateEventRelationsInSpeakers", function (request, response) {

    var Conference = Parse.Object.extend('Conference');
    var conference = new Conference();
    conference.id = request.params.conId;


    //query speakers
    var Speaker = Parse.Object.extend("Speaker");
    var querySpeaker = new Parse.Query(Speaker);
    querySpeaker.equalTo('conference', conference);
    var speakerList = [];

    //query events speaker relations
    var Event = Parse.Object.extend("Event");
    var queryEvent = new Parse.Query(Event);
    queryEvent.equalTo('conference', conference);
    var eventList = [];

    querySpeaker.find({
        success: function (results) {
            console.log("Successfully retrieved " + results.length + " speakers.");
            speakerList = results;
        },
        error: function (error) {
            console.log("Error: " + error.code + " " + error.message);
            response.error(error);
        }
    }).then(function () {
        return queryEvent.find({
            success: function (results) {
                console.log("Successfully retrieved " + results.length + " events.");
                eventList = results;
            },
            error: function (error) {
                console.log("Error: " + error.code + " " + error.message);
                response.error(error);
            }
        });
    }).then(function () {
        _.each(eventList, function (e) {
            e.relation("speakers").query().find({
                success: function (res) {
                    console.log("Successfully retrieved " + res + " events speakers.");
                    _.each(res, function (r) {
                        for (var index = 0; index < speakerList.length; index++) {
                            if (r.id === speakerList[index].id) {
                                speakerList[index].relation("event").add(e);
                                speakerList[index].save();
                                console.log('saved');
                                break;
                            }
                        }
                    });
                },
                error: function (error) {
                    console.log("Error: " + error.code + " " + error.message);
                    response.error(error);
                }
            });
        });
    });
});


Parse.Cloud.afterSave(Parse.User, function (request) {

    var query = new Parse.Query(Parse.Role);

    if (request.user.get('userType') === 'app') {
        query.equalTo("name", "User");
    } else if (request.user.get('userType') === 'cms') {
        if (request.user.get('access') === 'admin') {
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

Parse.Cloud.afterSave('Organization', function (request) {

    var Object = Parse.Object.extend('Organization');
    var queryObj = new Parse.Query(Object);
    queryObj.get(request.object.id, {
        success: function (object) {
            var acl = new Parse.ACL();
            acl.setPublicWriteAccess(false);
            acl.setPublicReadAccess(true);
            acl.setRoleWriteAccess('Admin', true);
            acl.setRoleReadAccess('Admin', true);
            acl.setRoleWriteAccess('Editor', true);
            acl.setRoleReadAccess('Editor', true);
            acl.setRoleReadAccess('User', true);
            object.setACL(acl);
            object.save();
        },
        error: function (error) {
            throw "Got an error " + error.code + " : " + error.message;
        }
    });

});


Parse.Cloud.afterSave('Conference', function (request) {

    var Object = Parse.Object.extend('Conference');
    var queryObj = new Parse.Query(Object);
    queryObj.include('organization');
    queryObj.get(request.object.id, {
        success: function (object) {
            var acl = new Parse.ACL();
            acl.setPublicWriteAccess(false);
            acl.setPublicReadAccess(true);
            acl.setRoleWriteAccess('Admin', true);
            acl.setRoleReadAccess('Admin', true);
            acl.setRoleWriteAccess('Editor', true);
            acl.setRoleReadAccess('Editor', true);
            acl.setRoleReadAccess('User', true);
            acl.setRoleWriteAccess('User', true);


            //Get Organization
            //Assign Organization role to ACL
            if (object.get('organization').get('name') === 'STSI') {
                acl.setRoleWriteAccess('STSIAdmin', true);
                acl.setRoleReadAccess('STSIAdmin', true);
                object.setACL(acl);
                object.save();
            }
        },
        error: function (error) {
            throw "Got an error " + error.code + " : " + error.message;
        }
    });

});


Parse.Cloud.afterSave('DBQuestion', function (request) {

    var Object = Parse.Object.extend('DBQuestion');
    var queryObj = new Parse.Query(Object);
    queryObj.include('conference');
    queryObj.get(request.object.id, {
        success: function (object) {
            var acl = new Parse.ACL();
            acl.setPublicWriteAccess(false);
            acl.setPublicReadAccess(true);
            acl.setRoleWriteAccess('Admin', true);
            acl.setRoleReadAccess('Admin', true);
            acl.setRoleWriteAccess('Editor', true);
            acl.setRoleReadAccess('Editor', true);
            acl.setRoleWriteAccess('Mod', true);
            acl.setRoleReadAccess('Mod', true);
            acl.setRoleReadAccess('User', true);
            acl.setRoleWriteAccess('User', true);
            //Get Organization
            //Assign Organization role to ACL
            if (object.get('conference').get('organization').id === stsi_id) {
                acl.setRoleWriteAccess('STSIAdmin', true);
                acl.setRoleReadAccess('STSIAdmin', true);
                object.setACL(acl);
                object.save();
            }
        },
        error: function (error) {
            throw "Got an error " + error.code + " : " + error.message;
        }
    });

});


Parse.Cloud.afterSave('DiscussionBoard', function (request) {

    var Object = Parse.Object.extend('DiscussionBoard');
    var queryObj = new Parse.Query(Object);
    queryObj.include('conference');
    queryObj.get(request.object.id, {
        success: function (object) {
            var acl = new Parse.ACL();
            acl.setPublicWriteAccess(false);
            acl.setPublicReadAccess(true);
            acl.setRoleWriteAccess('Admin', true);
            acl.setRoleReadAccess('Admin', true);
            acl.setRoleWriteAccess('Editor', true);
            acl.setRoleReadAccess('Editor', true);
            acl.setRoleWriteAccess('Mod', true);
            acl.setRoleReadAccess('Mod', true);
            acl.setRoleReadAccess('User', true);
            acl.setRoleWriteAccess('User', true);

            //Get Organization
            //Assign Organization role to ACL
            if (object.get('conference').get('organization').id === stsi_id) {
                acl.setRoleWriteAccess('STSIAdmin', true);
                acl.setRoleReadAccess('STSIAdmin', true);
                object.setACL(acl);
                object.save();
            }
        },
        error: function (error) {
            throw "Got an error " + error.code + " : " + error.message;
        }
    });

});


Parse.Cloud.afterSave('Event', function (request) {

    var Object = Parse.Object.extend('Event');
    var queryObj = new Parse.Query(Object);
    queryObj.include('conference');
    queryObj.get(request.object.id, {
        success: function (object) {
            var acl = new Parse.ACL();
            acl.setPublicWriteAccess(false);
            acl.setPublicReadAccess(true);
            acl.setRoleWriteAccess('Admin', true);
            acl.setRoleReadAccess('Admin', true);
            acl.setRoleWriteAccess('Editor', true);
            acl.setRoleReadAccess('Editor', true);
            acl.setRoleReadAccess('User', true);

            //Get Organization
            //Assign Organization role to ACL
            if (object.get('conference').get('organization').id === stsi_id) {
                acl.setRoleWriteAccess('STSIAdmin', true);
                acl.setRoleReadAccess('STSIAdmin', true);
                object.setACL(acl);
                object.save();
            }
        },
        error: function (error) {
            throw "Got an error " + error.code + " : " + error.message;
        }
    });

});


Parse.Cloud.afterSave('LinkedInUser', function (request) {

    var Object = Parse.Object.extend('LinkedInUser');
    var queryObj = new Parse.Query(Object);
    queryObj.get(request.object.id, {
        success: function (object) {
            var acl = new Parse.ACL();
            acl.setPublicReadAccess(true);
            acl.setPublicWriteAccess(false);
            acl.setRoleWriteAccess('Admin', true);
            acl.setRoleReadAccess('Admin', true);
            acl.setRoleWriteAccess('User', true);
            acl.setRoleReadAccess('User', true);
            object.setACL(acl);
            object.save();

        },
        error: function (error) {
            throw "Got an error " + error.code + " : " + error.message;
        }
    });

});


Parse.Cloud.afterSave('MasterNotification', function (request) {

    var Object = Parse.Object.extend('MasterNotification');
    var queryObj = new Parse.Query(Object);
    queryObj.include('conference');
    queryObj.get(request.object.id, {
        success: function (object) {
            var acl = new Parse.ACL();
            acl.setPublicWriteAccess(false);
            acl.setPublicReadAccess(true);
            acl.setRoleWriteAccess('Admin', true);
            acl.setRoleReadAccess('Admin', true);
            acl.setRoleWriteAccess('Editor', true);
            acl.setRoleReadAccess('Editor', true);
            acl.setRoleReadAccess('User', true);


            //Get Organization
            //Assign Organization role to ACL
            if (object.get('conference').get('organization').id === stsi_id) {
                acl.setRoleWriteAccess('STSIAdmin', true);
                acl.setRoleReadAccess('STSIAdmin', true);
                object.setACL(acl);
                object.save();
            }
        },
        error: function (error) {
            throw "Got an error " + error.code + " : " + error.message;
        }
    });

});


Parse.Cloud.afterSave('Note', function (request) {

    //Add Note to the user
    request.user.relation('Note').add(request.object);
    request.user.save();

    var Object = Parse.Object.extend('Note');
    var queryObj = new Parse.Query(Object);
    queryObj.get(request.object.id, {
        success: function (object) {
            var acl = new Parse.ACL();
            acl.setPublicReadAccess(false);
            acl.setPublicWriteAccess(false);
            acl.setRoleWriteAccess('Admin', true);
            acl.setRoleReadAccess('Admin', true);
            acl.setWriteAccess(request.user, true);
            acl.setReadAccess(request.user, true);
            object.setACL(acl);
            object.save();


        },
        error: function (error) {
            throw "Got an error " + error.code + " : " + error.message;
        }
    });

});


Parse.Cloud.afterSave('Notification', function (request) {

    var Object = Parse.Object.extend('Notification');
    var queryObj = new Parse.Query(Object);
    queryObj.include('conference');
    queryObj.get(request.object.id, {
        success: function (object) {
            var acl = new Parse.ACL();
            acl.setPublicWriteAccess(false);
            acl.setPublicReadAccess(false);
            acl.setRoleWriteAccess('Admin', true);
            acl.setRoleReadAccess('Admin', true);
            acl.setRoleWriteAccess('Editor', true);
            acl.setRoleReadAccess('Editor', true);
            acl.setRoleWriteAccess('User', true);
            acl.setRoleReadAccess('User', true);

            //Get Organization
            //Assign Organization role to ACL
            if (object.get('conference').get('organization').id === stsi_id) {
                acl.setRoleWriteAccess('STSIAdmin', true);
                acl.setRoleReadAccess('STSIAdmin', true);
                object.setACL(acl);
                object.save();
            }
        },
        error: function (error) {
            throw "Got an error " + error.code + " : " + error.message;
        }
    });

});


Parse.Cloud.afterSave('Session', function (request) {

    var Object = Parse.Object.extend('Session');
    var queryObj = new Parse.Query(Object);
    queryObj.include('conference');
    queryObj.get(request.object.id, {
        success: function (object) {
            var acl = new Parse.ACL();
            acl.setPublicWriteAccess(false);
            acl.setPublicReadAccess(true);
            acl.setRoleWriteAccess('Admin', true);
            acl.setRoleReadAccess('Admin', true);
            acl.setRoleWriteAccess('Editor', true);
            acl.setRoleReadAccess('Editor', true);
            acl.setRoleReadAccess('User', true);

            //Get Organization
            //Assign Organization role to ACL
            if (object.get('conference').get('organization').id === stsi_id) {
                acl.setRoleWriteAccess('STSIAdmin', true);
                acl.setRoleReadAccess('STSIAdmin', true);
                object.setACL(acl);
                object.save();
            }
        },
        error: function (error) {
            throw "Got an error " + error.code + " : " + error.message;
        }
    });

});

Parse.Cloud.afterSave('Attendee', function (request) {

    var Object = Parse.Object.extend('Attendee');
    var queryObj = new Parse.Query(Object);
    queryObj.include('conference');
    queryObj.get(request.object.id, {
        success: function (object) {
            var acl = new Parse.ACL();
            acl.setPublicWriteAccess(false);
            acl.setPublicReadAccess(true);
            acl.setRoleWriteAccess('Admin', true);
            acl.setRoleReadAccess('Admin', true);
            acl.setRoleWriteAccess('Editor', true);
            acl.setRoleReadAccess('Editor', true);
            acl.setRoleReadAccess('User', true);

            //Get Organization
            //Assign Organization role to ACL
            if (object.get('conference').get('organization').id === stsi_id) {
                acl.setRoleWriteAccess('STSIAdmin', true);
                acl.setRoleReadAccess('STSIAdmin', true);
                object.setACL(acl);
                object.save();
            }
        },
        error: function (error) {
            throw "Got an error " + error.code + " : " + error.message;
        }
    });

});


Parse.Cloud.afterSave('Speaker', function (request) {

    var Object = Parse.Object.extend('Speaker');
    var queryObj = new Parse.Query(Object);
    queryObj.include('conference');
    queryObj.get(request.object.id, {
        success: function (object) {
            var acl = new Parse.ACL();
            acl.setPublicWriteAccess(false);
            acl.setPublicReadAccess(true);
            acl.setRoleWriteAccess('Admin', true);
            acl.setRoleReadAccess('Admin', true);
            acl.setRoleWriteAccess('Editor', true);
            acl.setRoleReadAccess('Editor', true);
            acl.setRoleReadAccess('User', true);

            //Get Organization
            //Assign Organization role to ACL
            if (object.get('conference').get('organization').id === stsi_id) {
                acl.setRoleWriteAccess('STSIAdmin', true);
                acl.setRoleReadAccess('STSIAdmin', true);
                object.setACL(acl);
                object.save();
            }
        },
        error: function (error) {
            throw "Got an error " + error.code + " : " + error.message;
        }
    });

});

Parse.Cloud.afterSave('Sponsor', function (request) {

    var Object = Parse.Object.extend('Sponsor');
    var queryObj = new Parse.Query(Object);
    queryObj.include('conference');
    queryObj.get(request.object.id, {
        success: function (object) {
            var acl = new Parse.ACL();
            acl.setPublicWriteAccess(false);
            acl.setPublicReadAccess(true);
            acl.setRoleWriteAccess('Admin', true);
            acl.setRoleReadAccess('Admin', true);
            acl.setRoleWriteAccess('Editor', true);
            acl.setRoleReadAccess('Editor', true);
            acl.setRoleReadAccess('User', true);

            //Get Organization
            //Assign Organization role to ACL
            if (object.get('conference').get('organization').id === stsi_id) {
                acl.setRoleWriteAccess('STSIAdmin', true);
                acl.setRoleReadAccess('STSIAdmin', true);
                object.setACL(acl);
                object.save();
            }
        },
        error: function (error) {
            throw "Got an error " + error.code + " : " + error.message;
        }
    });

});

Parse.Cloud.afterSave('TravelBusiness', function (request) {

    var Object = Parse.Object.extend('TravelBusiness');
    var queryObj = new Parse.Query(Object);
    queryObj.include('conference');
    queryObj.get(request.object.id, {
        success: function (object) {
            var acl = new Parse.ACL();
            acl.setPublicWriteAccess(false);
            acl.setPublicReadAccess(true);
            acl.setRoleWriteAccess('Admin', true);
            acl.setRoleReadAccess('Admin', true);
            acl.setRoleWriteAccess('Editor', true);
            acl.setRoleReadAccess('Editor', true);
            acl.setRoleReadAccess('User', true);

            //Get Organization
            //Assign Organization role to ACL
            if (object.get('conference').get('organization').id === stsi_id) {
                acl.setRoleWriteAccess('STSIAdmin', true);
                acl.setRoleReadAccess('STSIAdmin', true);
                object.setACL(acl);
                object.save();
            }
        },
        error: function (error) {
            throw "Got an error " + error.code + " : " + error.message;
        }
    });

});

Parse.Cloud.afterSave('Votes', function (request) {

    var Object = Parse.Object.extend('Votes');
    var queryObj = new Parse.Query(Object);
    queryObj.get(request.object.id, {
        success: function (object) {
            var acl = new Parse.ACL();
            acl.setPublicWriteAccess(false);
            acl.setPublicReadAccess(true);
            acl.setRoleWriteAccess('Admin', true);
            acl.setRoleReadAccess('Admin', true);
            acl.setRoleWriteAccess('Editor', true);
            acl.setRoleReadAccess('Editor', true);
            acl.setRoleWriteAccess('Mod', true);
            acl.setRoleReadAccess('Mod', true);
            acl.setRoleWriteAccess('User', true);
            acl.setRoleReadAccess('User', true);
            object.setACL(acl);
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
        response.error(httpResponse.data);
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

Parse.Cloud.define("twitterOAuth", function (request, response) {

    if(request.params.actionType === 0){
        Parse.Cloud.httpRequest({
            method: 'POST',
            url: "https://api.twitter.com/oauth/request_token",
            headers: {
                Authorization: request.params.authSign,
                "Content-Type": "application/x-www-form-urlencoded"
            },
            params: {
                oauth_callback: request.params.redirectUri
            }
        }).then(function (httpResponse) {
            response.success(httpResponse.text);
        }, function (httpResponse) {
            console.error('Request failed with response code ' + httpResponse.status);
            response.error(httpResponse.data);
        });
    } else {
        Parse.Cloud.httpRequest({
            method: 'POST',
            url: "https://api.twitter.com/oauth/access_token",
            headers: {
                Authorization: request.params.authSign
            },
            params: {
                oauth_verifier: request.params.authVerify
            }
        }).then(function (httpResponse) {
            console.log(httpResponse.text);
            response.success(httpResponse.text);
        }, function (httpResponse) {
            console.error('Request failed with response code ' + httpResponse.status);
            response.error(httpResponse.data);
        });
    }

});
