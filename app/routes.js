var Subjects = require('./models/SubjectViews');

module.exports = function (app) {

    // server routes ===========================================================
    // return all entries as JSON data
    app.get('/api/data', function (req, res) {
        Subjects.find({}, '-_id', function (err, subjectDetails) {
            if (err)
                res.send(err);
            res.json(subjectDetails);
        });
    });

    app.get('dc.css', function (req, res) {
        res.sendFile('node_modules/dc/dc.css', { root: __dirname });
    });


    // frontend routes =========================================================
    app.get('/', function (req, res) {
        res.sendFile('./public/index.html', { root: __dirname });
    });
}