const sql = require('mssql')
const { validationResult } = require("express-validator");



//get all courses
exports.list = function (req, res, next) {
    new sql.Request().execute('SelectAllQuestion')
        .then(result => {
            let questions = result.recordset;
            questions.forEach((Quest, index) => {

                new sql.Request()
                    .input('ansId', sql.Int, Quest.Correct_Answer)
                    .execute('GetCorrectAnswer')
                    .then(result => {
                        choise = result.recordset[0].Body;
                        Quest.Correct_Answer = choise

                        Quest = Object.assign(Quest, { 'Choices': [] });
                        new sql.Request()
                            .input('questionID', sql.Int, Quest.Ques_ID)
                            .execute('getQuestionChoices')
                            .then(result => {
                                result.recordset.forEach(Choice => {
                                    Quest.Choices.push(Choice.Body);
                                })
                                if (index == questions.length - 1)
                                    res.status(200).json({ message: "Questions data", data: questions });
                            })

                    })
            })

        })
        .catch(error => {
            error.status = 500;
            next(error);
        })
}
exports.courseQuestions = function (req, res, next) {
    let errors = validationResult(req);
    if (!errors.isEmpty()) {
        let error = new Error();
        error.status = 422;
        error.message = errors.array().reduce((current, object) => current + object.msg + " ", "")
        throw error;
    }
    new sql.Request()
        .input('courseID', sql.Int, req.params.CrsId)
        .execute('getCourseQuestions')
        .then(result => {
            if (result.recordset[0].res == 'false') {
                res.status(204).json({ message: "no questions", data: [] });
            }
            else {
                let questions = result.recordset;
                questions.forEach((Quest, index) => {

                    new sql.Request()
                        .input('ansId', sql.Int, Quest.Correct_Answer)
                        .execute('GetCorrectAnswer')
                        .then(result => {
                            choise = result.recordset[0].Body;
                            Quest.Correct_Answer = choise

                            Quest = Object.assign(Quest, { 'Choices': [] });
                            new sql.Request()
                                .input('questionID', sql.Int, Quest.Ques_ID)
                                .execute('getQuestionChoices')
                                .then(result => {
                                    result.recordset.forEach(Choice => {
                                        Quest.Choices.push(Choice.Body);
                                    })
                                    if (index == questions.length - 1)
                                        res.status(200).json({ message: "Questions data", data: questions });
                                })

                        })
                })
            }
        })
        .catch(error => {
            error.status = 500;
            next(error);
        })
}

exports.addQuestion = function (req, res, next) {
    let errors = validationResult(req);
    if (!errors.isEmpty()) {
        let error = new Error();
        error.status = 422;
        error.message = errors.array().reduce((current, object) => current + object.msg + " ", "")
        throw error;
    }
    new sql.Request()
        .input('body', sql.NVarChar(sql.MAX), req.body.body)
        .input('correctAnswer', sql.NVarChar(sql.MAX), null)
        .input('type', sql.NChar(10), req.body.type)
        .input('degree', sql.Int, req.body.degree)
        .input('courseId', sql.Int, req.body.CrsId)
        .execute('InsertQuestion')
        .then(result => {
            if (req.body.type == 'tf') {
                new sql.Request()
                    .execute('addTFChoices')
                    .then(result => {
                        new sql.Request()
                            .input('correctAnswer', sql.NVarChar(sql.MAX), req.body.correctAnswer)
                            .execute('setCorrectAnswerId')
                            .then(result => {
                                res.status(200).json({ message: "Question added successfully" });
                            })
                            .catch(error => {
                                error.status = 500;
                                next(error);
                            })
                    })
                    .catch(error => {
                        error.status = 500;
                        next(error);
                    })
            }
            else {
                let choices = req.body.choices;
                new sql.Request()
                    .input('ansBody1', sql.NVarChar(sql.MAX), choices[0])
                    .input('ansBody2', sql.NVarChar(sql.MAX), choices[1])
                    .input('ansBody3', sql.NVarChar(sql.MAX), choices[2])
                    .execute('addMCQChoices')
                    .then(result => {
                        new sql.Request()
                            .input('correctAnswer', sql.NVarChar(sql.MAX), req.body.correctAnswer)
                            .execute('setCorrectAnswerId')
                            .then(result => {
                                res.status(200).json({ message: "Question added successfully" });
                            })
                            .catch(error => {
                                error.status = 500;
                                next(error);
                            })
                    })
                    .catch(error => {
                        error.status = 500;
                        next(error);
                    })
            }
        })
        .catch(error => {
            error.status = 500;
            next(error);
        })
}
