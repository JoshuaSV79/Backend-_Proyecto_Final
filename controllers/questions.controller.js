const QUESTIONS = require("../data/questions");
const users = require("../modelo/users.json");
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");  

const preg = [];

const iniciarCertificado = (req, res) => {
    console.log("Acceso al  /api/questions/start");

    let preguntas = 8;
    let vecPreg = [0, 0, 0, 0, 0, 0, 0, 0];

    for (let i = 0; i < preguntas; i++) {
        let ban = 1;
        do {
            let x = Math.floor(Math.random() * 16) + 1;
            ban = 0;
            for (let y = 0; y < preguntas; y++) {
                if (x === vecPreg[y]) {
                    ban = 1;
                    break;
                }
            }
            if (ban === 0) {
                vecPreg[i] = x;
            }
        } while (ban === 1);
    }
    vecPreg.forEach(element => console.log(element));

    for (let i = 0; i < preguntas; i++) {
        preg[i] = QUESTIONS.find(q => q.id === vecPreg[i]);
    }

    const publicQuestions = preg.map(({ id, text, options }) => ({
        id, text, options
    }));

    res.status(200).json({
        message: "Preguntas listas. ¡Éxito!",
        questions: publicQuestions
    });
};

const enviarRespuestas = async (req, res) => {
    console.log("Acceso a /api/questions/submit");

    const { userName, answers } = req.body;

    const match = users.find(u => u.cuenta === userName);

    match.realizado = true;

    const nombre = match.nombre;

    if (!Array.isArray(answers) || !userName) {
        return res.status(400).json({ message: "Datos incompletos. Debes enviar 'userName' y 'answers'." });
    }

    let score = 0;
    const details = [];

    for (const q of preg) {
        const user = answers.find(a => a.id === q.id);
        const isCorrect = !!user && user.answer === q.correct;
        if (isCorrect) score++;
        details.push({
            id: q.id,
            text: q.text,
            yourAnswer: user ? user.answer : null,
            correctAnswer: q.correct,
            correct: isCorrect
        });
    }

    const prom = (score / preg.length) * 10;

    if (prom >= 7.5) {
        try {
            const pdfPath = await generarCertificado(nombre, prom);
            const fileName = path.basename(pdfPath);
            return res.status(200).json({
                message: "Aprobaste la certificacion, se ha desargado tu certificao",
                aprobado: true,
                score,
                prom,
                total: preg.length,
                certificado: `/api/questions/certificado/${fileName}`,
                details
            });
        } catch (err) {
            console.error("Error generando el PDF:", err);
            return res.status(500).json({ message: "Error generando el certificado." });
        }
    }

    return res.status(200).json({
        message: "No alcanzaste el puntaje mínimo para el certificado.",
        aprobado: false,
        score,
        prom,
        total: preg.length,
        details,
        realizado: match.realizado
    });
};

function generarCertificado(nombre, promedio) {
    const fileName = `certificado_${Date.now()}.pdf`;
    const pdfPath = path.join(__dirname, `../pdf/${fileName}`);

    const doc = new PDFDocument({ margin: 50 });
    const stream = fs.createWriteStream(pdfPath);
    doc.pipe(stream);

    // Logo
    const logoPath = path.join(__dirname, "../images/logo.png");
    if (fs.existsSync(logoPath)) {
        doc.image(logoPath, { fit: [120, 120], valign: "top" });
        doc.moveDown(2);
    }

    // Medalla
    const medallaPath = path.join(__dirname, "../images/medalla.png");
    if (fs.existsSync(medallaPath)) {
        const pageWidth = doc.page.width;
        const imageWidth = 120;
        const xPosition = (pageWidth - imageWidth) / 2;

        doc.image(medallaPath, xPosition, doc.y, { fit: [120, 120] });
        doc.moveDown(11);
    }

    doc.font('Times-Roman');
    doc.fontSize(26).text("Certificación de React.js", { align: "center" });
    doc.moveDown(2);
    doc.fontSize(16).text(`CodeValidated se enorgullece de otorgar el presente certificado a:`, { align: "center" });
    doc.moveDown();
    doc.fontSize(18).text(`${nombre}`, { align: "center" });
    doc.moveDown();
    doc.fontSize(16).text(`Por haber aprobado la Certificacion de React.js`, { align: "center" });
    doc.moveDown();
    doc.fontSize(14).text(`Con un puntaje de ${promedio.toFixed(2)} puntos.`, { align: "center" });
    doc.moveDown(3);
    doc.fontSize(12).text(`Emitido en Aguascalientes, el ${new Date().toLocaleString()}`, { align: "center" });
    doc.moveDown(2);




    // Firma del Instructor
const firmaInstructorPath = path.join(__dirname, "../images/firma.png");
if (fs.existsSync(firmaInstructorPath)) {
    const pageWidth = doc.page.width;
    const imageWidth = 120;
    const xPosition = (pageWidth - imageWidth) / 2;

    doc.image(firmaInstructorPath, xPosition, doc.y, { fit: [120, 120] });
    doc.moveDown(2);
}

doc.fontSize(12).text("__________________________", { align: "center" });
doc.fontSize(12).text("Ángel Andrade, Instructor", { align: "center" });

// Espacio entre firmas
doc.moveDown(2);

// Firma del CEO
const firmaCEOPath = path.join(__dirname, "../images/firmaHugo.png");
if (fs.existsSync(firmaCEOPath)) {
    const pageWidth = doc.page.width;
    const imageWidth = 120;
    const xPosition = (pageWidth - imageWidth) / 2;

    doc.image(firmaCEOPath, xPosition, doc.y, { fit: [120, 120] });
    doc.moveDown(2);
}

doc.fontSize(12).text("__________________________", { align: "center" });
doc.fontSize(12).text("Hugo Delgado, CEO", { align: "center" });




    doc.moveDown(6);
    doc.fontSize(12).text("Avalado por la Secretaría de Educación Pública (SEP).", { align: "center" });

    doc.end();
    console.log("El usuario "+nombre+" obtuvo su certificado")
    return new Promise((resolve) => {
        stream.on("finish", () => resolve(pdfPath));
    });
}

module.exports = { iniciarCertificado, enviarRespuestas, generarCertificado };