const express = require('express');
const app = express();
const path = require('path');
// const bodyParser = require('body-parser'); 
const { promisify } = require('util');
const sgMail = require('@sendgrid/mail');



const googleSpreadsheet = require('google-spreadsheet');
const credentials = require('./docs/bug-tracker.json');

//configurações
const docId = 'Doc_Id';
const worksheetIndex = 0;
const sendGridKey = 'SenGridKey';


app.set('view engine', 'ejs');
app.set('views', path.resolve(__dirname, 'views'));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('views'));

app.get('/', (request, response) => {
    response.render('home');
})

app.post('/', async (request, response) => {
    try {

        const doc = new googleSpreadsheet(docId);
        await promisify(doc.useServiceAccountAuth)(credentials)
        console.log('Planilha aberta!');
        const info = await promisify(doc.getInfo)();
        const worksheet = info.worksheets[worksheetIndex];
        await promisify(worksheet.addRow)({
            name: request.body.name,
            email: request.body.email,
            issueType: request.body.issueType,
            howToReproduce: request.body.howToReproduce,
            expectedOutput: request.body.expectedOutput,
            receivedOutput: request.body.receivedOutput,
            userAgent: request.body.userAgent,
            userDAte: request.body.userDate,
            source: request.query.source || 'direct'
        });

        //Se for crítico 

        if (request.body.issueType === 'CRITICAL') {
            sgMail.setApiKey(sendGridKey);
            const msg = {
                to: 'contactlevi93@gmail.com',
                from: 'contactlevi93@gmail.com',
                subject: 'BUG CRITICO REPORTADO',
                text: `O usuário ${request.body.name} reportou um problema crítico.`,
                html: `<strong>O usuário ${request.body.name} reportou um problema crítico.</strong>`,
            };
            await sgMail.send(msg);
        }


        response.render('success');
    } catch (err) {
        response.send('Erro ao enviar formulário');
        console.log(err);
    }
});

app.listen(3000, (err) => {
    if (err) {
        console.log('Aconteceu um erro', err)
    } else {
        console.log('Bug Tracker rodando na porta http://localhost:3000')
    }
});