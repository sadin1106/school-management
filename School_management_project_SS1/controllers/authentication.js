var fs = require("fs").promises;
var multer = require("multer");
var express = require("express");
var router = express.Router();
var ObjectId = require("mongodb").ObjectID;
var common = require("../common");
var upload = multer({ dest: 'uploads/' });
const sharp = require('sharp');

router.get("/login", function(req, res) {
    (async function() {
        let p = { usr_value: "", msg: "Log in" };
        res.parts = {...res.parts, ...p };
        res.viewpath = './public/login.html';
        await common.render(res);
    })()
})

router.post("/login", async function(req, res) {
    var query = { "username": req.body.username };
    let p = { usr_value: req.body.username, msg: "" };
    var send_html = true,
        result = null;
    try {
        result = await common.getDb().collection("users").findOne(query);
    } catch (err) {
        console.log("error");
    }
    if (result == null) {
        p["msg"] = "<span style='color:red'>Username not found</span>";
    } else {
        var dbpass = String(result["password"]);
        if (dbpass == req.body.password) {
            res.cookie('login', result["_id"], { maxAge: 3600000 });
            var dbrole = String(result["role"]);
            if (dbrole == "teacher") {
                res.redirect(302, '/teacher');
            } else if (dbrole == "admin") {
                res.redirect(302, '/admin');
            }
            send_html = false;
        } else {
            p["msg"] = "<span style='color:red'>Password not correct</span>";
        }
    }
    if (send_html) {
        res.parts = {...res.parts, ...p };
        res.viewpath = './public/login.html';
        await common.render(res);
    }

})

router.get('/admin', async function(req, res) {
    res.viewpath = './public/admin.html';
    let p = {
        usr_role: req.user.role,
        user_role: req.user.role,
        usr_name: req.user.email
    };
    res.parts = {...res.parts, ...p };
    await common.render(res);
})

router.get('/teacher', async function(req, res) {
    res.viewpath = './public/teacher.html';
    let p = {
        usr_role: req.user.role,
        user_role: req.user.role,
        usr_name: req.user.email
    };
    res.parts = {...res.parts, ...p };
    await common.render(res);
})

router.get("/profile", async function(req, res) {
    var objUser;
    if (req.user == undefined) {
        res.send("Cannot get user data!");
        return;
    } else {
        objUser = req.user;
    }

    let p = {
        user_role: objUser.role,
        usr_email: objUser.email,
        avatar_sub: objUser.avatar,
        usr_name: objUser.username,
        usr_role: objUser.role,
        userId: objUser["_id"],
        usr_value: objUser.username,
        pwd_value: objUser.password,
        email_value: objUser.email,
        usr_err: "Username must be from 4 - 32 characters",
        pwd_err: "Password must be 6 - 32 characters"
    };
    res.parts = {...res.parts, ...p };
    let dbrole = String(objUser.role);
    if (dbrole == "admin") {
        res.viewpath = './public/admin_profile.html';
    } else if (dbrole == "teacher") {
        res.viewpath = './public/user_profile.html';
    }
    await common.render(res);
})

router.post("/profile", upload.single('profile_pic'), async function(req, res) {
    let success = true;
    var uid = req.cookies["login"];
    var oid = new ObjectId(uid);
    var query = { "_id": oid };
    objUser = null;
    try {
        objUser = await common.getDb().collection("users").findOne(query);
    } catch (err) {
        console.log("error");
    }
    if (objUser == null) {
        res.send("User with id '" + uid + "' cannot be found!");
        return;
    }

    let parts = {
        user_role: objUser.role,
        usr_email: objUser.email,
        avatar_sub: objUser.avatar,
        usr_name: objUser.username,
        usr_role: objUser.role,
        userId: uid,
        usr_value: req.body.username,
        email_value: req.body.email,
        usr_err: "Username must be from 4 - 32 characters",
        pwd_err: "Password must be 6 - 32 characters"
    }

    if (req.file != undefined) {
        var filename = objUser["username"] + ".jpg";
        await sharp(req.file.path)
            .resize(100, 100)
            .jpeg({ quality: 100, progressive: true })
            .toFile('public/profile_pics/' + filename)
        fs.unlink(req.file.path);
        objUser["avatar"] = 'profile_pics/' + filename;
    }

    if (req.body.username.length < 4 || req.body.username.length > 32) {
        parts["usr_err"] = "<span style='color:red'>Username length is not valid</span>";
        success = false;
    } else {
        var query = { "_id": { $ne: oid }, username: req.body.username };
        result = null;
        try {
            result = await common.getDb().collection("users").findOne(query);
        } catch (err) {
            console.log("error");
        }
        if (result != null) {
            parts["usr_err"] = "<span style='color:red'>Username '" + req.body.username + "' has been used already</span>";
            success = false;
        }
    }
    objUser["username"] = req.body.username;
    objUser["email"] = req.body.email;
    if (req.body["password"] != "") {
        if (req.body["password"].length < 6 || req.body["password"].length > 32) {
            parts["pwd_err"] = "<span style='color:red'>Password length is not valid</span>";
            success = false;
        } else {
            let dbpass = req.body["password"];
            objUser["password"] = dbpass;
        }
    }

    if (success) {
        var query = { "_id": oid };
        try {
            const result = await common.getDb().collection("users").updateOne(query, { $set: objUser });
        } catch (err) {
            console.log(err)
            res.send("500 error updating db")
            return;
        }
    }

    res.parts = {...res.parts, ...parts };
    let dbrole = String(objUser.role);
    if (dbrole == "admin") {
        res.viewpath = './public/admin_profile.html';
    } else if (dbrole == "teacher") {
        res.viewpath = './public/user_profile.html';
    }
    await common.render(res)
})

router.get("/signout", function(req, res) {
    res.clearCookie('login')
    res.redirect(302, "/login")
})

module.exports = router