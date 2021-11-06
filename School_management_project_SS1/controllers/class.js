var express = require("express");
var router = express.Router();
var ObjectId = require("mongodb").ObjectID;
var common = require("../common");


router.get("/class_schedule_list", async function(req, res) {
    var uid = req.cookies["login"];
    var oid = new ObjectId(uid);
    var query = { "_id": oid };
    objUser = null;
    try {
        objUser = await common.getDb().collection("users").findOne(query);
    } catch (err) {
        console.log("error");
    }

    let dbrole = String(objUser["role"]);
    let tbtext = "";
    const result = await common.getDb().collection("class").find().toArray()
        /**
         * @region
         * 		set today date
         */
    var today = new Date();
    var dd = String(today.getDate()).padStart(2, '0');
    var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
    var yyyy = today.getFullYear();
    today = yyyy + '-' + mm + '-' + dd
        //today = dd + '-' + mm  + '-' + yyyy;
        /**
         * @end
         */
    let stt = 1
    result.forEach(function(schedule) {

        let dateCreated = new Date(schedule["date_created"])
        let strDateCreated = dateCreated.getHours() + ":" + dateCreated.getMinutes() + ", " +
            dateCreated.getDate() + "/" + (dateCreated.getMonth() + 1) + "/" + dateCreated.getFullYear();

        let admin = "";
        if (dbrole == "admin") {
            admin = "<td><a href=\"/class_schedule_edit_" + schedule["_id"] + "\">Edit</a></td>" +
                "<td><a href=\"javascript:confirmDelete('" + schedule["_id"] + "')\">Delete</a></td>";
        }

        tbtext = tbtext + "<tr><th scope=\"row\">" + stt + "</th>" +
            "<td>" + schedule["class"] + "</td>" +
            "<td>" + schedule["room"] + "</td>" +
            "<td>" + schedule["time"] + "</td>" +
            "<td>" + schedule["date"] + "</td>" +
            "<td>" + schedule["teacher"] + "</td>" +
            "<td>" + strDateCreated + "</td>" +
            admin +
            "</tr>"
        stt++
    })
    let parts = {
        tb: tbtext,
        date: today,
        usr_role: objUser.role,
        user_role: objUser.role,
        usr_name: objUser.username
    }
    res.parts = {...res.parts, ...parts }

    if (dbrole == "admin") {
        res.viewpath = './public/class_schedule_list.html'
    } else if (dbrole == "teacher") {
        res.viewpath = './public/teacher_view_schedule.html'
    }

    await common.render(res);

});

router.get("/class_schedule_list_:date", async function(req, res) {
    var uid = req.cookies["login"];
    var obId = new ObjectId(uid);
    var query = { "_id": obId };
    objUser = null;
    try {
        objUser = await common.getDb().collection("users").findOne(query);
    } catch (err) {
        console.log("error");
    }

    let dbrole = String(objUser["role"]);
    let tbtext = "";
    const result = await common.getDb().collection("class").find().toArray()
    var oid = req.params["date"]

    let stt = 1
    result.forEach(function(schedule) {

            if (schedule["date"] === oid) {
                let dateCreated = new Date(schedule["date_created"])
                let strDateCreated = dateCreated.getHours() + ":" + dateCreated.getMinutes() + ", " +
                    dateCreated.getDate() + "/" + (dateCreated.getMonth() + 1) + "/" + dateCreated.getFullYear();

                let admin = "";
                if (dbrole == "admin") {
                    admin = "<td><a href=\"/class_schedule_edit_" + schedule["_id"] + "\">Edit</a></td>" +
                        "<td><a href=\"javascript:confirmDelete('" + schedule["_id"] + "')\">Delete</a></td>";
                }

                tbtext = tbtext + "<tr><th scope=\"row\">" + stt + "</th>" +
                    "<td>" + schedule["class"] + "</td>" +
                    "<td>" + schedule["room"] + "</td>" +
                    "<td>" + schedule["time"] + "</td>" +
                    "<td>" + schedule["date"] + "</td>" +
                    "<td>" + schedule["teacher"] + "</td>" +
                    "<td>" + strDateCreated + "</td>" +
                    admin +
                    "</tr>"
                stt++
            }
        })
        // let parts = {	tb: tbtext}
    let parts = {
        tb: tbtext,
        date: oid,
        usr_role: objUser.role,
        user_role: objUser.role,
        usr_name: objUser.username
    }
    res.parts = {...res.parts, ...parts }
    if (dbrole == "admin") {
        res.viewpath = './public/class_schedule_list.html'
    } else if (dbrole == "teacher") {
        res.viewpath = './public/teacher_view_schedule.html'
    }
    await common.render(res)

})

router.get("/class_schedule_create", async function(req, res) {
    var uid = req.cookies["login"];
    var oid = new ObjectId(uid);
    var query = { "_id": oid };
    objUser = null;
    try {
        objUser = await common.getDb().collection("users").findOne(query);
    } catch (err) {
        console.log("error");
    }
    const result = await common.getDb().collection("users").find().toArray()
    let teacherTxt = ""
    result.forEach(function(teacher) {
        teacherTxt += "<option value='" + teacher["username"] + "'name = '" + teacher["username"] + "'>" + teacher["username"] + "</option>"
    })
    let parts = {
        user_role: objUser.role,
        usr_role: objUser.role,
        usr_name: objUser.username,
        classname_value: "",
        teachername_value: teacherTxt,
        classname_err: "",
        room_err: "",
        date_err: "",
        room_value: "",
        teachername_err: ""
    }
    res.parts = {...res.parts, ...parts }
    res.viewpath = './public/class_schedule_create.html'
    await common.render(res)

});


