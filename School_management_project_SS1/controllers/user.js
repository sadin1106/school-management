var express = require("express");
var router = express.Router();
var ObjectId = require("mongodb").ObjectID;
var common = require("../common");

router.get("/user_list", async function(req, res) {
    var uid = req.cookies["login"];
    var oid = new ObjectId(uid);
    var query = { "_id": oid };
    objUser = null;
    try {
        objUser = await common.getDb().collection("users").findOne(query);
    } catch (err) {
        console.log("error");
    }
    let tbtext = "";
    const result = await common.getDb().collection("users").find().toArray()
    let stt = 1
    result.forEach(function(user) {
        let dbrole = String(user["role"]);
        let uType
        if (dbrole == "admin") {
            uType = "Admin";
        } else if (dbrole == "teacher") {
            uType = "Teacher";
        }
        let regDate = new Date(user["registerDate"])
        let strRegTime = regDate.getHours() + ":" + regDate.getMinutes() + ", " +
            regDate.getDate() + "/" + (regDate.getMonth() + 1) + "/" + regDate.getFullYear()
        tbtext = tbtext + "<tr><th scope=\"row\">" + stt + "</th>" +
            "<td>" + uType + "</td>" +
            "<td>" + user["username"] + "</td>" +
            "<td>" + user["email"] + "</td>" +
            "<td>" + strRegTime + "</td>" +
            "<td><a href=\"/user_edit_" + user["_id"] + "\">Edit</a></td><td><a href=\"javascript:confirmDelete('" + user["_id"] + "')\">Delete</a></td>" +
            "</tr>"
        stt++
    })
    let parts = {
        tb: tbtext,
        usr_role: objUser.role,
        user_role: objUser.role,
        usr_name: objUser.username
    }
    res.parts = {...res.parts, ...parts }
    res.viewpath = './public/user_list.html'
    await common.render(res)
})

router.get("/user_create", async function(req, res) {
    var uid = req.cookies["login"];
    var oid = new ObjectId(uid);
    var query = { "_id": oid };
    objUser = null;
    try {
        objUser = await common.getDb().collection("users").findOne(query);
    } catch (err) {
        console.log("error");
    }
    let p = {
        user_role: objUser.role,
        usr_role: objUser.role,
        usr_name: objUser.username,
        usr_value: "",
        email_value: "",
        usr_err: "Username must be from 4 - 32 characters",
        pwd_err: "Password must be 6 - 32 characters"
    }
    res.parts = {...res.parts, ...p }
    res.viewpath = './public/user_create.html'
    await common.render(res)
})

router.post("/user_create", async function(req, res) {
    let success = true;
    var uid = req.cookies["login"];
    var oid = new ObjectId(uid);
    var q = { "_id": oid };
    objUser = null;
    try {
        objUser = await common.getDb().collection("users").findOne(q);
    } catch (err) {
        console.log("error");
    }
    let parts = {
        user_role: objUser.role,
        usr_role: objUser.role,
        usr_name: objUser.username,
        usr_value: req.body.username,
        pwd_value: req.body.password,
        email_value: req.body.email,
        usr_err: "Username must be from 4 - 32 characters",
        pwd_err: "Password must be 6 - 32 characters"
    }
    var query = { "username": req.body.username }
    var send_html = true,
        result = null
    if (req.body.username.length < 4 || req.body.username.length > 32) {
        parts["usr_err"] = "<span style='color:red'>Username length is not valid</span>"
        success = false
    } else {
        try {
            result = await common.getDb().collection("users").findOne(query)
        } catch (err) {
            console.log("error")
        }
        if (result != null) {
            parts["usr_err"] = "<span style='color:red'>Username already exists</span>"
            success = false
        }
    }
    if (req.body.password.length < 6 || req.body.password.length > 32) {
        parts["pwd_err"] = "<span style='color:red'>Password length is not valid</span>"
        success = false
    }
    if (success) {
        let usr_obj = {
            "username": req.body.username,
            "role": "teacher",
            "password": req.body.password,
            "email": req.body.email,
            "avatar": "",
            registerDate: Date.now(),
        }
        try {
            await common.getDb().collection("users").insertOne(usr_obj);
        } catch (err) {
            console.log(err)
            res.send("500 error inserting to db")
            send_html = false
        }
    }
    if (send_html) {
        res.parts = {...res.parts, ...parts }
        res.viewpath = './public/user_create.html'
        await common.render(res)
    }
})

