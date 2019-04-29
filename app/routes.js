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

    // frontend routes =========================================================
    app.get('/', function (req, res) {
        // res.sendFile('./static/index.html', { root: __dirname });
        res.sendFile('index.html');
    });
}