router.post("/class_schedule_create", async function(req, res) {
    var uid = req.cookies["login"];
    var oid = new ObjectId(uid);
    var query = { "_id": oid };
    objUser = null;
    try {
        objUser = await common.getDb().collection("users").findOne(query);
    } catch (err) {
        console.log("error");
    }

    let success = true
    let parts = {
        user_role: objUser.role,
        usr_role: objUser.role,
        usr_name: objUser.username,
        classname_value: req.body.classname,
        room_value: req.body.room,
        date_value: req.body.date,
        teachername_value: req.body.teachername,
        classname_err: "",
        teachername_err: "",
        date_err: "",
        room_err: ""
    }
    var send_html = true

    var query = { "username": req.body.classname };
    if (req.body.classname.length < 0 || req.body.classname.length > 32) {
        parts["classname_err"] = "<span style='color:red'>Length of class name is not valid</span>"
        success = false
    } else {
        try {
            result = await common.getDb().collection("users").findOne(query)
        } catch (err) {
            console.log("error")
        }
        if (result != null) {
            parts["classname_err"] = "<span style='color:red'>Class already exists</span>"
            success = false
        }
    }

    if (success) {
        let class_obj = {
            "class": req.body.classname,
            "room": req.body.room,
            "date": req.body.date,
            "teacher": req.body.teacher,
            "time": req.body.time,
            date_created: Date.now()
        }
        try {
            await common.getDb().collection("class").insertOne(class_obj)
        } catch (err) {
            console.log(err)
            res.send("500 error inserting to db")
            send_html = false
        }
    }
    if (send_html) {
        res.parts = {...res.parts, ...parts }
        res.viewpath = './public/class_schedule_create.html'
        await common.render(res)
    }

});


router.get("/class_schedule_edit_:class_scheduleId", async function(req, res) {
    var uid = req.cookies["login"];
    var obId = new ObjectId(uid);
    var q = { "_id": obId };
    objUser = null;
    var oid = new ObjectId(req.params["class_scheduleId"])
    var query = { "_id": oid }
    result = null
    try {
        result = await common.getDb().collection("class").findOne(query);
        objUser = await common.getDb().collection("users").findOne(q);
    } catch (err) {
        console.log("error")
    }
    if (result == null) {
        res.send("class with id '" + req.params["class_scheduleId"] + "' cannot be found!")
        return;
    }
    const teacherArray = await common.getDb().collection("users").find().toArray()
    let teacherTxt = ""
    teacherArray.forEach(function(teacher) {
        teacherTxt += "<option value='" + teacher["username"] + "'name = '" + teacher["username"] + "'>" + teacher["username"] + "</option>"
    })
    let parts = {
        user_role: objUser.role,
        usr_role: objUser.role,
        usr_name: objUser.username,
        class_scheduleId: req.params["class_scheduleId"],
        classname_value: result["class"],
        teachername_value: teacherTxt,
        room_value: result["room"],
        classname_err: "",
        teachername_err: "",
        date_err: "",
        room_err: ""
    }
    res.parts = {...res.parts, ...parts }
    res.viewpath = './public/class_schedule_edit.html'
    await common.render(res)

});

/**
 * update the changes
 */
router.post("/class_schedule_edit_:class_scheduleId", async function(req, res) {
    var uid = req.cookies["login"];
    var obId = new ObjectId(uid);
    var q = { "_id": obId };
    let object = null;
    let success = true;
    var oid = new ObjectId(req.params["class_scheduleId"]);
    var query = { "_id": oid };
    objUser = null
    try {
        object = await common.getDb().collection("users").findOne(q)
        objUser = await common.getDb().collection("class").findOne(query)
    } catch (err) {
        console.log("error")
    }
    if (objUser == null) {
        res.send("Class with id '" + req.params["class_scheduleId"] + "' cannot be found!")
        return;
    }

    let parts = {
        user_role: object.role,
        usr_role: object.role,
        usr_name: object.username,
        class_scheduleId: req.params["productId"],
        classname_value: result["class"],
        room_value: result["room"],
        classname_err: "",
        teachername_err: "",
        date_err: "",
        room_err: ""
    }

    if (req.body.classname.length < 0 || req.body.classname.length > 32) {
        parts["usr_err"] = "<span style='color:red'>Classname length is not valid</span>"
        success = false
    } else {
        var query = { "_id": { $ne: oid }, class: req.body.classname };
        let result = null;
        try {
            result = await common.getDb().collection("class").findOne(query);
        } catch (err) {
            console.log("error");
        }
        if (result != null) {
            parts["classname_err"] = "<span style='color:red'>Class '" + req.body.classname + "' has been used already</span>";
            success = false;
        }
    }
    objUser["class"] = req.body.classname;
    objUser["room"] = req.body.room;
    objUser["date"] = req.body.date;
    objUser["teacher"] = req.body.teacher;
    objUser["time"] = req.body.time;

    if (success) {
        var query = { "_id": oid };
        try {
            await common.getDb().collection("class").updateOne(query, { $set: objUser });
        } catch (err) {
            console.log(err);
            res.send("500 error updating db");
            return;
        }
    }

    res.parts = {...res.parts, ...parts };
    res.viewpath = './public/class_schedule_edit.html';
    await common.render(res);
});

/**
 * delete the class
 */
router.get("/class_schedule_delete_:class_scheduleId", async function(req, res) {
    var oid = new ObjectId(req.params["class_scheduleId"])
    var query = { "_id": oid }
    result = null
    try {
        result = await common.getDb().collection("class").deleteOne(query)
    } catch (err) {
        res.send("database error")
        return;
    }
    res.redirect(302, "/class_schedule_list")

});

module.exports = router