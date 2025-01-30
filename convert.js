const fs = require('fs');
const path = require('path');

function convertTxtToJson() {
    const txtFilePath = path.join(__dirname, 'public', 'anlamlar.txt');
    const jsonFilePath = path.join(__dirname, 'public', 'questions.json');

    fs.readFile(txtFilePath, 'utf8', (err, data) => {
        if (err) {
            console.error('TXT dosyasını okuma hatası:', err);
            return;
        }

        const lines = data.split('\n').filter(line => line.trim() !== "");
        const questions = [];

        lines.forEach(line => {
            const parts = line.split('**');
            if (parts.length === 2) {
                const word = parts[0].trim();
                const meaning = parts[1].trim();

               
                if (meaning.toLowerCase() === "yok") {
                    console.log(`Anlamı olmayan kelime atlandı: ${word}`);
                    return; 
                }

                questions.push({ question: meaning, answer: word });
            }
        });

        fs.writeFile(jsonFilePath, JSON.stringify(questions, null, 4), 'utf8', (err) => {
            if (err) {
                console.error('JSON dosyası kaydedilemedi:', err);
                return;
            }
            console.log(`JSON dosyası başarıyla oluşturuldu: ${jsonFilePath}`);
        });
    });
}

convertTxtToJson();