router.get("/user_edit_:userId", async function(req, res) {
    var uid = req.cookies["login"];
    var obId = new ObjectId(uid);
    var q = { "_id": obId };
    objUser = null;
    var oid = new ObjectId(req.params["userId"])
    var query = { "_id": oid }
    result = null
    try {
        result = await common.getDb().collection("users").findOne(query);
        objUser = await common.getDb().collection("users").findOne(q);
    } catch (err) {
        console.log("error")
    }
    if (result == null) {
        res.send("User with id '" + req.params["userId"] + "' cannot be found!")
        return;
    }
    let parts = {
        user_role: objUser.role,
        usr_role: objUser.role,
        usr_name: objUser.username,
        userId: req.params["userId"],
        usr_value: result["username"],
        email_value: result["email"],
        usr_err: "Username must be from 4 - 32 characters",
        pwd_err: "Password must be 6 - 32 characters"
    };
    res.parts = {...res.parts, ...parts };
    res.viewpath = './public/user_edit.html';
    await common.render(res);
})

router.post("/user_edit_:userId", async function(req, res) {
    let success = true;
    var uid = req.cookies["login"];
    var obId = new ObjectId(uid);
    var q = { "_id": obId };
    objUser = null;
    var oid = new ObjectId(req.params["userId"])
    var query = { "_id": oid }
    result = null
    try {
        objUser = await common.getDb().collection("users").findOne(q)
        result = await common.getDb().collection("users").findOne(query)
    } catch (err) {
        console.log("error")
    }
    if (result == null) {
        res.send("User with id '" + req.params["userId"] + "' cannot be found!")
        return;
    }

    let parts = {
        user_role: objUser.role,
        usr_role: objUser.role,
        usr_name: objUser.username,
        userId: req.params["userId"],
        usr_value: req.body.username,
        email_value: req.body.email,
        usr_err: "Username must be from 4 - 32 characters",
        pwd_err: "Password must be 6 - 32 characters"
    }

    if (req.body.username.length < 4 || req.body.username.length > 32) {
        parts["usr_err"] = "<span style='color:red'>Username length is not valid</span>"
        success = false
    } else {
        var query = { "_id": { $ne: oid }, username: req.body.username }
        var u = null
        try {
            u = await common.getDb().collection("users").findOne(query)
        } catch (err) {
            console.log("error")
        }
        if (u != null) {
            parts["usr_err"] = "<span style='color:red'>Username '" + req.body.username + "' has been used already</span>"
            success = false
        }
    }
    result["username"] = req.body.username
    result["email"] = req.body.email
    if (req.body["password"] != "") {
        if (req.body["password"].length < 6 || req.body["password"].length > 32) {
            parts["pwd_err"] = "<span style='color:red'>Password length is not valid</span>"
            success = false
        } else {
            let dbpass = req.body["password"]
            result["password"] = dbpass
        }
    }

    if (success) {
        var query = { "_id": oid }
        try {
            await common.getDb().collection("users").updateOne(query, { $set: objUser })
        } catch (err) {
            console.log(err)
            res.send("500 error updating db")
            return;
        }
    }

    res.parts = {...res.parts, ...parts }
    res.viewpath = './public/user_edit.html'
    await common.render(res)
})

router.get("/user_delete_:userId", async function(req, res) {
    var oid = new ObjectId(req.params["userId"])
    var query = { "_id": oid }
    result = null
    try {
        result = await common.getDb().collection("users").deleteOne(query)
    } catch (err) {
        res.send("database error")
        return;
    }
    res.redirect(302, "/user_list")
})

module.exports = router