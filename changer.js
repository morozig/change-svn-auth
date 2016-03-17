var fs = require('fs-extra');
var path = require('path');
var async = require('async');
var readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
});

const PATH_IN_APPDATA = 'Subversion\\auth\\svn.simple';
const REPO_PATTERN = /<(.+):\d*> Subversion repository/;
const USERNAME_PATTERN = /(.+)\s+END/;
const SAVED_USERS_DIR = 'users';

var showRepositoryAndUser = (filePath, callback) => {
    fs.readFile(filePath, 'utf8', (err, text) => {
        if (err) callback(err);
        var repository = text.match(REPO_PATTERN)[1];
        var user = text.match(USERNAME_PATTERN)[1];
        console.log(repository, user);
        callback(null);
    });
};

var showCurrentUsers = (svnDir, callback) => {
    console.log('Current users:');
    fs.readdir(svnDir, (err, files) => {
        if (err) callback(err);
        async.each(files, (file, callback) => {
            var filePath = path.join(svnDir, file);
            showRepositoryAndUser(filePath, callback);
        }, callback);
    });
};

/**
 * callback(text)
 */
var input = (message, callback) => {
    readline.question(message, (text) => {
        callback(text);
        readline.close();
    });
};

/**
 * callback(choice)
 */
var askNewUser = (choices, callback) => {
    console.log('Choose option:');
    for (var i = 0; i < choices.length; i++){
        console.log(i + ':', choices[i]);
    }
    console.log('return: exit');
    input('', (text) => {
        if (text === '') callback(null);
        else callback(parseInt(text));
    });
};

var changeAuth = (savedUsersDir, svnDir, callback) => {
    fs.readdir(savedUsersDir, (err, files) => {
        if (err) callback(err);
        var choices = [null].concat(files);
        askNewUser(choices, (choice) => {
            if (choice === null) callback(null);
            else if (choice === 0) fs.emptyDir(svnDir, callback);
            else {
                var savedUserDir = path.join(savedUsersDir, choices[choice]);
                fs.copy(savedUserDir, svnDir, callback);
            }
        });
    });    
};

exports.change = (callback) => {
    var svnDir = path.join(process.env.APPDATA, PATH_IN_APPDATA);
    showCurrentUsers(svnDir, (err) => {
        if (err) callback(err);
        changeAuth(SAVED_USERS_DIR, svnDir, callback);
    });
};